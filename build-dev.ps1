# Build Development APK with Native Modules
Write-Host "Building Development APK..." -ForegroundColor Green

# Use system Java (already configured)
$javaVersion = java -version 2>&1 | Select-Object -First 1
Write-Host "Using Java: $javaVersion" -ForegroundColor Cyan

# Navigate to android directory
cd android

# Clean and build debug APK
Write-Host "Running Gradle assembleDebug..." -ForegroundColor Cyan
.\gradlew.bat clean assembleDebug

# Copy APK to root
if (Test-Path "app\build\outputs\apk\debug\app-debug.apk") {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $outputFile = "..\app-debug-$timestamp.apk"
    Copy-Item "app\build\outputs\apk\debug\app-debug.apk" $outputFile -Force
    Write-Host "`nSuccess! APK saved to:" -ForegroundColor Green
    Write-Host "   $outputFile" -ForegroundColor White
    Write-Host "`nInstall it on your device with:" -ForegroundColor Yellow
    Write-Host "   adb install $outputFile" -ForegroundColor White
} else {
    Write-Host "`nBuild failed!" -ForegroundColor Red
}

cd ..
