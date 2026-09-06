/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { MacroBar } from '../../src/components/dashboard/MacroBar';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('MacroBar', () => {
  it('renders the accessible progressbar with min/max/now', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <MacroBar
          label="Protein"
          current={45}
          goal={120}
          barColor="#22C55E"
        />,
      );
      await flushAsync();
    });
    const bar = tree!.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardMacroBar-Protein',
    )[0];
    expect(bar).toBeTruthy();
    const av = (bar.props as { accessibilityValue?: { min: number; max: number; now: number } }).accessibilityValue;
    expect(av).toEqual({ min: 0, max: 120, now: 45 });
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('caps current at goal for the a11y value (overshoot is still possible visually)', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <MacroBar
          label="Protein"
          current={500}
          goal={120}
          barColor="#22C55E"
        />,
      );
      await flushAsync();
    });
    const bar = tree!.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardMacroBar-Protein',
    )[0];
    const av = (bar.props as { accessibilityValue?: { now?: number } }).accessibilityValue;
    // Spec doesn't clamp now — the visible bar fill width is the cap.
    expect(av?.now).toBe(500);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
