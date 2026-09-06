import { useUserStore } from '../../src/stores/userStore';
import { useLogStore } from '../../src/stores/logStore';
import { useOfflineQueueStore } from '../../src/stores/offlineQueueStore';
import { useHydrationStore } from '../../src/stores/hydrationStore';
import type { LogEntry } from '../../src/types';

interface PersistShape {
  persist?: {
    getOptions?: () => {
      version?: number;
      migrate?: (persisted: unknown, version?: number) => unknown;
      storage?: unknown;
    };
  };
}

const wrappers: Array<{ name: string; store: PersistShape }> = [
  { name: 'userStore', store: useUserStore as unknown as PersistShape },
  { name: 'logStore', store: useLogStore as unknown as PersistShape },
  { name: 'offlineQueueStore', store: useOfflineQueueStore as unknown as PersistShape },
  { name: 'hydrationStore', store: useHydrationStore as unknown as PersistShape },
];

describe('Zustand persistence', () => {
  it.each(wrappers)('$name has persist config with version+migrate', ({ store }) => {
    expect(store.persist).toBeDefined();
    const options = store.persist?.getOptions?.();
    expect(options).toBeDefined();
    expect(options?.version).toBeDefined();
    expect(typeof options?.migrate).toBe('function');
    expect(options?.storage).toBeDefined();
  });

  it('every store reports a positive integer version', () => {
    for (const { store } of wrappers) {
      const v = store.persist?.getOptions?.().version;
      expect(typeof v).toBe('number');
      expect(v as number).toBeGreaterThan(0);
    }
  });

  it('migrate(version === current) is the identity transform', () => {
    // Every store declares its current schema as v1 (offlineQueueStore is
    // v2 because of the nextRetryAt bump). When zustand rehydrates with
    // the same version, the migration returns the payload unchanged.
    const m1 = userStoreMigrate({ profile: { id: 'a' } } as never, 1);
    expect(m1).toEqual({ profile: { id: 'a' } });
    const m2 = logStoreMigrate({ entries: {} } as never, 1);
    expect(m2).toEqual({ entries: {} });
    const m3 = offlineQueueMigrate({ queue: [] } as never, 2);
    expect(m3).toEqual({ queue: [] });
  });

  it('migrate falls back to a safe default for unknown persisted state', () => {
    const corrupt = 'this is not a state object';
    expect(userStoreMigrate(corrupt, 1)).toBeDefined();
    expect(logStoreMigrate(corrupt, 1)).toEqual({ entries: {} });
    const oq = offlineQueueMigrate(corrupt, 1) as { queue?: unknown[]; isProcessing?: boolean };
    expect(oq.queue).toEqual([]);
    expect(oq.isProcessing).toBe(false);
  });

  it('offlineQueueStore migration bumps v1 → v2 by adding nextRetryAt', () => {
    // v1 entries lack nextRetryAt; v2-aware migrate must backfill the
    // field so processQueue's nextRetryAt-aware filter still works.
    const v1 = { queue: [{ id: 'q1', retryCount: 0, status: 'pending' }] };
    const migrated = offlineQueueMigrate(v1, 1) as {
      queue: Array<Record<string, unknown>>;
    };
    expect(migrated.queue[0]).toHaveProperty('nextRetryAt');
  });

  it('logStore migration normalizes legacy entries that lack totalCalories', () => {
    // Older builds stored raw FoodItem[] without totals; migrate must
    // compute them so the dashboard ring reducer doesn't NaN out.
    const legacy: { entries: Record<string, LogEntry[]> } = {
      entries: {
        '2026-08-16': [
          {
            id: 'a',
            createdAt: '',
            updatedAt: '',
            dateKey: '2026-08-16',
            mealCategory: 'lunch',
            imageUri: '',
            items: [
              {
                id: 'f',
                name: 'Test',
                confidence: 1,
                estimatedPortionGrams: 200,
                caloriesPer100g: 100,
                proteinPer100g: 5,
                carbsPer100g: 10,
                fatPer100g: 1,
              },
            ],
          } as unknown as LogEntry,
        ],
      },
    };
    const migrated = logStoreMigrate(legacy, 1) as typeof legacy;
    const entry = migrated.entries['2026-08-16'][0];
    expect(entry.totalCalories).toBe(200); // 100 * 200/100
    expect(entry.totalProtein).toBe(10);
  });
});

// Extracted migrate invokers so each test can probe a specific store.
function userStoreMigrate(persisted: unknown, version: number): unknown {
  const migrate = (useUserStore as unknown as PersistShape).persist
    ?.getOptions?.().migrate as (p: unknown, v: number) => unknown;
  return migrate(persisted, version);
}

function logStoreMigrate(persisted: unknown, version: number): unknown {
  const migrate = (useLogStore as unknown as PersistShape).persist
    ?.getOptions?.().migrate as (p: unknown, v: number) => unknown;
  return migrate(persisted, version);
}

function offlineQueueMigrate(persisted: unknown, version: number): unknown {
  const migrate = (useOfflineQueueStore as unknown as PersistShape).persist
    ?.getOptions?.().migrate as (p: unknown, v: number) => unknown;
  return migrate(persisted, version);
}

