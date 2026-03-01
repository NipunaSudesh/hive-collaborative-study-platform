const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const { askGrok } = require('./src/services/grokService');
const chatbotRoutes = require('./src/routes/chatbotRoute');
const connectDB = require('./src/config/db');

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

dotenv.config();
const PORT = process.env.PORT || 3003;

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

// Health check
app.get('/', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));

// REST AI endpoint
app.use('/', chatbotRoutes);

// Create HTTP server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // User joins room
  socket.on('join', ({ room, username }) => {
    socket.join(room);
    socket.username = username;
    io.to(room).emit('system', `${username} joined the room`);
  });

  // Handle chat messages
  socket.on('message', async (payload) => {
    const room = payload.room;
    const sender = payload.sender || 'Unknown';
    const message = payload.message || '';

    const msgData = { room, sender, message, timestamp: new Date() };
    io.to(room).emit('message', msgData);

    try {
      // AI bot reply
      if (message && message.startsWith('@ai')) {
        const aiQuestion = message.replace('@ai', '').trim();
        const aiReply = await askGrok(aiQuestion);

        const botPayload = {
          room,
          sender: 'AI',
          message: aiReply,
          timestamp: new Date(),
        };

        io.to(room).emit('message', botPayload);
      }
    } catch (err) {
      console.error('AI error:', err.message);
    }
  });

  // Typing indicator
  socket.on('typing', ({ room, username }) => {
    socket.to(room).emit('typing', `${username} is typing...`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => console.log(`chat-service listening on ${PORT}`));