import asyncHandler from 'express-async-handler';
import Chat from '../models/Chat.js';

// @desc    Get chat history
// @route   GET /api/chat/:bookingId
// @access  Private
export const getChatHistory = asyncHandler(async (req, res) => {
  const chat = await Chat.findOne({ booking: req.params.bookingId })
    .populate('participants', 'name')
    .populate('messages.sender', 'name');

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  res.json(chat);
});

// @desc    Send message
// @route   POST /api/chat/:bookingId
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  let chat = await Chat.findOne({ booking: req.params.bookingId });

  if (!chat) {
    chat = await Chat.create({
      booking: req.params.bookingId,
      participants: [req.user._id],
      messages: []
    });
  }

  chat.messages.push({
    sender: req.user._id,
    content
  });

  await chat.save();
  res.status(201).json(chat);
});