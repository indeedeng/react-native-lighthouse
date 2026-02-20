// Jest setup file for react-native-lighthouse

// Stub native modules so React Native can load in Node (no native binary).
// Turbo modules must expose getConstants(); DeviceInfo/Dimensions expect window/screen metrics.
const stubNativeModule = () => ({
  getConstants: jest.fn(() => ({
    Dimensions: {
      window: { width: 375, height: 812, scale: 2, fontScale: 1 },
      screen: { width: 375, height: 812, scale: 2, fontScale: 1 },
    },
  })),
});
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn(stubNativeModule),
  get: jest.fn(() => null),
}));

// NativeEventEmitter requires a non-null native module on iOS; stub it for Node.
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class NativeEventEmitter {
    constructor() {}
    addListener() {
      return { remove: jest.fn() };
    }
    removeAllListeners() {}
  };
});

// Mock react-native: use a Proxy so deprecated PropTypes are never read from RN (their getters log).
// We serve those from deprecated-react-native-prop-types and PanResponder from our mock.
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const DeprecatedPropTypes = require('deprecated-react-native-prop-types');
  const panResponderMock = {
    create: jest.fn((config) => ({
      panHandlers: {
        onStartShouldSetResponder: config.onStartShouldSetPanResponder,
        onMoveShouldSetResponder: config.onMoveShouldSetPanResponder,
      },
    })),
  };
  const overrides = {
    ColorPropType: DeprecatedPropTypes.ColorPropType,
    EdgeInsetsPropType: DeprecatedPropTypes.EdgeInsetsPropType,
    PointPropType: DeprecatedPropTypes.PointPropType,
    ViewPropTypes: DeprecatedPropTypes.ViewPropTypes,
    PanResponder: panResponderMock,
  };
  return new Proxy(RN, {
    get(target, prop) {
      if (Object.prototype.hasOwnProperty.call(overrides, prop)) {
        return overrides[prop];
      }
      return target[prop];
    },
  });
});

// Silence console logs during tests unless debugging
if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
