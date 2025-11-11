const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const cron = require('node-cron');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  'https://skillswap-mcin.onrender.com',
  'https://69116f5.--skill-shift.netlify.app',
  'http://localhost:5173', // For local development
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean); // Remove undefined values

// Socket.IO with proper CORS
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS Middleware - FIXED
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected');
  // Start the cleanup job after DB connection
  startClassCleanupJob();
})
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/classes', require('./routes/classes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO for Real-time Chat
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user-online', (userId) => {
    activeUsers.set(userId, socket.id);
    io.emit('user-status', { userId, status: 'online' });
  });

  socket.on('send-message', async (data) => {
    const { receiverId, message } = data;
    const receiverSocketId = activeUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive-message', message);
    }
  });

  socket.on('typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = activeUsers.get(receiverId);
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', data);
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        io.emit('user-status', { userId, status: 'offline' });
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Auto-delete classes 24 hours after their scheduled time
async function deleteExpiredClasses() {
  try {
    const Class = require('./models/Class');
    const now = new Date();
    
    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // Find and delete classes that are 24+ hours past their scheduled time
    const result = await Class.deleteMany({
      date: { $lte: twentyFourHoursAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🗑️  Auto-deleted ${result.deletedCount} expired classes (24h+ old)`);
    }
  } catch (error) {
    console.error('❌ Error deleting expired classes:', error);
  }
}

// Start cron job to check every hour
function startClassCleanupJob() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', () => {
    console.log('🔄 Running automatic class cleanup...');
    deleteExpiredClasses();
  });
  
  console.log('✅ Class cleanup job scheduled (runs every hour)');
  
  // Also run once immediately on startup
  deleteExpiredClasses();
}

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Allowed origins:`, allowedOrigins);
});