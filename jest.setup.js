// The suite only needs the public react-native entry. Loading the real package
// follows react-native/Libraries paths that move between releases, and React
// Native 0.88 throws when its removed InteractionManager export is read.
jest.mock('react-native', () => {
  const React = require('react');
  const hostComponents = new Map();

  function createHostComponent(name) {
    function Host(props) {
      return React.createElement(name, props, props.children);
    }
    Host.displayName = name;
    return Host;
  }

  return new Proxy(
    {
      PanResponder: {
        create: jest.fn((config) => ({
          panHandlers: {
            onStartShouldSetResponder: config.onStartShouldSetPanResponder,
            onMoveShouldSetResponder: config.onMoveShouldSetPanResponder,
          },
        })),
      },
    },
    {
      get(target, prop) {
        if (prop === '__esModule') {
          return true;
        }
        if (Object.prototype.hasOwnProperty.call(target, prop)) {
          return target[prop];
        }
        if (typeof prop !== 'string') {
          return undefined;
        }
        if (!hostComponents.has(prop)) {
          hostComponents.set(prop, createHostComponent(prop));
        }
        return hostComponents.get(prop);
      },
    }
  );
});

// Silence console logs during tests unless debugging.
// React 19 prints this from react-test-renderer, which the testing library still uses.
const reactTestRendererDeprecation = 'react-test-renderer is deprecated';
if (process.env.DEBUG !== 'true') {
  const originalError = console.error;
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args) => {
      if (typeof args[0] === 'string' && args[0].includes(reactTestRendererDeprecation)) {
        return;
      }
      originalError(...args);
    },
  };
}
