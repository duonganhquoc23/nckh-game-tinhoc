const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path'); // Khai báo thêm thư viện xử lý đường dẫn

function createWindow () {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 1024,
        minHeight: 576,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.maximize();

    // Đã thay đổi: Tải file offline từ thư mục public thay vì gọi đường dẫn web Vercel
    win.loadFile(path.join(__dirname, 'public', 'index.html'));

    // Chặn việc mở trang web lạ bên trong ứng dụng, nếu bấm link ngoài sẽ văng ra trình duyệt của máy tính
    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});