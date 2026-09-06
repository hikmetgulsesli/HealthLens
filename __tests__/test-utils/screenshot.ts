import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface ScreenshotFingerprint {
  width: number;
  height: number;
  meanBrightness: number;
  /** Approximate non-dark-area pixel ratio (0..1). */
  contentRatio: number;
}

function runSips(filename: string): ScreenshotFingerprint {
  const fixture = path.join(__dirname, '..', 'screenshots', filename);
  if (!fs.existsSync(fixture)) {
    throw new Error(`Missing screenshot fixture: ${fixture}`);
  }
  // sips -g pixelWidth -g pixelHeight -g formatOptions
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', fixture], {
    encoding: 'utf8',
  });
  const wMatch = /pixelWidth:\s*(\d+)/.exec(out);
  const hMatch = /pixelHeight:\s*(\d+)/.exec(out);
  const width = wMatch ? Number(wMatch[1]) : 0;
  const height = hMatch ? Number(hMatch[1]) : 0;

  // Capture a 64x64 thumbnail in greyscale and measure mean.
  // sips does not compute "brightness", but for a coarse sanity check we
  // convert to greyscale PNG, run stat for size, and use pixel sample.
  const grayThumb = path.join('/tmp', `gray-${filename}`);
  execFileSync('sips', [
    '-s',
    'format',
    'jpeg',
    '--resampleHeightWidthMax',
    '64',
    fixture,
    '--out',
    grayThumb,
  ]);
  // Approximate brightness via JPEG byte length: dark images compress to
  // smaller files, bright/irregular content compresses to larger files.
  // This is a coarse proxy — not a real brightness measurement.
  const bytes = fs.statSync(grayThumb).size;
  const expectedMaxBytes = (width * height) / 50; // ~2% compression heuristic
  const contentRatio = Math.min(1, bytes / expectedMaxBytes);

  return {
    width,
    height,
    meanBrightness: bytes / (64 * 64),
    contentRatio,
  };
}

export interface FingerprintExpectations {
  /**
   * Inclusive lower bound for non-dark area, used as a coarse proxy for
   * "is content actually rendered on this screen?". The app's dark theme
   * relies on teal accents so the screen should never be visually empty.
   */
  minContentRatio?: number;
  minWidth?: number;
  minHeight?: number;
}

export function expectHealthyScreenshot(
  filename: string,
  expectations: FingerprintExpectations = {},
): void {
  const fp = runSips(filename);
  expect(fp.width).toBeGreaterThanOrEqual(expectations.minWidth ?? 1170);
  expect(fp.height).toBeGreaterThanOrEqual(expectations.minHeight ?? 2532);
  if (expectations.minContentRatio !== undefined) {
    expect(fp.contentRatio).toBeGreaterThanOrEqual(
      expectations.minContentRatio,
    );
  }
}
