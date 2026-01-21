// Jest setup file for react-native-lighthouse

// Mock react-native's PanResponder
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    PanResponder: {
      create: jest.fn((config) => ({
        panHandlers: {
          onStartShouldSetResponder: config.onStartShouldSetPanResponder,
          onMoveShouldSetResponder: config.onMoveShouldSetPanResponder,
        },
      })),
    },
  };
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
