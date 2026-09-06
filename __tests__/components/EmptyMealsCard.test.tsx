/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { EmptyMealsCard } from '../../src/components/dashboard/EmptyMealsCard';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('EmptyMealsCard', () => {
  it('renders empty plate illustration + first-capture CTA', async () => {
    const onPress = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <EmptyMealsCard
          emptyText="Henüz öğün yok"
          ctaText="İlk öğünü fotoğraflayın"
          onPressCta={onPress}
        />,
      );
      await flushAsync();
    });
    expect(
      tree!.root.findAll(
        n => (n.props as { testID?: string })?.testID === 'dashboardEmptyPlate',
      ).length,
    ).toBeGreaterThan(0);
    const cta = tree!.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardFirstCaptureCta',
    )[0];
    expect(cta).toBeTruthy();
    act(() => {
      (cta.props as { onPress?: () => void }).onPress?.();
    });
    expect(onPress).toHaveBeenCalled();
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
