const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:KxwuNOBJTtmfUUPqHoINZhFpwfPMoFrh@postgres.railway.internal:5432/railway',
  ssl: false
});

// Jadvallarni yaratish
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      courses TEXT[] DEFAULT '{}'
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id TEXT PRIMARY KEY,
      user_id TEXT,
      course_id TEXT,
      username TEXT,
      first_name TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      course_id TEXT,
      start_date TIMESTAMP DEFAULT NOW(),
      end_date TIMESTAMP,
      active BOOLEAN DEFAULT TRUE,
      UNIQUE(user_id, course_id)
    )
  `);
  console.log('DB jadvallar tayyor ✅');
}

initDB().catch(console.error);

// Foydalanuvchiga kurs qo'shish (1 oylik obuna)
async function addCourseToUser(userId, courseId) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1); // 1 oy qo'shish

  await pool.query(`
    INSERT INTO subscriptions (user_id, course_id, start_date, end_date, active)
    VALUES ($1, $2, $3, $4, TRUE)
    ON CONFLICT (user_id, course_id) DO UPDATE
    SET start_date = $3, end_date = $4, active = TRUE
  `, [userId, courseId, startDate, endDate]);

  // users jadvaliga ham qo'shish
  await pool.query(`
    INSERT INTO users (user_id, courses) VALUES ($1, ARRAY[$2]::text[])
    ON CONFLICT (user_id) DO UPDATE
    SET courses = array_append(users.courses, $2)
    WHERE NOT ($2 = ANY(users.courses))
  `, [userId, courseId]);
}

// Foydalanuvchining aktiv kurslarini olish
async function getUserCourses(userId) {
  const res = await pool.query(`
    SELECT course_id FROM subscriptions
    WHERE user_id = $1 AND active = TRUE AND end_date > NOW()
  `, [userId]);
  return res.rows.map(r => r.course_id);
}

// Foydalanuvchida aktiv kurs bormi
async function userHasCourse(userId, courseId) {
  const res = await pool.query(`
    SELECT id FROM subscriptions
    WHERE user_id = $1 AND course_id = $2 AND active = TRUE AND end_date > NOW()
  `, [userId, courseId]);
  return res.rows.length > 0;
}

// Obuna tugash sanasini olish
async function getSubscriptionInfo(userId, courseId) {
  const res = await pool.query(`
    SELECT * FROM subscriptions
    WHERE user_id = $1 AND course_id = $2 AND active = TRUE
  `, [userId, courseId]);
  return res.rows[0] || null;
}

// 3 kun ichida tugaydigan obunalarni olish
async function getExpiringSubscriptions() {
  const res = await pool.query(`
    SELECT * FROM subscriptions
    WHERE active = TRUE
    AND end_date > NOW()
    AND end_date <= NOW() + INTERVAL '3 days'
  `);
  return res.rows;
}

// Muddati o'tgan obunalarni o'chirish
async function deactivateExpiredSubscriptions() {
  const res = await pool.query(`
    UPDATE subscriptions SET active = FALSE
    WHERE active = TRUE AND end_date <= NOW()
    RETURNING *
  `);
  return res.rows;
}

// Yangi order yaratish
async function createOrder(orderId, userId, courseId, username, firstName) {
  await pool.query(
    'INSERT INTO orders (order_id, user_id, course_id, username, first_name) VALUES ($1, $2, $3, $4, $5)',
    [orderId, userId, courseId, username, firstName]
  );
}

// Orderni olish
async function getOrder(orderId) {
  const res = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
  if (!res.rows[0]) return null;
  const row = res.rows[0];
  return {
    userId: row.user_id,
    courseId: row.course_id,
    username: row.username,
    firstName: row.first_name,
    status: row.status
  };
}

// Orderni tasdiqlash
async function approveOrder(orderId) {
  await pool.query("UPDATE orders SET status = 'approved' WHERE order_id = $1", [orderId]);
  return await getOrder(orderId);
}

// Orderni bekor qilish
async function rejectOrder(orderId) {
  await pool.query("UPDATE orders SET status = 'rejected' WHERE order_id = $1", [orderId]);
  return await getOrder(orderId);
}

// Kutayotgan orderlar
async function getPendingOrders() {
  const res = await pool.query("SELECT * FROM orders WHERE status = 'pending'");
  return res.rows;
}

module.exports = {
  addCourseToUser,
  getUserCourses,
  userHasCourse,
  getSubscriptionInfo,
  getExpiringSubscriptions,
  deactivateExpiredSubscriptions,
  createOrder,
  getOrder,
  approveOrder,
  rejectOrder,
  getPendingOrders
};
