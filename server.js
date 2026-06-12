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
    console.log('Client connected to shop network.');

    // Send currently running promotions immediately on boot
    socket.emit('initial-load', getSavedNotices());

    // Listen for new promotions sent by the manager
    socket.on('publish-notice', (noticeData) => {
        const notices = getSavedNotices();
        noticeData.id = "id_" + Date.now(); // Generate a clean string ID
        notices.push(noticeData);
        saveNoticesToDisk(notices);
        
        // Broadcast the update to all systems
        io.emit('update-display', noticeData);
        io.emit('refresh-admin-list', notices); // Keep admin panels synced
    });

    // NEW FEATURE: Listen for explicit manual delete signals
    socket.on('delete-notice', (idToDelete) => {
        let notices = getSavedNotices();
        // Filter out the item matching the deleted ID
        notices = notices.filter(item => item.id !== idToDelete);
        saveNoticesToDisk(notices);

        // Tell all active screens to clear their layout data and reload fresh
        io.emit('clear-and-reload');
    });
});

