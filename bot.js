const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const multer = require('multer');
const db = require('./database');
const crypto = require('crypto');
const https = require('https');

const upload = multer({ storage: multer.memoryStorage() });
const videoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MINI_APP_URL = process.env.MINI_APP_URL;
const CARD_NUMBER = process.env.CARD_NUMBER;
const CARD_OWNER = process.env.CARD_OWNER;

// ── Backblaze B2 sozlamalari ──
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;
const B2_ENDPOINT = process.env.B2_ENDPOINT;
const B2_BUCKET_ID = process.env.B2_BUCKET_ID;

const COURSE_PRICES = {
  '1A': 150000, '1B': 150000,
  '2A': 180000, '2B': 180000,
  '3A': 200000, '3B': 200000,
  '4A': 200000, '4B': 200000,
  '5A': 220000, '5B': 220000,
  '6A': 220000, '6B': 220000,
};

const bot = new Telegraf(BOT_TOKEN);

// ══════════════════════════════════════════
// 🎬 BACKBLAZE B2 FUNKSIYALARI
// ══════════════════════════════════════════

// B2 authorization token olish
let b2AuthToken = null;
let b2ApiUrl = null;
let b2DownloadUrl = null;
let b2AuthTime = 0;

async function getB2Auth() {
  // Token 23 soat amal qiladi
  if (b2AuthToken && Date.now() - b2AuthTime < 23 * 60 * 60 * 1000) {
    return { authToken: b2AuthToken, apiUrl: b2ApiUrl, downloadUrl: b2DownloadUrl };
  }

  const credentials = Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
  const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { 'Authorization': `Basic ${credentials}` }
  });

  if (!response.ok) throw new Error('B2 auth failed');

  const data = await response.json();
  b2AuthToken = data.authorizationToken;
  b2ApiUrl = data.apiUrl;
  b2DownloadUrl = data.downloadUrl;
  b2AuthTime = Date.now();

  return { authToken: b2AuthToken, apiUrl: b2ApiUrl, downloadUrl: b2DownloadUrl };
}

// Upload URL olish
async function getUploadUrl(apiUrl, authToken) {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ bucketId: await getBucketId(apiUrl, authToken) })
  });
  return response.json();
}

// Bucket ID olish
async function getBucketId(apiUrl, authToken) {
  if (process.env.B2_BUCKET_ID) return process.env.B2_BUCKET_ID;
  const response = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accountId: B2_KEY_ID.split(':')[0] || B2_KEY_ID })
  });
  const data = await response.json();
  const bucket = data.buckets && data.buckets.find(b => b.bucketName === B2_BUCKET_NAME);
  return bucket ? bucket.bucketId : null;
}

// Video B2 ga yuklash
async function uploadToB2(fileBuffer, fileName, mimeType) {
  const { authToken, apiUrl } = await getB2Auth();
  const uploadData = await getUploadUrl(apiUrl, authToken);

  const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

  const response = await fetch(uploadData.uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': uploadData.authorizationToken,
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'Content-Type': mimeType || 'video/mp4',
      'Content-Length': fileBuffer.length,
      'X-Bz-Content-Sha1': sha1,
    },
    body: fileBuffer
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error('B2 upload failed: ' + err);
  }

  return response.json();
}

// Signed URL yaratish (2 soatlik)
async function getSignedUrl(fileName, expiresInSeconds = 7200) {
  const { authToken, apiUrl, downloadUrl } = await getB2Auth();

  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      'Authorization': authToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bucketId: await getBucketId(apiUrl, authToken),
      fileNamePrefix: fileName,
      validDurationInSeconds: expiresInSeconds
    })
  });

  const data = await response.json();
  return `${downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(fileName)}?Authorization=${data.authorizationToken}`;
}

// ══════════════════════════════════════════

// ── /start ──
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'Foydalanuvchi';
  ctx.reply(
    `Salom, ${firstName}! 👋\n\nKCstudy — Koreys tili o'rganish platformasi 🇰🇷\n\nQuyidagi tugmani bosib o'qishni boshlang!`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('📚 KCstudy ga kirish', MINI_APP_URL)]
    ])
  );
});

// ── /help ──
bot.command('help', (ctx) => {
  ctx.reply(
    '📌 Yordam:\n\n' +
    '• Kurs sotib olish uchun mini appda "Sotib olish" tugmasini bosing\n' +
    '• To\'lovdan so\'ng chekni shu botga yuboring\n' +
    '• Admin 24 soat ichida tasdiqlaydi\n\n' +
    '/mycourses — mening kurslarim\n' +
    '/status — so\'nggi buyurtma holati'
  );
});

// ── /mycourses ──
bot.command('mycourses', async (ctx) => {
  const userId = ctx.from.id.toString();
  const courses = await db.getUserCourses(userId);
  if (courses.length === 0) {
    ctx.reply('Sizda hali sotib olingan kurs yo\'q.\n\nKurs sotib olish uchun mini appni oching 👇',
      Markup.inlineKeyboard([[Markup.button.webApp('📚 KCstudy', MINI_APP_URL)]])
    );
  } else {
    let text = '✅ Sizning kurslaringiz:\n\n';
    for (const courseId of courses) {
      const info = await db.getSubscriptionInfo(userId, courseId);
      if (info) {
        const endDate = new Date(info.end_date).toLocaleDateString('ru-RU');
        text += `📚 SNU ${courseId} — ${endDate} gacha\n`;
      } else {
        text += `📚 SNU ${courseId}\n`;
      }
    }
    ctx.reply(text);
  }
});

// ── Mini app dan to'lov ma'lumoti kelganda ──
bot.on('web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.webAppData.data);
    if (data.action === 'payment') {
      const courseId = data.course;
      const userId = ctx.from.id.toString();
      const username = ctx.from.username || '';
      const firstName = ctx.from.first_name || '';
      const price = COURSE_PRICES[courseId] || 150000;

      if (await db.userHasCourse(userId, courseId)) {
        return ctx.reply(`✅ Siz allaqachon SNU ${courseId} kursiga egasiz!`);
      }

      const orderId = `${userId}_${courseId}_${Date.now()}`;
      await db.createOrder(orderId, userId, courseId, username, firstName);

      await ctx.reply(
        `💳 To'lov ma'lumotlari\n\n` +
        `📚 Kurs: SNU ${courseId}\n` +
        `💰 Narx: ${price.toLocaleString()} so'm\n\n` +
        `Karta raqami:\n<code>${CARD_NUMBER}</code>\n` +
        `Karta egasi: ${CARD_OWNER}\n\n` +
        `⚠️ To'lov qilgandan so'ng <b>chek rasmini</b> shu chatga yuboring.\n` +
        `Admin 24 soat ichida tasdiqlaydi.`,
        { parse_mode: 'HTML' }
      );

      await bot.telegram.sendMessage(
        ADMIN_ID,
        `🛒 Yangi buyurtma!\n\n` +
        `👤 ${firstName} ${username ? '@' + username : ''}\n` +
        `🆔 ID: ${userId}\n` +
        `📚 Kurs: SNU ${courseId}\n` +
        `💰 Narx: ${price.toLocaleString()} so'm\n` +
        `🔑 Order ID: <code>${orderId}</code>`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (e) {
    console.error('web_app_data error:', e);
  }
});

// ── Chek rasmi kelganda ──
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id.toString();
  const username = ctx.from.username || '';
  const firstName = ctx.from.first_name || '';

  await ctx.forwardMessage(ADMIN_ID);
  await bot.telegram.sendMessage(
    ADMIN_ID,
    `⬆️ Yuqoridagi chek:\n👤 ${firstName} ${username ? '@' + username : ''}\n🆔 ID: ${userId}\n\n` +
    `Tasdiqlash uchun: /approve_ORDERID`
  );
  await ctx.reply('✅ Chekingiz qabul qilindi! Admin tez orada tasdiqlaydi.');
});

// ── Inline tugmalar ──
bot.on('callback_query', async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const data = ctx.callbackQuery.data;

  if (data.startsWith('approve_')) {
    const orderId = data.replace('approve_', '');
    const order = await db.getOrder(orderId);
    if (!order) return ctx.answerCbQuery('❌ Order topilmadi!');
    if (order.status === 'approved') return ctx.answerCbQuery('⚠️ Allaqachon tasdiqlangan!');

    await db.approveOrder(orderId);
    await db.addCourseToUser(order.userId, order.courseId);

    await bot.telegram.sendMessage(
      order.userId,
      `🎉 Tabriklaymiz!\n\n✅ SNU ${order.courseId} kursi sizga ulandi!\n\nMini appni oching va o'qishni boshlang 👇`,
      Markup.inlineKeyboard([[Markup.button.webApp('📚 KCstudy ga kirish', MINI_APP_URL)]])
    );

    await ctx.editMessageCaption(ctx.callbackQuery.message.caption + '\n\n✅ TASDIQLANDI', { parse_mode: 'HTML' });
    ctx.answerCbQuery('✅ Tasdiqlandi!');

  } else if (data.startsWith('reject_')) {
    const orderId = data.replace('reject_', '');
    const order = await db.getOrder(orderId);
    if (!order) return ctx.answerCbQuery('❌ Order topilmadi!');

    await db.rejectOrder(orderId);
    await bot.telegram.sendMessage(order.userId, `❌ Afsuski to'lovingiz tasdiqlanmadi.\n\nMuammo bo'lsa admin bilan bog'laning.`);
    await ctx.editMessageCaption(ctx.callbackQuery.message.caption + '\n\n❌ BEKOR QILINDI', { parse_mode: 'HTML' });
    ctx.answerCbQuery('❌ Bekor qilindi!');
  }
});

// ── Admin: /approve ──
bot.hears(/^\/approve_(.+)$/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const orderId = ctx.match[1];
  const order = await db.getOrder(orderId);
  if (!order) return ctx.reply('❌ Order topilmadi: ' + orderId);
  if (order.status === 'approved') return ctx.reply('⚠️ Allaqachon tasdiqlangan!');

  await db.approveOrder(orderId);
  await db.addCourseToUser(order.userId, order.courseId);

  await bot.telegram.sendMessage(
    order.userId,
    `🎉 Tabriklaymiz!\n\n✅ SNU ${order.courseId} kursi sizga ulandi!\n\nMini appni oching va o'qishni boshlang 👇`,
    Markup.inlineKeyboard([[Markup.button.webApp('📚 KCstudy ga kirish', MINI_APP_URL)]])
  );
  ctx.reply(`✅ Tasdiqlandi! SNU ${order.courseId} kursi ${order.firstName} ga ulandi.`);
});

// ── Admin: /reject ──
bot.hears(/^\/reject_(.+)$/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const orderId = ctx.match[1];
  const order = await db.getOrder(orderId);
  if (!order) return ctx.reply('❌ Order topilmadi: ' + orderId);

  await db.rejectOrder(orderId);
  await bot.telegram.sendMessage(order.userId, `❌ Afsuski to'lovingiz tasdiqlanmadi.\n\nMuammo bo'lsa admin bilan bog'laning.`);
  ctx.reply(`❌ Bekor qilindi. ${order.firstName} ga xabar yuborildi.`);
});

// ── Admin: /orders ──
bot.command('orders', async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const pendingOrders = await db.getPendingOrders();
  const pending = pendingOrders
    .map(o => `• ${o.first_name} — SNU ${o.course_id}\n  /approve_${o.order_id}`)
    .join('\n\n');
  ctx.reply(pending ? `📋 Kutayotgan buyurtmalar:\n\n${pending}` : '✅ Kutayotgan buyurtma yo\'q');
});

// ── Express server ──
const app = express();
app.use(express.json());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => res.send('KCstudy bot ishlayapti!'));

// ── Rate limiting ──
const requestCounts = {};
function rateLimit(userId, maxPerMinute = 10) {
  const now = Date.now();
  const key = userId + '_' + Math.floor(now / 60000);
  requestCounts[key] = (requestCounts[key] || 0) + 1;
  Object.keys(requestCounts).forEach(k => {
    if (k.split('_')[1] < Math.floor(now / 60000) - 1) delete requestCounts[k];
  });
  return requestCounts[key] > maxPerMinute;
}

function isValidUserId(userId) {
  return userId && /^\d+$/.test(userId.toString()) && userId.toString().length >= 5;
}

// ── Foydalanuvchi kurslarini olish ──
app.get('/my-courses', async (req, res) => {
  const userId = req.query.userId;
  if (!isValidUserId(userId)) return res.json({ courses: [], coursesWithInfo: [] });
  if (rateLimit(userId)) return res.status(429).json({ error: 'Too many requests' });

  const courses = await db.getUserCourses(userId.toString());
  const coursesWithInfo = [];
  for (const courseId of courses) {
    const info = await db.getSubscriptionInfo(userId.toString(), courseId);
    coursesWithInfo.push({ courseId, endDate: info ? info.end_date : null });
  }
  res.json({ courses, coursesWithInfo });
});

// ══════════════════════════════════════════
// 🎬 VIDEO ENDPOINTLARI
// ══════════════════════════════════════════

// ── Video signed URL olish (mini app uchun) ──
app.get('/video-url', async (req, res) => {
  try {
    const { userId, courseId, bolim, dars } = req.query;

    if (!isValidUserId(userId)) return res.json({ success: false, error: 'Noto\'g\'ri so\'rov' });
    if (rateLimit(userId, 20)) return res.status(429).json({ error: 'Too many requests' });

    // Kurs sotib olinganmi tekshirish
    const hasCourse = await db.userHasCourse(userId.toString(), courseId);
    if (!hasCourse) {
      return res.json({ success: false, error: 'Kurs sotib olinmagan' });
    }

    // Video fayl nomi: masalan 1A_bolim1_dars1.mp4
    const fileName = `${courseId}_bolim${bolim}_dars${dars}.mp4`;

    // Signed URL yaratish (2 soatlik)
    const signedUrl = await getSignedUrl(fileName, 7200);

    res.json({ success: true, url: signedUrl });
  } catch (e) {
    console.error('/video-url error:', e);
    res.json({ success: false, error: 'Video topilmadi' });
  }
});

// ── Admin: video yuklash ──
app.post('/admin/upload-video', videoUpload.single('video'), async (req, res) => {
  try {
    // Admin tekshiruvi
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== BOT_TOKEN) {
      return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' });
    }

    const { courseId, bolim, dars } = req.body;
    const file = req.file;

    if (!file || !courseId || !bolim || !dars) {
      return res.json({ success: false, error: 'Ma\'lumotlar yetarli emas' });
    }

    // Fayl turi tekshirish
    if (!file.mimetype.startsWith('video/')) {
      return res.json({ success: false, error: 'Faqat video yuborilishi mumkin' });
    }

    const fileName = `${courseId}_bolim${bolim}_dars${dars}.mp4`;

    // B2 ga yuklash
    const result = await uploadToB2(file.buffer, fileName, file.mimetype);

    res.json({
      success: true,
      fileName: fileName,
      fileId: result.fileId,
      size: file.size
    });
  } catch (e) {
    console.error('/upload-video error:', e);
    res.json({ success: false, error: e.message });
  }
});

// ── Chek rasmi yuklash ──
app.post('/upload-chek', upload.single('photo'), async (req, res) => {
  try {
    const { userId, courseId, username, firstName } = req.body;
    const file = req.file;

    if (!isValidUserId(userId) || !file) return res.json({ success: false, error: 'Ma\'lumotlar noto\'g\'ri' });
    if (rateLimit(userId, 3)) return res.status(429).json({ success: false, error: 'Juda ko\'p so\'rov' });
    if (file.size > 10 * 1024 * 1024) return res.json({ success: false, error: 'Fayl juda katta (max 10MB)' });
    if (!file.mimetype.startsWith('image/')) return res.json({ success: false, error: 'Faqat rasm yuborilishi mumkin' });

    const orderId = `${userId}_${courseId}_${Date.now()}`;
    await db.createOrder(orderId, userId.toString(), courseId || '', username || '', firstName || '');

    await bot.telegram.sendPhoto(ADMIN_ID, { source: file.buffer }, {
      caption:
        `📸 Yangi chek!\n\n` +
        `👤 ${firstName || ''} ${username ? '@' + username : ''}\n` +
        `🆔 ID: ${userId}\n` +
        `📚 Kurs: SNU ${courseId}\n` +
        `🔑 Order ID: <code>${orderId}</code>`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Tasdiqlash', callback_data: `approve_${orderId}` },
          { text: '❌ Bekor qilish', callback_data: `reject_${orderId}` }
        ]]
      }
    });

    await bot.telegram.sendMessage(userId, `✅ Chekingiz qabul qilindi!\n\nAdmin 24 soat ichida tasdiqlaydi.`);
    res.json({ success: true });
  } catch (e) {
    console.error('/upload-chek error:', e);
    res.json({ success: false, error: e.message });
  }
});

// ── To'lov so'rovi ──
app.post('/payment', async (req, res) => {
  try {
    const { userId, courseId, username, firstName } = req.body;

    if (!isValidUserId(userId) || !courseId) return res.json({ success: false, error: 'Ma\'lumotlar noto\'g\'ri' });
    if (rateLimit(userId, 5)) return res.status(429).json({ success: false, error: 'Juda ko\'p so\'rov' });

    const validCourses = ['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'];
    if (!validCourses.includes(courseId)) return res.json({ success: false, error: 'Noto\'g\'ri kurs' });
    if (await db.userHasCourse(userId.toString(), courseId)) return res.json({ success: false, error: 'Kurs allaqachon mavjud' });

    const price = COURSE_PRICES[courseId] || 150000;
    const orderId = `${userId}_${courseId}_${Date.now()}`;
    await db.createOrder(orderId, userId.toString(), courseId, username || '', firstName || '');

    await bot.telegram.sendMessage(
      userId,
      `💳 To'lov ma'lumotlari\n\n` +
      `📚 Kurs: SNU ${courseId}\n` +
      `💰 Narx: ${price.toLocaleString()} so'm\n\n` +
      `Karta raqami:\n<code>${CARD_NUMBER}</code>\n` +
      `Karta egasi: ${CARD_OWNER}\n\n` +
      `⚠️ To'lov qilgandan so'ng <b>chek rasmini</b> shu chatga yuboring.\n` +
      `Admin 24 soat ichida tasdiqlaydi.\n\n` +
      `🔑 Buyurtma ID: <code>${orderId}</code>`,
      { parse_mode: 'HTML' }
    );

    await bot.telegram.sendMessage(
      ADMIN_ID,
      `🛒 Yangi buyurtma!\n\n` +
      `👤 ${firstName || ''} ${username ? '@' + username : ''}\n` +
      `🆔 ID: ${userId}\n` +
      `📚 Kurs: SNU ${courseId}\n` +
      `💰 Narx: ${price.toLocaleString()} so'm\n` +
      `🔑 Order ID: <code>${orderId}</code>`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: '✅ Tasdiqlash', callback_data: `approve_${orderId}` },
            { text: '❌ Bekor qilish', callback_data: `reject_${orderId}` }
          ]]
        }
      }
    );

    res.json({ success: true });
  } catch (e) {
    console.error('/payment error:', e);
    res.json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT} portda ishlamoqda`));

bot.launch().then(() => {
  console.log('KCstudy bot ishga tushdi! ✅');
}).catch(err => {
  console.error('Bot xatosi:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ── Obuna tekshirish ──
async function checkSubscriptions() {
  try {
    const expired = await db.deactivateExpiredSubscriptions();
    for (const sub of expired) {
      try {
        await bot.telegram.sendMessage(
          sub.user_id,
          `⏰ SNU ${sub.course_id} kursi obunangiz tugadi.\n\nDavom etish uchun mini appdan qayta obuna bo'ling 👇`,
          Markup.inlineKeyboard([[Markup.button.webApp('📚 KCstudy', MINI_APP_URL)]])
        );
      } catch (e) {}
    }

    const expiring = await db.getExpiringSubscriptions();
    for (const sub of expiring) {
      const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      try {
        await bot.telegram.sendMessage(
          sub.user_id,
          `⚠️ SNU ${sub.course_id} kursi obunangiz ${daysLeft} kundan keyin tugaydi!\n\nUzilmaslik uchun mini appdan yangilang 👇`,
          Markup.inlineKeyboard([[Markup.button.webApp('📚 KCstudy', MINI_APP_URL)]])
        );
      } catch (e) {}
    }
    console.log(`Obuna tekshirildi: ${expired.length} tugadi, ${expiring.length} tugayapti`);
  } catch (e) {
    console.error('checkSubscriptions xatosi:', e);
  }
}

setInterval(checkSubscriptions, 24 * 60 * 60 * 1000);
setTimeout(checkSubscriptions, 5000);
