// Jest compiles this package only. React Native itself is mocked, so the
// suite does not parse Flow sources under react-native/Libraries.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'classic' }],
    '@babel/preset-typescript',
  ],
};
