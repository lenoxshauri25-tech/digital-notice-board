const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs'); 

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'notices.json');

app.use(express.json());

function getSavedNotices() {
    if (!fs.existsSync(DB_FILE)) {
        return []; 
    }
    const fileData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(fileData || '[]');
}

function saveNoticesToDisk(noticesArray) {
    fs.writeFileSync(DB_FILE, JSON.stringify(noticesArray, null, 2), 'utf-8');
}

// --- THIS IS THE NEW CODE YOU PASSED IN STEP 3 ---
app.get('/', (req, res) => {
    res.redirect('/display');
});

app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'admin.html'));
});

app.get('/display', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'display.html'));
});
// -------------------------------------------------

app.get('/api/notices', (req, res) => {
    res.json(getSavedNotices());
});

io.on('connection', (socket) => {
    console.log('Client connected.');

    const activeNotices = getSavedNotices();
    socket.emit('initial-load', activeNotices);

    socket.on('publish-notice', (noticeData) => {
        const notices = getSavedNotices();
        noticeData.id = Date.now();
        notices.push(noticeData);
        saveNoticesToDisk(notices);
        io.emit('update-display', noticeData);
    });
});

server.listen(PORT, () => {
    console.log(`Server database operating smoothly at http://localhost:${PORT}`);
});
