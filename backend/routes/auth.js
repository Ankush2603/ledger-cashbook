import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDriveService } from '../services/driveServiceSingleton.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
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

// Register new user
router.post('/register', validateRegistration, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    let existingUser = null;
    try {
      const driveService = await getDriveService();
      existingUser = await driveService.getUserByEmail(email);
    } catch (driveError) {
      console.error('Google Drive error during user check:', driveError.message);
      return res.status(503).json({
        success: false,
        message: 'Google Drive service temporarily unavailable. Please try again later.',
        error: 'DRIVE_UNAVAILABLE'
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user data
    const userData = {
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    // Save user to Google Drive
    let user;
    try {
      const driveService = await getDriveService();
      user = await driveService.createUser(userData);
    } catch (driveError) {
      console.error('Google Drive error during user creation:', driveError.message);
      return res.status(503).json({
        success: false,
        message: 'Failed to save user data. Google Drive service unavailable.',
        error: 'DRIVE_SAVE_FAILED'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// Login user
router.post('/login', validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    let user;
    try {
      const driveService = await getDriveService();
      user = await driveService.getUserByEmail(email);
    } catch (driveError) {
      console.error('Google Drive error during login:', driveError.message);
      return res.status(503).json({
        success: false,
        message: 'Authentication service temporarily unavailable. Please try again later.',
        error: 'DRIVE_UNAVAILABLE'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    try {
      const driveService = await getDriveService();
      await driveService.updateUserLastLogin(user.id);
    } catch (updateError) {
      console.warn('Failed to update last login time:', updateError.message);
      // Don't fail login if we can't update the timestamp
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastLogin: new Date().toISOString()
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await driveService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// Verify token (for frontend to check if user is still authenticated)
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: {
        id: req.user.userId,
        email: req.user.email,
        name: req.user.name
      }
    }
  });
});

export default router;