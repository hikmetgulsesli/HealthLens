// Default mock: both functions are bare jest.fn() with no default
// implementation. Tests must stub behavior with mockResolvedValue* /
// mockRejectedValue*. This guarantees that "missing" stubs surface
// clearly (undefined returns) instead of silently succeeding.
export const analyzeFoodImage = jest.fn();
export const analyzeTextMeal = jest.fn();
export const getMockAnalysis = jest.fn();
