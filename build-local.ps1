# Quick Build Script - Workaround for Windows Path Length
# This copies your project to C:\IC (short path) and builds there

Write-Host "Starting Local Build Process..." -ForegroundColor Green

# 1. Create short path directory
$shortPath = "C:\IC"
if (Test-Path $shortPath) {
    Write-Host "Cleaning existing build directory..." -ForegroundColor Yellow
    Remove-Item $shortPath -Recurse -Force
}

Write-Host "Copying project to $shortPath..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $shortPath -Force | Out-Null

# 2. Copy essential files (excluding large folders)
$sourcePath = $PSScriptRoot
robocopy "$sourcePath" "$shortPath" /E /XD node_modules .git android\.cxx android\.gradle android\build .expo dist /NFL /NDL /NJH /NJS | Out-Null

# 3. Copy node_modules
Write-Host "Copying node_modules (this may take 2-3 minutes)..." -ForegroundColor Cyan
robocopy "$sourcePath\node_modules" "$shortPath\node_modules" /E /NFL /NDL /NJH /NJS | Out-Null

# 4. Copy android folder
Write-Host "Copying Android native code..." -ForegroundColor Cyan
robocopy "$sourcePath\android" "$shortPath\android" /E /XD .cxx .gradle build /NFL /NDL /NJH /NJS | Out-Null

# 5. Copy keystore
Copy-Item "$sourcePath\android.keystore" "$shortPath\android.keystore" -Force

# 6. Run build
Write-Host "Starting Gradle build..." -ForegroundColor Green
cd "$shortPath\android"
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
.\gradlew.bat bundleRelease

# 7. Copy .aab back
if (Test-Path "$shortPath\android\app\build\outputs\bundle\release\app-release.aab") {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmm"
    $outputFile = "$sourcePath\app-release-v1.0.41-$timestamp.aab"
    Copy-Item "$shortPath\android\app\build\outputs\bundle\release\app-release.aab" $outputFile -Force
    Write-Host "Build successful! AAB file saved to:" -ForegroundColor Green
    Write-Host "   $outputFile" -ForegroundColor White
} else {
    Write-Host "Build failed! Check errors above." -ForegroundColor Red
}

cd $sourcePath
