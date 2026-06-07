import type { HealthGoal, FoodItem } from '../types';

export interface HealthGradeInfo {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  label: string;
  color: string;
  description: string;
}

/**
 * Calculates a clinical health grade for a food item based on its macronutrient profile per 100g.
 */
export function calculateHealthGrade(
  caloriesPer100g: number,
  proteinPer100g: number,
  carbsPer100g: number,
  fatPer100g: number,
  fiberPer100g = 0,
  sugarPer100g = 0,
  sodiumPer100g = 0,
  healthGoal: HealthGoal = null,
): HealthGradeInfo {
  // Clinical scoring algorithm: starts with 70 base points.
  // Protein (+), Fiber (++) add points.
  // Sugar (--), Daturated fat / High fat (-), Sodium (-), and High Calories (-) reduce points.
  let score = 70;

  // Apply clinical health goal modifiers
  if (healthGoal === 'gut_health' && fiberPer100g > 3.0) {
    // Digestive wellness: reward high fiber foods extra generously
    score += fiberPer100g * 4.0;
  } else {
    score += fiberPer100g * 2.5;
  }

  score += proteinPer100g * 1.8;
  score -= fatPer100g * 0.5;
  score -= sugarPer100g * 1.5;
  score -= (sodiumPer100g * 1000) * 0.05; // sodium in mg/100g (sodiumPer100g is grams)

  if (caloriesPer100g > 250) {
    score -= (caloriesPer100g - 250) * 0.06;
  }

  // HARD LIMITS (Kısıt Cezaları)
  if (healthGoal === 'hypertension' && (sodiumPer100g * 1000) > 300) {
    // Hypertension: penalize high sodium foods hard (force C or D grade)
    score = Math.min(score, 50); // Will map to C or D grade maximum!
  }

  if (healthGoal === 'diabetes' && sugarPer100g > 12) {
    // Diabetes: penalize high sugar foods hard (force C or D grade)
    score = Math.min(score, 50); // Will map to C or D grade maximum!
  }

  if (score >= 90) {
    return {
      grade: 'A+',
      label: 'Süper Gıda',
      color: '#00E676', // Glowing Emerald Green
      description: 'Zengin lif, protein ve ideal mikro besin profili.',
    };
  } else if (score >= 74) {
    return {
      grade: 'A',
      label: 'Besleyici',
      color: '#00E676',
      description: 'Besin değeri son derece yüksek ve sağlıklı.',
    };
  } else if (score >= 58) {
    return {
      grade: 'B',
      label: 'Dengeli',
      color: '#14B8A6', // Glowing Clinical Teal
      description: 'Dengeli makro ve enerji profiline sahip standart gıda.',
    };
  } else if (score >= 42) {
    return {
      grade: 'C',
      label: 'Kontrollü',
      color: '#FFA726', // Glowing Gold
      description: 'Yüksek yağ veya kalori barındırır. Porsiyona dikkat edin.',
    };
  } else {
    return {
      grade: 'D',
      label: 'Boş Kalori',
      color: '#EF4444', // Glowing Red
      description: 'Yüksek şeker veya trans yağ içeriği. Sınırlı tüketin.',
    };
  }
}

/**
 * Calculates a combined clinical grade for a list of food items based on their portion weights.
 */
export function getMealHealthGrade(items: FoodItem[], healthGoal: HealthGoal = null): HealthGradeInfo {
  if (!items || items.length === 0) {
    return calculateHealthGrade(0, 0, 0, 0, 0, 0, 0, healthGoal);
  }

  let totalWeight = 0;
  let weightedCal = 0;
  let weightedPro = 0;
  let weightedCarb = 0;
  let weightedFat = 0;
  let weightedFiber = 0;
  let weightedSugar = 0;
  let weightedSodium = 0;

  for (const item of items) {
    const w = item.estimatedPortionGrams || 100;
    totalWeight += w;
    weightedCal += (item.caloriesPer100g || 0) * w;
    weightedPro += (item.proteinPer100g || 0) * w;
    weightedCarb += (item.carbsPer100g || 0) * w;
    weightedFat += (item.fatPer100g || 0) * w;
    weightedFiber += (item.fiberPer100g || 0) * w;
    weightedSugar += (item.sugarPer100g || 0) * w;
    weightedSodium += (item.sodiumPer100g || 0) * w;
  }

  if (totalWeight === 0) {
    return calculateHealthGrade(0, 0, 0, 0, 0, 0, 0, healthGoal);
  }

  return calculateHealthGrade(
    weightedCal / totalWeight,
    weightedPro / totalWeight,
    weightedCarb / totalWeight,
    weightedFat / totalWeight,
    weightedFiber / totalWeight,
    weightedSugar / totalWeight,
    weightedSodium / totalWeight,
    healthGoal,
  );
}
