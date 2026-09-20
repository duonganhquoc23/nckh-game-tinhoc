require('dotenv').config();
const API_KEY = process.env.GEMINI_API_KEY;

console.log("⏳ Đang dùng chìa khóa để gõ cửa máy chủ Google...");

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`)
  .then(res => res.json())
  .then(data => {
      if (data.error) {
          console.error("❌ MÁY CHỦ BÁO LỖI:", data.error.message);
      } else {
          console.log("✅ KẾT NỐI THÀNH CÔNG! Đây là các Model bạn được phép dùng:");
          // Lọc và in ra các model hỗ trợ tạo văn bản (generateContent)
          data.models
            .filter(m => m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent"))
            .forEach(m => console.log("👉 " + m.name.replace('models/', '')));
      }
  })
  .catch(err => console.error("Lỗi mạng:", err));