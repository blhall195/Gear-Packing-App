import type { TripAnswers } from '../../logic/types';

export interface QuestionDef {
  field: keyof TripAnswers;
  label: string;
  selectMode: 'single' | 'multi';
  options: { value: string; label: string }[];
  skip?: (answers: Partial<TripAnswers>) => boolean;
  autoValue?: (answers: Partial<TripAnswers>) => string | null;
}

export function buildQuestions(availableOptions: Record<string, string[]>): QuestionDef[] {
  const toOpts = (values: string[]) =>
    values.map((v) => ({ value: v, label: v.replace(/_/g, ' ') }));

  const mergeOpts = (base: string[], extra: string[]) => {
    const all = [...new Set([...base, ...extra])];
    return toOpts(all);
  };

  return [
    {
      field: 'activities',
      label: 'What activities are you doing?',
      selectMode: 'multi',
      options: toOpts(availableOptions.activities || []),
    },
    {
      field: 'climbingType',
      label: 'What type of climbing?',
      selectMode: 'multi',
      options: mergeOpts(['trad', 'sport', 'bouldering', 'scrambling'], availableOptions.climbingType || []),
      skip: (a) => !a.activities || !(a.activities as string[]).includes('climbing'),
    },
    {
      field: 'cavingType',
      label: 'What type of caving?',
      selectMode: 'multi',
      options: [
        { value: 'srt_trip', label: 'SRT Trip' },
        { value: 'non_srt_trip', label: 'Non-SRT Trip' },
        ...toOpts((availableOptions.cavingType || []).filter(v => v !== 'srt_trip' && v !== 'non_srt_trip')),
      ],
      skip: (a) => !a.activities || !(a.activities as string[]).includes('caving'),
    },
    {
      field: 'weather',
      label: "What are the conditions like?",
      selectMode: 'multi',
      options: toOpts(availableOptions.weather || []),
    },
    {
      field: 'duration',
      label: 'How long is the trip?',
      selectMode: 'single',
      options: mergeOpts(['single_day', 'multi_day'], availableOptions.duration || []),
    },
    {
      field: 'location',
      label: 'Home or abroad?',
      selectMode: 'single',
      options: mergeOpts(['home', 'abroad'], availableOptions.location || []),
      skip: (a) => a.duration === 'single_day',
    },
    {
      field: 'shelter',
      label: 'Where are you sleeping?',
      selectMode: 'single',
      options: toOpts(availableOptions.shelter || []),
      skip: (a) => a.duration === 'single_day',
    },
    {
      field: 'sleepProvision',
      label: 'What sleep provision is there?',
      selectMode: 'single',
      options: toOpts(availableOptions.sleepProvision || []),
      skip: (a) => a.duration === 'single_day',
      autoValue: (a) => (a.shelter === 'hotel' ? 'full_bedding' : null),
    },
    {
      field: 'cooking',
      label: 'Cooking situation?',
      selectMode: 'single',
      options: toOpts(availableOptions.cooking || []),
      skip: (a) => a.duration === 'single_day',
    },
  ];
}
