import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join room for specific booking
    socket.on('join-booking-room', (bookingId) => {
      socket.join(`booking-${bookingId}`);
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      const { bookingId, message } = data;
      
      // Broadcast to room
      io.to(`booking-${bookingId}`).emit('new-message', {
        sender: socket.userId,
        message,
        timestamp: new Date()
      });
    });

    // Handle container status updates
    socket.on('container-update', (data) => {
      io.emit('container-status-changed', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};