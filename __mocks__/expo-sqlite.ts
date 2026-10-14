const mockStatement = {
  executeSync: jest.fn(() => ({
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => null),
  })),
  executeForRawResultSync: jest.fn(() => ({
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => null),
  })),
  finalizeSync: jest.fn(),
};

export const openDatabaseSync = jest.fn(() => ({
  execSync: jest.fn(),
  runSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  prepareSync: jest.fn(() => mockStatement),
  closeSync: jest.fn(),
}));

export default {
  openDatabaseSync,
};
