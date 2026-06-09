const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Allow Express to read JSON data sent from forms
app.use(express.json());

// Serve your HTML files directly when opening localhost:3000/admin or /display
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/display', (req, res) => {
    res.sendFile(path.join(__dirname, 'display.html'));
});

// Manage incoming real-time screen connections
io.on('connection', (socket) => {
    console.log('A display monitor or admin page connected.');

    // Listen for new notices pushed from the admin dashboard
    socket.on('publish-notice', (noticeData) => {
        console.log('New notice received:', noticeData);
        // Instantly relay/broadcast this notice to all active display screens
        io.emit('update-display', noticeData);
    });

    socket.on('disconnect', () => {
        console.log('A client disconnected.');
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running successfully at http://localhost:${PORT}`);
});
