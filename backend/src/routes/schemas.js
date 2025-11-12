const express = require('express');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/schemas/latest - Get current active schema
router.get('/latest', async (req, res, next) => {
  try {
    const schema = await db.findOne('form_schemas', { 
      name: 'Pre-Trip Inspection', 
      is_active: true 
    });

    if (!schema) {
      // Fallback to file-based schema
      try {
        const schemaPath = path.join(__dirname, '../../../shared/inspection_schema.json');
        const fileSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        
        return res.json({
          success: true,
          schema: fileSchema,
          source: 'file'
        });
      } catch (fileError) {
        return res.status(404).json({ 
          error: 'No schema found',
          code: 'SCHEMA_NOT_FOUND' 
        });
      }
    }

    res.json({
      success: true,
      schema: schema.json_schema,
      version: schema.version,
      id: schema.id,
      source: 'database'
    });

  } catch (error) {
    logger.error('Error fetching latest schema:', error);
    next(error);
  }
});

// GET /api/schemas - List all schemas (admin only)
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      name,
      isActive = 'all',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      conditions.push(`name ILIKE $${paramIndex++}`);
      values.push(`%${name}%`);
    }

    if (isActive !== 'all') {
      conditions.push(`is_active = $${paramIndex++}`);
      values.push(isActive === 'true');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        id, name, version, description, is_active, created_at, updated_at,
        u.name as created_by_name
      FROM form_schemas fs
      LEFT JOIN users u ON fs.created_by = u.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parseInt(limit), offset);

    const result = await db.query(query, values);

    const countQuery = `SELECT COUNT(*) as total FROM form_schemas fs ${whereClause}`;
    const countResult = await db.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      schemas: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching schemas:', error);
    next(error);
  }
});

// GET /api/schemas/:id - Get specific schema (admin only)
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        fs.*, 
        u.name as created_by_name,
        (
          SELECT COUNT(*)
          FROM inspections i
          WHERE i.schema_id = fs.id
        ) as usage_count
      FROM form_schemas fs
      LEFT JOIN users u ON fs.created_by = u.id
      WHERE fs.id = $1
    `;

    const result = await db.query(query, [id]);
    const schema = result.rows[0];

    if (!schema) {
      return res.status(404).json({ 
        error: 'Schema not found',
        code: 'SCHEMA_NOT_FOUND' 
      });
    }

    res.json({
      success: true,
      schema
    });

  } catch (error) {
    logger.error('Error fetching schema:', error);
    next(error);
  }
});

// POST /api/schemas - Upload new schema (admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const schemaValidation = Joi.object({
      name: Joi.string().required(),
      version: Joi.string().required(),
      description: Joi.string().optional(),
      jsonSchema: Joi.object().required(),
      isActive: Joi.boolean().default(true)
    });

    const { error, value } = schemaValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const { name, version, description, jsonSchema, isActive } = value;

    // Check if this name/version combination already exists
    const existing = await db.findOne('form_schemas', { name, version });
    if (existing) {
      return res.status(409).json({ 
        error: 'Schema with this name and version already exists',
        code: 'SCHEMA_EXISTS' 
      });
    }

    await db.transaction(async (client) => {
      // If this is being set as active, deactivate other schemas with same name
      if (isActive) {
        await client.query(
          'UPDATE form_schemas SET is_active = false WHERE name = $1',
          [name]
        );
      }

      // Create new schema
      const schemaData = {
        name,
        version,
        description,
        json_schema: jsonSchema,
        is_active: isActive,
        created_by: req.user.id
      };

      const insertQuery = `
        INSERT INTO form_schemas (${Object.keys(schemaData).join(', ')})
        VALUES (${Object.keys(schemaData).map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *
      `;

      const result = await client.query(insertQuery, Object.values(schemaData));
      return result.rows[0];
    });

    logger.info(`New schema uploaded: ${name} v${version} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Schema uploaded successfully'
    });

  } catch (error) {
    logger.error('Error uploading schema:', error);
    next(error);
  }
});

// PUT /api/schemas/:id/activate - Activate schema (admin only)
router.put('/:id/activate', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const schema = await db.findById('form_schemas', id);
    if (!schema) {
      return res.status(404).json({ 
        error: 'Schema not found',
        code: 'SCHEMA_NOT_FOUND' 
      });
    }

    await db.transaction(async (client) => {
      // Deactivate all other schemas with same name
      await client.query(
        'UPDATE form_schemas SET is_active = false WHERE name = $1',
        [schema.name]
      );

      // Activate this schema
      await client.query(
        'UPDATE form_schemas SET is_active = true WHERE id = $1',
        [id]
      );
    });

    logger.info(`Schema activated: ${schema.name} v${schema.version} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Schema activated successfully'
    });

  } catch (error) {
    logger.error('Error activating schema:', error);
    next(error);
  }
});

// DELETE /api/schemas/:id - Delete schema (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const schema = await db.findById('form_schemas', id);
    if (!schema) {
      return res.status(404).json({ 
        error: 'Schema not found',
        code: 'SCHEMA_NOT_FOUND' 
      });
    }

    // Check if schema is being used by any inspections
    const usageResult = await db.query(
      'SELECT COUNT(*) as count FROM inspections WHERE schema_id = $1',
      [id]
    );

    const usageCount = parseInt(usageResult.rows[0].count);
    if (usageCount > 0) {
      return res.status(409).json({ 
        error: `Cannot delete schema - it's being used by ${usageCount} inspections`,
        code: 'SCHEMA_IN_USE',
        usageCount
      });
    }

    await db.delete('form_schemas', id);

    logger.info(`Schema deleted: ${schema.name} v${schema.version} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Schema deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting schema:', error);
    next(error);
  }
});

module.exports = router;