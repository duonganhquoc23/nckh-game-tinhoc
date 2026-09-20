// URL Backend: Đổi thành 'http://localhost:3000' nếu bạn chạy trên máy cá nhân thay vì Render
const API_BASE_URL = 'https://nckh-game-tinhoc.onrender.com';

// DANH SÁCH HUY HIỆU (Yêu cầu điểm XP để mở khóa)
const BADGES = [
    { id: 'b1', name: 'Ngôi Sao Chăm Chỉ', req: 500, icon: 'fa-star', color: 'text-warning' },
    { id: 'b2', name: 'Hiệp Sĩ An Toàn', req: 1000, icon: 'fa-shield-halved', color: 'text-success' },
    { id: 'b3', name: 'Chuyên Gia Thiết Bị', req: 1500, icon: 'fa-medal', color: 'text-secondary' },
    { id: 'b4', name: 'Quán Quân Tin Học', req: 2000, icon: 'fa-trophy', color: 'text-accent' }
];

// 1. CHỨC NĂNG ĐỒNG BỘ DỮ LIỆU LÊN SERVER
async function syncDataToServer(playerData) {
    try {
        await fetch(`${API_BASE_URL}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(playerData)
        });
        console.log("Đã đồng bộ dữ liệu lên máy chủ!");
    } catch (error) {
        console.error("Lỗi đồng bộ dữ liệu:", error);
    }
}

// 2. CHỨC NĂNG ĐĂNG NHẬP (Bắt đầu chơi)
function startGame() {
    const name = document.getElementById('login-name').value.trim();
    const className = document.getElementById('login-class').value;
    const activeAvatarBtn = document.querySelector('.login-box .avatar-btn.selected');
    const avatar = activeAvatarBtn ? activeAvatarBtn.innerText : '👦';

    if (!name || !className) {
        alert("Con nhớ nhập tên và chọn lớp nhé!");
        return;
    }

    const userData = {
        name: name,
        class_name: className,
        avatar: avatar,
        level: 1,
        xp: 0,
        unlocked: [] // Mảng lưu trữ các huy hiệu đã mở khóa
    };

    // Lưu vào trình duyệt
    localStorage.setItem('edtech_user_kid', JSON.stringify(userData));
    
    // Gửi lên server
    syncDataToServer(userData);

    // Cập nhật giao diện
    document.documentElement.classList.remove('no-auth');
    document.documentElement.classList.add('is-auth');
    updateHeader(userData);
}

// 3. CHỨC NĂNG ĐIỀU HƯỚNG TAB
function navigate(targetId) {
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('#nav-menu a').forEach(a => a.classList.remove('active'));
    
    document.getElementById(targetId).classList.add('active');
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    
    if(targetId === 'profile') {
        loadUserProfile(); // Gọi hàm load profile khi chuyển sang Góc thành tích
    }
}

// 4. CHỌN NHÂN VẬT TẠI MÀN HÌNH ĐĂNG NHẬP
function selectLoginAvatar(avatar, btn) {
    document.querySelectorAll('.login-box .avatar-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// 5. CHỌN LẠI NHÂN VẬT BÊN TRONG GAME
function selectAvatar(avatar, btn) {
    document.querySelectorAll('#avatar-list .avatar-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    
    let data = localStorage.getItem('edtech_user_kid');
    if(data) {
        let user = JSON.parse(data);
        user.avatar = avatar;
        localStorage.setItem('edtech_user_kid', JSON.stringify(user));
        updateHeader(user);
        syncDataToServer(user); 
    }
}

// 6. CẬP NHẬT HEADER & HỒ SƠ & HUY HIỆU
function updateHeader(user) {
    if(document.getElementById('header-name')) document.getElementById('header-name').innerText = user.name;
    if(document.getElementById('header-avatar')) document.getElementById('header-avatar').innerText = user.avatar;
}

function loadUserProfile() {
    let data = localStorage.getItem('edtech_user_kid');
    if(!data) return;
    let user = JSON.parse(data);
    
    document.getElementById('prof-name').innerText = user.name || "Khách";
    document.getElementById('prof-class').innerText = user.class_name || "Lớp";
    document.getElementById('prof-avatar').innerText = user.avatar || "👦";
    document.getElementById('prof-level').innerText = user.level || 1;
    document.getElementById('prof-xp').innerText = user.xp || 0;

    // Cập nhật thanh tiến trình XP
    let xp = user.xp || 0;
    let progressPercent = ((xp % 500) / 500) * 100;
    let progressBar = document.getElementById('prof-xp-bar');
    if(progressBar) progressBar.style.width = progressPercent + "%";

    // XỬ LÝ VẼ BỘ SƯU TẬP HUY HIỆU
    const container = document.getElementById('achievements-container');
    if(!container) return;
    container.innerHTML = ''; // Xóa trắng để vẽ lại
    
    if(!user.unlocked) user.unlocked = [];
    
    BADGES.forEach(b => {
        let isUnlocked = user.unlocked.includes(b.id);
        let canUnlock = user.xp >= b.req;
        
        let card = document.createElement('div');
        card.className = `stat-card card ${isUnlocked ? '' : 'locked-badge'}`;
        
        let iconHtml = `<i class="fa-solid ${b.icon} ${isUnlocked ? b.color : ''}" style="font-size: 3rem; ${isUnlocked ? '' : 'color: #94a3b8;'}"></i>`;
        let titleHtml = `<h3 style="font-family: 'Baloo 2', cursive; font-size: 1.4rem; margin-top: 10px;">${b.name}</h3>`;
        
        let btnHtml = '';
        if(isUnlocked) {
            btnHtml = `<span style="color: #10b981; font-weight: bold; margin-top:10px;"><i class="fa-solid fa-check-circle"></i> Đã mở khóa</span>`;
        } else if(canUnlock) {
            btnHtml = `<button class="btn btn-primary mt-2" onclick="unlockBadge('${b.id}', this)" style="padding: 5px 15px; font-size: 0.95rem;">MỞ KHÓA 🔓</button>`;
        } else {
            btnHtml = `<span style="color: #94a3b8; font-weight: bold; margin-top:10px;"><i class="fa-solid fa-lock"></i> Cần ${b.req} XP</span>`;
        }
        
        card.innerHTML = iconHtml + titleHtml + btnHtml;
        container.appendChild(card);
    });
}

// 7. CHỨC NĂNG BẤM NÚT MỞ KHÓA HUY HIỆU
function unlockBadge(badgeId, btnElement) {
    let data = localStorage.getItem('edtech_user_kid');
    if(!data) return;
    let user = JSON.parse(data);
    if(!user.unlocked) user.unlocked = [];

    // Thêm huy hiệu vào danh sách đã mở
    user.unlocked.push(badgeId);
    localStorage.setItem('edtech_user_kid', JSON.stringify(user));
    syncDataToServer(user);
    
    // Tạo hiệu ứng pháo hoa tại vị trí nút bấm
    let rect = btnElement.getBoundingClientRect();
    createConfetti(rect.left + rect.width / 2, rect.top);
    
    // Tải lại giao diện sau 0.8 giây
    setTimeout(() => { loadUserProfile(); }, 800);
}

// HIỆU ỨNG PHÁO HOA
function createConfetti(x, y) {
    const colors = ['#facc15', '#34d399', '#f43f5e', '#60a5fa', '#a855f7'];
    for(let i=0; i<30; i++) {
        let conf = document.createElement('div');
        conf.className = 'confetti';
        conf.style.left = x + 'px';
        conf.style.top = y + 'px';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(conf);
        
        let angle = Math.random() * Math.PI * 2;
        let dist = Math.random() * 150 + 50;
        conf.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        conf.style.setProperty('--ty', (Math.sin(angle) * dist + 100) + 'px'); 
        
        setTimeout(() => conf.remove(), 1000);
    }
}

// 8. ĐĂNG XUẤT
function resetData() {
    if(confirm("Con có chắc chắn muốn thoát game không?")) {
        localStorage.removeItem('edtech_user_kid');
        document.documentElement.classList.remove('is-auth');
        document.documentElement.classList.add('no-auth');
    }
}

// 9. KIỂM TRA ĐĂNG NHẬP KHI TẢI TRANG
window.addEventListener('DOMContentLoaded', () => {
    let data = localStorage.getItem('edtech_user_kid');
    if(data) {
        updateHeader(JSON.parse(data));
        // Kiểm tra xem URL có chứa #profile không để mở tab thành tích ngay
        if (window.location.hash === '#profile') {
            navigate('profile');
        }
    }
});
