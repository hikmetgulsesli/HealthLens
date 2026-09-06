import { expectHealthyScreenshot } from '../test-utils/screenshot';

describe('Camera screen — visual snapshot', () => {
  it('camera-clean.png is dark with foreground content', async () => {
    await expectHealthyScreenshot('02-camera-clean.png', {
      minContentRatio: 0.01,
    });
  });
});
