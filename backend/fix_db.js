const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'edtech_db',
    ssl: {
        rejectUnauthorized: false // 👉 THÊM DÒNG NÀY ĐỂ AIVEN CHO PHÉP KẾT NỐI
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(() => console.log('✅ Đã kết nối thành công với MySQL Workbench/Aiven!'))
    .catch((err) => console.error('❌ Lỗi kết nối MySQL:', err.message));

module.exports = pool;