# 🚀 Buscor Admin Dashboard - Netlify Deployment Guide

## ✅ Pre-deployment Checklist
- [x] Production build successful
- [x] Netlify configuration created
- [x] Environment variables configured
- [x] Netlify CLI installed

## 🌐 Quick Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **Login to Netlify**
   ```bash
   netlify login
   ```

2. **Initialize and Deploy**
   ```bash
   netlify deploy --prod --dir=.next
   ```

### Option 2: Git-based Deployment

1. **Push to GitHub/GitLab**
   - Commit all changes to your repository
   - Push to main branch

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your repository
   - Netlify will auto-detect Next.js settings

## 🔧 Environment Variables

Make sure to add these environment variables in Netlify:

```
NEXT_PUBLIC_SUPABASE_URL=https://elwrezqhbphadrfwrtwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsd3JlenFoYnBoYWRyZndydHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyNzU5MjUsImV4cCI6MjA0Njg1MTkyNX0.oQPv9wlI_YUqjfOLKgpj6tr8hxBBi2wgSzlzYhTN7kQ
```

## 📋 Post-Deployment Tasks

1. **Verify deployment**: Check all pages load correctly
2. **Test database connection**: Use /test-database page
3. **Test mobile app sync**: Submit inspection from mobile app
4. **Configure custom domain** (optional)

## 🔗 Useful Links

- Netlify Dashboard: https://app.netlify.com
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js/
- Supabase Dashboard: https://supabase.com/dashboard

## 🎯 Expected Result

Your admin dashboard will be live at: `https://[site-name].netlify.app`

Login credentials:
- Email: admin@buscor.com  
- Password: admin123

## 🚨 Troubleshooting

If deployment fails:
1. Check build logs in Netlify dashboard
2. Ensure all environment variables are set
3. Verify Supabase connection
4. Check for any TypeScript errors

---
*Generated for Buscor Vehicle Inspection System*