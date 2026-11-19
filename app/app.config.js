const base = require('./app.json').expo;
const isPreview = process.env.APP_ENV === 'preview';

// Connexion Google (décision P9) : le schéma d'URL iOS se déduit de l'ID client iOS
// « 1234-abc.apps.googleusercontent.com » → « com.googleusercontent.apps.1234-abc ».
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googlePlugin = googleIosClientId
  ? [[
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: `com.googleusercontent.apps.${googleIosClientId.replace('.apps.googleusercontent.com', '')}` },
    ]]
  : [];

module.exports = {
  expo: {
    ...base,
    ios: {
      ...base.ios,
      // Connexion Apple (décision P9)
      usesAppleSignIn: true,
    },
    android: {
      ...base.android,
      // preview: arm64 only → ~3x faster build. production: all ABIs for Play Store.
      ...(isPreview && { abiFilters: ['arm64-v8a'] }),
    },
    plugins: [...base.plugins, 'expo-apple-authentication', ...googlePlugin],
  },
};
