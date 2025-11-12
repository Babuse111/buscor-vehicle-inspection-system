require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/error');
const { authenticateToken } = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const schemaRoutes = require('./routes/schemas');
const inspectionRoutes = require('./routes/inspections');
const defectRoutes = require('./routes/defects');
const uploadRoutes = require('./routes/uploads');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-admin-dashboard.com', 'https://your-mobile-app.com']
    : ['http://localhost:3001', 'http://localhost:3000', 'http://10.0.2.2:3000'], // Include Android emulator
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/vehicles', authenticateToken, vehicleRoutes);
app.use('/api/schemas', authenticateToken, schemaRoutes);
app.use('/api/inspections', authenticateToken, inspectionRoutes);
app.use('/api/defects', authenticateToken, defectRoutes);
app.use('/api/uploads', authenticateToken, uploadRoutes);

// Serve inspection schema publicly (for mobile app initial setup)
app.get('/api/public/schema', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  try {
    const schemaPath = path.join(__dirname, '../../shared/inspection_schema.json');
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    res.json(schema);
  } catch (error) {
    logger.error('Error serving public schema:', error);
    res.status(500).json({ error: 'Schema not available' });
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Inspection API server running on port ${PORT}`);
  logger.info(`📖 Health check available at http://localhost:${PORT}/health`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;