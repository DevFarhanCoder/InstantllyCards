@echo off
echo ========================================
echo Rebuilding Android App with Native Modules
echo ========================================
echo.
echo This will rebuild the app to include react-native-view-shot
echo for card image sharing feature.
echo.
echo Estimated time: 5-10 minutes
echo.
pause

echo.
echo [1/3] Cleaning Android build...
cd android
call gradlew clean
cd ..

echo.
echo [2/3] Prebuild with Expo...
call npx expo prebuild --clean

echo.
echo [3/3] Building and installing app...
call npx expo run:android

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo The app should now support card image sharing.
echo Test by going to MyCards > 3 dots > Share Card > Share Card Image
echo.
pause
