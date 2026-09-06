import { PLANS } from '../../src/config/plans';

describe('plans config', () => {
  it('exposes three tiers (free, pro, pro_plus) in display order', () => {
    const tiers = PLANS.map(p => p.tier);
    expect(tiers).toEqual(['free', 'pro', 'pro_plus']);
  });

  it('free tier has 0 cost in both monthly and yearly periods', () => {
    const free = PLANS.find(p => p.tier === 'free')!;
    expect(free.monthlyCents).toBe(0);
    expect(free.yearlyCents).toBe(0);
  });

  it('paid tiers have non-zero costs', () => {
    const pro = PLANS.find(p => p.tier === 'pro')!;
    const proPlus = PLANS.find(p => p.tier === 'pro_plus')!;
    expect(pro.monthlyCents).toBeGreaterThan(0);
    expect(pro.yearlyCents).toBeGreaterThan(0);
    expect(proPlus.monthlyCents).toBeGreaterThan(0);
    expect(proPlus.yearlyCents).toBeGreaterThan(0);
  });

  it('pro_plus yearly is the only -1 (unlimited) daily AI quota', () => {
    const proPlus = PLANS.find(p => p.tier === 'pro_plus')!;
    expect(proPlus.dailyAiQuota).toBe(-1);
    for (const tier of PLANS) {
      if (tier.tier === 'pro_plus') continue;
      expect(tier.dailyAiQuota).toBeGreaterThanOrEqual(0);
    }
  });

  it('every plan advertises at least 2 features', () => {
    for (const tier of PLANS) {
      expect(tier.features.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('yearly price offers a meaningful discount vs 12 monthly payments', () => {
    // Pricing sanity: yearly billing should be materially cheaper than
    // paying 12 monthly bills in a row. We require at least 5% off.
    for (const tier of PLANS) {
      if (tier.monthlyCents === 0) continue;
      const monthly12 = tier.monthlyCents * 12;
      expect(tier.yearlyCents).toBeLessThanOrEqual(monthly12 * 0.95);
    }
  });

  it('plan copy is non-empty (displayName, tagline, every feature title/sub)', () => {
    for (const tier of PLANS) {
      expect(tier.displayName.length).toBeGreaterThan(0);
      expect(tier.tagline.length).toBeGreaterThan(0);
      for (const feat of tier.features) {
        expect(feat.title.length).toBeGreaterThan(0);
        expect(feat.sub.length).toBeGreaterThan(0);
      }
    }
  });
});
