const fetch = require('node-fetch');
const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const multer = require('multer');
const db = require('./database');
const crypto = require('crypto');

const upload = multer({ storage: multer.memoryStorage() });
const videoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 * 1024 } });

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;
const MINI_APP_URL = process.env.MINI_APP_URL;
const CARD_NUMBER = process.env.CARD_NUMBER;
const CARD_OWNER = process.env.CARD_OWNER;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── Backblaze B2 ──
const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APP_KEY = process.env.B2_APP_KEY;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;
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
// 🎬 BACKBLAZE B2
// ══════════════════════════════════════════
let b2AuthToken = null;
let b2ApiUrl = null;
let b2DownloadUrl = null;
let b2AuthTime = 0;

async function getB2Auth() {
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

async function getBucketId(apiUrl, authToken) {
  if (B2_BUCKET_ID) return B2_BUCKET_ID;
  const response = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: { 'Authorization': authToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: B2_KEY_ID.split(':')[0] || B2_KEY_ID })
  });
  const data = await response.json();
  const bucket = data.buckets && data.buckets.find(b => b.bucketName === B2_BUCKET_NAME);
  return bucket ? bucket.bucketId : null;
}

async function getUploadUrl(apiUrl, authToken) {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: { 'Authorization': authToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: await getBucketId(apiUrl, authToken) })
  });
  return response.json();
}

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
  if (!response.ok) throw new Error('B2 upload failed: ' + await response.text());
  return response.json();
}

async function getSignedUrl(fileName, expiresInSeconds = 7200) {
  const { authToken, apiUrl, downloadUrl } = await getB2Auth();
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_download_authorization`, {
    method: 'POST',
    headers: { 'Authorization': authToken, 'Content-Type': 'application/json' },
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
// 🤖 TELEGRAM BOT
// ══════════════════════════════════════════
bot.start((ctx) => {
  const firstName = ctx.from.first_name || 'Foydalanuvchi';
  ctx.reply(
    `Salom, ${firstName}! 👋\n\nKCstudy — Koreys tili o'rganish platformasi 🇰🇷\n\nIlovani yuklab oling va o'qishni boshlang!`,
  );
});

bot.command('help', (ctx) => {
  ctx.reply(
    '📌 Yordam:\n\n' +
    '• Kurs sotib olish uchun ilovada "Sotib olish" tugmasini bosing\n' +
    '• To\'lovdan so\'ng chekni shu botga yuboring\n' +
    '• Admin 24 soat ichida tasdiqlaydi\n\n' +
    '/mycourses — mening kurslarim'
  );
});

bot.command('mycourses', async (ctx) => {
  const userId = ctx.from.id.toString();
  const courses = await db.getUserCourses(userId);
  if (courses.length === 0) {
    ctx.reply('Sizda hali sotib olingan kurs yo\'q.\n\nIlovani yuklab oling va kurs sotib oling!');
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

// Chek rasmi kelganda
bot.on('photo', async (ctx) => {
  const userId = ctx.from.id.toString();
  const username = ctx.from.username || '';
  const firstName = ctx.from.first_name || '';
  await ctx.forwardMessage(ADMIN_ID);
  await bot.telegram.sendMessage(
    ADMIN_ID,
    `⬆️ Yuqoridagi chek:\n👤 ${firstName} ${username ? '@' + username : ''}\n🆔 ID: ${userId}\n\nTasdiqlash uchun: /approve_ORDERID`
  );
  await ctx.reply('✅ Chekingiz qabul qilindi! Admin tez orada tasdiqlaydi.');
});

// Inline tugmalar
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
      `🎉 Tabriklaymiz!\n\n✅ SNU ${order.courseId} kursi sizga ulandi!\n\nIlovani oching va o'qishni boshlang 📱`
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

bot.hears(/^\/approve_(.+)$/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const orderId = ctx.match[1];
  const order = await db.getOrder(orderId);
  if (!order) return ctx.reply('❌ Order topilmadi: ' + orderId);
  if (order.status === 'approved') return ctx.reply('⚠️ Allaqachon tasdiqlangan!');

  await db.approveOrder(orderId);
  await db.addCourseToUser(order.userId, order.courseId);
  await bot.telegram.sendMessage(order.userId, `🎉 Tabriklaymiz!\n\n✅ SNU ${order.courseId} kursi sizga ulandi!\n\nIlovani oching va o'qishni boshlang 📱`);
  ctx.reply(`✅ Tasdiqlandi! SNU ${order.courseId} kursi ${order.firstName} ga ulandi.`);
});

bot.hears(/^\/reject_(.+)$/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const orderId = ctx.match[1];
  const order = await db.getOrder(orderId);
  if (!order) return ctx.reply('❌ Order topilmadi: ' + orderId);
  await db.rejectOrder(orderId);
  await bot.telegram.sendMessage(order.userId, `❌ Afsuski to'lovingiz tasdiqlanmadi.\n\nMuammo bo'lsa admin bilan bog'laning.`);
  ctx.reply(`❌ Bekor qilindi. ${order.firstName} ga xabar yuborildi.`);
});

bot.command('orders', async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const pendingOrders = await db.getPendingOrders();
  const pending = pendingOrders
    .map(o => `• ${o.first_name} — SNU ${o.course_id}\n  /approve_${o.order_id}`)
    .join('\n\n');
  ctx.reply(pending ? `📋 Kutayotgan buyurtmalar:\n\n${pending}` : '✅ Kutayotgan buyurtma yo\'q');
});

// ══════════════════════════════════════════
// 🌐 EXPRESS SERVER
// ══════════════════════════════════════════
const app = express();
app.use(express.json());
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Rate limiting
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

// userId validatsiya — Telegram ID yoki Firebase UID
function isValidUserId(userId) {
  return userId && userId.toString().length >= 5;
}

app.get('/', (req, res) => res.send('KCstudy API ishlayapti! ✅'));

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

// ── Video URL olish (Flutter + Mini app uchun) ──
app.get('/video-url', async (req, res) => {
  try {
    const { userId, courseId, bolim, dars } = req.query;

    if (!isValidUserId(userId)) return res.json({ success: false, error: 'Noto\'g\'ri so\'rov' });
    if (rateLimit(userId, 20)) return res.status(429).json({ error: 'Too many requests' });

    const hasCourse = await db.userHasCourse(userId.toString(), courseId);
    if (!hasCourse) return res.json({ success: false, error: 'Kurs sotib olinmagan' });

    const fileName = `${courseId}_bolim${bolim}_dars${dars}.mp4`;
    const signedUrl = await getSignedUrl(fileName, 7200);
    res.json({ success: true, url: signedUrl });
  } catch (e) {
    console.error('/video-url error:', e);
    res.json({ success: false, error: 'Video topilmadi' });
  }
});

// ── 🤖 AI Tarjima (Flutter lug'at uchun) ──
app.get('/translate', async (req, res) => {
  const word = req.query.word;
  if (!word) return res.json({ success: false, error: 'So\'z kiritilmadi' });
  if (rateLimit(req.ip || 'anon', 20)) return res.status(429).json({ error: 'Too many requests' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Koreys-o'zbek lug'at yordamchisi. "${word}" so'zini tarjima qil.
Faqat JSON qaytargin, boshqa hech narsa yozma:
{"kr":"koreys yozuvi","uz":"o'zbek tarjimasi","romanization":"o'qilishi","example_kr":"koreys misol gap","example_uz":"misol gapning o'zbek tarjimasi"}
Agar o'zbek so'z bo'lsa koreyscha ber. Agar koreys so'z bo'lsa o'zbekcha ber.`
        }]
      })
    });

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));
if (!data.content || !data.content[0]) {
  throw new Error('AI javob bermadi: ' + JSON.stringify(data));
}
const text = data.content[0].text;
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json({ success: true, ...parsed });
  } catch (e) {
    console.error('/translate error:', e);
    res.json({ success: false, error: e.message, stack: e.stack });
  }
});

// ── Flutter to'lov so'rovi ──
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

    // Adminga xabar
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `🛒 Yangi buyurtma (Flutter ilova)!\n\n` +
      `👤 ${firstName || 'Noma\'lum'} ${username ? '@' + username : ''}\n` +
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

    res.json({
      success: true,
      orderId,
      price,
      cardNumber: CARD_NUMBER,
      cardOwner: CARD_OWNER,
      message: `To'lov ma'lumotlari:\nKarta: ${CARD_NUMBER}\nEgasi: ${CARD_OWNER}\nNarx: ${price.toLocaleString()} so'm\n\nTo'lovdan so'ng chekni Telegram botga yuboring.`
    });
  } catch (e) {
    console.error('/payment error:', e);
    res.json({ success: false, error: e.message });
  }
});

// ── Chek yuklash ──
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

    res.json({ success: true });
  } catch (e) {
    console.error('/upload-chek error:', e);
    res.json({ success: false, error: e.message });
  }
});

// ── Admin: video yuklash ──
app.post('/admin/upload-video', videoUpload.single('video'), async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== BOT_TOKEN) return res.status(403).json({ success: false, error: 'Ruxsat yo\'q' });

    const { courseId, bolim, dars } = req.body;
    const file = req.file;

    if (!file || !courseId || !bolim || !dars) return res.json({ success: false, error: 'Ma\'lumotlar yetarli emas' });
    if (!file.mimetype.startsWith('video/')) return res.json({ success: false, error: 'Faqat video yuborilishi mumkin' });

    const fileName = `${courseId}_bolim${bolim}_dars${dars}.mp4`;
    const result = await uploadToB2(file.buffer, fileName, file.mimetype);
    res.json({ success: true, fileName, fileId: result.fileId, size: file.size });
  } catch (e) {
    console.error('/upload-video error:', e);
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

// Obuna tekshirish
async function checkSubscriptions() {
  try {
    const expired = await db.deactivateExpiredSubscriptions();
    for (const sub of expired) {
      try {
        await bot.telegram.sendMessage(sub.user_id, `⏰ SNU ${sub.course_id} kursi obunangiz tugadi.\n\nDavom etish uchun ilovadan qayta obuna bo'ling 📱`);
      } catch (e) {}
    }
    const expiring = await db.getExpiringSubscriptions();
    for (const sub of expiring) {
      const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      try {
        await bot.telegram.sendMessage(sub.user_id, `⚠️ SNU ${sub.course_id} kursi obunangiz ${daysLeft} kundan keyin tugaydi!\n\nUzilmaslik uchun ilovadan yangilang 📱`);
      } catch (e) {}
    }
  } catch (e) {
    console.error('checkSubscriptions xatosi:', e);
  }
}

setInterval(checkSubscriptions, 24 * 60 * 60 * 1000);
setTimeout(checkSubscriptions, 5000);
