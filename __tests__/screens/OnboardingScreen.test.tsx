import React from 'react';
import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { OnboardingScreen } from '../../src/screens/OnboardingScreen';
import { resetAllStores } from '../test-utils/resetStores';
import { useUserStore } from '../../src/stores/userStore';

jest.mock('../../src/services/aiService', () => ({
  analyzeFoodImage: jest.fn(),
  analyzeTextMeal: jest.fn(),
}));

const flushAsync = () =>
  new Promise<void>(resolve => setImmediate(resolve));

interface ReactProps {
  testID?: string;
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  children?: unknown;
}

function findAllByTestID(root: TestRenderer.ReactTestInstance, id: string) {
  return root.findAll(node => {
    return (node.props as ReactProps)?.testID === id;
  });
}

function findAllByText(root: TestRenderer.ReactTestInstance, text: string) {
  return root.findAll(node => {
    const c = (node.props as ReactProps)?.children;
    return c === text || (Array.isArray(c) && c.includes(text as never));
  });
}

describe('OnboardingScreen — step 1', () => {
  let alertSpy: jest.SpyInstance;
  beforeEach(() => {
    resetAllStores();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders all four health-goal cards with stable testIDs', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(<OnboardingScreen />);
      await flushAsync();
    });
    for (const id of [
      'onboardingGoal-hypertension',
      'onboardingGoal-diabetes',
      'onboardingGoal-gut_health',
      'onboardingGoal-weight_management',
    ]) {
      expect(findAllByTestID(tree!.root, id).length).toBeGreaterThan(0);
    }
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('selecting a goal flips accessibilityState.selected=true', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(<OnboardingScreen />);
      await flushAsync();
    });
    const before = findAllByTestID(tree!.root, 'onboardingGoal-weight_management')[0];
    expect((before.props as ReactProps).accessibilityState?.selected).toBe(false);
    await act(async () => {
      (before.props as ReactProps).onPress?.();
      await flushAsync();
    });
    const after = findAllByTestID(tree!.root, 'onboardingGoal-weight_management')[0];
    expect((after.props as ReactProps).accessibilityState?.selected).toBe(true);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('without a selection Devam Et is a no-op and triggers an alert', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(<OnboardingScreen />);
      await flushAsync();
    });
    const next = findAllByTestID(tree!.root, 'onboardingGoalNextButton')[0];
    await act(async () => {
      (next.props as ReactProps).onPress?.();
      await flushAsync();
    });
    // alert() called with the "Hedef Seçin" copy.
    expect(alertSpy).toHaveBeenCalledWith(
      'Hedef Seçin',
      'Lütfen bir sağlık odağı seçin.',
    );
    // We still on step 1: the step-2 heading is absent.
    expect(findAllByText(tree!.root, 'Kendinizden Bahsedin').length).toBe(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('with a goal selected Devam Et advances to step 2', async () => {
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(<OnboardingScreen />);
      await flushAsync();
    });
    await act(async () => {
      const c = findAllByTestID(tree!.root, 'onboardingGoal-hypertension')[0];
      (c.props as ReactProps).onPress?.();
      await flushAsync();
    });
    await act(async () => {
      const next = findAllByTestID(tree!.root, 'onboardingGoalNextButton')[0];
      (next.props as ReactProps).onPress?.();
      await flushAsync();
    });
    expect(findAllByText(tree!.root, 'Kendinizden Bahsedin').length).toBeGreaterThan(0);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('committing health goal to userStore flips isFirstLaunch=false', () => {
    TestRenderer.create(<OnboardingScreen />);
    useUserStore.setState(state => ({
      profile: {
        ...state.profile,
        isFirstLaunch: false,
        healthGoal: 'diabetes' as const,
      },
    }));
    expect(useUserStore.getState().profile.healthGoal).toBe('diabetes');
    expect(useUserStore.getState().profile.isFirstLaunch).toBe(false);
  });
});
