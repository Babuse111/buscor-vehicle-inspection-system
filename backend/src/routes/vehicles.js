const express = require('express');
const Joi = require('joi');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const vehicleSchema = Joi.object({
  fleetCode: Joi.string().required(),
  registration: Joi.string().required(),
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1),
  vin: Joi.string().optional(),
  engineNumber: Joi.string().optional(),
  fuelType: Joi.string().valid('petrol', 'diesel', 'electric', 'hybrid').optional(),
  capacity: Joi.number().integer().min(1).optional(),
  department: Joi.string().optional(),
  status: Joi.string().valid('active', 'maintenance', 'retired', 'out_of_service').default('active'),
  lastServiceDate: Joi.date().optional(),
  nextServiceDue: Joi.date().optional(),
  insuranceExpiry: Joi.date().optional(),
  roadworthyExpiry: Joi.date().optional(),
  metadata: Joi.object().default({})
});

// GET /api/vehicles - List all vehicles
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      department,
      search,
      sortBy = 'fleet_code',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (department) {
      conditions.push(`department = $${paramIndex++}`);
      values.push(department);
    }

    if (search) {
      conditions.push(`(
        fleet_code ILIKE $${paramIndex} OR 
        registration ILIKE $${paramIndex} OR 
        make ILIKE $${paramIndex} OR 
        model ILIKE $${paramIndex}
      )`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Main query with additional stats
    const query = `
      SELECT 
        v.*,
        (
          SELECT COUNT(*) 
          FROM inspections i 
          WHERE i.vehicle_id = v.id
        ) as total_inspections,
        (
          SELECT COUNT(*) 
          FROM inspections i 
          WHERE i.vehicle_id = v.id 
          AND i.submitted_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as recent_inspections,
        (
          SELECT i.submitted_at
          FROM inspections i 
          WHERE i.vehicle_id = v.id 
          ORDER BY i.submitted_at DESC 
          LIMIT 1
        ) as last_inspection_date,
        (
          SELECT i.overall_status
          FROM inspections i 
          WHERE i.vehicle_id = v.id 
          ORDER BY i.submitted_at DESC 
          LIMIT 1
        ) as last_inspection_status,
        (
          SELECT COUNT(*)
          FROM defects d
          JOIN inspection_items ii ON d.inspection_item_id = ii.id
          JOIN inspections i ON ii.inspection_id = i.id
          WHERE i.vehicle_id = v.id AND d.state IN ('OPEN', 'IN_PROGRESS')
        ) as open_defects
      FROM vehicles v
      ${whereClause}
      ORDER BY v.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parseInt(limit), offset);

    const result = await db.query(query, values);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vehicles v
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      vehicles: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    next(error);
  }
});

// GET /api/vehicles/:id - Get specific vehicle details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get vehicle details
    const vehicleQuery = `
      SELECT 
        v.*,
        (
          SELECT COUNT(*) 
          FROM inspections i 
          WHERE i.vehicle_id = v.id
        ) as total_inspections,
        (
          SELECT json_agg(
            json_build_object(
              'id', i.id,
              'submitted_at', i.submitted_at,
              'overall_status', i.overall_status,
              'driver_name', u.name,
              'defect_count', (
                SELECT COUNT(*) 
                FROM inspection_items ii 
                WHERE ii.inspection_id = i.id AND ii.status = 'NOT_OK'
              )
            )
          )
          FROM inspections i
          JOIN users u ON i.driver_id = u.id
          WHERE i.vehicle_id = v.id
          ORDER BY i.submitted_at DESC
          LIMIT 10
        ) as recent_inspections,
        (
          SELECT json_agg(
            json_build_object(
              'id', d.id,
              'title', d.title,
              'severity', d.severity,
              'state', d.state,
              'created_at', d.created_at,
              'assigned_to_name', u.name
            )
          )
          FROM defects d
          JOIN inspection_items ii ON d.inspection_item_id = ii.id
          JOIN inspections i ON ii.inspection_id = i.id
          LEFT JOIN users u ON d.assigned_to = u.id
          WHERE i.vehicle_id = v.id AND d.state IN ('OPEN', 'IN_PROGRESS')
          ORDER BY d.created_at DESC
        ) as open_defects
      FROM vehicles v
      WHERE v.id = $1
    `;

    const result = await db.query(vehicleQuery, [id]);
    const vehicle = result.rows[0];

    if (!vehicle) {
      return res.status(404).json({ 
        error: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND' 
      });
    }

    res.json({
      success: true,
      vehicle
    });

  } catch (error) {
    logger.error('Error fetching vehicle:', error);
    next(error);
  }
});

// POST /api/vehicles - Create new vehicle (admin only)
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { error, value } = vehicleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const {
      fleetCode,
      registration,
      make,
      model,
      year,
      vin,
      engineNumber,
      fuelType,
      capacity,
      department,
      status,
      lastServiceDate,
      nextServiceDue,
      insuranceExpiry,
      roadworthyExpiry,
      metadata
    } = value;

    // Check if fleet code or registration already exists
    const existingFleetCode = await db.findOne('vehicles', { fleet_code: fleetCode });
    if (existingFleetCode) {
      return res.status(409).json({ 
        error: 'Fleet code already exists',
        code: 'FLEET_CODE_EXISTS' 
      });
    }

    const existingRegistration = await db.findOne('vehicles', { registration });
    if (existingRegistration) {
      return res.status(409).json({ 
        error: 'Registration already exists',
        code: 'REGISTRATION_EXISTS' 
      });
    }

    const vehicleData = {
      fleet_code: fleetCode,
      registration,
      make,
      model,
      year,
      vin,
      engine_number: engineNumber,
      fuel_type: fuelType,
      capacity,
      department,
      status,
      last_service_date: lastServiceDate,
      next_service_due: nextServiceDue,
      insurance_expiry: insuranceExpiry,
      roadworthy_expiry: roadworthyExpiry,
      metadata
    };

    const newVehicle = await db.create('vehicles', vehicleData);

    logger.info(`New vehicle created: ${fleetCode} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      vehicle: newVehicle,
      message: 'Vehicle created successfully'
    });

  } catch (error) {
    logger.error('Error creating vehicle:', error);
    next(error);
  }
});

// PUT /api/vehicles/:id - Update vehicle (admin only)
router.put('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = vehicleSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const vehicle = await db.findById('vehicles', id);
    if (!vehicle) {
      return res.status(404).json({ 
        error: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND' 
      });
    }

    const {
      fleetCode,
      registration,
      make,
      model,
      year,
      vin,
      engineNumber,
      fuelType,
      capacity,
      department,
      status,
      lastServiceDate,
      nextServiceDue,
      insuranceExpiry,
      roadworthyExpiry,
      metadata
    } = value;

    // Check if fleet code or registration already exists (excluding current vehicle)
    if (fleetCode !== vehicle.fleet_code) {
      const existingFleetCode = await db.findOne('vehicles', { fleet_code: fleetCode });
      if (existingFleetCode) {
        return res.status(409).json({ 
          error: 'Fleet code already exists',
          code: 'FLEET_CODE_EXISTS' 
        });
      }
    }

    if (registration !== vehicle.registration) {
      const existingRegistration = await db.findOne('vehicles', { registration });
      if (existingRegistration) {
        return res.status(409).json({ 
          error: 'Registration already exists',
          code: 'REGISTRATION_EXISTS' 
        });
      }
    }

    const updateData = {
      fleet_code: fleetCode,
      registration,
      make,
      model,
      year,
      vin,
      engine_number: engineNumber,
      fuel_type: fuelType,
      capacity,
      department,
      status,
      last_service_date: lastServiceDate,
      next_service_due: nextServiceDue,
      insurance_expiry: insuranceExpiry,
      roadworthy_expiry: roadworthyExpiry,
      metadata: { ...vehicle.metadata, ...metadata }
    };

    const updatedVehicle = await db.update('vehicles', id, updateData);

    logger.info(`Vehicle updated: ${fleetCode} by ${req.user.email}`);

    res.json({
      success: true,
      vehicle: updatedVehicle,
      message: 'Vehicle updated successfully'
    });

  } catch (error) {
    logger.error('Error updating vehicle:', error);
    next(error);
  }
});

// DELETE /api/vehicles/:id - Delete vehicle (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const vehicle = await db.findById('vehicles', id);
    if (!vehicle) {
      return res.status(404).json({ 
        error: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND' 
      });
    }

    // Check if vehicle has associated inspections
    const inspectionCount = await db.query(
      'SELECT COUNT(*) as count FROM inspections WHERE vehicle_id = $1',
      [id]
    );

    if (parseInt(inspectionCount.rows[0].count) > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete vehicle with existing inspections',
        code: 'VEHICLE_HAS_INSPECTIONS',
        inspectionCount: parseInt(inspectionCount.rows[0].count)
      });
    }

    await db.delete('vehicles', id);

    logger.info(`Vehicle deleted: ${vehicle.fleet_code} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting vehicle:', error);
    next(error);
  }
});

// GET /api/vehicles/:id/inspections - Get vehicle inspection history
router.get('/:id/inspections', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 20,
      fromDate,
      toDate,
      status 
    } = req.query;

    const vehicle = await db.findById('vehicles', id);
    if (!vehicle) {
      return res.status(404).json({ 
        error: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND' 
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [`i.vehicle_id = $1`];
    const values = [id];
    let paramIndex = 2;

    if (fromDate) {
      conditions.push(`i.submitted_at >= $${paramIndex++}`);
      values.push(fromDate);
    }

    if (toDate) {
      conditions.push(`i.submitted_at <= $${paramIndex++}`);
      values.push(toDate);
    }

    if (status) {
      conditions.push(`i.overall_status = $${paramIndex++}`);
      values.push(status);
    }

    const query = `
      SELECT 
        i.*,
        u.name as driver_name,
        (
          SELECT COUNT(*) 
          FROM inspection_items ii 
          WHERE ii.inspection_id = i.id AND ii.status = 'NOT_OK'
        ) as defect_count
      FROM inspections i
      JOIN users u ON i.driver_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.submitted_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parseInt(limit), offset);

    const result = await db.query(query, values);

    res.json({
      success: true,
      inspections: result.rows,
      vehicle: vehicle
    });

  } catch (error) {
    logger.error('Error fetching vehicle inspections:', error);
    next(error);
  }
});

module.exports = router;