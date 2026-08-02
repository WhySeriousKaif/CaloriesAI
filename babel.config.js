module.exports = function (api) {
  api.cache(true);
  return {
    // nativewind/babel is the v5 import-rewrite preset — unlike v4 it does not
    // need `jsxImportSource` on babel-preset-expo.
    presets: ['babel-preset-expo', 'nativewind/babel'],
  };
};
