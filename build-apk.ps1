# Buscor Inspection App - APK Build Script
# Run this script from PowerShell

Write-Host "Building Buscor Inspection App APK..." -ForegroundColor Green

# Navigate to mobile app directory
Set-Location "C:\Users\User\OneDrive\Desktop\inspection-app\mobile-expo"

# Install dependencies if needed
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Login to Expo (you'll need to create an account if you don't have one)
Write-Host "Please login to Expo account:" -ForegroundColor Yellow
npx expo login

# Build the APK
Write-Host "Building APK for production..." -ForegroundColor Yellow
npx eas build --platform android --profile preview

Write-Host "APK build initiated! You can download it from your Expo dashboard." -ForegroundColor Green
Write-Host "Visit: https://expo.dev/accounts/[your-username]/projects/buscor-inspection-app/builds" -ForegroundColor Cyan