const base = require('./app.json').expo;
const isPreview = process.env.APP_ENV === 'preview';

module.exports = {
  expo: {
    ...base,
    android: {
      ...base.android,
      // preview: arm64 only → ~3x faster build. production: all ABIs for Play Store.
      ...(isPreview && { abiFilters: ['arm64-v8a'] }),
    },
  },
};
