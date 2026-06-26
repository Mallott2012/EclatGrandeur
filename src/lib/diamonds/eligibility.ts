import { normaliseGrade, normaliseFluorescence } from './normalise';

export interface EligibilityInput {
  cut: string;
  cut_grade: string | null | undefined;
  polish: string | null | undefined;
  symmetry: string | null | undefined;
  fluorescence: string | null | undefined;
  eclat_approved: boolean;
}

export function isEclatEligible(d: EligibilityInput): boolean {
  if (normaliseGrade(d.polish) !== 'excellent') return false;
  if (normaliseGrade(d.symmetry) !== 'excellent') return false;
  if (normaliseFluorescence(d.fluorescence) !== 'none') return false;

  // All shapes require Excellent Cut. For round brilliants this is proven by
  // the formal GIA certificate cut grade. For fancy shapes (oval, cushion,
  // pear, radiant, emerald) GIA does not issue a cut grade, so Éclat approval
  // confirms the internal Excellent Cut standard instead.
  if (d.cut === 'round') {
    return normaliseGrade(d.cut_grade) === 'excellent';
  }
  return d.eclat_approved === true;
}
