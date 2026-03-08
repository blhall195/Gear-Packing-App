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
  weather: [],
  duration: null,
  shelter: null,
  sleepProvision: null,
  location: null,
  cooking: null,
};

const TripContext = createContext<TripContextType | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<TripAnswers>(defaultAnswers);

  const resetAnswers = () => setAnswers(defaultAnswers);

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
