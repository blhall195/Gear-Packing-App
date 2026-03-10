export interface GearItem {
  [key: string]: string | string[] | boolean;
  id: string;
  name: string;
  category: string;
  always: boolean;
  optional: boolean;
  activities: string[];
  climbingType: string[];
  cavingType: string[];
  weather: string[];
  duration: string[];
  shelter: string[];
  sleepProvision: string[];
  location: string[];
  cooking: string[];
}

export interface TripAnswers {
  [key: string]: string | string[] | null;
  activities: string[];
  climbingType: string[];
  cavingType: string[];
  weather: string[];
  duration: string | null;
  shelter: string | null;
  sleepProvision: string | null;
  location: string | null;
  cooking: string | null;
}

export const CONDITION_FIELDS = [
  { key: 'activities' as const, multi: true, label: 'Activities' },
  { key: 'climbingType' as const, multi: true, label: 'Climbing Type' },
  { key: 'cavingType' as const, multi: true, label: 'Caving Type' },
  { key: 'weather' as const, multi: true, label: 'Weather' },
  { key: 'duration' as const, multi: false, label: 'Duration' },
  { key: 'shelter' as const, multi: false, label: 'Shelter' },
  { key: 'sleepProvision' as const, multi: false, label: 'Sleep Provision' },
  { key: 'location' as const, multi: false, label: 'Location' },
  { key: 'cooking' as const, multi: false, label: 'Cooking' },
];

export type CategoryFieldConfig = Record<string, string[]>;

export const DEFAULT_CATEGORY_FIELDS: Record<string, CategoryFieldConfig> = {
  'Essentials': { activities: [], weather: [], duration: [] },
  'Clothing': { activities: [], weather: [], duration: [] },
  'Safety': { activities: [], weather: [] },
  'Climbing Gear': { activities: [], climbingType: [] },
  'Caving Gear': { activities: [], cavingType: [] },
  'Camping Gear': { duration: [], shelter: [] },
  'Navigation': { activities: [] },
  'Sleep System': { duration: [], shelter: [], sleepProvision: [] },
  'Cooking': { cooking: [], duration: [] },
  'Electronics': { duration: [], shelter: [] },
  'Travel Documents': { location: [] },
};

export const CATEGORY_ORDER = [
  'Essentials',
  'Clothing',
  'Safety',
  'Climbing Gear',
  'Caving Gear',
  'Camping Gear',
  'Navigation',
  'Sleep System',
  'Cooking',
  'Electronics',
  'Travel Documents',
];

/* ── Question Editor types ── */

export interface ShowWhenCondition {
  field: string;
  includes?: string;
  equals?: string;
  notIncludes?: string;
  notEquals?: string;
}

export interface AutoValueCondition {
  field: string;
  equals: string;
  setValue: string;
}

export interface BaseOption {
  value: string;
  label: string;
}

export interface QuestionConfig {
  id: string;
  field: string;
  label: string;
  selectMode: 'single' | 'multi';
  baseOptions: BaseOption[];
  parentId: string | null;
  order: number;
  showWhen?: ShowWhenCondition;
  autoWhen?: AutoValueCondition;
}
