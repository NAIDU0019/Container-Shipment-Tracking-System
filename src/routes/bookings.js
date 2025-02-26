import express from 'express';
import {
  createBooking,
  getBookings,
  processPayment
} from '../controllers/bookingController.js';
import { protect } from '../middlewares/auth.js';
import { validate, bookingValidationRules } from '../middlewares/validator.js';

const router = express.Router();

router.use(protect); // Protect all booking routes

router.post('/', validate(bookingValidationRules), createBooking);
router.get('/', getBookings);
router.post('/:id/pay', processPayment);

export default router;