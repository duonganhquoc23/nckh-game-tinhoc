const API_BASE_URL = 'https://nckh-game-tinhoc.onrender.com'; 
let allStudents = []; 

async function loadData() {
    const tb = document.getElementById('tb-students');
    tb.innerHTML = `<tr><td colspan="7" style="text-align:center;">⏳ Đang tải dữ liệu từ CSDL...</td></tr>`;

    try {
        const response = await fetch(`${API_BASE_URL}/api/leaderboard`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allStudents = data;
            updateClassFilterDropdown(); 
            applyFilter(); 
        } else {
            throw new Error(data.error || "Dữ liệu trả về không hợp lệ");
        }
    } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        tb.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">❌ Không thể kết nối hoặc lỗi CSDL: ${error.message}</td></tr>`;
    }
}

function updateClassFilterDropdown() {
    const filterSelect = document.getElementById('class-filter');
    const currentValue = filterSelect.value; 
    const classes = [...new Set(allStudents.map(s => s.class_name).filter(c => c))].sort();
    
    filterSelect.innerHTML = `<option value="">-- Tất cả các lớp --</option>`;
    classes.forEach(c => {
        filterSelect.innerHTML += `<option value="${c}">${c}</option>`;
    });
    filterSelect.value = currentValue; 
}

function applyFilter() {
    const filterValue = document.getElementById('class-filter').value;
    const filteredStudents = filterValue ? allStudents.filter(s => s.class_name === filterValue) : allStudents;

    let totalXp = 0;
    filteredStudents.forEach(s => totalXp += (s.xp || 0));
    const avgXp = filteredStudents.length > 0 ? Math.round(totalXp / filteredStudents.length) : 0;

    document.getElementById('stat-total-students').innerText = filteredStudents.length;
    document.getElementById('stat-total-xp').innerText = totalXp;
    document.getElementById('stat-avg-xp').innerText = avgXp;

    const tb = document.getElementById('tb-students');
    if (filteredStudents.length === 0) {
        tb.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#64748b;">Chưa có dữ liệu.</td></tr>`;
        return;
    }

    tb.innerHTML = filteredStudents.map((s, index) => {
        const lastPlayed = s.last_played ? new Date(s.last_played).toLocaleString('vi-VN') : 'Vừa xong';
        return `
        <tr>
            <td><strong>#${index + 1}</strong></td>
            <td style="font-weight: 600; color: #4f46e5;">
                ${s.name || 'Học sinh ẩn danh'} 
                <br><small style="color: gray;">Lớp: ${s.class_name || 'Chưa cập nhật'}</small>
            </td>
            <td style="font-size: 1.5rem; text-align: center;">${s.avatar || '👦'}</td>
            <td><span style="color: #f59e0b; font-weight: 800; font-size: 1.1rem;">${s.xp || 0}</span></td>
            <td><span class="badge">Lv ${s.level || 1}</span></td>
            <td style="color: #64748b; font-size: 0.9rem;">${lastPlayed}</td>
            <td style="text-align: center;">
                <button class="btn-action-view" onclick="viewHistory('${s.name}')" title="Xem lịch sử làm bài">
                    <i class="fa-solid fa-clock-rotate-left"></i> Lịch sử
                </button>
                <button class="btn-action-del" onclick="deleteStudent(${s.id}, '${s.name}')" title="Xóa học sinh này">
                    <i class="fa-solid fa-xmark"></i> Xóa
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

// --- CÁC HÀM XỬ LÝ LỊCH SỬ LÀM BÀI --- //
async function viewHistory(studentName) {
    document.getElementById('history-student-name').innerText = studentName;
    document.getElementById('history-modal').style.display = 'flex';
    const tbHistory = document.getElementById('tb-history');
    
    tbHistory.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">⏳ Đang tải dữ liệu lịch sử...</td></tr>`;

    try {
        // Đường dẫn API đã được sửa chuẩn xác
        const response = await fetch(`${API_BASE_URL}/api/history?student_name=${encodeURIComponent(studentName)}`);
        
        if (!response.ok) {
            throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
            tbHistory.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b; padding: 20px;">Học sinh chưa có lịch sử làm bài.</td></tr>`;
            return;
        }

        tbHistory.innerHTML = data.map(h => {
            const time = new Date(h.created_at).toLocaleString('vi-VN');
            const resultBadge = h.is_correct 
                ? '<span style="background: #d1fae5; color: #059669; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.85rem;">✔ Đúng</span>' 
                : '<span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 0.85rem;">✘ Sai</span>';
            
            return `
            <tr>
                <td style="font-size: 0.85rem; color: #64748b;">${time}</td>
                <td style="font-weight: bold; color: #475569;">${h.game_name || 'Mini Game'}</td>
                <td>${h.question}</td>
                <td style="font-style: italic;">${h.student_answer}</td>
                <td>${resultBadge}</td>
            </tr>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
        tbHistory.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red; padding: 20px;">❌ Lỗi tải lịch sử: ${error.message}</td></tr>`;
    }
}

function closeHistoryModal() {
    document.getElementById('history-modal').style.display = 'none';
}

function exportExcel() {
    const filterValue = document.getElementById('class-filter').value;
    const dataToExport = filterValue ? allStudents.filter(s => s.class_name === filterValue) : allStudents;
    
    if (dataToExport.length === 0) return alert("Trống không! Không có dữ liệu để xuất Excel.");

    const excelData = dataToExport.map((s, i) => ({
        "STT": i + 1,
        "Họ và Tên": s.name,
        "Lớp": s.class_name,
        "Tổng Điểm (XP)": s.xp,
        "Cấp độ": s.level,
        "Thời gian cập nhật": s.last_played ? new Date(s.last_played).toLocaleString('vi-VN') : 'Vừa xong'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh");
    
    const fileName = filterValue ? `Diem_Game_Lop_${filterValue}.xlsx` : `Diem_Game_Tat_Ca.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

async function deleteStudent(id, name) {
    if(!confirm(`⚠️ Bạn có chắc chắn muốn xóa dữ liệu của học sinh "${name}" không?\nHành động này không thể hoàn tác!`)) return;
    try {
        await fetch(`${API_BASE_URL}/api/student/${id}`, { method: 'DELETE' });
        loadData(); 
    } catch(e) { console.error(e); alert("Lỗi khi xóa học sinh!"); }
}

async function deleteFiltered() {
    const filterValue = document.getElementById('class-filter').value;
    let msg = filterValue 
        ? `⚠️ Bạn đang chọn xóa TOÀN BỘ học sinh của lớp "${filterValue}".\nBạn có chắc chắn không?` 
        : `🚨 NGUY HIỂM: Bạn đang thao tác XÓA TOÀN BỘ dữ liệu học sinh trong hệ thống.\nBạn có chắc chắn muốn xóa trắng dữ liệu không?`;
    
    if(!confirm(msg)) return;
    if(!confirm("Xác nhận lần 2: Dữ liệu bị xóa sẽ KHÔNG THỂ KHÔI PHỤC. Bạn vẫn tiếp tục?")) return;

    try {
        let url = `${API_BASE_URL}/api/students`;
        if(filterValue) url += `?class_name=${filterValue}`;
        
        const response = await fetch(url, { method: 'DELETE' });
        if(response.ok) {
            document.getElementById('class-filter').value = ""; 
            loadData(); 
        }
    } catch(e) { console.error(e); alert("Lỗi khi xóa dữ liệu!"); }
}

window.addEventListener('DOMContentLoaded', loadData);
