const express = require('express');
const Joi = require('joi');
const db = require('../utils/database');
const logger = require('../utils/logger');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const inspectionSchema = Joi.object({
  schemaVersion: Joi.string().required(),
  vehicleId: Joi.string().uuid().required(),
  inspectionType: Joi.string().valid('pre-trip', 'post-trip', 'maintenance', 'incident').default('pre-trip'),
  shiftType: Joi.string().valid('morning', 'afternoon', 'evening', 'night').optional(),
  routeName: Joi.string().max(100).optional(),
  destination: Joi.string().max(200).optional(),
  odometer: Joi.number().min(0).optional(),
  fuelLevel: Joi.number().min(0).max(100).optional(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).optional(),
  locationName: Joi.string().max(200).optional(),
  weatherConditions: Joi.string().max(100).optional(),
  temperature: Joi.number().optional(),
  startedAt: Joi.string().isoDate().required(),
  submittedAt: Joi.string().isoDate().optional(),
  overallStatus: Joi.string().valid('PASS', 'FAIL', 'NEEDS_ATTENTION').required(),
  signatureUrl: Joi.string().uri().optional(),
  notes: Joi.string().max(1000).optional(),
  items: Joi.array().items(Joi.object({
    section: Joi.string().required(),
    itemKey: Joi.string().required(),
    itemLabel: Joi.string().required(),
    status: Joi.string().valid('OK', 'NOT_OK', 'NA').required(),
    comment: Joi.string().max(500).optional(),
    photoUrl: Joi.string().uri().optional(),
    priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional(),
    requiresImmediateAttention: Joi.boolean().default(false)
  })).min(1).required(),
  metadata: Joi.object().default({})
});

// GET /api/inspections - List inspections with filtering
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      vehicleId,
      driverId,
      status,
      fromDate,
      toDate,
      inspectionType,
      sortBy = 'submitted_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Build WHERE conditions
    if (vehicleId) {
      conditions.push(`i.vehicle_id = $${paramIndex++}`);
      values.push(vehicleId);
    }

    if (driverId) {
      conditions.push(`i.driver_id = $${paramIndex++}`);
      values.push(driverId);
    }

    if (status) {
      conditions.push(`i.overall_status = $${paramIndex++}`);
      values.push(status);
    }

    if (inspectionType) {
      conditions.push(`i.inspection_type = $${paramIndex++}`);
      values.push(inspectionType);
    }

    if (fromDate) {
      conditions.push(`i.submitted_at >= $${paramIndex++}`);
      values.push(fromDate);
    }

    if (toDate) {
      conditions.push(`i.submitted_at <= $${paramIndex++}`);
      values.push(toDate);
    }

    // Restrict drivers to see only their own inspections
    if (req.user.role === 'driver') {
      conditions.push(`i.driver_id = $${paramIndex++}`);
      values.push(req.user.id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Main query
    const query = `
      SELECT 
        i.*,
        u.name as driver_name,
        u.phone as driver_phone,
        v.fleet_code,
        v.registration,
        v.make,
        v.model,
        ST_X(i.location::geometry) as longitude,
        ST_Y(i.location::geometry) as latitude,
        (
          SELECT COUNT(*) 
          FROM inspection_items ii 
          WHERE ii.inspection_id = i.id AND ii.status = 'NOT_OK'
        ) as defect_count,
        (
          SELECT COUNT(*) 
          FROM inspection_items ii 
          WHERE ii.inspection_id = i.id AND ii.status = 'NOT_OK' AND ii.priority = 'CRITICAL'
        ) as critical_defect_count
      FROM inspections i
      JOIN users u ON i.driver_id = u.id
      JOIN vehicles v ON i.vehicle_id = v.id
      ${whereClause}
      ORDER BY i.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(parseInt(limit), offset);

    const result = await db.query(query, values);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inspections i
      JOIN users u ON i.driver_id = u.id
      JOIN vehicles v ON i.vehicle_id = v.id
      ${whereClause}
    `;

    const countResult = await db.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      inspections: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    logger.error('Error fetching inspections:', error);
    next(error);
  }
});

// GET /api/inspections/:id - Get specific inspection with details
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get inspection details
    const inspectionQuery = `
      SELECT 
        i.*,
        u.name as driver_name,
        u.phone as driver_phone,
        u.email as driver_email,
        v.fleet_code,
        v.registration,
        v.make,
        v.model,
        v.year,
        ST_X(i.location::geometry) as longitude,
        ST_Y(i.location::geometry) as latitude
      FROM inspections i
      JOIN users u ON i.driver_id = u.id
      JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.id = $1
    `;

    const inspectionResult = await db.query(inspectionQuery, [id]);
    const inspection = inspectionResult.rows[0];

    if (!inspection) {
      return res.status(404).json({ 
        error: 'Inspection not found',
        code: 'INSPECTION_NOT_FOUND' 
      });
    }

    // Check permissions - drivers can only see their own inspections
    if (req.user.role === 'driver' && inspection.driver_id !== req.user.id) {
      return res.status(403).json({ 
        error: 'Access denied',
        code: 'ACCESS_DENIED' 
      });
    }

    // Get inspection items
    const itemsQuery = `
      SELECT * FROM inspection_items
      WHERE inspection_id = $1
      ORDER BY section, sort_order, item_key
    `;

    const itemsResult = await db.query(itemsQuery, [id]);
    const items = itemsResult.rows;

    // Get defects for NOT_OK items
    const defectsQuery = `
      SELECT d.*, ii.item_label, ii.section
      FROM defects d
      JOIN inspection_items ii ON d.inspection_item_id = ii.id
      WHERE ii.inspection_id = $1
      ORDER BY d.severity DESC, d.created_at DESC
    `;

    const defectsResult = await db.query(defectsQuery, [id]);
    const defects = defectsResult.rows;

    res.json({
      success: true,
      inspection: {
        ...inspection,
        items,
        defects
      }
    });

  } catch (error) {
    logger.error('Error fetching inspection:', error);
    next(error);
  }
});

// POST /api/inspections - Submit new inspection
router.post('/', async (req, res, next) => {
  try {
    const { error, value } = inspectionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details[0].message 
      });
    }

    const {
      schemaVersion,
      vehicleId,
      inspectionType,
      shiftType,
      routeName,
      destination,
      odometer,
      fuelLevel,
      location,
      locationName,
      weatherConditions,
      temperature,
      startedAt,
      submittedAt,
      overallStatus,
      signatureUrl,
      notes,
      items,
      metadata
    } = value;

    // Verify vehicle exists
    const vehicle = await db.findById('vehicles', vehicleId);
    if (!vehicle) {
      return res.status(404).json({ 
        error: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND' 
      });
    }

    // Get current schema
    const schema = await db.findOne('form_schemas', { 
      name: 'Pre-Trip Inspection', 
      is_active: true 
    });

    await db.transaction(async (client) => {
      // Create inspection record
      const inspectionData = {
        schema_id: schema?.id || null,
        schema_version: schemaVersion,
        driver_id: req.user.id,
        vehicle_id: vehicleId,
        inspection_type: inspectionType,
        shift_type: shiftType,
        route_name: routeName,
        destination,
        odometer,
        fuel_level: fuelLevel,
        location: location ? `POINT(${location.lng} ${location.lat})` : null,
        location_name: locationName,
        weather_conditions: weatherConditions,
        temperature,
        started_at: startedAt,
        submitted_at: submittedAt || new Date().toISOString(),
        overall_status: overallStatus,
        signature_url: signatureUrl,
        notes,
        metadata
      };

      const insertInspectionQuery = `
        INSERT INTO inspections (${Object.keys(inspectionData).join(', ')})
        VALUES (${Object.keys(inspectionData).map((_, i) => `$${i + 1}`).join(', ')})
        RETURNING *
      `;

      const inspectionResult = await client.query(
        insertInspectionQuery, 
        Object.values(inspectionData)
      );
      
      const newInspection = inspectionResult.rows[0];

      // Create inspection items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemData = {
          inspection_id: newInspection.id,
          section: item.section,
          item_key: item.itemKey,
          item_label: item.itemLabel,
          status: item.status,
          comment: item.comment,
          photo_url: item.photoUrl,
          priority: item.priority,
          requires_immediate_attention: item.requiresImmediateAttention || false,
          sort_order: i
        };

        const insertItemQuery = `
          INSERT INTO inspection_items (${Object.keys(itemData).join(', ')})
          VALUES (${Object.keys(itemData).map((_, idx) => `$${idx + 1}`).join(', ')})
          RETURNING *
        `;

        const itemResult = await client.query(
          insertItemQuery,
          Object.values(itemData)
        );

        const newItem = itemResult.rows[0];

        // Create defect for NOT_OK items
        if (item.status === 'NOT_OK') {
          const defectData = {
            inspection_item_id: newItem.id,
            title: `${item.section}: ${item.itemLabel}`,
            description: item.comment || `Issue found with ${item.itemLabel}`,
            severity: item.priority || 'MEDIUM',
            state: 'OPEN',
            category: item.section.toLowerCase(),
            vehicle_out_of_service: item.priority === 'CRITICAL' && item.requiresImmediateAttention
          };

          const insertDefectQuery = `
            INSERT INTO defects (${Object.keys(defectData).join(', ')})
            VALUES (${Object.keys(defectData).map((_, idx) => `$${idx + 1}`).join(', ')})
          `;

          await client.query(insertDefectQuery, Object.values(defectData));
        }
      }

      return newInspection;
    });

    logger.info(`New inspection submitted: ${vehicleId} by ${req.user.email} - Status: ${overallStatus}`);

    res.status(201).json({
      success: true,
      message: 'Inspection submitted successfully',
      inspectionId: result.id
    });

  } catch (error) {
    logger.error('Error submitting inspection:', error);
    next(error);
  }
});

// GET /api/inspections/:id/export.pdf - Export inspection to PDF
router.get('/:id/export.pdf', async (req, res, next) => {
  try {
    // This would integrate with a PDF generation library like puppeteer
    res.status(501).json({
      error: 'PDF export not implemented yet',
      message: 'This feature will be available in a future update'
    });
  } catch (error) {
    logger.error('Error exporting inspection PDF:', error);
    next(error);
  }
});

// DELETE /api/inspections/:id - Delete inspection (admin only)
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const inspection = await db.findById('inspections', id);
    if (!inspection) {
      return res.status(404).json({ 
        error: 'Inspection not found',
        code: 'INSPECTION_NOT_FOUND' 
      });
    }

    await db.delete('inspections', id);

    logger.info(`Inspection deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Inspection deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting inspection:', error);
    next(error);
  }
});

module.exports = router;