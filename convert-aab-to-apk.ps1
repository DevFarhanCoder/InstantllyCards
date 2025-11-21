# Download AAB and convert to APK for testing
$aabUrl = "https://expo.dev/artifacts/eas/xodyeRrujDFNcMWRY24wXh.aab"
$testDir = "C:\Users\user3\Documents\App\InstantllyCards\test-apk"

# Create test directory
if (-not (Test-Path $testDir)) {
    New-Item -ItemType Directory -Path $testDir | Out-Null
}

$aabFile = Join-Path $testDir "app.aab"
$apkFile = Join-Path $testDir "app.apk"

Write-Host "📥 Downloading AAB from EAS..." -ForegroundColor Green
Invoke-WebRequest -Uri $aabUrl -OutFile $aabFile -UseBasicParsing

Write-Host "✅ AAB downloaded to: $aabFile" -ForegroundColor Green
Write-Host ""
Write-Host "📋 To convert AAB to APK, you need bundletool:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Download bundletool:" -ForegroundColor Cyan
Write-Host "   curl -L https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar -o bundletool.jar" -ForegroundColor White
Write-Host ""
Write-Host "2. Run:" -ForegroundColor Cyan
Write-Host "   java -jar bundletool.jar build-apks --bundle=$aabFile --output=$apkFile --mode=universal" -ForegroundColor White
Write-Host ""
Write-Host "3. Then install with adb:" -ForegroundColor Cyan
Write-Host "   adb install $apkFile" -ForegroundColor White
