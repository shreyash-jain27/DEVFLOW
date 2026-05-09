const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const env = require('./config/env');
const logger = require('./utils/logger');
const { applySecurityMiddleware } = require('./middlewares/security');
const requestId = require('./middlewares/requestId');

if (process.env.NODE_ENV !== 'test') {
  const connectDB = require('./config/db');
  connectDB();
  
  const bootstrapJobs = require('./jobs/index');
  bootstrapJobs();
}


const app = express();
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});


app.set('io', io);


const jwt = require('jsonwebtoken');
io.use((socket, next) => {
  
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Socket authentication error: Token missing'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; 
    next();
  } catch (err) {
    return next(new Error('Socket authentication error: Invalid token'));
  }
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());



applySecurityMiddleware(app);


app.use(requestId);
app.use(express.static(path.join(__dirname, 'public')));


const { apiLimiter, aiLimiter, authLimiter } = require('./middlewares/rateLimiter');
app.use('/api/', apiLimiter);
app.use('/api/ai/', aiLimiter);



app.use('/api/health', require('./routes/health'));

app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));



if (process.env.NODE_ENV !== 'test') {
  const { createBullBoard } = require('@bull-board/api');
  const { BullAdapter }     = require('@bull-board/api/bullAdapter');
  const { ExpressAdapter }  = require('@bull-board/express');
  const { aiQueue, emailQueue, cleanupQueue } = require('./config/queues');

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullAdapter(aiQueue),
      new BullAdapter(emailQueue),
      new BullAdapter(cleanupQueue),
    ],
    serverAdapter,
  });

  
  const jwt = require('jsonwebtoken');
  const User = require('./models/User');
  const bullBoardGuard = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Token required' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('role');
      if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };

  app.use('/admin/queues', bullBoardGuard, serverAdapter.getRouter());
  logger.info('[Bull Board] Mounted at /admin/queues');
}


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const { globalErrorHandler } = require('./middlewares/error');
app.use(globalErrorHandler);


io.on('connection', (socket) => {
  logger.info(`A user connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

const PORT = env.port;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
