export interface GearItem {
  [key: string]: string | string[] | boolean;
  id: string;
  name: string;
  category: string;
  always: boolean;
  activities: string[];
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
  weather: string[];
  duration: string | null;
  shelter: string | null;
  sleepProvision: string | null;
  location: string | null;
  cooking: string | null;
}

export const CONDITION_FIELDS = [
  { key: 'activities' as const, multi: true, label: 'Activities' },
  { key: 'weather' as const, multi: true, label: 'Weather' },
  { key: 'duration' as const, multi: false, label: 'Duration' },
  { key: 'shelter' as const, multi: false, label: 'Shelter' },
  { key: 'sleepProvision' as const, multi: false, label: 'Sleep Provision' },
  { key: 'location' as const, multi: false, label: 'Location' },
  { key: 'cooking' as const, multi: false, label: 'Cooking' },
];

export const CATEGORY_ORDER = [
  'Essentials',
  'Clothing',
  'Safety',
  'Climbing Gear',
  'Camping Gear',
  'Navigation',
  'Sleep System',
  'Cooking',
  'Electronics',
  'Travel Documents',
];
