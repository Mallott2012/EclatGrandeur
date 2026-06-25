const GRADE_MAP: Record<string, string> = {
  ex:           'excellent',
  excellent:    'excellent',
  vg:           'very_good',
  'very good':  'very_good',
  g:            'good',
  good:         'good',
  f:            'fair',
  fair:         'fair',
  p:            'poor',
  poor:         'poor',
};

const FLUORESCENCE_MAP: Record<string, string> = {
  'none':          'none',
  'none (inert)':  'none',
  'nil':           'none',
  'faint':         'faint',
  'sl':            'slight',
  'slight':        'slight',
  'med':           'medium',
  'medium':        'medium',
  'st':            'strong',
  'strong':        'strong',
  'vst':           'very_strong',
  'very strong':   'very_strong',
};

export function normaliseGrade(value: string | null | undefined): string | null {
  if (value == null) return null;
  return GRADE_MAP[value.trim().toLowerCase()] ?? null;
}

export function normaliseFluorescence(value: string | null | undefined): string | null {
  if (value == null) return null;
  return FLUORESCENCE_MAP[value.trim().toLowerCase()] ?? null;
}
