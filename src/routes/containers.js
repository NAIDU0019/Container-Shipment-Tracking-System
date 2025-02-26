import express from 'express';
import {
  getContainers,
  createContainer,
  updateContainer
} from '../controllers/containerController.js';
import { protect, restrictTo } from '../middlewares/auth.js';
import { validate, containerValidationRules } from '../middlewares/validator.js';

const router = express.Router();

// Public routes
router.get('/', getContainers);

// Protected routes
router.use(protect);

// LSP/Trader only routes
router.post(
  '/',
  restrictTo('lsp', 'trader'),
  validate(containerValidationRules),
  createContainer
);

router.put(
  '/:id',
  restrictTo('lsp', 'trader'),
  validate(containerValidationRules),
  updateContainer
);

export default router;