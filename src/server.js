const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Configure this to your frontend URL in production
    methods: ['GET', 'POST']
  }
});

// Make io instance accessible in all controllers via req.app.get('io')
app.set('io', io);

// Socket.io Authentication Middleware
const jwt = require('jsonwebtoken');
io.use((socket, next) => {
  // Extract token from handshake auth payload (e.g. client connects with { auth: { token: '...' } })
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Socket authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // Attach decoded user info to the socket connection
    next();
  } catch (err) {
    return next(new Error('Socket authentication error: Invalid token'));
  }
});

// Basic Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const { apiLimiter, aiLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/ai', require('./routes/ai'));

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'AI-Enhanced Task Management API is running...' });
});

// Global Error Handler
const { globalErrorHandler } = require('./utils/errorHandler');
app.use(globalErrorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
