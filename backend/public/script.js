const API_BASE_URL = 'https://nckh-game-tinhoc.onrender.com';

const BADGES = [
    { id: 'b1', name: 'Ngôi Sao Chăm Chỉ', req: 500, icon: 'fa-star', color: 'text-warning' },
    { id: 'b2', name: 'Hiệp Sĩ An Toàn', req: 1000, icon: 'fa-shield-halved', color: 'text-success' },
    { id: 'b3', name: 'Chuyên Gia Thiết Bị', req: 1500, icon: 'fa-medal', color: 'text-secondary' },
    { id: 'b4', name: 'Quán Quân Tin Học', req: 2000, icon: 'fa-trophy', color: 'text-accent' }
];

async function syncDataToServer(playerData) {
    try {
        await fetch(`${API_BASE_URL}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(playerData)
        });
        console.log("Đã đồng bộ dữ liệu!");
    } catch (error) { console.error("Lỗi đồng bộ:", error); }
}

function getCurrentUser() {
    let data = localStorage.getItem('edtech_user_kid');
    return data ? JSON.parse(data) : null;
}

// ---- QUẢN LÝ GAME VÀ MODAL MẬT KHẨU ----
let pendingGameId = null;
let pendingGameUrl = null;

function updateGameButtons() {
    let user = getCurrentUser();
    if (!user) return;
    if (!user.unlockedGames) user.unlockedGames = [];

    // ĐÃ FIX: Khóa Đảo Tư Duy và Đấu Trường So Tài (Ếch con đã được mở)
    const lockedGamesConfig = [
        { id: 'daotuduy', btnId: 'btn-daotuduy', url: 'game_matching.html' },
        { id: 'dautruong', btnId: 'btn-dautruong', url: 'game_arena.html' } 
    ];

    lockedGamesConfig.forEach(game => {
        const btn = document.getElementById(game.btnId);
        if (btn) {
            const card = btn.closest('.game-card-v2');
            if (user.unlockedGames.includes(game.id)) {
                btn.innerHTML = 'Khởi hành <i class="fa-solid fa-rocket"></i>';
                btn.className = 'btn btn-primary w-100';
                btn.onclick = () => window.location.href = game.url;
                if (card) card.classList.remove('game-locked');
            } else {
                btn.innerHTML = 'Mở khóa 🔓';
                btn.className = 'btn btn-warning w-100';
                btn.onclick = () => playLockedGame(game.id, game.url);
                if (card) card.classList.add('game-locked'); 
            }
        }
    });
}

function playLockedGame(gameId, targetUrl) {
    let user = getCurrentUser();
    if (!user) { alert("Vui lòng đăng nhập trước khi chơi!"); return; }
    
    // Mở Form thay vì dùng prompt
    pendingGameId = gameId;
    pendingGameUrl = targetUrl;
    document.getElementById('game-pwd-input').value = '';
    document.getElementById('pwd-modal').classList.add('active');
    document.getElementById('game-pwd-input').focus();
}

function closePwdModal() {
    document.getElementById('pwd-modal').classList.remove('active');
    pendingGameId = null; pendingGameUrl = null;
}

function confirmPwd() {
    let pwd = document.getElementById('game-pwd-input').value;
    if (pwd === '23122006') {
        let user = getCurrentUser();
        if (!user.unlockedGames) user.unlockedGames = [];
        user.unlockedGames.push(pendingGameId);
        localStorage.setItem('edtech_user_kid', JSON.stringify(user));
        syncDataToServer(user);
        
        closePwdModal();
        alert("🎉 Chúc mừng con đã mở khóa game thành công!");
        updateGameButtons(); 
    } else {
        alert("❌ Mật khẩu chưa đúng rồi, con thử lại nhé!");
    }
}

function playNormalGame(targetUrl) {
    let user = getCurrentUser();
    if (!user) { alert("Vui lòng đăng nhập!"); return; }
    window.location.href = targetUrl;
}

// Bắt sự kiện Enter khi nhập mật khẩu
document.addEventListener('DOMContentLoaded', () => {
    let pwdInput = document.getElementById('game-pwd-input');
    if (pwdInput) {
        pwdInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") confirmPwd();
        });
    }
});

// ---- CORE FUNCTIONS ----
function startGame() {
    const nameInput = document.getElementById('login-name');
    const classSelect = document.getElementById('login-class');
    const name = nameInput.value.trim();
    const className = classSelect.value;
    const activeAvatarBtn = document.querySelector('#login-avatar-list .avatar-btn.selected');
    const avatar = activeAvatarBtn ? activeAvatarBtn.innerText : '👦';

    // BƯỚC 1: XÓA CẢNH BÁO LỖI CŨ (Nếu có)
    document.querySelectorAll('.error-msg').forEach(el => el.remove());
    nameInput.style.borderColor = '#cbd5e1';
    classSelect.style.borderColor = '#cbd5e1';

    let hasError = false;

    // BƯỚC 2: KIỂM TRA ĐIỀU KIỆN
    if (!name) {
        nameInput.style.borderColor = 'red';
        const error = document.createElement('p');
        error.className = 'error-msg';
        error.style.color = 'red';
        error.style.fontSize = '0.9rem';
        error.style.marginTop = '-10px';
        error.style.marginBottom = '15px';
        error.style.fontWeight = 'bold';
        error.innerText = "❌ Con quên nhập tên mất rồi!";
        nameInput.insertAdjacentElement('afterend', error);
        hasError = true;
    }

    // Chặn nếu chưa chọn lớp hoặc value rỗng
    if (!className || className === "") {
        classSelect.style.borderColor = 'red';
        const error = document.createElement('p');
        error.className = 'error-msg';
        error.style.color = 'red';
        error.style.fontSize = '0.9rem';
        error.style.marginTop = '-10px';
        error.style.marginBottom = '15px';
        error.style.fontWeight = 'bold';
        error.innerText = "❌ Con hãy nhấp vào đây để chọn Lớp nhé!";
        classSelect.insertAdjacentElement('afterend', error);
        hasError = true;
    }

    // DỪNG HÀM NẾU CÓ LỖI (Không cho lưu localStorage hay gọi API)
    if (hasError) return;

    // BƯỚC 3: XỬ LÝ LƯU DATA NẾU HỢP LỆ
    let existingData = getCurrentUser();
    let unlockedGamesArr = (existingData && existingData.name === name && existingData.class_name === className) ? (existingData.unlockedGames || []) : [];
    let playCountsObj = (existingData && existingData.name === name && existingData.class_name === className) ? (existingData.playCounts || {}) : {};

    const userData = {
        name: name, 
        class_name: className, 
        avatar: avatar,
        level: existingData ? (existingData.level || 1) : 1,
        xp: existingData ? (existingData.xp || 0) : 0,
        unlocked: existingData ? (existingData.unlocked || []) : [],
        unlockedGames: unlockedGamesArr,
        playCounts: playCountsObj
    };

    localStorage.setItem('edtech_user_kid', JSON.stringify(userData));
    syncDataToServer(userData);

    document.documentElement.classList.remove('no-auth'); 
    document.documentElement.classList.add('is-auth');
    updateHeader(userData); 
    updateGameButtons();
}

function navigate(targetId) {
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('#nav-menu a').forEach(a => a.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    if(targetId === 'profile') loadUserProfile();
}

function selectLoginAvatar(avatar, btn) {
    document.querySelectorAll('#login-avatar-list .avatar-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

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

    let progressPercent = (((user.xp || 0) % 500) / 500) * 100;
    if(document.getElementById('prof-xp-bar')) document.getElementById('prof-xp-bar').style.width = progressPercent + "%";

    const container = document.getElementById('achievements-container');
    if(!container) return; container.innerHTML = '';
    if(!user.unlocked) user.unlocked = [];
    
    BADGES.forEach(b => {
        let isUnlocked = user.unlocked.includes(b.id);
        let canUnlock = user.xp >= b.req;
        let card = document.createElement('div');
        card.className = `stat-card card ${isUnlocked ? '' : 'locked-badge'}`;
        card.innerHTML = `<i class="fa-solid ${b.icon} ${isUnlocked ? b.color : ''}" style="font-size: 3rem; ${isUnlocked ? '' : 'color: #94a3b8;'}"></i>
            <h3 style="font-family: 'Baloo 2', cursive; font-size: 1.4rem; margin-top: 10px;">${b.name}</h3>
            ${isUnlocked ? `<span style="color: #10b981; font-weight: bold; margin-top:10px;"><i class="fa-solid fa-check-circle"></i> Đã mở khóa</span>` : 
            canUnlock ? `<button class="btn btn-primary mt-2" onclick="unlockBadge('${b.id}', this)" style="padding: 5px 15px; font-size: 0.95rem;">MỞ KHÓA 🔓</button>` : 
            `<span style="color: #94a3b8; font-weight: bold; margin-top:10px;"><i class="fa-solid fa-lock"></i> Cần ${b.req} XP</span>`}`;
        container.appendChild(card);
    });
}

function unlockBadge(badgeId, btnElement) {
    let user = getCurrentUser(); if(!user) return;
    if(!user.unlocked) user.unlocked = [];
    user.unlocked.push(badgeId);
    localStorage.setItem('edtech_user_kid', JSON.stringify(user)); syncDataToServer(user);
    
    let rect = btnElement.getBoundingClientRect(); createConfetti(rect.left + rect.width / 2, rect.top);
    setTimeout(() => { loadUserProfile(); }, 800);
}

function createConfetti(x, y) {
    const colors = ['#facc15', '#34d399', '#f43f5e', '#60a5fa', '#a855f7'];
    for(let i=0; i<30; i++) {
        let conf = document.createElement('div'); conf.className = 'confetti';
        conf.style.left = x + 'px'; conf.style.top = y + 'px';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        document.body.appendChild(conf);
        let angle = Math.random() * Math.PI * 2, dist = Math.random() * 150 + 50;
        conf.style.setProperty('--tx', Math.cos(angle) * dist + 'px'); conf.style.setProperty('--ty', (Math.sin(angle) * dist + 100) + 'px'); 
        setTimeout(() => conf.remove(), 1000);
    }
}

function resetData() {
    if(confirm("Con có chắc chắn muốn thoát game không?")) {
        localStorage.removeItem('edtech_user_kid');
        document.documentElement.classList.remove('is-auth'); document.documentElement.classList.add('no-auth');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let user = getCurrentUser();
    if(user) {
        updateHeader(user); updateGameButtons(); 
        if (window.location.hash === '#profile') navigate('profile');
    }
});
