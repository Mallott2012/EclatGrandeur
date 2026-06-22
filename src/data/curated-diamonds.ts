export type CuratedLabel = 'Éclat Selection' | 'Best Balance' | 'Exceptional Value' | 'Rare Find'

export interface CuratedDiamond {
  id: string
  carat: number
  colour: 'D' | 'E' | 'F' | 'G' | 'H'
  clarity: 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2'
  /** GBP pence */
  price: number
  label?: CuratedLabel
  /** Product slugs this stone is curated for */
  settingSlugs: string[]
}

export const CURATED_ROUND_BRILLIANTS: CuratedDiamond[] = [
  { id: 'cr-01', carat: 0.75, colour: 'F', clarity: 'VS1',  price:  420000, settingSlugs: ['aurora-solitaire-ring', 'monarch-halo-ring'] },
  { id: 'cr-02', carat: 1.01, colour: 'G', clarity: 'VS2',  price:  580000, label: 'Best Balance',      settingSlugs: ['aurora-solitaire-ring', 'monarch-halo-ring'] },
  { id: 'cr-03', carat: 1.20, colour: 'F', clarity: 'VS1',  price:  820000, label: 'Éclat Selection',   settingSlugs: ['aurora-solitaire-ring', 'aria-oval-solitaire-ring'] },
  { id: 'cr-04', carat: 1.51, colour: 'E', clarity: 'VVS2', price: 1180000, settingSlugs: ['aurora-solitaire-ring', 'monarch-halo-ring'] },
  { id: 'cr-05', carat: 1.72, colour: 'F', clarity: 'VS2',  price: 1390000, settingSlugs: ['aurora-solitaire-ring'] },
  { id: 'cr-06', carat: 2.01, colour: 'G', clarity: 'VS1',  price: 1920000, label: 'Exceptional Value', settingSlugs: ['aurora-solitaire-ring', 'monarch-halo-ring'] },
  { id: 'cr-07', carat: 2.15, colour: 'E', clarity: 'VVS1', price: 2550000, label: 'Éclat Selection',   settingSlugs: ['aurora-solitaire-ring'] },
  { id: 'cr-08', carat: 2.51, colour: 'D', clarity: 'IF',   price: 3800000, label: 'Rare Find',         settingSlugs: ['aurora-solitaire-ring'] },
  { id: 'cr-09', carat: 3.02, colour: 'E', clarity: 'VVS2', price: 5400000, settingSlugs: ['aurora-solitaire-ring'] },
  { id: 'cr-10', carat: 3.51, colour: 'D', clarity: 'VVS1', price: 7200000, label: 'Rare Find',         settingSlugs: ['aurora-solitaire-ring'] },
]
