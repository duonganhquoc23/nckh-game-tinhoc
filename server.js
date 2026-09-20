require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// TỰ ĐỘNG KHỞI TẠO CSDL KHI SERVER CHẠY (Khắc phục lỗi mất dữ liệu)
const initDB = async () => {
    try {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
                class_name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                avatar VARCHAR(255),
                level INT DEFAULT 1,
                xp INT DEFAULT 0,
                last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await db.query(createTableQuery);
        console.log("✅ CSDL: Bảng 'users' đã kiểm tra và sẵn sàng!");
    } catch (error) {
        console.error("❌ Lỗi khởi tạo CSDL:", error.message);
    }
};
// Gọi hàm chạy ngay lập tức
initDB();

// API 1: Tạo bảng CSDL thủ công (Giữ lại để dự phòng)
app.get('/api/setup', async (req, res) => {
    try {
        await initDB();
        res.status(200).send("🎉 TUYỆT VỜI! Đã tạo bảng users thành công.");
    } catch (error) {
        res.status(500).send("Lỗi tạo bảng: " + error.message);
    }
});

// API 2: Nhận dữ liệu từ Người chơi lưu vào MySQL
app.post('/api/sync', async (req, res) => {
    const { name, class_name, avatar, level, xp } = req.body;
    try {
        const query = `
            INSERT INTO users (name, class_name, avatar, level, xp) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            class_name = VALUES(class_name), 
            avatar = VALUES(avatar), level = VALUES(level), xp = VALUES(xp)
        `;
        await db.query(query, [name, class_name, avatar, level, xp]);
        res.status(200).json({ message: 'Đồng bộ thành công' });
    } catch (error) {
        console.error("Lỗi đồng bộ:", error);
        res.status(500).json({ error: error.message });
    }
});

// API 3: Trả dữ liệu cho Admin hiển thị
app.get('/api/leaderboard', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM users ORDER BY xp DESC");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        res.status(500).json({ error: error.message });
    }
});

// API 4: Xóa 1 học sinh theo ID
app.delete('/api/student/:id', async (req, res) => {
    try {
        await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.status(200).json({ message: 'Đã xóa học sinh' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 5: Xóa toàn bộ học sinh hoặc xóa theo Lớp
app.delete('/api/students', async (req, res) => {
    try {
        const className = req.query.class_name;
        if (className) {
            await db.query("DELETE FROM users WHERE class_name = ?", [className]);
        } else {
            await db.query("DELETE FROM users");
        }
        res.status(200).json({ message: 'Đã xóa dữ liệu' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server API đang chạy tại cổng ${PORT}`));