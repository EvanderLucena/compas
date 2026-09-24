export interface FoodSubstitutionRequest {
  foodId?: string | null;
  sourceFoodName?: string;
  sourceAmount: number;
  sourceUnit?: string;
  sourceKcal?: number;
  sourceProt?: number;
  sourceCarb?: number;
  sourceFat?: number;
  category?: string;
  limit?: number;
}

export interface FoodSubstitutionItem {
  foodId: string;
  name: string;
  category: string;
  unit: string;
  suggestedAmount: number;
  householdPortion: string;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
  deltaKcal: number;
  deltaProt: number;
  deltaCarb: number;
  deltaFat: number;
  isPatientHabit: boolean;
  habitCount: number;
  habitBadge?: string | null;
  matchScore: number;
  clinicalReason: string;
}

export interface FoodSubstitutionResponse {
  sourceFoodName: string;
  sourceAmount: number;
  sourceUnit: string;
  sourceKcal: number;
  sourceProt: number;
  sourceCarb: number;
  sourceFat: number;
  dominantMacro: string;
  substitutions: FoodSubstitutionItem[];
  whatsappMessage: string;
}
