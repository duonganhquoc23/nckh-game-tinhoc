const mysql = require('mysql2/promise');
require('dotenv').config();

// Khởi tạo Connection Pool kết nối với Aiven MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 25060, // Cổng mặc định của Aiven thường là 5 số
    ssl: {
        rejectUnauthorized: false // BẮT BUỘC ĐỂ KẾT NỐI VỚI AIVEN
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối ngay khi khởi động
db.getConnection()
    .then(connection => {
        console.log('✅ Đã kết nối thành công tới CSDL Aiven MySQL!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối CSDL:', err.message);
    });

module.exports = db;
