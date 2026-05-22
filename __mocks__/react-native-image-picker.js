export default {
  launchImageLibrary: jest.fn(() => Promise.resolve({ didCancel: true })),
  launchCamera: jest.fn(() => Promise.resolve({ didCancel: true })),
};
