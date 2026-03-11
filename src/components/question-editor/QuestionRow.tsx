import type { QuestionConfig } from '../../logic/types';

interface Props {
  question: QuestionConfig;
  allQuestions: QuestionConfig[];
  depth: number;
  index: number;
  siblingCount: number;
  canIndent: boolean;
  canOutdent: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onIndent: () => void;
  onOutdent: () => void;
}

function describeShowWhen(q: QuestionConfig, allQuestions: QuestionConfig[]): string | null {
  if (!q.showWhen) return null;
  const { field, includes, equals, notIncludes, notEquals } = q.showWhen;
  const parent = allQuestions.find((p) => p.field === field);
  const fieldLabel = parent?.label || field.replace(/_/g, ' ');

  const formatValue = (val: string) => {
    if (!val) return 'Any';
    if (parent) {
      const opt = parent.baseOptions.find((o) => o.value === val);
      if (opt) return opt.label;
    }
    return val.replace(/_/g, ' ');
  };

  if (includes !== undefined) return `when ${fieldLabel} includes ${formatValue(includes)}`;
  if (equals !== undefined) return `when ${fieldLabel} = ${formatValue(equals)}`;
  if (notIncludes !== undefined) return `when ${fieldLabel} excludes ${formatValue(notIncludes)}`;
  if (notEquals !== undefined) return `when ${fieldLabel} ≠ ${formatValue(notEquals)}`;
  return null;
}

export default function QuestionRow({
  question, allQuestions, depth, index, siblingCount, canIndent, canOutdent,
  onEdit, onDelete, onMove, onIndent, onOutdent,
}: Props) {
  const condition = describeShowWhen(question, allQuestions);

  return (
    <div className="question-row" style={{ marginLeft: `${depth * 1.5}rem` }}>
      <div className="question-row-main">
        <div className="question-row-info">
          <span className="question-row-label">{question.label || '(untitled)'}</span>
          {question.field && (
            <span className="gear-item-badge">{question.field.replace(/([A-Z])/g, ' $1').trim()}</span>
          )}
          <span className="gear-item-badge optional-badge">{question.selectMode}</span>
          {condition && (
            <span className="question-row-condition">{condition}</span>
          )}
        </div>
        <div className="question-row-actions">
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={onOutdent}
            disabled={!canOutdent}
            title="Outdent (make top-level)"
          >
            &#8592;
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={onIndent}
            disabled={!canIndent}
            title="Indent (make sub-question)"
          >
            &#8594;
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title="Move up"
          >
            &#9650;
          </button>
          <button
            type="button"
            className="btn btn-small btn-secondary"
            onClick={() => onMove(1)}
            disabled={index === siblingCount - 1}
            title="Move down"
          >
            &#9660;
          </button>
          <button type="button" className="btn btn-small btn-secondary" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="btn btn-small btn-danger" onClick={onDelete}>
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
