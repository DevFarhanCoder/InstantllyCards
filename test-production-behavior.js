// Test Production Behavior in Development Mode
// This simulates production conditions without building an APK

const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Production Behavior Setup\n");

// 1. Temporarily modify app/index.tsx to force production behavior
const indexPath = path.join(__dirname, "app", "index.tsx");
let indexContent = fs.readFileSync(indexPath, "utf8");

// Store original
const backupPath = path.join(__dirname, "app", "index.tsx.backup");
fs.writeFileSync(backupPath, indexContent);

// Add production simulation at the top of the component
const simulationCode = `
// 🧪 PRODUCTION TEST MODE - Simulating production behavior
const __PRODUCTION_TEST__ = true;
if (__PRODUCTION_TEST__) {
  console.log = () => {}; // Disable console.logs like in production
  console.warn = () => {};
  console.error = () => {};
}
`;

// Insert after imports
indexContent = indexContent.replace(
  "export default function Index() {",
  simulationCode + "\nexport default function Index() {",
);

fs.writeFileSync(indexPath, indexContent);

console.log("✅ Modified app/index.tsx to simulate production");
console.log("   - Console.logs disabled");
console.log("   - Testing navigation timeout behavior\n");

console.log("📱 Now run: npx expo start");
console.log('   Press "a" to test on Android\n');

console.log("⚠️  When done testing, restore original:");
console.log("   node restore-original.js\n");

// Create restore script
const restoreScript = `
const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'app', 'index.tsx.backup');
const indexPath = path.join(__dirname, 'app', 'index.tsx');

if (fs.existsSync(backupPath)) {
  const backup = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(indexPath, backup);
  fs.unlinkSync(backupPath);
  console.log('✅ Restored original app/index.tsx');
} else {
  console.log('❌ No backup found');
}
`;

fs.writeFileSync(path.join(__dirname, "restore-original.js"), restoreScript);
console.log("✅ Created restore-original.js for cleanup");
