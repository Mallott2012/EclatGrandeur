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

  if (d.cut === 'round') {
    return normaliseGrade(d.cut_grade) === 'excellent';
  }
  // Fancy shapes require explicit Éclat approval (no formal GIA cut grade)
  return d.eclat_approved === true;
}
