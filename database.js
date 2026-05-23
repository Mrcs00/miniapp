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
  console.log('DB jadvallar tayyor ✅');
}

initDB().catch(console.error);

// Foydalanuvchiga kurs qo'shish
async function addCourseToUser(userId, courseId) {
  await pool.query(`
    INSERT INTO users (user_id, courses) VALUES ($1, ARRAY[$2]::text[])
    ON CONFLICT (user_id) DO UPDATE
    SET courses = array_append(users.courses, $2)
    WHERE NOT ($2 = ANY(users.courses))
  `, [userId, courseId]);
}

// Foydalanuvchining kurslarini olish
async function getUserCourses(userId) {
  const res = await pool.query('SELECT courses FROM users WHERE user_id = $1', [userId]);
  return res.rows[0]?.courses || [];
}

// Foydalanuvchida kurs bormi
async function userHasCourse(userId, courseId) {
  const courses = await getUserCourses(userId);
  return courses.includes(courseId);
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
  createOrder,
  getOrder,
  approveOrder,
  rejectOrder,
  getPendingOrders
};
