export const analyzeFoodImage = jest.fn(() =>
  Promise.resolve({
    imageUri: 'test',
    mealCategory: 'breakfast',
    items: [],
  }),
);

export const getMockAnalysis = jest.fn(() => ({
  imageUri: 'test',
  mealCategory: 'breakfast',
  items: [],
}));
