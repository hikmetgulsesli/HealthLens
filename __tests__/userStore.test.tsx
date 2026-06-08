import { useUserStore } from '../src/stores/userStore';

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
});
