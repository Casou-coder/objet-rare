const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force Babel to transpile packages that use modern syntax (ES2022+)
// incompatible with Hermes without transformation
config.transformer.getTransformOptions = async () => ({
  transform: { experimentalImportSupport: false, inlineRequires: true },
});
const defaultIgnore = config.transformer.transformIgnorePatterns?.[0]
  ?? 'node_modules/(?!(react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?|@expo-google-fonts|react-navigation|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg)/)';
config.transformer.transformIgnorePatterns = [
  defaultIgnore.replace(
    'node_modules/(?!(',
    'node_modules/(?!(@supabase|node-forge|i18next|react-i18next|',
  ),
];

// Modules Node.js non disponibles dans React Native
// { type: 'empty' } = Metro retourne un module vide sans erreur
const NODE_BUILTINS = new Set([
  'stream', 'crypto', 'http', 'https', 'net', 'tls', 'zlib',
  'fs', 'os', 'path', 'util', 'assert', 'child_process', 'cluster',
  'dns', 'domain', 'readline', 'repl', 'string_decoder', 'timers',
  'tty', 'v8', 'vm', 'worker_threads', 'perf_hooks', 'async_hooks',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub les modules Node.js built-in
  if (NODE_BUILTINS.has(moduleName)) {
    return { type: 'empty' };
  }
  // ws → shim utilisant la WebSocket native de React Native
  if (moduleName === 'ws') {
    return {
      filePath: path.resolve(__dirname, 'shims/ws.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
