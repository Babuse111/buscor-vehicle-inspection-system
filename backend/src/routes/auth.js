const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const db = require('../utils/database');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  deviceInfo: Joi.object({
    deviceId: Joi.string(),
    platform: Joi.string().valid('android', 'ios', 'web'),
    version: Joi.string()
  }).optional()
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('driver', 'mechanic').default('driver'),
  metadata: Joi.object().default({})
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const { email, password, deviceInfo } = value;

    // Find user by email
    const user = await db.findOne('users', { email, is_active: true });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS' 
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update last login timestamp
    await db.update('users', user.id, { 
      last_login_at: new Date().toISOString(),
      metadata: {
        ...user.metadata,
        lastLoginDevice: deviceInfo
      }
    });

    logger.info(`User login successful: ${user.email} (${user.role})`);

    // Return user data and token (exclude password_hash)
    const { password_hash, ...userWithoutPassword } = user;
    res.json({
      success: true,
      token,
      user: userWithoutPassword,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// POST /api/auth/register (admin only for creating new users)
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const { name, email, phone, password, role, metadata } = value;

    // Check if user already exists
    const existingUser = await db.findOne('users', { email });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        code: 'USER_EXISTS' 
      });
    }

    // Check phone uniqueness
    const existingPhone = await db.findOne('users', { phone });
    if (existingPhone) {
      return res.status(409).json({ 
        error: 'Phone number already in use',
        code: 'PHONE_EXISTS' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      name,
      email,
      phone,
      password_hash,
      role,
      metadata,
      is_active: true
    };

    const newUser = await db.create('users', userData);

    logger.info(`New user registered: ${email} (${role})`);

    // Return user data (exclude password_hash)
    const { password_hash: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      message: 'User created successfully'
    });

  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Token required',
        code: 'TOKEN_REQUIRED' 
      });
    }

    // Verify token (allow expired tokens for refresh)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        // Decode expired token to get user info
        decoded = jwt.decode(token);
      } else {
        return res.status(403).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN' 
        });
      }
    }

    // Verify user still exists and is active
    const user = await db.findById('users', decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_INACTIVE' 
      });
    }

    // Generate new token
    const newTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const newToken = jwt.sign(
      newTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`Token refreshed for user: ${user.email}`);

    res.json({
      success: true,
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    next(error);
  }
});

// POST /api/auth/logout (optional - for cleanup/logging)
router.post('/logout', async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is mainly client-side
    // But we can log the event for audit purposes
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info(`User logout: ${decoded.email}`);
      } catch (error) {
        // Token might be expired, that's ok for logout
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
});

// GET /api/auth/me (get current user profile)
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Token required',
        code: 'TOKEN_REQUIRED' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.findById('users', decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ 
        error: 'User not found or inactive',
        code: 'USER_INACTIVE' 
      });
    }

    // Return user data (exclude password_hash)
    const { password_hash, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN' 
      });
    }
    logger.error('Get profile error:', error);
    next(error);
  }
});

module.exports = router;