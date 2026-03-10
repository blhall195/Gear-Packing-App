import { createContext, useContext, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import type { QuestionConfig } from '../logic/types';
import { DEFAULT_QUESTIONS } from '../logic/default-questions';

interface QuestionContextType {
  questions: QuestionConfig[];
  setQuestions: (questions: QuestionConfig[]) => void;
  importFromFile: () => void;
  resetToDefault: () => void;
  isCustom: boolean;
}

const STORAGE_KEY = 'custom-question-config';

function loadQuestions(): { questions: QuestionConfig[]; isCustom: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as QuestionConfig[];
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].field) {
        return { questions: parsed, isCustom: true };
      }
    }
  } catch { /* ignore */ }
  return { questions: [...DEFAULT_QUESTIONS], isCustom: false };
}

const QuestionContext = createContext<QuestionContextType | null>(null);

export function QuestionProvider({ children }: { children: ReactNode }) {
  const initial = loadQuestions();
  const [questions, setQuestionsState] = useState<QuestionConfig[]>(initial.questions);
  const [isCustom, setIsCustom] = useState(initial.isCustom);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const setQuestions = (newQuestions: QuestionConfig[]) => {
    setQuestionsState(newQuestions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newQuestions));
    setIsCustom(true);
  };

  const resetToDefault = () => {
    setQuestionsState([...DEFAULT_QUESTIONS]);
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
            alert('Invalid question data: expected a JSON array.');
            return;
          }
          if (parsed.length === 0) {
            alert('Invalid question data: the array is empty.');
            return;
          }
          const first = parsed[0];
          if (!first.field || !first.label) {
            alert('Invalid question data: items must have "field" and "label" properties.');
            return;
          }
          setQuestions(parsed as QuestionConfig[]);
        } catch {
          alert('Failed to parse JSON file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <QuestionContext.Provider value={{ questions, setQuestions, importFromFile, resetToDefault, isCustom }}>
      {children}
    </QuestionContext.Provider>
  );
}

export function useQuestions() {
  const ctx = useContext(QuestionContext);
  if (!ctx) throw new Error('useQuestions must be used within QuestionProvider');
  return ctx;
}
