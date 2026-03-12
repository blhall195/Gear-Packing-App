import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { useQuestions } from '../../context/QuestionContext';
import type { TripAnswers } from '../../logic/types';
import { CONDITION_FIELDS } from '../../logic/types';
import type { QuestionDef } from './questions';
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

/** Get all descendants of a question (children, grandchildren, etc.) */
function getDescendants(parentId: string, allQuestions: QuestionDef[]): QuestionDef[] {
  const children = allQuestions.filter((q) => q.parentId === parentId);
  const result: QuestionDef[] = [];
  for (const child of children) {
    result.push(child);
    result.push(...getDescendants(child.id, allQuestions));
  }
  return result;
}

export default function Questionnaire() {
  const navigate = useNavigate();
  const { setAnswers, resetAnswers } = useTrip();
  const { questions: questionConfigs } = useQuestions();
  const [currentStep, setCurrentStepState] = useState(loadStep);
  const [draft, setDraftState] = useState<Partial<TripAnswers>>(loadDraft);
  const [slideDir, setSlideDir] = useState<'forward' | 'back'>('forward');

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

  // Root questions (no parent) that aren't skipped
  const rootQuestions = useMemo(() => {
    return questions.filter((q) => q.parentId === null && !q.skip?.(draft));
  }, [questions, draft]);

  // Clamp step
  const clampedStep = Math.min(currentStep, Math.max(rootQuestions.length - 1, 0));
  if (clampedStep !== currentStep) {
    setCurrentStep(clampedStep);
  }

  const currentRoot = rootQuestions[clampedStep];

  // Build the visible questions for the current panel (root + visible descendants)
  const panelQuestions = useMemo(() => {
    if (!currentRoot) return [];
    const descendants = getDescendants(currentRoot.id, questions);
    const visible = descendants.filter((q) => !q.skip?.(draft));
    return [currentRoot, ...visible];
  }, [currentRoot, questions, draft]);

  const handleChange = (field: keyof TripAnswers, value: string | string[]) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };

      // Clear answers for child questions that become hidden after this change
      if (currentRoot) {
        const allDescendants = getDescendants(currentRoot.id, questions);
        for (const desc of allDescendants) {
          if (desc.skip?.(next)) {
            if (desc.selectMode === 'multi') {
              (next as Record<string, unknown>)[desc.field] = [];
            } else {
              (next as Record<string, unknown>)[desc.field] = null;
            }
          }
        }
      }

      return next;
    });
  };

  const handleNext = () => {
    if (clampedStep < rootQuestions.length - 1) {
      setSlideDir('forward');
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

      // Copy any additional question fields not in CONDITION_FIELDS (e.g. nested custom questions)
      for (const q of questions) {
        const key = q.field;
        if (key in finalAnswers) continue; // already set above
        const draftVal = draft[key];
        if (q.selectMode === 'multi') {
          (finalAnswers as Record<string, unknown>)[key] = (draftVal as string[]) || [];
        } else {
          (finalAnswers as Record<string, unknown>)[key] = (draftVal as string) || null;
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
      setSlideDir('back');
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

  if (!currentRoot) {
    return (
      <div className="questionnaire">
        <p>No questions available.</p>
      </div>
    );
  }

  const isLast = clampedStep === rootQuestions.length - 1;

  // Can proceed only if all visible panel questions are answered
  const canProceed = panelQuestions.every((q) => {
    const val = draft[q.field];
    if (q.selectMode === 'multi') {
      return ((val as string[]) || []).length > 0;
    }
    return val !== null && val !== undefined;
  });

  return (
    <div className="questionnaire">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((clampedStep + 1) / rootQuestions.length) * 100}%` }}
        />
      </div>
      <p className="step-counter">
        Question {clampedStep + 1} of {rootQuestions.length}
      </p>

      <div
        key={clampedStep}
        className={`question-panel slide-${slideDir}`}
      >
        {panelQuestions.map((q) => {
          const val = draft[q.field] ?? (q.selectMode === 'multi' ? [] : null);
          return (
            <QuestionStep
              key={q.field}
              question={q}
              value={val}
              onChange={(value) => handleChange(q.field, value)}
            />
          );
        })}
      </div>

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
