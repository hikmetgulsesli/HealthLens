/** @format */
import TestRenderer, { act } from 'react-test-renderer';
import { GoalCard } from '../../src/components/profile/GoalCard';

const flushAsync = (): Promise<void> =>
  new Promise(resolve => setImmediate(resolve));

describe('GoalCard', () => {
  it('renders with testID + invokes onIncrement / onDecrement', async () => {
    const onInc = jest.fn();
    const onDec = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <GoalCard
          label="Kalori"
          icon="local-fire-department"
          accentColor="#EF4444"
          accentInputColor="#EF4444"
          value="2000"
          placeholder="---"
          unit="kcal / gün"
          onChange={jest.fn()}
          onBlur={jest.fn()}
          onIncrement={onInc}
          onDecrement={onDec}
          testID="profileGoalCalorie"
        />,
      );
      await flushAsync();
    });
    expect(
      tree!.root.findAllByProps({ testID: 'profileGoalCalorie' }).length,
    ).toBeGreaterThan(0);
    const incBtn = tree!.root.findAllByProps({
      testID: 'profileGoalCalorie-increment',
    })[0];
    const decBtn = tree!.root.findAllByProps({
      testID: 'profileGoalCalorie-decrement',
    })[0];
    expect(incBtn).toBeTruthy();
    expect(decBtn).toBeTruthy();
    act(() => {
      (incBtn.props as { onPress?: () => void }).onPress?.();
    });
    act(() => {
      (decBtn.props as { onPress?: () => void }).onPress?.();
    });
    expect(onInc).toHaveBeenCalledTimes(1);
    expect(onDec).toHaveBeenCalledTimes(1);
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });

  it('fires onChange when the text input value changes', async () => {
    const onChange = jest.fn();
    let tree: TestRenderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = TestRenderer.create(
        <GoalCard
          label="Protein"
          icon="fitness-center"
          accentColor="#22C55E"
          accentInputColor="#22C55E"
          value="100"
          placeholder="---"
          unit="g"
          onChange={onChange}
          onBlur={jest.fn()}
          onIncrement={jest.fn()}
          onDecrement={jest.fn()}
          testID="profileGoalProtein"
        />,
      );
      await flushAsync();
    });
    const input = tree!.root.findAllByProps({
      testID: 'profileGoalProtein-input',
    })[0];
    expect(input).toBeTruthy();
    act(() => {
      (input.props as { onChangeText?: (t: string) => void }).onChangeText?.('150');
    });
    expect(onChange).toHaveBeenCalledWith('150');
    await act(async () => {
      tree!.unmount();
      await flushAsync();
    });
  });
});
