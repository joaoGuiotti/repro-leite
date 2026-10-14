export const openDatabaseSync = jest.fn(() => ({
  execSync: jest.fn(),
  runSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  prepareSync: jest.fn(),
  closeSync: jest.fn(),
}));

export default {
  openDatabaseSync,
};
