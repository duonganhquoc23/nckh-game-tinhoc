const bcrypt = require('bcrypt');
const db = require('./db');

async function resetPassword() {
    try {
        console.log("⏳ Đang thiết lập lại mật khẩu...");
        const newHash = await bcrypt.hash('admin123', 10);
        
        const [result] = await db.query("UPDATE admin_users SET password_hash = ? WHERE username = 'admin'", [newHash]);
        
        if (result.affectedRows === 0) {
            console.log("⚠️ Tài khoản admin bị thiếu. Đang tạo mới...");
            await db.query("INSERT INTO admin_users (username, password_hash) VALUES ('admin', ?)", [newHash]);
        }
        
        console.log("✅ THÀNH CÔNG TÚY ĐỐI! Tài khoản là: admin | Mật khẩu là: admin123");
    } catch (error) {
        console.error("❌ LỖI:", error.message);
    } finally {
        process.exit();
    }
}

resetPassword();