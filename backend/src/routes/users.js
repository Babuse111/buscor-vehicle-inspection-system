const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { requireAdmin, requireDriverOrMechanic } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  role: Joi.string().valid('driver', 'mechanic', 'admin').required(),
  isActive: Joi.boolean().default(true),
  metadata: Joi.object().default({})
});

const updateUserSchema = userSchema.keys({
  password: Joi.string().min(8).optional()
});

// GET /api/users - List users (admin only)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      role,
      search,
      isActive = 'true',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (isActive !== 'all') {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(isActive === 'true');
    }

    if (search) {
      conditions.push(`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        id, role, name, phone, email, is_active, last_login_at, created_at,
        (
          SELECT COUNT(*) 
          FROM inspections i 
          WHERE i.driver_id = u.id
        ) as total_inspections,
        (
          SELECT COUNT(*) 
          FROM inspections i 
          WHERE i.driver_id = u.id 
          AND i.submitted_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as recent_inspections
      FROM users u
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parseInt(limit), offset);

    const result = await db.query(query, values);

    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereClause}`;
    const countResult = await db.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
});

// GET /api/users/me - Get current user profile
router.get('/me', async (req, res, next) => {
  try {
    const user = await db.findById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    logger.error('Error fetching user profile:', error);
    next(error);
  }
});

// GET /api/users/:id - Get specific user (admin only)
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const userQuery = `
      SELECT 
        u.*,
        (
          SELECT COUNT(*) 
          FROM inspections i 
          WHERE i.driver_id = u.id
        ) as total_inspections,
        (
          SELECT json_agg(
            json_build_object(
              'id', i.id,
              'submitted_at', i.submitted_at,
              'overall_status', i.overall_status,
              'vehicle_fleet_code', v.fleet_code
            )
          )
          FROM inspections i
          JOIN vehicles v ON i.vehicle_id = v.id
          WHERE i.driver_id = u.id
          ORDER BY i.submitted_at DESC
          LIMIT 10
        ) as recent_inspections
      FROM users u
      WHERE u.id = $1
    `;

    const result = await db.query(userQuery, [id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });

  } catch (error) {
    logger.error('Error fetching user:', error);
    next(error);
  }
});

// POST /api/users - Create new user (admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const { name, email, phone, role, isActive, metadata } = value;

    // Check if user already exists
    const existingEmail = await db.findOne('users', { email });
    if (existingEmail) {
      return res.status(409).json({ 
        error: 'Email already exists',
        code: 'EMAIL_EXISTS' 
      });
    }

    const existingPhone = await db.findOne('users', { phone });
    if (existingPhone) {
      return res.status(409).json({ 
        error: 'Phone number already exists',
        code: 'PHONE_EXISTS' 
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-12);
    const password_hash = await bcrypt.hash(tempPassword, 12);

    const userData = {
      name,
      email,
      phone,
      password_hash,
      role,
      is_active: isActive,
      metadata
    };

    const newUser = await db.create('users', userData);

    logger.info(`New user created: ${email} (${role}) by ${req.user.email}`);

    const { password_hash: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      tempPassword, // In production, send via email instead
      message: 'User created successfully'
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    next(error);
  }
});

// PUT /api/users/:id - Update user (admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const user = await db.findById('users', id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    const { name, email, phone, role, isActive, metadata, password } = value;

    // Check email/phone uniqueness
    if (email !== user.email) {
      const existingEmail = await db.findOne('users', { email });
      if (existingEmail) {
        return res.status(409).json({ 
          error: 'Email already exists',
          code: 'EMAIL_EXISTS' 
        });
      }
    }

    if (phone !== user.phone) {
      const existingPhone = await db.findOne('users', { phone });
      if (existingPhone) {
        return res.status(409).json({ 
          error: 'Phone number already exists',
          code: 'PHONE_EXISTS' 
        });
      }
    }

    const updateData = {
      name,
      email,
      phone,
      role,
      is_active: isActive,
      metadata: { ...user.metadata, ...metadata }
    };

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    const updatedUser = await db.update('users', id, updateData);

    logger.info(`User updated: ${email} by ${req.user.email}`);

    const { password_hash, ...userWithoutPassword } = updatedUser;
    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'User updated successfully'
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    next(error);
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account',
        code: 'CANNOT_DELETE_SELF' 
      });
    }

    const user = await db.findById('users', id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      });
    }

    // Soft delete by deactivating instead of hard delete
    await db.update('users', id, { is_active: false });

    logger.info(`User deactivated: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    logger.error('Error deleting user:', error);
    next(error);
  }
});

module.exports = router;