import { AccessibilityInfo } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';
import { useReduceMotion } from '../../src/hooks/useReduceMotion';

let listeners: Array<(enabled: boolean) => void> = [];
let currentValue = false;

function installMock(initial: boolean): void {
  currentValue = initial;
  listeners = [];
  (AccessibilityInfo as unknown as {
    isReduceMotionEnabled: jest.Mock;
    addEventListener: jest.Mock;
    removeEventListener?: jest.Mock;
  }).isReduceMotionEnabled = jest.fn(async () => currentValue);
  (AccessibilityInfo as unknown as {
    addEventListener: jest.Mock;
  }).addEventListener = jest.fn(
    (_event: string, cb: (enabled: boolean) => void) => {
      listeners.push(cb);
      return { remove: jest.fn() };
    },
  );
}

const flushAsync = () =>
  new Promise<void>(resolve => setImmediate(resolve));

function renderHook(): { current: boolean; unmount: () => void } {
  function HookProbe(): null {
    const value = useReduceMotion();
    (HookProbe as unknown as { __result: boolean }).__result = value;
    return null;
  }
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(<HookProbe />);
  });
  const probe = HookProbe as unknown as { __result: boolean };
  return {
    get current() {
      return probe.__result;
    },
    unmount: () => {
      act(() => {
        tree.unmount();
      });
    },
  };
}

describe('useReduceMotion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when the system reports Reduce Motion disabled', async () => {
    installMock(false);
    const hook = renderHook();
    await act(async () => {
      await flushAsync();
    });
    expect(hook.current).toBe(false);
    hook.unmount();
  });

  it('returns true when the system reports Reduce Motion enabled', async () => {
    installMock(true);
    const hook = renderHook();
    await act(async () => {
      await flushAsync();
    });
    expect(hook.current).toBe(true);
    hook.unmount();
  });

  it('updates when the system emits a reduceMotionChanged event', async () => {
    installMock(false);
    const hook = renderHook();
    await act(async () => {
      await flushAsync();
    });
    expect(hook.current).toBe(false);
    act(() => {
      currentValue = true;
      listeners.forEach(cb => cb(true));
    });
    expect(hook.current).toBe(true);
    hook.unmount();
  });
});
