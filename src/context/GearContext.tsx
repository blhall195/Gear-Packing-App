import { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { GearItem } from '../logic/types';
import defaultGearData from '../assets/gear-data.json';

interface GearContextType {
  items: GearItem[];
  setItems: (items: GearItem[]) => void;
  importFromFile: () => void;
  resetToDefault: () => void;
  isCustom: boolean;
}

const STORAGE_KEY = 'custom-gear-data';

function loadGear(): { items: GearItem[]; isCustom: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { items: JSON.parse(stored) as GearItem[], isCustom: true };
    }
  } catch { /* ignore */ }
  return { items: defaultGearData as GearItem[], isCustom: false };
}

const GearContext = createContext<GearContextType | null>(null);

export function GearProvider({ children }: { children: ReactNode }) {
  const initial = loadGear();
  const [items, setItemsState] = useState<GearItem[]>(initial.items);
  const [isCustom, setIsCustom] = useState(initial.isCustom);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setItems = (newItems: GearItem[]) => {
    setItemsState(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    setIsCustom(true);
  };

  const resetToDefault = () => {
    setItemsState(defaultGearData as GearItem[]);
    localStorage.removeItem(STORAGE_KEY);
    setIsCustom(false);
  };

  const importFromFile = () => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      fileInputRef.current = input;
    }

    const input = fileInputRef.current;
    input.value = '';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string);
          if (!Array.isArray(parsed)) {
            alert('Invalid gear data: expected a JSON array.');
            return;
          }
          if (parsed.length === 0) {
            alert('Invalid gear data: the array is empty.');
            return;
          }
          const first = parsed[0];
          if (!first.name || !first.category) {
            alert('Invalid gear data: items must have "name" and "category" fields.');
            return;
          }
          setItems(parsed as GearItem[]);
        } catch {
          alert('Failed to parse JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <GearContext.Provider value={{ items, setItems, importFromFile, resetToDefault, isCustom }}>
      {children}
    </GearContext.Provider>
  );
}

export function useGear() {
  const ctx = useContext(GearContext);
  if (!ctx) throw new Error('useGear must be used within GearProvider');
  return ctx;
}
