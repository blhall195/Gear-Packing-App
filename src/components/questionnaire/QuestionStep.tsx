import type { QuestionDef } from './questions';

interface Props {
  question: QuestionDef;
  value: string | string[] | null;
  onChange: (value: string | string[]) => void;
}

export default function QuestionStep({ question, value, onChange }: Props) {
  const { label, selectMode, options } = question;

  const handleClick = (optValue: string) => {
    if (selectMode === 'multi') {
      const current = (value as string[]) || [];
      if (current.includes(optValue)) {
        onChange(current.filter((v) => v !== optValue));
      } else {
        onChange([...current, optValue]);
      }
    } else {
      onChange(optValue);
    }
  };

  const isSelected = (optValue: string) => {
    if (selectMode === 'multi') {
      return ((value as string[]) || []).includes(optValue);
    }
    return value === optValue;
  };

  return (
    <div className="question-step">
      <h2 className="question-label">{label}</h2>
      {selectMode === 'multi' && (
        <p className="question-hint">Select all that apply</p>
      )}
      <div className="question-options">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`option-btn ${isSelected(opt.value) ? 'selected' : ''}`}
            onClick={() => handleClick(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
