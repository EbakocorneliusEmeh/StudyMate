// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: [
//       "babel-preset-expo",
//     ],
//     plugins: [
//       "nativewind/babel",
//     ],
//   };
// };

// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: ['babel-preset-expo'],
//     plugins: ['expo-router/babel'],
//   };
// };

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'], // only this
    plugins: [
      // remove "expo-router/babel"
      // you can keep other plugins here if needed
    ],
  };
};