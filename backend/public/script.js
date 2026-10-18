// URL Backend
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

// Lấy ID/Username của user hiện tại
function getCurrentUser() {
    let data = localStorage.getItem('edtech_user_kid');
    return data ? JSON.parse(data) : null;
}

// ---------------------------------------------------------
// TÍNH NĂNG MỚI: QUẢN LÝ GAME KHÓA BẰNG MẬT KHẨU
// ---------------------------------------------------------

// Cập nhật giao diện các nút game (khóa/mở) khi tải trang
function updateGameButtons() {
    let user = getCurrentUser();
    if (!user) return;

    if (!user.unlockedGames) user.unlockedGames = [];

    // ĐÃ FIX: Chèn đúng tên file HTML của Đảo Tư Duy và Đấu Trường So Tài
    const lockedGamesConfig = [
        { id: 'daotuduy', btnId: 'btn-daotuduy', url: 'game_matching.html' },
        { id: 'dautruong', btnId: 'btn-dautruong', url: 'game_arena.html' }
    ];

    lockedGamesConfig.forEach(game => {
        const btn = document.getElementById(game.btnId);
        if (btn) {
            const card = btn.closest('.game-card-v2');
            
            if (user.unlockedGames.includes(game.id)) {
                // Đã mở khóa
                btn.innerHTML = 'Khởi hành <i class="fa-solid fa-rocket"></i>';
                btn.className = 'btn btn-primary w-100';
                btn.onclick = () => window.location.href = game.url;
                if (card) card.classList.remove('game-locked');
            } else {
                // Chưa mở khóa
                btn.innerHTML = 'Mở khóa 🔓';
                btn.className = 'btn btn-warning w-100';
                btn.style.backgroundColor = '#fbbf24'; 
                btn.style.color = '#fff';
                btn.onclick = () => playLockedGame(game.id, game.url);
                if (card) card.classList.add('game-locked'); 
            }
        }
    });
}

// Hàm kiểm tra mật khẩu để mở khóa game
function playLockedGame(gameId, targetUrl) {
    let user = getCurrentUser();
    if (!user) {
        alert("Vui lòng đăng nhập trước khi chơi!");
        return;
    }

    if (!user.unlockedGames) user.unlockedGames = [];

    // Nhập mật khẩu
    let pwd = prompt("Trò chơi này đang bị khóa! Vui lòng nhập mật khẩu để mở khóa:");
    
    if (pwd === null) return; 
    
    if (pwd === '23122006') {
        user.unlockedGames.push(gameId);
        localStorage.setItem('edtech_user_kid', JSON.stringify(user));
        syncDataToServer(user);
        
        alert("🎉 Chúc mừng! Con đã mở khóa game thành công!");
        updateGameButtons(); 
    } else {
        alert("❌ Mật khẩu chưa đúng rồi, con thử lại nhé!");
    }
}

// Hàm chơi game bình thường (dành cho Ếch con qua sông)
function playNormalGame(targetUrl) {
    let user = getCurrentUser();
    if (!user) {
        alert("Vui lòng đăng nhập trước khi chơi!");
        return;
    }
    window.location.href = targetUrl;
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

    let existingData = getCurrentUser();
    let unlockedGamesArr = (existingData && existingData.name === name && existingData.class_name === className) 
                            ? (existingData.unlockedGames || []) 
                            : [];

    const userData = {
        name: name,
        class_name: className,
        avatar: avatar,
        level: existingData ? (existingData.level || 1) : 1,
        xp: existingData ? (existingData.xp || 0) : 0,
        unlocked: existingData ? (existingData.unlocked || []) : [],
        unlockedGames: unlockedGamesArr 
    };

    localStorage.setItem('edtech_user_kid', JSON.stringify(userData));
    syncDataToServer(userData);

    document.documentElement.classList.remove('no-auth');
    document.documentElement.classList.add('is-auth');
    updateHeader(userData);
    updateGameButtons();
}

// 3. CHỨC NĂNG ĐIỀU HƯỚNG TAB
function navigate(targetId) {
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('#nav-menu a').forEach(a => a.classList.remove('active'));
    
    document.getElementById(targetId).classList.add('active');
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    
    if(targetId === 'profile') {
        loadUserProfile();
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
    
    let user = getCurrentUser();
    if(user) {
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
    let user = getCurrentUser();
    if(!user) return;
    
    document.getElementById('prof-name').innerText = user.name || "Khách";
    document.getElementById('prof-class').innerText = user.class_name || "Lớp";
    document.getElementById('prof-avatar').innerText = user.avatar || "👦";
    document.getElementById('prof-level').innerText = user.level || 1;
    document.getElementById('prof-xp').innerText = user.xp || 0;

    let xp = user.xp || 0;
    let progressPercent = ((xp % 500) / 500) * 100;
    let progressBar = document.getElementById('prof-xp-bar');
    if(progressBar) progressBar.style.width = progressPercent + "%";

    const container = document.getElementById('achievements-container');
    if(!container) return;
    container.innerHTML = '';
    
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
    let user = getCurrentUser();
    if(!user) return;
    if(!user.unlocked) user.unlocked = [];

    user.unlocked.push(badgeId);
    localStorage.setItem('edtech_user_kid', JSON.stringify(user));
    syncDataToServer(user);
    
    let rect = btnElement.getBoundingClientRect();
    createConfetti(rect.left + rect.width / 2, rect.top);
    
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
    let user = getCurrentUser();
    if(user) {
        updateHeader(user);
        updateGameButtons(); 
        if (window.location.hash === '#profile') {
            navigate('profile');
        }
    }
});
