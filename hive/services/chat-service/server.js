const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const chatbotRoutes = require('./src/routes/chatbotRoute');
const { askGrok } = require('./src/services/grokService');

dotenv.config();
const PORT = process.env.PORT || 3003;

connectDB(process.env.MONGO_URI || 'mongodb://localhost:27017/hive');

const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));

app.use('/', chatbotRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);
  socket.on('join', (room) => socket.join(room));
  socket.on('message', async (payload) => {
    const { room } = payload;
    io.to(room).emit('message', payload);

    try {
      // 🔹 Ask Grok AI
      const aiReply = await askGrok(message);

      const botPayload = {
        room,
        sender: 'AI',
        message: aiReply,
        timestamp: new Date(),
      };

      // 🔹 Send AI response to room
      io.to(room).emit('message', botPayload);

    } catch (err) {
      console.error('AI error:', err.message);
    }
  });
  socket.on('disconnect', () => console.log('socket disconnected:', socket.id));
});

server.listen(PORT, () => console.log(`chat-service listening on ${PORT}`));
