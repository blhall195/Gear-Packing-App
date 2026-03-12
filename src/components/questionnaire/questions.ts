import type { TripAnswers } from '../../logic/types';
import type { QuestionConfig, ShowWhenCondition, AutoValueCondition } from '../../logic/types';

export interface QuestionDef {
  id: string;
  parentId: string | null;
  field: keyof TripAnswers;
  label: string;
  selectMode: 'single' | 'multi';
  options: { value: string; label: string }[];
  skip?: (answers: Partial<TripAnswers>) => boolean;
  autoValue?: (answers: Partial<TripAnswers>) => string | null;
}

/** Check if a value is a meaningful (non-empty) answer */
function hasAnswer(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (val === '') return false;
  return true;
}

function evaluateShowWhen(condition: ShowWhenCondition): (answers: Partial<TripAnswers>) => boolean {
  return (answers) => {
    const val = answers[condition.field];

    // If the referenced field hasn't been answered yet, hide the question
    if (!hasAnswer(val)) return true;

    // Empty string means "Any" — show when field has any non-empty answer
    if (condition.includes !== undefined) {
      if (!condition.includes) return false; // "Any" — field is answered, so show
      if (Array.isArray(val)) {
        return !(val as string[]).includes(condition.includes);
      }
      return val !== condition.includes;
    }

    if (condition.equals !== undefined) {
      if (!condition.equals) return false;
      if (Array.isArray(val)) {
        return !(val as string[]).includes(condition.equals);
      }
      return val !== condition.equals;
    }

    if (condition.notIncludes !== undefined) {
      if (!condition.notIncludes) return false;
      if (Array.isArray(val)) {
        return (val as string[]).includes(condition.notIncludes);
      }
      return val === condition.notIncludes;
    }

    if (condition.notEquals !== undefined) {
      if (!condition.notEquals) return false;
      if (Array.isArray(val)) {
        return (val as string[]).includes(condition.notEquals);
      }
      return val === condition.notEquals;
    }

    // No condition key — treat as "Any"
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

  // Build defs first, then chain parent skip logic
  const defs: QuestionDef[] = sorted.map((config) => {
    const def: QuestionDef = {
      id: config.id,
      parentId: config.parentId,
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

  // Chain: a question is skipped if it or any ancestor is skipped
  const defMap = new Map(defs.map((d) => [d.id, d]));
  for (const def of defs) {
    if (!def.parentId) continue;
    const parent = defMap.get(def.parentId);
    if (!parent?.skip) continue;
    const ownSkip = def.skip;
    const parentSkip = parent.skip;
    def.skip = ownSkip
      ? (answers) => parentSkip(answers) || ownSkip(answers)
      : parentSkip;
  }

  return defs;
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
