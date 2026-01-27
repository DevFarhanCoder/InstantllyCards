#!/usr/bin/env pwsh
# Quick Build and Test Script for Production Fix

Write-Host "🔧 InstantllyCards Production Build Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project directory
$projectDir = "C:\Users\RIZWAN\Documents\App (1)\App\InstantllyCards"
Set-Location $projectDir

Write-Host "📍 Current directory: $projectDir" -ForegroundColor Yellow
Write-Host ""

# Function to ask user
function Ask-Continue {
    param([string]$message)
    Write-Host $message -ForegroundColor Green
    $response = Read-Host "Continue? (Y/N)"
    if ($response -ne 'Y' -and $response -ne 'y') {
        Write-Host "❌ Cancelled by user" -ForegroundColor Red
        exit
    }
}

# Step 1: Clean build
Write-Host "🧹 Step 1: Clean previous builds" -ForegroundColor Cyan
Ask-Continue "This will remove android/app/build and .expo folders"
if (Test-Path "android/app/build") { Remove-Item -Recurse -Force "android/app/build" }
if (Test-Path ".expo") { Remove-Item -Recurse -Force ".expo" }
Write-Host "✅ Cleaned!" -ForegroundColor Green
Write-Host ""

# Step 2: Test local development
Write-Host "🧪 Step 2: Test in Development Mode" -ForegroundColor Cyan
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop after testing" -ForegroundColor Yellow
Ask-Continue "Ready to start development server?"
npx expo start --clear

# Step 3: Build APK (commented - user can uncomment when ready)
<#
Write-Host ""
Write-Host "🏗️ Step 3: Build Production APK" -ForegroundColor Cyan
Ask-Continue "Build APK? This will take 10-15 minutes"

Write-Host "Building with EAS..." -ForegroundColor Yellow
eas build --platform android --profile preview --local

Write-Host ""
Write-Host "✅ Build Complete!" -ForegroundColor Green
Write-Host "📦 APK location will be shown above" -ForegroundColor Yellow
#>

Write-Host ""
Write-Host "🎉 Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If dev mode works, uncomment the build section in this script" -ForegroundColor White
Write-Host "2. Run the script again to build production APK" -ForegroundColor White
Write-Host "3. Test APK on real device (not emulator)" -ForegroundColor White
Write-Host ""
