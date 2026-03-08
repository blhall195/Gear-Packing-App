import type { GearItem, TripAnswers } from './types';
import { CONDITION_FIELDS } from './types';

export function matchGear(items: GearItem[], trip: TripAnswers): GearItem[] {
  return items.filter((item) => {
    if (item.always) return true;

    for (const field of CONDITION_FIELDS) {
      const itemValues = item[field.key] as string[];
      if (itemValues.length === 0) continue;

      const tripValue = trip[field.key];

      if (tripValue === null) return false;

      if (field.multi) {
        const tripArray = tripValue as string[];
        const hasOverlap = itemValues.some((v) => tripArray.includes(v));
        if (!hasOverlap) return false;
      } else {
        if (!itemValues.includes(tripValue as string)) return false;
      }
    }

    return true;
  });
}

export function extractOptions(items: GearItem[], field: keyof GearItem): string[] {
  const values = new Set<string>();
  for (const item of items) {
    const arr = item[field];
    if (Array.isArray(arr)) {
      arr.forEach((v: string) => values.add(v));
    }
  }
  return Array.from(values).sort();
}
