// Watch the parent library source so edits to `../src` reload live. The library
// is installed via a `file:..` symlink and the parent has its own
// `react` / `react-native` dev deps. A symlinked package resolves `react` from
// the parent's node_modules by the natural module walk, producing a second copy
// of React and hook errors like "Cannot read property 'useSyncExternalStore' of
// null".
//
// `resolveRequest` hard-redirects every `react` / `react-native` import (incl.
// subpaths like `react/jsx-runtime`) to the example's node_modules regardless
// of which file requested it. Do NOT add `resolver.nodeModulesPaths` — on Expo
// SDK 57 it fights built-in workspace detection and can break Metro's
// transformer (500 / transformFile undefined).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [libraryRoot];

const exampleEntry = path.join(projectRoot, 'index.js');
const isReactPackage = (moduleName) =>
  moduleName === 'react' ||
  moduleName === 'react-native' ||
  moduleName.startsWith('react/') ||
  moduleName.startsWith('react-native/');

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (isReactPackage(moduleName)) {
    // Resolve as if imported from the example entry so React always comes from
    // the example's node_modules — never the symlinked parent's.
    return resolve(
      { ...context, originModulePath: exampleEntry },
      moduleName,
      platform
    );
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
