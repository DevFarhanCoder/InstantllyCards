// app.config.js - Expo config that reads from .env
module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      EXPO_PUBLIC_API_BASE: process.env.EXPO_PUBLIC_API_BASE || "https://instantlly-cards-backend-6ki0.onrender.com",
      API_BASE: process.env.EXPO_PUBLIC_API_BASE || process.env.API_BASE || "https://instantlly-cards-backend-6ki0.onrender.com",
      EXPO_PUBLIC_API_PREFIX: process.env.EXPO_PUBLIC_API_PREFIX || "/api",
      router: {},
      eas: {
        projectId: "2d7524da-4330-496c-816f-4e011831e6f4"
      }
    }
  };
};
