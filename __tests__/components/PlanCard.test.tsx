import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { PlanCard } from '../../src/components/paywall/PlanCard';
import type { PlanDef } from '../../src/config/plans';

const mockPlan: PlanDef = {
  tier: 'pro',
  displayName: 'Pro',
  tagline: 'Ciddi sağlık takibi için',
  monthlyCents: 499,
  yearlyCents: 4990,
  dailyAiQuota: 100,
  features: [],
};

const mockPopular: PlanDef = {
  ...mockPlan,
  tier: 'pro_plus',
  displayName: 'Pro+',
  tagline: 'Profesyoneller için',
  monthlyCents: 999,
  yearlyCents: 9990,
  dailyAiQuota: -1,
  features: [],
  isPopular: true,
};

const flushAsync = () => new Promise<void>(resolve => setImmediate(resolve));

describe('PlanCard', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('mounts and renders plan name + tagline + price', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <PlanCard
          plan={mockPlan}
          isSelected={false}
          onSelect={() => {}}
          formatPrice={cents => `₺${(cents / 100).toFixed(2)}`}
          formatPerMonth={cents => `₺${((cents / 100) / 12).toFixed(2)}/ay`}
        />,
      );
      await flushAsync();
    });
    expect(tree!.root.findAllByProps({ children: 'Pro' }).length).toBeGreaterThan(0);
    expect(tree!.root.findAllByProps({ children: 'Ciddi sağlık takibi için' }).length).toBeGreaterThan(0);
    expect(tree!.root.findAllByProps({ children: '₺4.99' }).length).toBeGreaterThan(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('shows the EN POPÜLER badge when isPopular is true', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <PlanCard
          plan={mockPopular}
          isSelected={false}
          onSelect={() => {}}
          formatPrice={c => String(c)}
          formatPerMonth={c => String(c)}
        />,
      );
      await flushAsync();
    });
    expect(tree!.root.findAllByProps({ children: 'EN POPÜLER' }).length).toBeGreaterThan(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('hides the popular badge when isPopular is false', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <PlanCard
          plan={mockPlan}
          isSelected={false}
          onSelect={() => {}}
          formatPrice={c => String(c)}
          formatPerMonth={c => String(c)}
        />,
      );
      await flushAsync();
    });
    expect(tree!.root.findAllByProps({ children: 'EN POPÜLER' }).length).toBe(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('invokes formatPerMonth with the yearlyCents value', async () => {
    const formatPerMonth = jest.fn(c => `₺${(c / 100).toFixed(2)}/ay`);
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <PlanCard
          plan={mockPlan}
          isSelected={false}
          onSelect={() => {}}
          formatPrice={c => String(c)}
          formatPerMonth={formatPerMonth}
        />,
      );
      await flushAsync();
    });
    expect(formatPerMonth).toHaveBeenCalledWith(4990);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
