export interface Profile {
  id: string;
  name: string;
  daily_calories_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  claude_api_key: string | null;
  created_at: string;
}

export interface Meal {
  id: string;
  profile_id: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  photo_url: string | null;
  created_at: string;
  food_items?: FoodItem[];
}

export interface FoodItem {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meals: Meal[];
}

export interface AnalysisResult {
  foods: {
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
}
