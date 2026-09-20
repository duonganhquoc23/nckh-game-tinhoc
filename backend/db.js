const mysql = require('mysql2/promise');
require('dotenv').config();

// Sử dụng .trim() để dọn sạch các khoảng trắng/dấu enter ẩn bị lỗi khi copy
const db = mysql.createPool({
    host: process.env.DB_HOST ? process.env.DB_HOST.trim() : '',
    user: process.env.DB_USER ? process.env.DB_USER.trim() : '',
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.trim() : '',
    database: process.env.DB_NAME ? process.env.DB_NAME.trim() : '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 28559,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then(connection => {
        console.log('✅ Đã kết nối thành công tới CSDL Aiven MySQL!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối CSDL:', err.message);
    });

module.exports = db;
