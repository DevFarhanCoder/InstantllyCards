const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom metro config here
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;