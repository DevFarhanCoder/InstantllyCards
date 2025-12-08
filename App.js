// Metro sometimes resolves a plain `App` import to a .js file first.
// Provide a tiny JS shim that delegates to expo-router's entry so Expo can find `App`.
import 'expo-router/entry';

// No default export required — expo-router registers the application root.
