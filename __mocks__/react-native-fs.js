export default {
  DocumentDirectoryPath: '/mock/documents',
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('base64encodedstring')),
};
