const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

// `withNativewind` defaults to globalClassNamePolyfill: true, which is what lets
// `className` work on plain react-native primitives, and generates
// nativewind-env.d.ts for the className prop types.
module.exports = withNativewind(getDefaultConfig(__dirname));
