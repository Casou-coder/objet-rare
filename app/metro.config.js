const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Packages that use ESM dynamic import(variable) or ES2022+ syntax
// incompatible with Hermes — force Babel transformation on them.
// @supabase uses import(OTEL_PKG) for optional OpenTelemetry support.
config.transformer.transformIgnorePatterns = [
  /node_modules\/(?!(@supabase|node-forge|i18next|react-i18next|react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?\/|@expo-google-fonts\/|react-navigation|@react-navigation\/|@unimodules\/|unimodules|sentry-expo|native-base|react-native-svg)\/)/,
];

// Modules Node.js non disponibles dans React Native
const NODE_BUILTINS = new Set([
  'stream', 'crypto', 'http', 'https', 'net', 'tls', 'zlib',
  'fs', 'os', 'path', 'util', 'assert', 'child_process', 'cluster',
  'dns', 'domain', 'readline', 'repl', 'string_decoder', 'timers',
  'tty', 'v8', 'vm', 'worker_threads', 'perf_hooks', 'async_hooks',
]);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NODE_BUILTINS.has(moduleName)) {
    return { type: 'empty' };
  }
  if (moduleName === 'ws') {
    return { filePath: path.resolve(__dirname, 'shims/ws.js'), type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
