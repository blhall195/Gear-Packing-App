import type { TripAnswers } from '../../logic/types';
import type { QuestionConfig, ShowWhenCondition, AutoValueCondition } from '../../logic/types';

export interface QuestionDef {
  field: keyof TripAnswers;
  label: string;
  selectMode: 'single' | 'multi';
  options: { value: string; label: string }[];
  skip?: (answers: Partial<TripAnswers>) => boolean;
  autoValue?: (answers: Partial<TripAnswers>) => string | null;
}

function evaluateShowWhen(condition: ShowWhenCondition): (answers: Partial<TripAnswers>) => boolean {
  return (answers) => {
    const val = answers[condition.field];

    // If the referenced field hasn't been answered yet, hide the question
    if (val === undefined || val === null) return true;

    if (condition.includes !== undefined) {
      if (Array.isArray(val)) {
        return !(val as string[]).includes(condition.includes);
      }
      return val !== condition.includes;
    }

    if (condition.equals !== undefined) {
      if (Array.isArray(val)) {
        return !(val as string[]).includes(condition.equals);
      }
      return val !== condition.equals;
    }

    if (condition.notIncludes !== undefined) {
      if (Array.isArray(val)) {
        return (val as string[]).includes(condition.notIncludes);
      }
      return val === condition.notIncludes;
    }

    if (condition.notEquals !== undefined) {
      if (Array.isArray(val)) {
        return (val as string[]).includes(condition.notEquals);
      }
      return val === condition.notEquals;
    }

    return false;
  };
}

function evaluateAutoWhen(condition: AutoValueCondition): (answers: Partial<TripAnswers>) => string | null {
  return (answers) => {
    const val = answers[condition.field];
    if (val === condition.equals) return condition.setValue;
    if (Array.isArray(val) && (val as string[]).includes(condition.equals)) return condition.setValue;
    return null;
  };
}

export function buildQuestions(
  configs: QuestionConfig[],
): QuestionDef[] {
  // Sort: top-level by order, then children after their parent by order
  const sorted = flattenTree(configs);

  return sorted.map((config) => {
    const def: QuestionDef = {
      field: config.field as keyof TripAnswers,
      label: config.label,
      selectMode: config.selectMode,
      options: config.baseOptions,
    };

    if (config.showWhen) {
      def.skip = evaluateShowWhen(config.showWhen);
    }

    if (config.autoWhen) {
      def.autoValue = evaluateAutoWhen(config.autoWhen);
    }

    return def;
  });
}

/** Flatten question tree: top-level sorted by order, children inserted after parent */
function flattenTree(configs: QuestionConfig[]): QuestionConfig[] {
  const roots = configs.filter((c) => !c.parentId).sort((a, b) => a.order - b.order);
  const result: QuestionConfig[] = [];

  function addWithChildren(node: QuestionConfig) {
    result.push(node);
    const children = configs
      .filter((c) => c.parentId === node.id)
      .sort((a, b) => a.order - b.order);
    for (const child of children) {
      addWithChildren(child);
    }
  }

  for (const root of roots) {
    addWithChildren(root);
  }

  return result;
}
