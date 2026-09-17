export type FoodUnit = 'GRAMAS' | 'UNIDADE' | 'ML';

export const FOOD_UNIT_KEYS: FoodUnit[] = ['GRAMAS', 'UNIDADE', 'ML'];

export const FOOD_UNIT_LABELS: Record<FoodUnit, string> = {
  GRAMAS: 'Gramas (g)',
  UNIDADE: 'Unidade',
  ML: 'Mililitros (ml)',
};

export const FOOD_UNIT_SYMBOLS: Record<FoodUnit, string> = {
  GRAMAS: 'g',
  UNIDADE: 'unid',
  ML: 'ml',
};

export type FoodCategoryKey =
  'PROTEINA' | 'CARBOIDRATO' | 'GORDURA' | 'VEGETAL' | 'FRUTA' | 'BEBIDA' | 'OUTRO';
export type FoodCategory = 'Todos' | FoodCategoryKey;

export const FOOD_CATEGORY_KEYS: FoodCategoryKey[] = [
  'PROTEINA',
  'CARBOIDRATO',
  'GORDURA',
  'VEGETAL',
  'FRUTA',
  'BEBIDA',
  'OUTRO',
];

export const FOOD_CATEGORY_LABELS: Record<FoodCategoryKey, string> = {
  PROTEINA: 'Proteína',
  CARBOIDRATO: 'Carboidrato',
  GORDURA: 'Gordura',
  VEGETAL: 'Vegetal',
  FRUTA: 'Fruta',
  BEBIDA: 'Bebida',
  OUTRO: 'Outro',
};

export const REVERSE_CATEGORY_LABELS: Record<string, FoodCategoryKey> = Object.fromEntries(
  Object.entries(FOOD_CATEGORY_LABELS).map(([k, v]) => [v, k as FoodCategoryKey]),
) as Record<string, FoodCategoryKey>;

export interface Food {
  id: string;
  name: string;
  category: string;
  unit: FoodUnit;
  referenceAmount: number;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number;
  prep: string;
  portionLabel: string;
  used: number;
  custom?: boolean;
}

export const FOOD_CATEGORIES: FoodCategory[] = ['Todos', ...FOOD_CATEGORY_KEYS];

export interface FoodApiResponse {
  id: string;
  name: string;
  category: string;
  unit: string;
  referenceAmount: number;
  kcal: number;
  prot: number;
  carb: number;
  fat: number;
  fiber: number | null;
  prep: string | null;
  portionLabel: string | null;
  usedCount: number;
  custom?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodListApiResponse {
  content: FoodApiResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

function normalizeCategoryLabel(raw: string): string {
  return FOOD_CATEGORY_LABELS[raw as FoodCategoryKey] || raw;
}

export function mapFoodFromApi(api: FoodApiResponse): Food {
  return {
    id: api.id,
    name: api.name,
    category: normalizeCategoryLabel(api.category),
    unit: api.unit as FoodUnit,
    referenceAmount: api.referenceAmount,
    kcal: api.kcal,
    prot: api.prot,
    carb: api.carb,
    fat: api.fat,
    fiber: api.fiber ?? 0,
    prep: api.prep ?? '',
    portionLabel: api.portionLabel ?? '',
    used: api.usedCount,
    custom: api.custom ?? true,
  };
}
