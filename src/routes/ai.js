import express from 'express';
import {
  getAIAssistance,
  analyzeDocument
} from '../controllers/aiController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validator.js';
import { body } from 'express-validator';

const router = express.Router();

const aiValidation = [
  body('query').notEmpty().trim().withMessage('Query is required')
];

const documentValidation = [
  body('documentText').notEmpty().trim().withMessage('Document text is required')
];

router.use(protect); // Protect all AI routes

router.post('/assist', validate(aiValidation), getAIAssistance);
router.post('/analyze-document', validate(documentValidation), analyzeDocument);

export default router;