const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

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
