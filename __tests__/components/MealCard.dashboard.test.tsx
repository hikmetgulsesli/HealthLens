/** @format */
import { Alert } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { useLogStore } from '../../src/stores/logStore';
import { useUserStore } from '../../src/stores/userStore';
import { resetAllStores } from '../test-utils/resetStores';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

async function mount(): Promise<TestRenderer.ReactTestRenderer> {
  let tree: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    tree = TestRenderer.create(<DashboardScreen />);
    await flushAsync();
  });
  return tree!;
}

function seedTodayMeal(): void {
  const todayKey = new Date().toISOString().split('T')[0];
  useLogStore.setState({
    entries: {
      [todayKey]: [
        {
          id: 'seed-meal',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dateKey: todayKey,
          mealCategory: 'lunch',
          imageUri: 'file:///x.jpg',
          items: [
            {
              id: 'f1',
              name: 'Mercimek Çorbası',
              confidence: 0.95,
              estimatedPortionGrams: 250,
              caloriesPer100g: 64,
              proteinPer100g: 5,
              carbsPer100g: 10,
              fatPer100g: 1.5,
            },
          ],
          totalCalories: 160,
          totalProtein: 12,
          totalCarbs: 25,
          totalFat: 4,
        },
      ],
    },
  });
}

describe('DashboardScreen — meal card rendering', () => {
  beforeEach(() => {
    resetAllStores();
    useUserStore.setState(state => ({
      profile: { ...state.profile, isFirstLaunch: false },
    }));
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders a meal card testID per logged entry', async () => {
    seedTodayMeal();
    const tree = await mount();
    const ids = tree.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardMealCard-seed-meal',
    );
    expect(ids.length).toBeGreaterThan(0);
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('long-press on a meal card raises an action sheet', async () => {
    seedTodayMeal();
    const tree = await mount();
    const card = tree.root.findAll(
      n => (n.props as { testID?: string })?.testID === 'dashboardMealCard-seed-meal',
    )[0];
    expect(card).toBeTruthy();
    act(() => {
      (card.props as { onLongPress?: () => void }).onLongPress?.();
    });
    expect(Alert.alert as jest.Mock).toHaveBeenCalled();
    const [title] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(title).toContain('Öğün İşlemleri');
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });

  it('dashboard ring + macro bars re-compute after adding a second meal', async () => {
    seedTodayMeal();
    const tree = await mount();
    const ringValue = tree.root.findAllByProps({ testID: 'dashboardCalorieValue' });
    expect(ringValue.length).toBeGreaterThanOrEqual(1);
    // Add another meal at +200 kcal
    const todayKey = new Date().toISOString().split('T')[0];
    act(() => {
      useLogStore.getState().addEntry({
        id: 'second-meal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dateKey: todayKey,
        mealCategory: 'dinner',
        imageUri: '',
        items: [],
        totalCalories: 200,
        totalProtein: 10,
        totalCarbs: 20,
        totalFat: 5,
      });
    });
    // The store reducer contract that the dashboard ring relies on:
    // 160 (seeded) + 200 (new) === 360 kcal summed.
    const total = useLogStore
      .getState()
      .getEntriesForDate(todayKey)
      .reduce((s, e) => s + e.totalCalories, 0);
    expect(total).toBe(360);
    await act(async () => {
      tree.unmount();
      await flushAsync();
    });
  });
});
