module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 routes `className` through its own JSX runtime, so
    // babel-preset-expo needs `jsxImportSource` alongside nativewind/babel.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
