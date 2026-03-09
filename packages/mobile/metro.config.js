const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const path = require('path');
const fs = require('fs');

const baseConfig = getDefaultConfig(__dirname);

// Enable package.json `exports` field support so native Metro resolver
// (used inside Univand's nativeResolver) can find packages like @babel/runtime
// that use `exports` only (no `main` field)
baseConfig.resolver.unstable_enablePackageExports = true;

// Apply Uniwind for CSS/className support
const config = withUniwindConfig(baseConfig, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});

// Capture Uniwind's resolver BEFORE we override it
const univandResolveRequest = config.resolver.resolveRequest;

// Node.js built-ins unavailable in React Native
const NODE_BUILTINS = new Set([
  'crypto', 'http', 'https', 'url', 'stream', 'net', 'tls',
  'zlib', 'os', 'fs', 'events', 'assert', 'util',
  'querystring', 'string_decoder', 'child_process', 'worker_threads',
  'proxy-from-env', 'follow-redirects', 'form-data',
]);

const PROJECT_ROOT = __dirname;

// Source extensions to probe when resolving entry point
const SOURCE_EXTS = ['', '.js', '.ts', '.tsx', '.jsx', '.mjs'];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 1. Shim Node.js built-ins (needed by axios's Node build)
  if (NODE_BUILTINS.has(moduleName)) {
    return { type: 'empty' };
  }

  // 2. Handle entry point resolution directly to break Univand's resolver loop
  //    Metro calls with originModulePath = '<projectRoot>/.' when resolving the bundle entry
  const isEntryResolution = (
    context.originModulePath === `${PROJECT_ROOT}/.` ||
    context.originModulePath === `${PROJECT_ROOT}/`
  );
  if (isEntryResolution && moduleName.startsWith('./')) {
    const relative = moduleName.slice(2); // strip './'
    for (const ext of SOURCE_EXTS) {
      const full = path.join(PROJECT_ROOT, relative + ext);
      if (fs.existsSync(full)) {
        return { type: 'sourceFile', filePath: full };
      }
    }
  }

  // 3. Delegate everything else to Univand's resolver
  return univandResolveRequest(context, moduleName, platform);
};

module.exports = config;
