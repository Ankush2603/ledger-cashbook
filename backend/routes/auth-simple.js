import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Simple test registration (without Google Drive for now)
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const { email, password, name } = req.body;

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user data (mock for now)
    const userData = {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    console.log('User created:', { id: userData.id, email: userData.email, name: userData.name });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: userData.id, 
        email: userData.email,
        name: userData.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully (test mode)',
      data: {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          createdAt: userData.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed: ' + error.message
    });
  }
});

// Simple test login
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', req.body);
    
    res.json({
      success: false,
      message: 'Login not implemented in test mode - please register first'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed: ' + error.message
    });
  }
});

export default router;