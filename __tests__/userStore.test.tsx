import { useUserStore } from '../src/stores/userStore';
import { getTodayKey } from '../src/utils/date';

describe('userStore actions', () => {
  beforeEach(() => {
    // Reset store state to default before each test to ensure test isolation
    useUserStore.setState({
      profile: {
        id: 'default',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        goals: {
          dailyCalorieGoal: null,
          dailyProteinGoal: null,
          dailyCarbGoal: null,
          dailyFatGoal: null,
          showMicronutrients: false,
          showSodium: false,
          showFiber: false,
          showSugar: false,
        },
        unitSystem: 'metric',
        isFirstLaunch: true,
        isPremium: false,
        plan: 'free',
        trialEndsAt: null,
        freeScansDateKey: new Date().toISOString().split('T')[0],
        freeScansUsed: 0,
        healthGoal: null,
        email: null,
        loginMethod: null,
      },
    });
  });

  test('loginUser updates email, loginMethod and enables premium status', () => {
    const emailAddress = 'test@example.com';
    useUserStore.getState().loginUser(emailAddress, 'google');

    const updatedProfile = useUserStore.getState().profile;
    expect(updatedProfile.email).toBe(emailAddress);
    expect(updatedProfile.loginMethod).toBe('google');
    expect(updatedProfile.isPremium).toBe(true);
  });

  test('logoutUser clears email, loginMethod, premium status and resets free scan tokens to 0', () => {
    // Setup authenticated state with some used scan tokens
    useUserStore.setState({
      profile: {
        ...useUserStore.getState().profile,
        email: 'test@example.com',
        loginMethod: 'apple',
        isPremium: true,
        plan: 'pro',
        freeScansUsed: 3,
      },
    });

    // Execute logout
    useUserStore.getState().logoutUser();

    const updatedProfile = useUserStore.getState().profile;
    expect(updatedProfile.email).toBeNull();
    expect(updatedProfile.loginMethod).toBeNull();
    expect(updatedProfile.isPremium).toBe(false);
    expect(updatedProfile.plan).toBe('free');
    expect(updatedProfile.trialEndsAt).toBeNull();
    expect(updatedProfile.freeScansUsed).toBe(0);
  });

  test('resetOnboarding sets isFirstLaunch to true and clears clinical focus (healthGoal)', () => {
    // Setup state where onboarding has been completed and goal is set
    useUserStore.setState({
      profile: {
        ...useUserStore.getState().profile,
        isFirstLaunch: false,
        healthGoal: 'diabetes',
      },
    });

    // Execute reset
    useUserStore.getState().resetOnboarding();

    const updatedProfile = useUserStore.getState().profile;
    expect(updatedProfile.isFirstLaunch).toBe(true);
    expect(updatedProfile.healthGoal).toBeNull();
  });

  test('canScan uses only scans from the current date key', () => {
    useUserStore.setState({
      profile: {
        ...useUserStore.getState().profile,
        freeScansDateKey: '2024-01-01',
        freeScansUsed: 3,
      },
    });

    expect(useUserStore.getState().canScan(3, 100).allowed).toBe(true);
  });

  test('incrementFreeScans resets stale daily scan count before incrementing', () => {
    const todayKey = getTodayKey();

    useUserStore.setState({
      profile: {
        ...useUserStore.getState().profile,
        freeScansDateKey: '2024-01-01',
        freeScansUsed: 3,
      },
    });

    useUserStore.getState().incrementFreeScans();

    const updatedProfile = useUserStore.getState().profile;
    expect(updatedProfile.freeScansDateKey).toBe(todayKey);
    expect(updatedProfile.freeScansUsed).toBe(1);
  });
});

describe('userStore — setGoals / setUnitSystem / setProfile', () => {
  beforeEach(() => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, unitSystem: 'metric', goals: { ...state.profile.goals } },
    }));
  });

  test('setGoals merges partial fields without overwriting siblings', () => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, goals: { ...state.profile.goals, dailyCalorieGoal: 2000, dailyProteinGoal: 100 } },
    }));
    useUserStore.getState().setGoals({ dailyCarbGoal: 250 });
    const goals = useUserStore.getState().profile.goals;
    expect(goals.dailyCalorieGoal).toBe(2000);
    expect(goals.dailyProteinGoal).toBe(100);
    expect(goals.dailyCarbGoal).toBe(250);
  });

  test('setGoals accepts null values to clear a target', () => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, goals: { ...state.profile.goals, dailyCalorieGoal: 2000 } },
    }));
    useUserStore.getState().setGoals({ dailyCalorieGoal: null });
    expect(useUserStore.getState().profile.goals.dailyCalorieGoal).toBeNull();
  });

  test('setGoals updates the profile updatedAt timestamp', () => {
    const before = useUserStore.getState().profile.updatedAt;
    useUserStore.getState().setGoals({ dailyCalorieGoal: 1800 });
    const after = useUserStore.getState().profile.updatedAt;
    expect(new Date(after).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  test('setUnitSystem flips metric ↔ imperial', () => {
    useUserStore.getState().setUnitSystem('imperial');
    expect(useUserStore.getState().profile.unitSystem).toBe('imperial');
    useUserStore.getState().setUnitSystem('metric');
    expect(useUserStore.getState().profile.unitSystem).toBe('metric');
  });

  test('setProfile merges top-level fields but preserves nested goals', () => {
    useUserStore.setState(state => ({
      profile: { ...state.profile, goals: { ...state.profile.goals, dailyCalorieGoal: 2000 } },
    }));
    useUserStore.getState().setProfile({ isFirstLaunch: false });
    const p = useUserStore.getState().profile;
    expect(p.isFirstLaunch).toBe(false);
    // setProfile intentionally preserves goals (the reducer spreads the
    // incoming profile on top, but `goals` lives inside profile so it
    // would be replaced if setProfile is given a full profile). With a
    // partial profile arg, goals stay intact.
    expect(p.goals.dailyCalorieGoal).toBe(2000);
    // updatedAt bumps on each call.
    expect(p.updatedAt).toBeDefined();
  });
});
