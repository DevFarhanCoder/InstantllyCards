# SMS Retriever - Rebuild App
# Run this script after Android configuration changes

Write-Host "📱 SMS Retriever Setup - Rebuilding App" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$projectRoot = "C:\Users\hp\OneDrive\Desktop\instantlycards\InstantllyCards"
Set-Location $projectRoot

Write-Host "📁 Current directory: $projectRoot" -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean Android build
Write-Host "🧹 Step 1: Cleaning Android build..." -ForegroundColor Green
Set-Location "$projectRoot\android"
& .\gradlew.bat clean
Set-Location $projectRoot
Write-Host "✅ Clean complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Clear Metro cache
Write-Host "🗑️  Step 2: Clearing Metro cache..." -ForegroundColor Green
& npx expo start --clear
Write-Host ""

# Step 3: Rebuild app
Write-Host "🔨 Step 3: Rebuilding app for Android..." -ForegroundColor Green
Write-Host "⏳ This may take 5-10 minutes..." -ForegroundColor Yellow
Write-Host ""
& npx expo run:android

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Build Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check console for: [SMS Retriever] App Hash: <YOUR_HASH>" -ForegroundColor White
Write-Host "2. Test signup with phone: 9892254636" -ForegroundColor White
Write-Host "3. Wait for SMS and check auto-fill" -ForegroundColor White
Write-Host ""
Write-Host "🐛 If hash is still empty, check:" -ForegroundColor Yellow
Write-Host "   - Google Play Services installed on device" -ForegroundColor White
Write-Host "   - Running on real device (not emulator without Play Services)" -ForegroundColor White
Write-Host ""
