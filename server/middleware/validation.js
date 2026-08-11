import { body, validationResult } from 'express-validator';

// Express validation error handler middleware
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

// Validation rules for updating settings
export const settingsRules = [
  body('rewardUrl')
    .isURL()
    .withMessage('Reward URL must be a valid URL.'),
  
  body('pollingInterval')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Polling interval must be an integer between 1 and 1440 minutes.'),
  
  body('emailAddress')
    .isEmail()
    .withMessage('Email address must be a valid email.'),
  
  body('smtpHost')
    .trim()
    .notEmpty()
    .withMessage('SMTP Host is required.'),
  
  body('smtpPort')
    .isInt({ min: 1, max: 65535 })
    .withMessage('SMTP Port must be a valid port number (1-65535).'),
  
  body('smtpUser')
    .trim()
    .notEmpty()
    .withMessage('SMTP User email is required.'),
  
  body('smtpPass')
    .trim()
    .notEmpty()
    .withMessage('SMTP Password is required.'),
  
  body('browserProfilePath')
    .trim()
    .notEmpty()
    .withMessage('Browser Profile Path is required.')
];
