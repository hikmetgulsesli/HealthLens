export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  id: string;
  name: string;
  confidence: number;
  estimatedPortionGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  sugarPer100g?: number;
  sodiumPer100g?: number;
}

export interface LogEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  dateKey: string;
  mealCategory: MealCategory;
  imageUri?: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface NutritionGoals {
  dailyCalorieGoal: number | null;
  dailyProteinGoal: number | null;
  dailyCarbGoal: number | null;
  dailyFatGoal: number | null;
  showMicronutrients: boolean;
  showSodium: boolean;
  showFiber: boolean;
  showSugar: boolean;
}

export interface UserProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  goals: NutritionGoals;
  unitSystem: 'metric' | 'imperial';
}

export interface OfflineQueueItem {
  id: string;
  createdAt: string;
  imageUri: string;
  mealCategory: MealCategory;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
}

export interface AnalysisResult {
  items: FoodItem[];
  mealCategory: MealCategory;
  imageUri: string;
}
