# GitHub Repository Setup Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com and log in to your account
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `buscor-vehicle-inspection-system`
   - **Description**: `Complete vehicle inspection management system with mobile app and admin dashboard`
   - **Visibility**: Choose Public or Private as needed
   - **DON'T** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these in your PowerShell:

```powershell
# Add the remote repository (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/buscor-vehicle-inspection-system.git

# Push the code to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Netlify from GitHub

1. Go to https://netlify.com and log in
2. Click "New site from Git"
3. Choose "GitHub" as your Git provider
4. Select the `buscor-vehicle-inspection-system` repository
5. Configure build settings:
   - **Base directory**: `admin-dashboard`
   - **Build command**: `npm run build`
   - **Publish directory**: `admin-dashboard/.next`
6. Click "Deploy site"

## Step 4: Configure Environment Variables on Netlify

1. In your Netlify site dashboard, go to "Site settings"
2. Click "Environment variables"
3. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Any other environment variables from your `.env.local`

## Step 5: Update Mobile App with Live Dashboard URL

Once Netlify gives you a live URL (e.g., https://amazing-name-123456.netlify.app), you can update any dashboard links in the mobile app.

## 🎉 That's it!

Your admin dashboard will be live and accessible from anywhere. The mobile app will continue to work with the live dashboard for real-time data sync.

## Repository Structure on GitHub

```
buscor-vehicle-inspection-system/
├── admin-dashboard/     # Next.js admin dashboard (deployed to Netlify)
├── mobile-expo/        # React Native mobile app
├── backend/           # Node.js API server
├── android/          # Android build files
├── shared/           # Shared utilities
└── README.md         # Project documentation
```