import express from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { body } from 'express-validator';

const router = express.Router();

const updateProfileValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

router.use(protect); // Protect all routes

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileValidation), updateProfile);

export default router;