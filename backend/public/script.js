// URL Backend: Đổi thành 'http://localhost:3000' nếu bạn chạy trên máy cá nhân thay vì Render
const API_BASE_URL = 'https://nckh-game-tinhoc.onrender.com';

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
        xp: 0
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
    
    let data = localStorage.getItem('edtech_user_kid');
    if(data) {
        let user = JSON.parse(data);
        user.avatar = avatar;
        localStorage.setItem('edtech_user_kid', JSON.stringify(user));
        updateHeader(user);
        syncDataToServer(user); // Cập nhật avatar mới lên server
    }
}

// 6. CẬP NHẬT HEADER & HỒ SƠ
function updateHeader(user) {
    if(document.getElementById('header-name')) document.getElementById('header-name').innerText = user.name;
    if(document.getElementById('header-avatar')) document.getElementById('header-avatar').innerText = user.avatar;
}

function loadUserProfile() {
    let data = localStorage.getItem('edtech_user_kid');
    if(!data) return;
    let user = JSON.parse(data);
    
    document.getElementById('prof-name').innerText = user.name;
    document.getElementById('prof-class').innerText = user.class_name;
    document.getElementById('prof-avatar').innerText = user.avatar;
    document.getElementById('prof-level').innerText = user.level;
    document.getElementById('prof-xp').innerText = user.xp;
}

// 7. ĐĂNG XUẤT
function resetData() {
    if(confirm("Con có chắc chắn muốn thoát game không?")) {
        localStorage.removeItem('edtech_user_kid');
        document.documentElement.classList.remove('is-auth');
        document.documentElement.classList.add('no-auth');
    }
}

// 8. KIỂM TRA ĐĂNG NHẬP KHI TẢI TRANG
window.addEventListener('DOMContentLoaded', () => {
    let data = localStorage.getItem('edtech_user_kid');
    if(data) {
        updateHeader(JSON.parse(data));
    }
});
