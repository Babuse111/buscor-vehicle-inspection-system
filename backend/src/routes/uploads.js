const express = require('express');
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// POST /api/uploads/signature - Get signed upload params for photos
router.post('/signature', async (req, res, next) => {
  try {
    const { type = 'photo', inspectionId, itemKey } = req.body;

    if (!inspectionId) {
      return res.status(400).json({ 
        error: 'Inspection ID required',
        code: 'INSPECTION_ID_REQUIRED' 
      });
    }

    // Generate folder structure: inspections/YYYY-MM/inspectionId/photos
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const folder = `inspections/${yearMonth}/${inspectionId}/${type}s`;

    // Generate public ID with item key for easier identification
    const publicId = itemKey 
      ? `${folder}/${itemKey}_${Date.now()}`
      : `${folder}/${type}_${Date.now()}`;

    const uploadParams = {
      public_id: publicId,
      folder: folder,
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto',
      fetch_format: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ],
      context: {
        inspection_id: inspectionId,
        item_key: itemKey || '',
        uploaded_by: req.user.id,
        upload_type: type
      }
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    logger.info(`Upload signature generated for inspection ${inspectionId} by ${req.user.email}`);

    res.json({
      success: true,
      uploadParams: {
        ...uploadParams,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        timestamp: Math.round(Date.now() / 1000)
      },
      cloudName: process.env.CLOUDINARY_CLOUD_NAME
    });

  } catch (error) {
    logger.error('Error generating upload signature:', error);
    next(error);
  }
});

// POST /api/uploads/signature-url - Get signed upload URL (alternative method)
router.post('/signature-url', async (req, res, next) => {
  try {
    const { type = 'photo', inspectionId, itemKey } = req.body;

    if (!inspectionId) {
      return res.status(400).json({ 
        error: 'Inspection ID required',
        code: 'INSPECTION_ID_REQUIRED' 
      });
    }

    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const folder = `inspections/${yearMonth}/${inspectionId}/${type}s`;
    
    const publicId = itemKey 
      ? `${folder}/${itemKey}_${Date.now()}`
      : `${folder}/${type}_${Date.now()}`;

    // Generate signed upload URL
    const signedUrl = cloudinary.utils.private_download_zip_url({
      resource_type: 'image',
      type: 'upload',
      public_id: publicId
    });

    res.json({
      success: true,
      signedUrl,
      publicId
    });

  } catch (error) {
    logger.error('Error generating signed URL:', error);
    next(error);
  }
});

// DELETE /api/uploads/:publicId - Delete uploaded file
router.delete('/:publicId', async (req, res, next) => {
  try {
    const { publicId } = req.params;

    // Decode URL-encoded public ID
    const decodedPublicId = decodeURIComponent(publicId);

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(decodedPublicId);

    if (result.result === 'ok') {
      logger.info(`File deleted: ${decodedPublicId} by ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'File deleted successfully',
        result
      });
    } else {
      res.status(404).json({
        error: 'File not found or already deleted',
        code: 'FILE_NOT_FOUND'
      });
    }

  } catch (error) {
    logger.error('Error deleting file:', error);
    next(error);
  }
});

// GET /api/uploads/list/:inspectionId - List files for an inspection
router.get('/list/:inspectionId', async (req, res, next) => {
  try {
    const { inspectionId } = req.params;
    const { type } = req.query; // photo, signature

    // Build search query
    const date = new Date();
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = type 
      ? `inspections/${yearMonth}/${inspectionId}/${type}s`
      : `inspections/${yearMonth}/${inspectionId}`;

    try {
      const result = await cloudinary.search
        .expression(`folder:${prefix}/*`)
        .sort_by([['created_at', 'desc']])
        .max_results(100)
        .execute();

      const files = result.resources.map(resource => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        bytes: resource.bytes,
        createdAt: resource.created_at,
        context: resource.context || {},
        transformation: resource.transformation
      }));

      res.json({
        success: true,
        files,
        total: result.total_count
      });

    } catch (cloudinaryError) {
      // Handle case where folder doesn't exist
      logger.debug(`No files found for inspection ${inspectionId}: ${cloudinaryError.message}`);
      
      res.json({
        success: true,
        files: [],
        total: 0
      });
    }

  } catch (error) {
    logger.error('Error listing files:', error);
    next(error);
  }
});

// POST /api/uploads/transform - Transform existing image
router.post('/transform', async (req, res, next) => {
  try {
    const { publicId, transformations } = req.body;

    if (!publicId) {
      return res.status(400).json({ 
        error: 'Public ID required',
        code: 'PUBLIC_ID_REQUIRED' 
      });
    }

    // Generate transformed URL
    const transformedUrl = cloudinary.url(publicId, {
      ...transformations,
      secure: true
    });

    res.json({
      success: true,
      transformedUrl,
      originalPublicId: publicId
    });

  } catch (error) {
    logger.error('Error transforming image:', error);
    next(error);
  }
});

module.exports = router;