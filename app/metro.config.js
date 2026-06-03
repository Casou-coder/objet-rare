const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force CJS over ESM in package exports resolution.
// @supabase ESM uses import(variable) which Hermes rejects;
// the CJS version already uses Promise.resolve() — fully compatible.
config.resolver.unstable_conditionNames = [
  'require',
  'default',
  'react-native',
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
