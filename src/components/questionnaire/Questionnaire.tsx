import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { useQuestions } from '../../context/QuestionContext';
import type { TripAnswers } from '../../logic/types';
import { CONDITION_FIELDS } from '../../logic/types';
import { buildQuestions } from './questions';
import QuestionStep from './QuestionStep';

const DRAFT_KEY = 'questionnaire-draft';
const STEP_KEY = 'questionnaire-step';

function emptyDraft(): Partial<TripAnswers> {
  const init: Partial<TripAnswers> = {};
  for (const cf of CONDITION_FIELDS) {
    if (cf.multi) {
      (init as Record<string, unknown>)[cf.key] = [];
    }
  }
  return init;
}

function loadDraft(): Partial<TripAnswers> {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (stored) return JSON.parse(stored) as Partial<TripAnswers>;
  } catch { /* ignore */ }
  return emptyDraft();
}

function loadStep(): number {
  try {
    const stored = localStorage.getItem(STEP_KEY);
    if (stored) return Number(stored) || 0;
  } catch { /* ignore */ }
  return 0;
}

export default function Questionnaire() {
  const navigate = useNavigate();
  const { setAnswers, resetAnswers } = useTrip();
  const { questions: questionConfigs } = useQuestions();
  const [currentStep, setCurrentStepState] = useState(loadStep);
  const [draft, setDraftState] = useState<Partial<TripAnswers>>(loadDraft);

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    localStorage.setItem(STEP_KEY, String(step));
  }, []);

  const setDraft = useCallback((updater: (prev: Partial<TripAnswers>) => Partial<TripAnswers>) => {
    setDraftState(prev => {
      const next = updater(prev);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const questions = useMemo(
    () => buildQuestions(questionConfigs),
    [questionConfigs],
  );

  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => !q.skip?.(draft));
  }, [questions, draft]);

  // Clamp step in case saved step exceeds visible questions (e.g. questions changed)
  const clampedStep = Math.min(currentStep, Math.max(visibleQuestions.length - 1, 0));
  if (clampedStep !== currentStep) {
    setCurrentStep(clampedStep);
  }

  const currentQuestion = visibleQuestions[clampedStep];

  const handleChange = (value: string | string[]) => {
    setDraft((prev) => ({ ...prev, [currentQuestion.field]: value }));
  };

  const handleNext = () => {
    if (clampedStep < visibleQuestions.length - 1) {
      setCurrentStep(clampedStep + 1);
    } else {
      const finalAnswers: TripAnswers = {
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
      for (const cf of CONDITION_FIELDS) {
        if (cf.multi) {
          (finalAnswers as Record<string, unknown>)[cf.key] = (draft[cf.key] as string[]) || [];
        } else {
          (finalAnswers as Record<string, unknown>)[cf.key] = (draft[cf.key] as string) || null;
        }
      }

      // Apply auto-values for skipped questions
      for (const q of questions) {
        if (q.skip?.(draft)) {
          if (q.autoValue) {
            const auto = q.autoValue(draft);
            if (auto) {
              (finalAnswers as Record<string, unknown>)[q.field] = auto;
            }
          }
        }
      }

      setAnswers(finalAnswers);
      clearDraftStorage();
      navigate('/list');
    }
  };

  const handleBack = () => {
    if (clampedStep > 0) {
      setCurrentStep(clampedStep - 1);
    }
  };

  const clearDraftStorage = () => {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(STEP_KEY);
  };

  const handleStartOver = () => {
    resetAnswers();
    setDraft(() => emptyDraft());
    setCurrentStep(0);
    clearDraftStorage();
    localStorage.removeItem('checked-items');
  };

  if (!currentQuestion) {
    return (
      <div className="questionnaire">
        <p>No questions available.</p>
      </div>
    );
  }

  const isLast = clampedStep === visibleQuestions.length - 1;
  const currentValue = draft[currentQuestion.field] ?? (currentQuestion.selectMode === 'multi' ? [] : null);

  const canProceed = currentQuestion.selectMode === 'multi'
    ? ((currentValue as string[]).length > 0)
    : (currentValue !== null);

  return (
    <div className="questionnaire">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((clampedStep + 1) / visibleQuestions.length) * 100}%` }}
        />
      </div>
      <p className="step-counter">
        Question {clampedStep + 1} of {visibleQuestions.length}
      </p>

      <QuestionStep
        question={currentQuestion}
        value={currentValue}
        onChange={handleChange}
      />

      <div className="question-nav">
        {clampedStep > 0 ? (
          <button type="button" className="btn btn-secondary" onClick={handleBack}>
            Back
          </button>
        ) : (
          <button type="button" className="btn btn-secondary" onClick={handleStartOver}>
            Start Over
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {isLast ? 'Generate List' : 'Next'}
        </button>
      </div>
    </div>
  );
}
