let userData = {};
let currentLoginAvatar = '👦';

function initData() {
    try {
        let data = localStorage.getItem('edtech_user_kid');
        if (!data) throw new Error("Chưa có dữ liệu");
        
        userData = JSON.parse(data);
        if (!userData.name) throw new Error("Dữ liệu bị lỗi");
        
        // Đã đăng nhập: Cập nhật cờ bảo vệ UI
        document.documentElement.classList.remove('no-auth');
        document.documentElement.classList.add('is-auth');
        
        if(!userData.id) userData.id = Date.now().toString();
        if(!userData.level) userData.level = 1;
        if(!userData.xp) userData.xp = 0;
        if(!userData.unlocked) userData.unlocked = []; // Mảng chứa huy hiệu đã mở
        
        updateHeaderInfo();
        renderProfile();
        loadSelectedAvatar();
        syncToAdmin(userData);
        
        if (window.location.hash) {
            let targetId = window.location.hash.substring(1);
            if (targetId === 'games') targetId = 'home';
            if (document.getElementById(targetId)) navigate(targetId);
        }
    } catch(e) {
        localStorage.removeItem('edtech_user_kid');
        // Chưa đăng nhập: Mở rào chắn bảo vệ UI
        document.documentElement.classList.remove('is-auth');
        document.documentElement.classList.add('no-auth');
    }
}

document.addEventListener('DOMContentLoaded', initData);

function selectLoginAvatar(avatar, btnElement) {
    currentLoginAvatar = avatar;
    const btns = document.querySelectorAll('#login-screen .avatar-btn');
    btns.forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
}

function startGame() {
    const nameInput = document.getElementById('login-name').value.trim();
    const classInput = document.getElementById('login-class').value.trim();

    if (nameInput === '' || classInput === '') {
        alert('Ôi! Con quên nhập Tên hoặc Lớp rồi kìa!');
        return;
    }

    userData = {
        id: Date.now().toString(),
        name: nameInput,
        class_name: classInput,
        avatar: currentLoginAvatar,
        level: 1,
        xp: 0,
        unlocked: []
    };    
    localStorage.setItem('edtech_user_kid', JSON.stringify(userData));
    
    // Gỡ khung đăng nhập bằng cờ
    document.documentElement.classList.remove('no-auth');
    document.documentElement.classList.add('is-auth');
    
    updateHeaderInfo();
    renderProfile();
    loadSelectedAvatar();
    syncToAdmin(userData);
}

async function syncToAdmin(userObj) {
    try {
        localStorage.setItem('edtech_user_kid', JSON.stringify(userObj));
        // Đã cập nhật link API mới từ Render
        await fetch('https://nckh-game-tinhoc.onrender.com/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userObj)
        });
    } catch (error) {
        console.error('Không thể kết nối đến máy chủ API:', error);
    }
}

function selectAvatar(avatarEmoji, btnElement) {
    userData.avatar = avatarEmoji;
    localStorage.setItem('edtech_user_kid', JSON.stringify(userData));
    syncToAdmin(userData); 

    const btns = document.querySelectorAll('#avatar-list .avatar-btn');
    btns.forEach(btn => btn.classList.remove('selected'));
    if(btnElement) btnElement.classList.add('selected');
    
    updateHeaderInfo();
    renderProfile();
}

function loadSelectedAvatar() {
    const currentAvatar = userData.avatar || '👦';
    const btns = document.querySelectorAll('#avatar-list .avatar-btn');
    btns.forEach(btn => {
        if(btn.innerText === currentAvatar) btn.classList.add('selected');
    });
}

function updateHeaderInfo() {
    document.getElementById('header-name').innerText = userData.name || "Khách";
    document.getElementById('header-avatar').innerText = userData.avatar || "👦";
}

function navigate(sectionId) {
    if (sectionId === 'games') sectionId = 'home';
    
    document.querySelectorAll('main section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('#nav-menu a').forEach(a => a.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId); 
    if (targetSection) targetSection.classList.add('active');
    
    const navLink = document.querySelector(`#nav-menu a[data-target="${sectionId}"]`); 
    if (navLink) navLink.classList.add('active');
    
    if (sectionId === 'profile') renderProfile();
}

const BADGES = [
    { id: 'b1', name: 'Ngôi Sao Chăm Chỉ', req: 500, icon: 'fa-star', color: 'text-warning' },
    { id: 'b2', name: 'Hiệp Sĩ An Toàn', req: 1000, icon: 'fa-shield-halved', color: 'text-success' },
    { id: 'b3', name: 'Chuyên Gia Thiết Bị', req: 1500, icon: 'fa-medal', color: 'text-secondary' },
    { id: 'b4', name: 'Quán Quân Tin Học', req: 2000, icon: 'fa-trophy', color: 'text-accent' }
];

function renderProfile() {
    document.getElementById('prof-name').innerText = userData.name || "Phi Hành Gia Nhí";
    document.getElementById('prof-class').innerText = userData.class_name || "Lớp 4";
    document.getElementById('prof-level').innerText = userData.level || 1;
    document.getElementById('prof-xp').innerText = userData.xp || 0;
    document.getElementById('prof-avatar').innerText = userData.avatar || "👦";
    document.getElementById('prof-xp-bar').style.width = (((userData.xp || 0) % 500) / 500 * 100) + "%";
    
    const container = document.getElementById('achievements-container');
    if(!container) return;
    container.innerHTML = '';
    
    if(!userData.unlocked) userData.unlocked = [];
    
    BADGES.forEach(b => {
        let isUnlocked = userData.unlocked.includes(b.id);
        let canUnlock = userData.xp >= b.req;
        
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

function unlockBadge(badgeId, btnElement) {
    userData.unlocked.push(badgeId);
    localStorage.setItem('edtech_user_kid', JSON.stringify(userData));
    syncToAdmin(userData);
    
    let rect = btnElement.getBoundingClientRect();
    createConfetti(rect.left + rect.width / 2, rect.top);
    
    setTimeout(() => { renderProfile(); }, 800);
}

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

function resetData() {
    localStorage.removeItem('edtech_user_kid');
    window.location.reload(); 
}