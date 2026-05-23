const { Telegraf, Markup } = require('telegraf');
const express = require('express');
const multer = require('multer');
const db = require('./database');

const upload = multer({ storage: multer.memoryStorage() });

const BOT_TOKEN = process.env.BOT_TOKEN || '7600431069:AAFfmqWnJIK7tVhW3RlOK7mKWBQKPZ-NmCs';
const ADMIN_ID = process.env.ADMIN_ID || '1847556913';
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://mrcs00.github.io/miniapp';

// Kurs narxlari
const COURSE_PRICES = {
  '1A': 150000, '1B': 150000,
  '2A': 180000, '2B': 180000,
  '3A': 200000, '3B': 200000,
  '4A': 200000, '4B': 200000,
  '5A': 220000, '5B': 220000,
  '6A': 220000, '6B': 220000,
};

// To'lov karta raqami
const CARD_NUMBER = process.env.CARD_NUMBER || '9860 1201 7364 2691';
const CARD_OWNER = process.env.CARD_OWNER || 'Muhammadqodir Orifjonov';

const bot = new Telegraf(BOT_TOKEN);

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
bot.command('mycourses', (ctx) => {
  const userId = ctx.from.id.toString();
  const courses = db.getUserCourses(userId);
  if (courses.length === 0) {
    ctx.reply('Sizda hali sotib olingan kurs yo\'q.\n\nKurs sotib olish uchun mini appni oching 👇',
      Markup.inlineKeyboard([
        [Markup.button.webApp('📚 KCstudy', MINI_APP_URL)]
      ])
    );
  } else {
    ctx.reply(`✅ Sizning kurslaringiz:\n\n${courses.map(c => `• SNU ${c}`).join('\n')}`);
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

      // Foydalanuvchida kurs allaqachon bormi?
      if (db.userHasCourse(userId, courseId)) {
        return ctx.reply(`✅ Siz allaqachon SNU ${courseId} kursiga egasiz!`);
      }

      // Order ID yaratish
      const orderId = `${userId}_${courseId}_${Date.now()}`;
      db.createOrder(orderId, userId, courseId, username, firstName);

      // Foydalanuvchiga to'lov ma'lumoti
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

      // Adminga xabar
      await bot.telegram.sendMessage(
        ADMIN_ID,
        `🛒 Yangi buyurtma!\n\n` +
        `👤 Foydalanuvchi: ${firstName} ${username ? '@' + username : ''}\n` +
        `🆔 ID: ${userId}\n` +
        `📚 Kurs: SNU ${courseId}\n` +
        `💰 Narx: ${price.toLocaleString()} so'm\n` +
        `🔑 Order ID: <code>${orderId}</code>\n\n` +
        `Tasdiqlash: /approve_${orderId}\n` +
        `Bekor qilish: /reject_${orderId}`,
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

  // Adminga forward qilish
  await ctx.forwardMessage(ADMIN_ID);
  await bot.telegram.sendMessage(
    ADMIN_ID,
    `⬆️ Yuqoridagi chek:\n👤 ${firstName} ${username ? '@' + username : ''}\n🆔 ID: ${userId}\n\n` +
    `Tasdiqlash uchun: /approve_ORDERID\n` +
    `(Order ID ni yuqoridagi xabardan toping)`
  );

  await ctx.reply('✅ Chekingiz qabul qilindi! Admin tez orada tasdiqlaydi.');
});

// ── Admin: /approve_ORDERID ──
bot.hears(/^\/approve_(.+)$/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;

  const orderId = ctx.match[1];
  const order = db.getOrder(orderId);

  if (!order) {
    return ctx.reply('❌ Order topilmadi: ' + orderId);
  }
  if (order.status === 'approved') {
    return ctx.reply('⚠️ Bu order allaqachon tasdiqlangan!');
  }

  db.approveOrder(orderId);
  db.addCourseToUser(order.userId, order.courseId);

  // Foydalanuvchiga xabar
  await bot.telegram.sendMessage(
    order.userId,
    `🎉 Tabriklaymiz!\n\n` +
    `✅ SNU ${order.courseId} kursi sizga ulandi!\n\n` +
    `Mini appni oching va o'qishni boshlang 👇`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('📚 KCstudy ga kirish', MINI_APP_URL)]
    ])
  );

  ctx.reply(`✅ Tasdiqlandi! SNU ${order.courseId} kursi ${order.firstName} ga ulandi.`);
});

// ── Admin: /reject_ORDERID ──
bot.hears(/^\/reject_(.+)$/, async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;

  const orderId = ctx.match[1];
  const order = db.getOrder(orderId);

  if (!order) {
    return ctx.reply('❌ Order topilmadi: ' + orderId);
  }

  db.rejectOrder(orderId);

  // Foydalanuvchiga xabar
  await bot.telegram.sendMessage(
    order.userId,
    `❌ Afsuski to'lovingiz tasdiqlanmadi.\n\n` +
    `Muammo bo'lsa admin bilan bog'laning.`
  );

  ctx.reply(`❌ Bekor qilindi. ${order.firstName} ga xabar yuborildi.`);
});

// ── Admin: barcha buyurtmalar ──
bot.command('orders', async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const { orders } = require('./database');
  const db2 = require('fs').existsSync('./db.json')
    ? JSON.parse(require('fs').readFileSync('./db.json'))
    : { orders: {} };

  const pending = Object.entries(db2.orders)
    .filter(([, o]) => o.status === 'pending')
    .map(([id, o]) => `• ${o.firstName} — SNU ${o.courseId}\n  /approve_${id}`)
    .join('\n\n');

  ctx.reply(pending ? `📋 Kutayotgan buyurtmalar:\n\n${pending}` : '✅ Kutayotgan buyurtma yo\'q');
});

// ── Express server (Render/Railway uchun) ──
const app = express();
app.use(express.json());

// CORS - mini app dan so'rovlarga ruxsat
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (req, res) => res.send('KCstudy bot ishlayapti!'));

// ── Foydalanuvchi kurslarini olish ──
app.get('/my-courses', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.json({ courses: [] });
  const courses = db.getUserCourses(userId.toString());
  res.json({ courses });
});

// ── Chek rasmi yuklash ──
app.post('/upload-chek', upload.single('photo'), async (req, res) => {
  try {
    const { userId, courseId, username, firstName } = req.body;
    const file = req.file;

    if (!file || !userId) {
      return res.json({ success: false, error: 'Ma\'lumotlar yetarli emas' });
    }

    const orderId = `${userId}_${courseId}_${Date.now()}`;
    db.createOrder(orderId, userId.toString(), courseId || '', username || '', firstName || '');

    // Adminga rasmni yuborish
    await bot.telegram.sendPhoto(ADMIN_ID, { source: file.buffer }, {
      caption:
        `📸 Yangi chek!\n\n` +
        `👤 ${firstName || ''} ${username ? '@' + username : ''}\n` +
        `🆔 ID: ${userId}\n` +
        `📚 Kurs: SNU ${courseId}\n` +
        `🔑 Order ID: <code>${orderId}</code>\n\n` +
        `Tasdiqlash: /approve_${orderId}\n` +
        `Bekor qilish: /reject_${orderId}`,
      parse_mode: 'HTML'
    });

    // Foydalanuvchiga xabar
    await bot.telegram.sendMessage(
      userId,
      `✅ Chekingiz qabul qilindi!\n\nAdmin 24 soat ichida tasdiqlaydi.`
    );

    res.json({ success: true });
  } catch (e) {
    console.error('/upload-chek error:', e);
    res.json({ success: false, error: e.message });
  }
});

// ── Mini app dan to'lov so'rovi ──
app.post('/payment', async (req, res) => {
  try {
    const { userId, courseId, username, firstName } = req.body;

    if (!userId || !courseId) {
      return res.json({ success: false, error: 'Ma\'lumotlar yetarli emas' });
    }

    // Foydalanuvchida kurs allaqachon bormi?
    if (db.userHasCourse(userId.toString(), courseId)) {
      return res.json({ success: false, error: 'Kurs allaqachon mavjud' });
    }

    const price = COURSE_PRICES[courseId] || 150000;
    const orderId = `${userId}_${courseId}_${Date.now()}`;
    db.createOrder(orderId, userId.toString(), courseId, username || '', firstName || '');

    // Foydalanuvchiga to'lov ma'lumoti yuborish
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

    // Adminga xabar
    await bot.telegram.sendMessage(
      ADMIN_ID,
      `🛒 Yangi buyurtma!\n\n` +
      `👤 ${firstName || ''} ${username ? '@' + username : ''}\n` +
      `🆔 ID: ${userId}\n` +
      `📚 Kurs: SNU ${courseId}\n` +
      `💰 Narx: ${price.toLocaleString()} so'm\n` +
      `🔑 Order ID: <code>${orderId}</code>\n\n` +
      `Tasdiqlash: /approve_${orderId}\n` +
      `Bekor qilish: /reject_${orderId}`,
      { parse_mode: 'HTML' }
    );

    res.json({ success: true });
  } catch (e) {
    console.error('/payment error:', e);
    res.json({ success: false, error: e.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ${PORT} portda ishlamoqda`));

// ── Botni ishga tushirish ──
bot.launch().then(() => {
  console.log('KCstudy bot ishga tushdi! ✅');
}).catch(err => {
  console.error('Bot xatosi:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
