require('dotenv').config();
const db = require('./db'); // Gọi file db.js (chứa kết nối pool) của bạn

// Hàm chuẩn hóa tên (viết hoa chữ cái đầu, xóa khoảng trắng thừa)
function formatStudentName(name) {
    if (!name) return "";
    return name.trim()
               .toLowerCase()
               .replace(/\s+/g, ' ')
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
}

async function fixDatabaseNames() {
    try {
        console.log("🚀 Đang quét Database để tìm tên bị lỗi...");
        
        // Lấy danh sách toàn bộ học sinh
        const [users] = await db.query("SELECT id, name FROM users");
        
        let updatedCount = 0;
        for (let user of users) {
            const correctedName = formatStudentName(user.name);
            
            // Nếu phát hiện tên sai chuẩn, tiến hành update lại
            if (user.name !== correctedName) {
                await db.query("UPDATE users SET name = ? WHERE id = ?", [correctedName, user.id]);
                console.log(`👉 Đã sửa: "${user.name}"  ==>  "${correctedName}"`);
                updatedCount++;
            }
        }
        
        console.log(`✅ Tuyệt vời! Đã chuẩn hóa thành công ${updatedCount} tên học sinh.`);
        process.exit(0); // Tự động ngắt kết nối sau khi làm xong
    } catch (error) {
        console.error("❌ Lỗi khi sửa Database:", error.message);
        process.exit(1);
    }
}

// Chạy hàm
fixDatabaseNames();
