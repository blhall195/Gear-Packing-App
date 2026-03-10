import type { QuestionConfig } from '../../logic/types';

interface Props {
  question: QuestionConfig;
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

function describeShowWhen(q: QuestionConfig): string | null {
  if (!q.showWhen) return null;
  const { field, includes, equals, notIncludes, notEquals } = q.showWhen;
  const label = field.replace(/_/g, ' ');
  if (includes) return `when ${label} includes "${includes.replace(/_/g, ' ')}"`;
  if (equals) return `when ${label} = "${equals.replace(/_/g, ' ')}"`;
  if (notIncludes) return `when ${label} excludes "${notIncludes.replace(/_/g, ' ')}"`;
  if (notEquals) return `when ${label} ≠ "${notEquals.replace(/_/g, ' ')}"`;
  return null;
}

export default function QuestionRow({
  question, depth, index, siblingCount, canIndent, canOutdent,
  onEdit, onDelete, onMove, onIndent, onOutdent,
}: Props) {
  const condition = describeShowWhen(question);

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
