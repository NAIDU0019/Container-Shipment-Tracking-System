import { body, validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      errors: errors.array()
    });
  };
};

export const bookingValidationRules = [
  body('containerId').notEmpty().withMessage('Container ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
];

export const containerValidationRules = [
  body('containerId').notEmpty().withMessage('Container ID is required'),
  body('type').isIn(['20ft', '40ft', '45ft']).withMessage('Invalid container type'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('location').isArray().withMessage('Location must be coordinates array')
];