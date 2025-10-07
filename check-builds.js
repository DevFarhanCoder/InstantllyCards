// Quick script to find the actual latest build
const { execSync } = require('child_process');

console.log('🔍 Checking actual builds on Expo...\n');

try {
  // Try to get build list
  const output = execSync('eas build:list --platform android --limit 5 --non-interactive', {
    encoding: 'utf-8',
    cwd: __dirname
  });
  
  console.log(output);
} catch (error) {
  console.error('Error checking builds:', error.message);
  console.log('\n📱 Alternative: Check builds at:');
  console.log('https://expo.dev/accounts/devfarhancoder/projects/instantllycards/builds');
}
