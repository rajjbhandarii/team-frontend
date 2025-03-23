const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/collab-coding')
.then(() => console.log('MongoDB Connected'))
  .catch(err => console.error(err));

// Define Room Schema
const RoomSchema = new mongoose.Schema({
  roomId: String,
  password: String
});
const Room = mongoose.model('Room', RoomSchema);

// Create Room API
app.post('/create-room', async (req, res) => {
  const { roomId, password } = req.body;
  try {
    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) return res.status(400).json({ error: 'Room ID already exists' });

    const newRoom = new Room({ roomId, password });
    await newRoom.save();
    res.json({ message: 'Room created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Join Room API
app.post('/join-room', async (req, res) => {
  const { roomId, password } = req.body;
  try {
    const room = await Room.findOne({ roomId });
    if (!room || room.password !== password) {
      return res.status(400).json({ error: 'Room does not exist or incorrect password' });
    }
    res.json({ message: 'Joined room successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// WebRTC Signaling with Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  socket.on('start-screen-share', (data) => {
    socket.to(data.roomId).emit('start-screen-share');
  });

  socket.on('stop-screen-share', (roomId) => {
    socket.to(roomId).emit('screen-share-stopped');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
