import express from 'express';
import { getChatHistory, sendMessage } from '../controllers/chatController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { body } from 'express-validator';

const router = express.Router();

const messageValidation = [
  body('content').notEmpty().trim().withMessage('Message content is required')
];

router.use(protect); // Protect all chat routes

router.get('/:bookingId', getChatHistory);
router.post('/:bookingId', validate(messageValidation), sendMessage);

export default router;