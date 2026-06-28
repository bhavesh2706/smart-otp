// Watch the parent library source so edits to `../src` reload live. The library
// is installed via a `file:..` symlink and the parent has its own
// `react` / `react-native` dev deps. A symlinked package resolves `react` from
// the parent's node_modules by the natural module walk, producing a second copy
// of React and the dreaded "Cannot read property 'useState' of null".
//
// `resolveRequest` hard-redirects every `react` / `react-native` request to the
// example's copy regardless of which file imports it, guaranteeing a single
// React instance. `nodeModulesPaths` lets the library resolve its other
// dependencies (e.g. @babel/runtime) from the example.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

const exampleEntry = path.join(projectRoot, 'index.js');
const isReactPackage = (name) =>
  name === 'react' ||
  name === 'react-native' ||
  name.startsWith('react/') ||
  name.startsWith('react-native/');

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;
  if (isReactPackage(moduleName)) {
    // Resolve as if imported from the example's own entry file, so React always
    // comes from the example's node_modules — never the symlinked parent's.
    return resolve(
      { ...context, originModulePath: exampleEntry },
      moduleName,
      platform
    );
  }
  return resolve(context, moduleName, platform);
};

module.exports = config;
