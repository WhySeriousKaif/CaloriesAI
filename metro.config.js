const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// NativeWind v4 compiles `input` with the Tailwind CLI and injects the result
// into the bundle, so the CSS entry has to be named here as well as imported.
module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './src/global.css' });
