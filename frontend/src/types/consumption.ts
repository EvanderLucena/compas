export interface FrequentOffPlanFood {
  foodName: string;
  consumptionCount: number;
  commonMealLabel: string;
  mealSlotId: string | null;
  typicalGrams: number;
  typicalKcal: number;
  typicalProt: number;
  typicalCarb: number;
  typicalFat: number;
  category: string;
  clinicalRationale: string;
  sameGroup: boolean;
  verdict: string;
}

export interface PatientConsumptionPatterns {
  periodDays: number;
  totalLoggedMeals: number;
  dailyAverageMeals: number;
  avgKcalPerMeal: number;
  avgProtPerMeal: number;
  peakHoursRange: string;
  frequentOffPlanFoods: FrequentOffPlanFood[];
  observedPatterns: string[];
}
