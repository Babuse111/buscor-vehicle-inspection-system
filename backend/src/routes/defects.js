const express = require('express');
const Joi = require('joi');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { requireMechanic, requireDriverOrMechanic } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const defectSchema = Joi.object({
  inspectionItemId: Joi.string().uuid().required(),
  defectCode: Joi.string().optional(),
  title: Joi.string().max(200).required(),
  description: Joi.string().max(1000).optional(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
  category: Joi.string().max(50).optional(),
  estimatedCost: Joi.number().min(0).optional(),
  estimatedTimeHours: Joi.number().min(0).optional(),
  partsRequired: Joi.array().items(Joi.string()).default([]),
  vehicleOutOfService: Joi.boolean().default(false)
});

const updateDefectSchema = Joi.object({
  state: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').optional(),
  assignedTo: Joi.string().uuid().optional(),
  actualCost: Joi.number().min(0).optional(),
  actualTimeHours: Joi.number().min(0).optional(),
  resolutionNotes: Joi.string().max(1000).optional(),
  workOrderNumber: Joi.string().max(50).optional(),
  vendorContact: Joi.string().max(200).optional(),
  vehicleOutOfService: Joi.boolean().optional()
});

// GET /api/defects - List defects with filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      state,
      severity,
      assignedTo,
      vehicleId,
      fromDate,
      toDate,
      category,
      vehicleOutOfService,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (state) {
      conditions.push(`d.state = $${paramIndex++}`);
      values.push(state);
    }

    if (severity) {
      conditions.push(`d.severity = $${paramIndex++}`);
      values.push(severity);
    }

    if (assignedTo) {
      conditions.push(`d.assigned_to = $${paramIndex++}`);
      values.push(assignedTo);
    }

    if (vehicleId) {
      conditions.push(`i.vehicle_id = $${paramIndex++}`);
      values.push(vehicleId);
    }

    if (fromDate) {
      conditions.push(`d.created_at >= $${paramIndex++}`);
      values.push(fromDate);
    }

    if (toDate) {
      conditions.push(`d.created_at <= $${paramIndex++}`);
      values.push(toDate);
    }

    if (category) {
      conditions.push(`d.category = $${paramIndex++}`);
      values.push(category);
    }

    if (vehicleOutOfService === 'true') {
      conditions.push(`d.vehicle_out_of_service = true`);
    } else if (vehicleOutOfService === 'false') {
      conditions.push(`d.vehicle_out_of_service = false`);
    }

    // Restrict mechanics to see only assigned defects (unless admin)
    if (req.user.role === 'mechanic') {
      conditions.push(`(d.assigned_to = $${paramIndex++} OR d.assigned_to IS NULL)`);
      values.push(req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Main query
    const query = `
      SELECT 
        d.*,
        ii.section,
        ii.item_label,
        ii.photo_url as item_photo_url,
        i.submitted_at as inspection_date,
        i.odometer as inspection_odometer,
        v.fleet_code,
        v.registration,
        v.make,
        v.model,
        u_driver.name as driver_name,
        u_assigned.name as assigned_to_name,
        EXTRACT(EPOCH FROM (COALESCE(d.resolved_at, NOW()) - d.created_at)) / 3600 as age_hours
      FROM defects d
      JOIN inspection_items ii ON d.inspection_item_id = ii.id
      JOIN inspections i ON ii.inspection_id = i.id
      JOIN vehicles v ON i.vehicle_id = v.id
      JOIN users u_driver ON i.driver_id = u_driver.id
      LEFT JOIN users u_assigned ON d.assigned_to = u_assigned.id
      ${whereClause}
      ORDER BY 
        CASE d.state 
          WHEN 'OPEN' THEN 1 
          WHEN 'IN_PROGRESS' THEN 2 
          WHEN 'RESOLVED' THEN 3 
          WHEN 'CLOSED' THEN 4 
        END,
        CASE d.severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'HIGH' THEN 2 
          WHEN 'MEDIUM' THEN 3 
          WHEN 'LOW' THEN 4 
        END,
        d.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parseInt(limit), offset);

    const result = await db.query(query, values);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM defects d
      JOIN inspection_items ii ON d.inspection_item_id = ii.id
      JOIN inspections i ON ii.inspection_id = i.id
      JOIN vehicles v ON i.vehicle_id = v.id
      JOIN users u_driver ON i.driver_id = u_driver.id
      LEFT JOIN users u_assigned ON d.assigned_to = u_assigned.id
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    // Get summary stats
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE d.state = 'OPEN') as open_count,
        COUNT(*) FILTER (WHERE d.state = 'IN_PROGRESS') as in_progress_count,
        COUNT(*) FILTER (WHERE d.state = 'RESOLVED') as resolved_count,
        COUNT(*) FILTER (WHERE d.severity = 'CRITICAL') as critical_count,
        COUNT(*) FILTER (WHERE d.vehicle_out_of_service = true) as out_of_service_count,
        AVG(EXTRACT(EPOCH FROM (COALESCE(d.resolved_at, NOW()) - d.created_at)) / 3600) as avg_resolution_hours
      FROM defects d
      JOIN inspection_items ii ON d.inspection_item_id = ii.id
      JOIN inspections i ON ii.inspection_id = i.id
      ${whereClause}
    `;

    const statsResult = await db.query(statsQuery, values.slice(0, -2));
    const stats = statsResult.rows[0];

    res.json({
      success: true,
      defects: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      stats: {
        open: parseInt(stats.open_count) || 0,
        inProgress: parseInt(stats.in_progress_count) || 0,
        resolved: parseInt(stats.resolved_count) || 0,
        critical: parseInt(stats.critical_count) || 0,
        outOfService: parseInt(stats.out_of_service_count) || 0,
        avgResolutionHours: parseFloat(stats.avg_resolution_hours) || 0
      }
    });

  } catch (error) {
    logger.error('Error fetching defects:', error);
    next(error);
  }
});

// GET /api/defects/:id - Get specific defect
router.get('/:id', requireDriverOrMechanic, async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        d.*,
        ii.section,
        ii.item_label,
        ii.item_key,
        ii.status as item_status,
        ii.comment as item_comment,
        ii.photo_url as item_photo_url,
        i.id as inspection_id,
        i.submitted_at as inspection_date,
        i.overall_status as inspection_status,
        i.odometer as inspection_odometer,
        i.notes as inspection_notes,
        v.fleet_code,
        v.registration,
        v.make,
        v.model,
        v.year,
        u_driver.name as driver_name,
        u_driver.phone as driver_phone,
        u_driver.email as driver_email,
        u_assigned.name as assigned_to_name,
        u_assigned.phone as assigned_to_phone,
        u_assigned.email as assigned_to_email
      FROM defects d
      JOIN inspection_items ii ON d.inspection_item_id = ii.id
      JOIN inspections i ON ii.inspection_id = i.id
      JOIN vehicles v ON i.vehicle_id = v.id
      JOIN users u_driver ON i.driver_id = u_driver.id
      LEFT JOIN users u_assigned ON d.assigned_to = u_assigned.id
      WHERE d.id = $1
    `;

    const result = await db.query(query, [id]);
    const defect = result.rows[0];

    if (!defect) {
      return res.status(404).json({ 
        error: 'Defect not found',
        code: 'DEFECT_NOT_FOUND' 
      });
    }

    // Check permissions
    if (req.user.role === 'mechanic' && defect.assigned_to !== req.user.id && defect.assigned_to !== null) {
      return res.status(403).json({ 
        error: 'Access denied - defect not assigned to you',
        code: 'ACCESS_DENIED' 
      });
    }

    if (req.user.role === 'driver' && defect.driver_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied - not your inspection',
        code: 'ACCESS_DENIED' 
      });
    }

    res.json({
      success: true,
      defect
    });

  } catch (error) {
    logger.error('Error fetching defect:', error);
    next(error);
  }
});

// POST /api/defects - Create new defect (usually done automatically)
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = defectSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const {
      inspectionItemId,
      defectCode,
      title,
      description,
      severity,
      category,
      estimatedCost,
      estimatedTimeHours,
      partsRequired,
      vehicleOutOfService
    } = value;

    // Verify inspection item exists and is NOT_OK
    const itemQuery = `
      SELECT ii.*, i.driver_id, i.vehicle_id
      FROM inspection_items ii
      JOIN inspections i ON ii.inspection_id = i.id
      WHERE ii.id = $1
    `;

    const itemResult = await db.query(itemQuery, [inspectionItemId]);
    const item = itemResult.rows[0];

    if (!item) {
      return res.status(404).json({ 
        error: 'Inspection item not found',
        code: 'ITEM_NOT_FOUND' 
      });
    }

    if (item.status !== 'NOT_OK') {
      return res.status(400).json({ 
        error: 'Can only create defects for NOT_OK items',
        code: 'INVALID_ITEM_STATUS' 
      });
    }

    // Check if defect already exists for this item
    const existingDefect = await db.findOne('defects', { inspection_item_id: inspectionItemId });
    if (existingDefect) {
      return res.status(409).json({ 
        error: 'Defect already exists for this item',
        code: 'DEFECT_EXISTS' 
      });
    }

    const defectData = {
      inspection_item_id: inspectionItemId,
      defect_code: defectCode,
      title,
      description,
      severity,
      category: category || item.section?.toLowerCase(),
      estimated_cost: estimatedCost,
      estimated_time_hours: estimatedTimeHours,
      parts_required: JSON.stringify(partsRequired),
      vehicle_out_of_service: vehicleOutOfService,
      state: 'OPEN'
    };

    const newDefect = await db.create('defects', defectData);

    logger.info(`New defect created: ${title} for vehicle ${item.vehicle_id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      defect: newDefect,
      message: 'Defect created successfully'
    });

  } catch (error) {
    logger.error('Error creating defect:', error);
    next(error);
  }
});

// PATCH /api/defects/:id - Update defect
router.patch('/:id', requireDriverOrMechanic, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateDefectSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const defect = await db.query(`
      SELECT d.*, ii.inspection_id, i.driver_id 
      FROM defects d
      JOIN inspection_items ii ON d.inspection_item_id = ii.id
      JOIN inspections i ON ii.inspection_id = i.id
      WHERE d.id = $1
    `, [id]);

    if (defect.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Defect not found',
        code: 'DEFECT_NOT_FOUND' 
      });
    }

    const currentDefect = defect.rows[0];

    // Permission checks
    if (req.user.role === 'driver' && currentDefect.driver_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied - not your inspection',
        code: 'ACCESS_DENIED' 
      });
    }

    if (req.user.role === 'mechanic' && currentDefect.assigned_to !== req.user.id && value.assignedTo !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied - defect not assigned to you',
        code: 'ACCESS_DENIED' 
      });
    }

    const updateData = {};

    // Handle state transitions
    if (value.state) {
      updateData.state = value.state;
      
      if (value.state === 'IN_PROGRESS' && !currentDefect.started_at) {
        updateData.started_at = new Date().toISOString();
      }
      
      if (value.state === 'RESOLVED' && !currentDefect.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
      
      if (value.state === 'CLOSED') {
        updateData.closed_at = new Date().toISOString();
      }
    }

    // Handle assignment
    if (value.assignedTo !== undefined) {
      updateData.assigned_to = value.assignedTo;
      if (value.assignedTo) {
        updateData.assigned_at = new Date().toISOString();
      }
    }

    // Other updates
    if (value.actualCost !== undefined) updateData.actual_cost = value.actualCost;
    if (value.actualTimeHours !== undefined) updateData.actual_time_hours = value.actualTimeHours;
    if (value.resolutionNotes !== undefined) updateData.resolution_notes = value.resolutionNotes;
    if (value.workOrderNumber !== undefined) updateData.work_order_number = value.workOrderNumber;
    if (value.vendorContact !== undefined) updateData.vendor_contact = value.vendorContact;
    if (value.vehicleOutOfService !== undefined) updateData.vehicle_out_of_service = value.vehicleOutOfService;

    const updatedDefect = await db.update('defects', id, updateData);

    logger.info(`Defect updated: ${id} by ${req.user.email} - State: ${value.state || 'unchanged'}`);

    res.json({
      success: true,
      defect: updatedDefect,
      message: 'Defect updated successfully'
    });

  } catch (error) {
    logger.error('Error updating defect:', error);
    next(error);
  }
});

// POST /api/defects/:id/assign - Assign defect to mechanic
router.post('/:id/assign', requireMechanic, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mechanicId } = req.body;

    // Validate mechanic exists
    if (mechanicId) {
      const mechanic = await db.findOne('users', { id: mechanicId, role: 'mechanic', is_active: true });
      if (!mechanic) {
        return res.status(404).json({ 
          error: 'Mechanic not found',
          code: 'MECHANIC_NOT_FOUND' 
        });
      }
    }

    const defect = await db.findById('defects', id);
    if (!defect) {
      return res.status(404).json({ 
        error: 'Defect not found',
        code: 'DEFECT_NOT_FOUND' 
      });
    }

    const updateData = {
      assigned_to: mechanicId || req.user.id, // Self-assign if no mechanicId provided
      assigned_at: new Date().toISOString()
    };

    if (defect.state === 'OPEN') {
      updateData.state = 'IN_PROGRESS';
      updateData.started_at = new Date().toISOString();
    }

    const updatedDefect = await db.update('defects', id, updateData);

    logger.info(`Defect assigned: ${id} to ${mechanicId || req.user.id} by ${req.user.email}`);

    res.json({
      success: true,
      defect: updatedDefect,
      message: 'Defect assigned successfully'
    });

  } catch (error) {
    logger.error('Error assigning defect:', error);
    next(error);
  }
});

module.exports = router;