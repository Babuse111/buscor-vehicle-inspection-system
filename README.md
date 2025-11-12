# Buscor Admin Dashboard

A modern, responsive admin dashboard for managing vehicle inspections and fleet monitoring.

## Features

- 🚌 **Vehicle Management**: Monitor fleet status and maintenance
- 📋 **Inspection Tracking**: Real-time inspection monitoring  
- ⚠️ **Defect Management**: Safety issue tracking and reporting
- 📊 **Analytics Dashboard**: Performance metrics and insights
- 🔐 **Authentication**: Secure admin access
- 📱 **Responsive Design**: Mobile and desktop compatible

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.local` and update Supabase credentials
   - Set admin login credentials

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Access Dashboard**
   - Open http://localhost:3001
   - Login with: admin@buscor.com / admin123

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with Buscor brand colors
- **Icons**: Heroicons
- **Database**: Supabase (configured for mobile app)
- **Authentication**: JWT-based admin auth

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── page.tsx        # Dashboard home
│   ├── login/          # Authentication
│   └── layout.tsx      # Root layout
└── components/         # Reusable components
    ├── Layout.tsx      # Main layout with header
    ├── DashboardStats.tsx
    ├── VehicleStatus.tsx
    ├── RecentInspections.tsx
    └── DefectOverview.tsx
```

## Buscor Branding

- **Primary Color**: #FF7F00 (Orange)
- **Secondary Color**: #00A693 (Teal)
- **Typography**: Inter font family
- **Logo**: Circular "BC" brand mark

## Development

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

The dashboard is ready for deployment to:
- Vercel (recommended for Next.js)
- Netlify
- Custom server with Node.js

## Integration

This dashboard connects to:
- Mobile inspection app (React Native)
- Backend API (Node.js/Express)
- Supabase database (shared with mobile app)