# Buscor Admin Dashboard - Netlify Deployment

## 🚀 Quick Deploy to Netlify

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial admin dashboard deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/buscor-admin-dashboard.git
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to https://netlify.com
   - Sign up/login
   - Click "New site from Git"
   - Connect your GitHub repository
   - Select the `admin-dashboard` folder as the base directory

3. **Configure deployment:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Netlify will automatically detect the `netlify.toml` configuration

### Option 2: Manual Deployment

1. **Create a production build:**
   ```bash
   npm run build
   ```

2. **Deploy to Netlify:**
   - Go to https://netlify.com
   - Drag and drop the `.next` folder to deploy

## 🔧 Environment Variables

Make sure to set these environment variables in Netlify:

### In Netlify Dashboard > Site Settings > Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://elwrezqhbphadrfwrtwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsd3JlenFoYnBoYWRyZndydHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNjM0NzYsImV4cCI6MjA0NjgzOTQ3Nn0.LYZK8qR8QiKMOZYBHJbKn9a9FMMK9r1-8Cby9OjJg7c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsd3JlenFoYnBoYWRyZndydHd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTI2MzQ3NiwiZXhwIjoyMDQ2ODM5NDc2fQ.IM-k58uuEr29wDkZVZJh8BaOr3kFbsLNkN2Vw6GDCm4
```

## 🔗 Live URL

Once deployed, your admin dashboard will be available at:
`https://YOUR_SITE_NAME.netlify.app`

## 📱 Features

- ✅ Real-time inspection data from mobile app
- ✅ Vehicle management dashboard
- ✅ Inspection reports and analytics
- ✅ Responsive design
- ✅ Secure authentication
- ✅ Live database synchronization

## 🧪 Testing the Live Deployment

1. Access your live URL
2. Login with: admin@buscor.com / admin123
3. Submit an inspection from your mobile app
4. Watch it appear in real-time on the live dashboard!

## 📞 Support

If you encounter any issues during deployment, check the Netlify build logs and ensure all environment variables are set correctly.