import Stripe from 'stripe';
import asyncHandler from 'express-async-handler';
import Booking from '../models/Booking.js';
import { config } from '../config/env.js';

// Initialize Stripe with the secret key
const stripe = new Stripe(config.STRIPE_SECRET_KEY);

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = asyncHandler(async (req, res) => {
  const { containerId, startDate, endDate } = req.body;
  const booking = await Booking.create({
    user: req.user._id,
    container: containerId,
    startDate,
    endDate,
    status: 'pending'
  });
  res.status(201).json(booking);
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private
export const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('container')
    .sort('-createdAt');
  res.json(bookings);
});

// @desc    Process payment for booking
// @route   POST /api/bookings/:id/pay
// @access  Private
export const processPayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('container');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.container.price * 100, // Convert to cents
    currency: config.STRIPE_CURRENCY,
    metadata: {
      bookingId: booking._id.toString(),
      containerId: booking.container._id.toString()
    }
  });

  res.json({
    clientSecret: paymentIntent.client_secret
  });
});

// @desc    Webhook handler for Stripe events
// @route   POST /api/bookings/webhook
// @access  Public
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await Booking.findByIdAndUpdate(
        paymentIntent.metadata.bookingId,
        { status: 'paid', paymentId: paymentIntent.id },
        { new: true }
      );
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await Booking.findByIdAndUpdate(
        failedPayment.metadata.bookingId,
        { status: 'failed' },
        { new: true }
      );
      break;
  }

  res.json({ received: true });
});