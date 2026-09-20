const mysql = require('mysql2/promise');
require('dotenv').config();

// Khởi tạo Connection Pool kết nối với Aiven MySQL (Đã gắn cứng thông số)
const db = mysql.createPool({
    host: 'mysql-31160401-aquocduong76-007c.a.aivencloud.com', // Gắn cứng chính xác tên miền Aiven
    user: 'avnadmin',                                         // Gắn cứng tên User
    password: process.env.DB_PASSWORD,                        // Vẫn lấy mật khẩu từ tab Environment trên Render
    database: 'defaultdb',                                    // Gắn cứng tên Database
    port: 28559,                                              // Gắn cứng cổng kết nối
    ssl: {
        rejectUnauthorized: false                             // Bắt buộc phải có để Aiven cho phép kết nối
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối ngay khi khởi động server
db.getConnection()
    .then(connection => {
        console.log('✅ Đã kết nối thành công tới CSDL Aiven MySQL!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối CSDL:', err.message);
    });

module.exports = db;
