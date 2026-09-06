import { useUserStore } from '../../src/stores/userStore';

const TODAY_KEY = '2026-08-16';
const _pastDate = '2025-01-01';

// Pin getTodayKey() so the quota contract is stable across test runs.
jest.mock('../../src/utils/date', () => ({
  getTodayKey: () => TODAY_KEY,
}));

function setPlan(plan: 'free' | 'pro' | 'pro_plus', extras: Partial<ReturnType<typeof useUserStore.getState>['profile']> = {}) {
  useUserStore.setState(state => ({
    profile: { ...state.profile, plan, isPremium: plan !== 'free', ...extras },
  }));
}

describe('userStore — canScan quota logic', () => {
  beforeEach(() => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, plan: 'free', isPremium: false, freeScansUsed: 0, freeScansDateKey: TODAY_KEY },
    }));
  });

  it('free user under quota is allowed', () => {
    useUserStore.getState().incrementFreeScans();
    const r = useUserStore.getState().canScan(3, 100);
    expect(r.allowed).toBe(true);
  });

  it('free user at quota (3) is blocked', () => {
    setPlan('free', { freeScansUsed: 3 });
    const r = useUserStore.getState().canScan(3, 100);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/Pro/i);
  });

  it('free user over quota is blocked', () => {
    setPlan('free', { freeScansUsed: 5 });
    const r = useUserStore.getState().canScan(3, 100);
    expect(r.allowed).toBe(false);
  });

  it('pro user respects the proQuotaPerDay ceiling', () => {
    setPlan('pro', { freeScansUsed: 99 });
    const allowed = useUserStore.getState().canScan(3, 100);
    expect(allowed.allowed).toBe(true);
    setPlan('pro', { freeScansUsed: 100 });
    const atLimit = useUserStore.getState().canScan(3, 100);
    expect(atLimit.allowed).toBe(false);
    expect(atLimit.reason).toMatch(/Pro\+/i);
  });

  it('pro_plus tier is unlimited (allowed regardless of count)', () => {
    setPlan('pro_plus', { freeScansUsed: 9999 });
    const r = useUserStore.getState().canScan(3, 100);
    expect(r.allowed).toBe(true);
    expect(r.reason).toBeUndefined();
  });

  it('active trial unlocks pro_plus even if plan=free', () => {
    const trialEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    setPlan('free', { freeScansUsed: 9999, trialEndsAt: trialEnd });
    const r = useUserStore.getState().canScan(3, 100);
    expect(r.allowed).toBe(true);
  });

  it('expired trial does not grant quota', () => {
    const expiredTrial = new Date(Date.now() - 1000).toISOString();
    setPlan('free', { freeScansUsed: 9999, trialEndsAt: expiredTrial });
    const r = useUserStore.getState().canScan(3, 100);
    expect(r.allowed).toBe(false);
  });

  it('freeScansUsed from a previous day does not count toward today', () => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, plan: 'free', freeScansUsed: 99, freeScansDateKey: _pastDate },
    }));
    const r = useUserStore.getState().canScan(3, 100);
    expect(r.allowed).toBe(true);
  });

  it('pro tier with -1 (unlimited sentinel) is always allowed', () => {
    setPlan('pro', { freeScansUsed: 999 });
    const r = useUserStore.getState().canScan(3, -1);
    expect(r.allowed).toBe(true);
  });
});

describe('userStore — startTrial', () => {
  beforeEach(() => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, plan: 'free', trialEndsAt: null },
    }));
  });

  it('starts a 7-day trial for free user', () => {
    const before = Date.now();
    useUserStore.getState().startTrial(7);
    const end = useUserStore.getState().profile.trialEndsAt;
    expect(end).not.toBeNull();
    const ms = new Date(end!).getTime() - before;
    expect(ms).toBeGreaterThan(6.9 * 86400000);
    expect(ms).toBeLessThan(7.1 * 86400000);
    expect(useUserStore.getState().profile.plan).toBe('pro_plus');
    expect(useUserStore.getState().profile.isPremium).toBe(true);
  });

  it('does not extend an active trial', () => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, plan: 'free', trialEndsAt: new Date(Date.now() + 1000000).toISOString() },
    }));
    const before = useUserStore.getState().profile.trialEndsAt;
    useUserStore.getState().startTrial(7);
    expect(useUserStore.getState().profile.trialEndsAt).toBe(before);
  });

  it('does not start a trial for an existing paid user', () => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, plan: 'pro', trialEndsAt: null },
    }));
    useUserStore.getState().startTrial(7);
    expect(useUserStore.getState().profile.trialEndsAt).toBeNull();
  });
});

describe('userStore — completeOnboarding', () => {
  beforeEach(() => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, isFirstLaunch: true, healthGoal: null },
    }));
  });

  it('flips isFirstLaunch to false and merges dynamic goals', () => {
    useUserStore.getState().completeOnboarding(
      { healthGoal: 'weight_management' },
      {
        dailyCalorieGoal: 2000,
        dailyProteinGoal: 110,
        dailyCarbGoal: null,
        dailyFatGoal: null,
        showMicronutrients: false,
        showSodium: false,
        showFiber: false,
        showSugar: false,
      },
    );
    const p = useUserStore.getState().profile;
    expect(p.isFirstLaunch).toBe(false);
    expect(p.healthGoal).toBe('weight_management');
    expect(p.goals.dailyCalorieGoal).toBe(2000);
    expect(p.goals.dailyProteinGoal).toBe(110);
  });
});

describe('userStore — loginUser / logoutUser', () => {
  beforeEach(() => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, isPremium: false, plan: 'free', email: null },
    }));
  });

  it('loginUser sets email, loginMethod, and isPremium=true', () => {
    useUserStore.getState().loginUser('test@example.com', 'google');
    const p = useUserStore.getState().profile;
    expect(p.email).toBe('test@example.com');
    expect(p.loginMethod).toBe('google');
    expect(p.isPremium).toBe(true);
  });

  it('logoutUser clears email, loginMethod, premium and freeScansUsed', () => {
    useUserStore.getState().loginUser('x@y.com', 'apple');
    useUserStore.setState(state => ({
      profile: { ...state.profile, freeScansUsed: 5 },
    }));
    useUserStore.getState().logoutUser();
    const p = useUserStore.getState().profile;
    expect(p.email).toBeNull();
    expect(p.loginMethod).toBeNull();
    expect(p.isPremium).toBe(false);
    expect(p.freeScansUsed).toBe(0);
  });
});
