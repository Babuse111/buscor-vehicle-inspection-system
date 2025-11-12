# Backend API Server

Node.js/Express backend for the Vehicle Inspection App with PostgreSQL database and JWT authentication.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**
   ```bash
   npm run migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The API will be running on `http://localhost:3000`

## 📋 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/inspection_app

# JWT
JWT_SECRET=your-super-secure-secret-key
JWT_EXPIRES_IN=7d

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🗄️ Database Setup

### PostgreSQL Requirements
- PostgreSQL 12+ with PostGIS extension
- Create database: `CREATE DATABASE inspection_app;`
- Enable extensions: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS postgis;`

### Running Migrations
```bash
# Run schema and seed data
npm run migrate

# Or run individually
node scripts/migrate.js
```

This creates:
- Database tables with proper indexes
- Sample admin user: `admin@inspectionapp.com` / `admin123`
- Sample driver: `john.smith@company.com` / `driver123`
- Sample vehicles for testing

## 🔗 API Endpoints

### Authentication
```http
POST   /api/auth/login          # User login
POST   /api/auth/register       # Create new user (admin only)
POST   /api/auth/refresh        # Refresh JWT token
POST   /api/auth/logout         # Logout (cleanup)
GET    /api/auth/me             # Get current user profile
```

### Users
```http
GET    /api/users               # List all users (admin only)
GET    /api/users/:id           # Get user details (admin only)
POST   /api/users               # Create new user (admin only)
PUT    /api/users/:id           # Update user (admin only)
DELETE /api/users/:id           # Deactivate user (admin only)
GET    /api/users/me            # Get current user profile
```

### Vehicles
```http
GET    /api/vehicles            # List vehicles
GET    /api/vehicles/:id        # Get vehicle details
POST   /api/vehicles            # Create vehicle (admin only)
PUT    /api/vehicles/:id        # Update vehicle (admin only)
DELETE /api/vehicles/:id        # Delete vehicle (admin only)
GET    /api/vehicles/:id/inspections  # Get vehicle inspection history
```

### Inspections
```http
GET    /api/inspections         # List inspections (with filters)
GET    /api/inspections/:id     # Get inspection details
POST   /api/inspections         # Submit new inspection
DELETE /api/inspections/:id     # Delete inspection (admin only)
GET    /api/inspections/:id/export.pdf  # Export to PDF
```

### Defects
```http
GET    /api/defects             # List defects (with filters)
GET    /api/defects/:id         # Get defect details
POST   /api/defects             # Create defect
PATCH  /api/defects/:id         # Update defect status
POST   /api/defects/:id/assign  # Assign to mechanic
```

### Schemas
```http
GET    /api/schemas/latest      # Get current inspection schema
GET    /api/schemas             # List all schemas (admin only)
POST   /api/schemas             # Upload new schema (admin only)
PUT    /api/schemas/:id/activate # Activate schema version (admin only)
DELETE /api/schemas/:id         # Delete schema (admin only)
```

### File Uploads
```http
POST   /api/uploads/signature   # Get signed upload URL for photos
DELETE /api/uploads/:publicId   # Delete uploaded file
GET    /api/uploads/list/:inspectionId # List files for inspection
```

### Public Endpoints
```http
GET    /api/public/schema       # Get inspection schema (no auth required)
GET    /health                  # Health check endpoint
```

## 🔐 Authentication & Authorization

### JWT Authentication
- All API endpoints (except public ones) require JWT token
- Token expires in 7 days (configurable)
- Include in header: `Authorization: Bearer <token>`

### User Roles
- **Admin**: Full access to all endpoints
- **Driver**: Can view/create inspections for assigned vehicles
- **Mechanic**: Can view/update defects assigned to them

### Example API Usage
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john.smith@company.com',
    password: 'driver123'
  })
})
const { token, user } = await response.json()

// Use token for subsequent requests
const inspections = await fetch('/api/inspections', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## 📊 Query Parameters

### Inspections
```http
GET /api/inspections?page=1&limit=20&vehicleId=123&status=PASS&fromDate=2023-01-01&toDate=2023-12-31
```

### Vehicles
```http
GET /api/vehicles?status=active&department=Transport&search=BUS
```

### Defects
```http
GET /api/defects?state=OPEN&severity=CRITICAL&assignedTo=mechanic-id
```

## 🏗️ Project Structure

```
src/
├── routes/           # API route handlers
│   ├── auth.js       # Authentication endpoints
│   ├── users.js      # User management
│   ├── vehicles.js   # Vehicle management
│   ├── inspections.js # Inspection endpoints
│   ├── defects.js    # Defect management
│   ├── schemas.js    # Schema management
│   └── uploads.js    # File upload handling
├── middleware/       # Express middleware
│   ├── auth.js       # JWT authentication
│   └── error.js      # Error handling
├── utils/           # Utility modules
│   ├── database.js   # Database connection & helpers
│   └── logger.js     # Winston logging
└── server.js        # Main application entry point

database/
├── schema.sql       # Database schema definition
└── seed.sql         # Sample data

scripts/
└── migrate.js       # Database setup script
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.js

# Run tests with coverage
npm run test:coverage
```

## 📝 Logging

Application uses Winston for logging:
- **Development**: Console output with colors
- **Production**: File-based logging (`logs/combined.log`, `logs/error.log`)
- **Levels**: error, warn, info, debug

## ⚠️ Error Handling

API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2023-11-09T10:30:00Z",
  "path": "/api/endpoint",
  "method": "POST"
}
```

Common error codes:
- `TOKEN_MISSING` - No authorization token provided
- `TOKEN_INVALID` - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` - User lacks required role
- `VALIDATION_ERROR` - Request data validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist

## 🚀 Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start src/server.js --name inspection-api
pm2 startup
pm2 save
```

### Environment Setup
- Set `NODE_ENV=production`
- Use environment variables for all sensitive data
- Enable HTTPS with reverse proxy (nginx/Apache)
- Set up database connection pooling
- Configure log rotation

### Database Considerations
- Use connection pooling (configured in database.js)
- Regular backups and point-in-time recovery
- Monitor performance and optimize queries
- Consider read replicas for scaling

## 📊 Performance

### Optimizations Included
- Database indexing on frequently queried columns
- Connection pooling for PostgreSQL
- Request compression with gzip
- Rate limiting to prevent abuse
- Efficient pagination for large datasets

### Monitoring
- Health check endpoint: `GET /health`
- Request logging with response times
- Error tracking with stack traces
- Database query performance logging

---

For more information, see the main project README.md