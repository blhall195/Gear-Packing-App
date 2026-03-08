import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { TripAnswers } from '../logic/types';

interface TripContextType {
  answers: TripAnswers;
  setAnswers: (answers: TripAnswers) => void;
  resetAnswers: () => void;
}

const defaultAnswers: TripAnswers = {
  activities: [],
  climbingType: [],
  cavingType: [],
  weather: [],
  duration: null,
  shelter: null,
  sleepProvision: null,
  location: null,
  cooking: null,
};

const STORAGE_KEY = 'trip-answers';

function loadAnswers(): TripAnswers {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as TripAnswers;
  } catch { /* ignore */ }
  return defaultAnswers;
}

const TripContext = createContext<TripContextType | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswersState] = useState<TripAnswers>(loadAnswers);

  const setAnswers = (a: TripAnswers) => {
    setAnswersState(a);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  };

  const resetAnswers = () => {
    setAnswersState(defaultAnswers);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <TripContext.Provider value={{ answers, setAnswers, resetAnswers }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within TripProvider');
  return ctx;
}
