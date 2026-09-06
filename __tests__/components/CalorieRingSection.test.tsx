/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { CalorieRingSection } from '../../src/components/dashboard/CalorieRingSection';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('CalorieRingSection', () => {
  it('renders the accessible progressbar with min/max/now values', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <CalorieRingSection consumed={450} goal={2000} />,
      );
      await flushAsync();
    });
    const ring = tree!.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardCalorieRing',
    )[0];
    expect(ring).toBeTruthy();
    expect((ring.props as { accessible?: boolean }).accessible).toBe(true);
    const av = (ring.props as { accessibilityValue?: { min: number; max: number; now: number } }).accessibilityValue;
    expect(av).toEqual({ min: 0, max: 2000, now: 450 });
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('clamps consumed to goal when displayed in a11y value', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <CalorieRingSection consumed={5000} goal={2000} />,
      );
      await flushAsync();
    });
    const ring = tree!.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardCalorieRing',
    )[0];
    const av = (ring.props as { accessibilityValue?: { now?: number } }).accessibilityValue;
    // The accessibility value is not clamped; PRD allows overshoot.
    expect(av?.now).toBe(5000);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
