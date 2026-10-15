require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trang chủ kiểm tra trạng thái Server (Rất hữu ích khi deploy lên Render)
app.get('/', (req, res) => {
    res.send('🚀 Backend Thế Giới Game Tin Học đang hoạt động bình thường!');
});

// API 1: Tạo bảng CSDL (Chỉ chạy 1 lần lúc setup)
app.get('/api/setup', async (req, res) => {
    try {
        // 1. Tạo bảng users (Đã thêm cột played_submarine để giới hạn 1 lần chơi)
        const createTableUsers = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
                class_name VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                avatar VARCHAR(255),
                level INT DEFAULT 1,
                xp INT DEFAULT 0,
                played_submarine BOOLEAN DEFAULT FALSE, 
                last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await db.query(createTableUsers);

        // 2. Tạo bảng game_history (Lưu lịch sử câu hỏi)
        const createTableHistory = `
            CREATE TABLE IF NOT EXISTS game_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
                game_name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                question TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                student_answer TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                is_correct BOOLEAN,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await db.query(createTableHistory);

        // Nếu bảng users đã tồn tại từ trước mà chưa có cột played_submarine, lệnh ALTER TABLE này sẽ thêm vào
        try {
            await db.query("ALTER TABLE users ADD COLUMN played_submarine BOOLEAN DEFAULT FALSE");
            console.log("Đã thêm cột played_submarine vào bảng users hiện tại.");
        } catch (e) {
            // Bỏ qua lỗi nếu cột đã tồn tại
        }

        res.status(200).send("🎉 TUYỆT VỜI! Đã tạo/cập nhật bảng users và game_history thành công.");
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

// -------------------------------------------------------------
// API MỚI: KIỂM TRA QUYỀN CHƠI GAME TÀU NGẦM (GIỚI HẠN 1 LẦN)
// -------------------------------------------------------------
app.post('/api/check-submarine-status', async (req, res) => {
    const { name, class_name } = req.body;
    
    // Kiểm tra cả tên và lớp để đảm bảo tính chính xác
    if (!name || !class_name) {
        return res.status(400).json({ error: "Thiếu tên hoặc lớp của học sinh" });
    }

    try {
        const [rows] = await db.query("SELECT played_submarine FROM users WHERE name = ? AND class_name = ?", [name, class_name]);
        
        if (rows.length === 0) {
            // Nếu user chưa có trong DB (lần đầu đăng nhập), chắc chắn là được chơi
            return res.status(200).json({ can_play: true });
        }

        // Nếu played_submarine là true/1 => Không cho chơi, ngược lại => Cho chơi
        const hasPlayed = rows[0].played_submarine;
        res.status(200).json({ can_play: !hasPlayed });
        
    } catch (error) {
        console.error("Lỗi kiểm tra trạng thái game:", error);
        res.status(500).json({ error: error.message });
    }
});

// -------------------------------------------------------------
// API MỚI: ĐÁNH DẤU ĐÃ CHƠI XONG GAME TÀU NGẦM (KHÓA LẠI)
// -------------------------------------------------------------
app.post('/api/mark-submarine-played', async (req, res) => {
    const { name, class_name } = req.body;
    
    if (!name || !class_name) {
        return res.status(400).json({ error: "Thiếu tên hoặc lớp của học sinh" });
    }

    try {
        // Update dựa trên cả tên và lớp
        await db.query("UPDATE users SET played_submarine = TRUE WHERE name = ? AND class_name = ?", [name, class_name]);
        res.status(200).json({ message: "Đã khóa quyền chơi Tàu Ngầm Khám Phá cho học sinh này." });
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái game:", error);
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
        const [student] = await db.query("SELECT name FROM users WHERE id = ?", [req.params.id]);
        if (student.length > 0) {
            await db.query("DELETE FROM game_history WHERE student_name = ?", [student[0].name]);
        }
        await db.query("DELETE FROM users WHERE id = ?", [req.params.id]);
        res.status(200).json({ message: 'Đã xóa học sinh và lịch sử liên quan' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 5: Xóa toàn bộ học sinh hoặc xóa theo Lớp
app.delete('/api/students', async (req, res) => {
    try {
        const className = req.query.class_name;
        if (className) {
            const [students] = await db.query("SELECT name FROM users WHERE class_name = ?", [className]);
            for (let s of students) {
                await db.query("DELETE FROM game_history WHERE student_name = ?", [s.name]);
            }
            await db.query("DELETE FROM users WHERE class_name = ?", [className]);
        } else {
            await db.query("DELETE FROM game_history");
            await db.query("DELETE FROM users");
        }
        res.status(200).json({ message: 'Đã xóa dữ liệu' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 6: Lưu lịch sử 1 câu trả lời từ Game
app.post('/api/history', async (req, res) => {
    const { student_name, game_name, question, student_answer, is_correct } = req.body;
    try {
        const query = `
            INSERT INTO game_history (student_name, game_name, question, student_answer, is_correct) 
            VALUES (?, ?, ?, ?, ?)
        `;
        await db.query(query, [student_name, game_name, question, student_answer, is_correct]);
        res.status(200).json({ message: 'Đã lưu lịch sử câu hỏi' });
    } catch (error) {
        console.error("Lỗi lưu lịch sử:", error);
        res.status(500).json({ error: error.message });
    }
});

// API 7: Lấy lịch sử làm bài của 1 học sinh (Dành cho trang Admin)
app.get('/api/history/:student_name', async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT * FROM game_history WHERE student_name = ? ORDER BY created_at DESC", 
            [req.params.student_name]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server API đang chạy tại cổng ${PORT}`));
