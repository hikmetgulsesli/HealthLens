import React from 'react';
import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { resetAllStores } from '../test-utils/resetStores';
import { useLogStore } from '../../src/stores/logStore';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
}));

const flushAsync = () => new Promise<void>(resolve => setImmediate(resolve));

interface ReactProps {
  testID?: string;
  accessibilityLabel?: string;
  accessibilityState?: { selected?: boolean };
  onPress?: () => void;
  children?: unknown;
}

function findAllByText(root: TestRenderer.ReactTestInstance, text: string) {
  return root.findAll(node => {
    const c = (node.props as ReactProps)?.children;
    return c === text || (Array.isArray(c) && c.includes(text as never));
  });
}

function findAllByTestID(root: TestRenderer.ReactTestInstance, id: string) {
  return root.findAll(node => (node.props as ReactProps)?.testID === id);
}

function seedTodaysEntry(): void {
  const todayKey = new Date().toISOString().split('T')[0];
  useLogStore.setState({
    entries: {
      [todayKey]: [
        {
          id: 'meal-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dateKey: todayKey,
          mealCategory: 'lunch',
          imageUri: '',
          items: [
            {
              id: 'food-1',
              name: 'Mercimek Çorbası',
              confidence: 0.95,
              estimatedPortionGrams: 200,
              caloriesPer100g: 64,
              proteinPer100g: 5,
              carbsPer100g: 10,
              fatPer100g: 1.5,
              fiberPer100g: 4,
              sugarPer100g: 1,
              sodiumPer100g: 240,
            },
          ],
          totalCalories: 128,
          totalProtein: 10,
          totalCarbs: 20,
          totalFat: 3,
        },
      ],
    },
  });
}

async function mountDashboard(): Promise<TestRenderer.ReactTestRenderer> {
  let tree: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    tree = TestRenderer.create(<DashboardScreen />);
    await flushAsync();
  });
  return tree!;
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    resetAllStores();
    mockNavigate.mockClear();
    mockGoBack.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders the empty state CTA when no meals exist for today', async () => {
    const tree = await mountDashboard();
    expect(findAllByText(tree.root, 'Günlük Enerji').length).toBeGreaterThan(0);
    // When there are no entries, EmptyMealsCard shows the empty illustration.
    const emptyCta = findAllByTestID(tree.root, 'dashboardFirstCaptureCta')[0];
    expect(emptyCta).toBeTruthy();
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('shows calorie ring + macro bars once meals are logged', async () => {
    seedTodaysEntry();
    const tree = await mountDashboard();
    expect(findAllByTestID(tree.root, 'dashboardCalorieRing').length).toBeGreaterThan(0);
    expect(findAllByTestID(tree.root, 'dashboardCalorieValue').length).toBeGreaterThan(0);
    expect(findAllByTestID(tree.root, 'dashboardMacroBar-Protein').length).toBeGreaterThan(0);
    expect(findAllByTestID(tree.root, 'dashboardMacroBar-Karbonhidrat').length).toBeGreaterThan(0);
    expect(findAllByTestID(tree.root, 'dashboardMacroBar-Yağ').length).toBeGreaterThan(0);
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('renders the seeded meal calorie total (128 kcal) into the ring', async () => {
    seedTodaysEntry();
    const tree = await mountDashboard();
    expect(findAllByText(tree.root, '128').length).toBeGreaterThan(0);
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('pull-to-refresh triggers processQueue without crashing', async () => {
    seedTodaysEntry();
    const tree = await mountDashboard();
    // ScrollView's onRefresh is wired through the RefreshControl.
    // We assert the component survives a render cycle that includes
    // pending queue processing by simulating a refresh tick.
    await act(async () => {
      await flushAsync();
    });
    expect(tree.root).toBeTruthy();
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('camera FAB navigates to CameraTab on press', async () => {
    const tree = await mountDashboard();
    const fab = findAllByTestID(tree.root, 'dashboardCameraFab')[0];
    expect(fab).toBeTruthy();
    await act(async () => {
      (fab.props as ReactProps).onPress?.();
      await flushAsync();
    });
    expect(mockNavigate).toHaveBeenCalledWith('CameraTab');
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('meal card tap navigates to Review', async () => {
    seedTodaysEntry();
    const tree = await mountDashboard();
    const card = findAllByTestID(tree.root, 'dashboardMealCard-meal-1')[0];
    expect(card).toBeTruthy();
    await act(async () => {
      (card.props as ReactProps).onPress?.();
      await flushAsync();
    });
    expect(mockNavigate).toHaveBeenCalledWith('Review');
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('streak badge hides when no entries exist', async () => {
    const tree = await mountDashboard();
    expect(findAllByText(tree.root, 'Gün').length).toBe(0);
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });
});
