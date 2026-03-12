import type { GearItem, TripAnswers } from './types';

export function matchGear(items: GearItem[], trip: TripAnswers): GearItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.category}::${item.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (item.always) return true;

    // Dynamically check all array fields on the item (handles custom question fields)
    let hasCriteria = false;
    for (const [fieldKey, fieldValue] of Object.entries(item)) {
      if (!Array.isArray(fieldValue) || fieldValue.length === 0) continue;

      hasCriteria = true;
      const tripValue = trip[fieldKey];

      // Item requires this field but trip hasn't answered → no match
      if (tripValue === null || tripValue === undefined) return false;

      if (Array.isArray(tripValue)) {
        if (!fieldValue.some((v: string) => (tripValue as string[]).includes(v))) return false;
      } else {
        if (!fieldValue.includes(tripValue as string)) return false;
      }
    }

    // No criteria and not marked "always" → don't include
    if (!hasCriteria) return false;

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
