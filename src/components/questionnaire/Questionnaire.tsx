import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import type { TripAnswers, GearItem } from '../../logic/types';
import { extractOptions } from '../../logic/matching';
import { buildQuestions } from './questions';
import QuestionStep from './QuestionStep';
import gearData from '../../assets/gear-data.json';

const items = gearData as GearItem[];

export default function Questionnaire() {
  const navigate = useNavigate();
  const { setAnswers, resetAnswers } = useTrip();
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<Partial<TripAnswers>>({
    activities: [],
    weather: [],
  });

  const availableOptions = useMemo(() => ({
    activities: extractOptions(items, 'activities'),
    weather: extractOptions(items, 'weather'),
    duration: extractOptions(items, 'duration'),
    shelter: extractOptions(items, 'shelter'),
    sleepProvision: extractOptions(items, 'sleepProvision'),
    location: extractOptions(items, 'location'),
    cooking: extractOptions(items, 'cooking'),
  }), []);

  const questions = useMemo(() => buildQuestions(availableOptions), [availableOptions]);

  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => !q.skip?.(draft));
  }, [questions, draft]);

  const currentQuestion = visibleQuestions[currentStep];

  const handleChange = (value: string | string[]) => {
    setDraft((prev) => ({ ...prev, [currentQuestion.field]: value }));
  };

  const handleNext = () => {
    if (currentStep < visibleQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const finalAnswers: TripAnswers = {
        activities: (draft.activities as string[]) || [],
        weather: (draft.weather as string[]) || [],
        duration: (draft.duration as string) || null,
        shelter: (draft.shelter as string) || null,
        sleepProvision: (draft.sleepProvision as string) || null,
        location: (draft.location as string) || null,
        cooking: (draft.cooking as string) || null,
      };

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
      navigate('/list');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartOver = () => {
    resetAnswers();
    setDraft({ activities: [], weather: [] });
    setCurrentStep(0);
  };

  if (!currentQuestion) {
    return (
      <div className="questionnaire">
        <p>No questions available.</p>
      </div>
    );
  }

  const isLast = currentStep === visibleQuestions.length - 1;
  const currentValue = draft[currentQuestion.field] ?? (currentQuestion.selectMode === 'multi' ? [] : null);

  const canProceed = currentQuestion.selectMode === 'multi'
    ? ((currentValue as string[]).length > 0)
    : (currentValue !== null);

  return (
    <div className="questionnaire">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / visibleQuestions.length) * 100}%` }}
        />
      </div>
      <p className="step-counter">
        Question {currentStep + 1} of {visibleQuestions.length}
      </p>

      <QuestionStep
        question={currentQuestion}
        value={currentValue}
        onChange={handleChange}
      />

      <div className="question-nav">
        {currentStep > 0 ? (
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
