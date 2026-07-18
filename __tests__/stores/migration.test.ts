import { useUserStore } from '../../src/stores/userStore';
import { useLogStore } from '../../src/stores/logStore';
import { useOfflineQueueStore } from '../../src/stores/offlineQueueStore';
import { useHydrationStore } from '../../src/stores/hydrationStore';

describe('Zustand persistence', () => {
  const wrappers: Array<{ name: string; store: unknown }> = [
    { name: 'userStore', store: useUserStore },
    { name: 'logStore', store: useLogStore },
    { name: 'offlineQueueStore', store: useOfflineQueueStore },
    { name: 'hydrationStore', store: useHydrationStore },
  ];

  it.each(wrappers)('$name has persist config with version+migrate', ({ store }) => {
    const persistFn = (store as { persist?: { getOptions?: () => unknown } }).persist;
    expect(persistFn).toBeDefined();
    const options = persistFn?.getOptions?.() as
      | { version?: number; migrate?: unknown; storage?: unknown }
      | undefined;
    expect(options).toBeDefined();
    expect(options?.version).toBeDefined();
    expect(typeof options?.migrate).toBe('function');
    expect(options?.storage).toBeDefined();
  });
});
