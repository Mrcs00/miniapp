const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

// DB ni o'qish
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: {}, orders: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

// DB ni saqlash
function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Foydalanuvchiga kurs qo'shish
function addCourseToUser(userId, courseId) {
  const db = readDB();
  if (!db.users[userId]) db.users[userId] = { courses: [] };
  if (!db.users[userId].courses.includes(courseId)) {
    db.users[userId].courses.push(courseId);
  }
  saveDB(db);
}

// Foydalanuvchining kurslarini olish
function getUserCourses(userId) {
  const db = readDB();
  return db.users[userId]?.courses || [];
}

// Foydalanuvchida kurs bormi tekshirish
function userHasCourse(userId, courseId) {
  return getUserCourses(userId).includes(courseId);
}

// Yangi order yaratish
function createOrder(orderId, userId, courseId, username, firstName) {
  const db = readDB();
  db.orders[orderId] = {
    userId,
    courseId,
    username,
    firstName,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  saveDB(db);
}

// Orderni olish
function getOrder(orderId) {
  const db = readDB();
  return db.orders[orderId] || null;
}

// Orderni tasdiqlash
function approveOrder(orderId) {
  const db = readDB();
  if (db.orders[orderId]) {
    db.orders[orderId].status = 'approved';
    saveDB(db);
    return db.orders[orderId];
  }
  return null;
}

// Orderni bekor qilish
function rejectOrder(orderId) {
  const db = readDB();
  if (db.orders[orderId]) {
    db.orders[orderId].status = 'rejected';
    saveDB(db);
    return db.orders[orderId];
  }
  return null;
}

module.exports = {
  addCourseToUser,
  getUserCourses,
  userHasCourse,
  createOrder,
  getOrder,
  approveOrder,
  rejectOrder
};
