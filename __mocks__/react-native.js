const AppState = {
  currentState: 'active',
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
};

const Platform = {
  OS: 'ios',
  select: jest.fn((dict) => dict.ios || dict.default),
};

module.exports = {
  AppState,
  Platform,
  NativeModules: {},
};
