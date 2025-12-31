# Script to convert .aab to universal .apk for testing
# This creates a universal APK that can be installed on any device

$aabPath = "android\app\build\outputs\bundle\release\app-release.aab"
$outputDir = "android\app\build\outputs\apk\release"
$keystorePath = "android.keystore"
$keystorePassword = "Farhan_90"
$keyAlias = "android"

# Check if bundletool exists
$bundletoolPath = "bundletool.jar"
if (-not (Test-Path $bundletoolPath)) {
    Write-Host "Downloading bundletool..." -ForegroundColor Yellow
    try {
        # Use TLS 1.2 for secure connection
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $bundletoolUrl = "https://github.com/google/bundletool/releases/download/1.17.2/bundletool-all-1.17.2.jar"
        
        # Download with progress
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $bundletoolUrl -OutFile $bundletoolPath -UseBasicParsing
        $ProgressPreference = 'Continue'
        
        Write-Host "Bundletool downloaded successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Failed to download bundletool. Please download it manually from:" -ForegroundColor Red
        Write-Host "https://github.com/google/bundletool/releases/download/1.17.2/bundletool-all-1.17.2.jar" -ForegroundColor Yellow
        Write-Host "Save it as 'bundletool.jar' in the project root directory." -ForegroundColor Yellow
        exit 1
    }
}

# Create output directory if it doesn't exist
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Convert .aab to .apks (APK set)
Write-Host "`nBuilding APK set from AAB..." -ForegroundColor Cyan
java -jar $bundletoolPath build-apks `
    --bundle=$aabPath `
    --output="$outputDir\app-release.apks" `
    --mode=universal `
    --ks=$keystorePath `
    --ks-pass=pass:$keystorePassword `
    --ks-key-alias=$keyAlias `
    --key-pass=pass:$keystorePassword

if ($LASTEXITCODE -eq 0) {
    Write-Host "Universal APK created successfully!" -ForegroundColor Green
    
    # Extract the universal APK from the .apks file
    Write-Host "`nExtracting universal APK..." -ForegroundColor Cyan
    Expand-Archive -Path "$outputDir\app-release.apks" -DestinationPath "$outputDir\extracted" -Force
    
    # Copy the universal APK to the output directory
    Copy-Item "$outputDir\extracted\universal.apk" "$outputDir\app-release-universal.apk" -Force
    
    # Clean up
    Remove-Item "$outputDir\extracted" -Recurse -Force
    Remove-Item "$outputDir\app-release.apks" -Force
    
    Write-Host "Universal APK created: $outputDir\app-release-universal.apk" -ForegroundColor Green
    Write-Host "`nYou can now install this APK on any device for testing!" -ForegroundColor Yellow
    Write-Host "Install command: adb install $outputDir\app-release-universal.apk" -ForegroundColor Cyan
} else {
    Write-Host "Failed to create APK set" -ForegroundColor Red
    exit 1
}
