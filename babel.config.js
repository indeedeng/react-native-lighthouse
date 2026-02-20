// Jest transforms both our TypeScript and RN's Flow-typed node_modules.
// @react-native/babel-preset handles TS, JSX, and Flow (so @react-native/js-polyfills parses).
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
