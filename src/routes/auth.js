import express from 'express';
import { register, login } from '../controllers/authController.js';
import { validate } from '../middlewares/validator.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('role').optional().isIn(['user', 'trader', 'lsp']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Auth routes
router.post('/register', register);
router.post('/login', login);
export default router;