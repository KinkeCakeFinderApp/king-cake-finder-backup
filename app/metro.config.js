// Metro configuration for Expo.
//
// The one non-default line disables Metro's "package exports" resolution. The
// Firebase JS SDK (v10/v11) ships an `exports` map that, under Expo SDK 53+,
// makes Metro pick Firebase's browser build in React Native — which throws
// "Component auth has not been registered yet" at runtime. Falling back to
// classic resolution makes `firebase/auth` resolve to the correct build.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
