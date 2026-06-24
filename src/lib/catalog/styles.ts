// Central style definitions shared by the public listing pages and the admin
// console so the two always show an identical style scroller.

export interface StyleDef {
  id:    string;
  label: string;
}

export const RING_STYLES: StyleDef[] = [
  { id: 'round',    label: 'Round Brilliant' },
  { id: 'oval',     label: 'Oval' },
  { id: 'emerald',  label: 'Emerald' },
  { id: 'cushion',  label: 'Cushion' },
  { id: 'pear',     label: 'Pear' },
  { id: 'princess', label: 'Princess' },
  { id: 'marquise', label: 'Marquise' },
  { id: 'radiant',  label: 'Radiant' },
];

export const NECKLACE_STYLES: StyleDef[] = [
  { id: 'solitaire', label: 'Solitaire Pendant' },
  { id: 'riviere',   label: 'Rivière' },
  { id: 'halo',      label: 'Halo Pendant' },
  { id: 'drop',      label: 'Drop Pendant' },
  { id: 'bar',       label: 'Bar Necklace' },
];

export const EARRING_STYLES: StyleDef[] = [
  { id: 'stud',       label: 'Stud Earrings' },
  { id: 'drop',       label: 'Drop Earrings' },
  { id: 'halo',       label: 'Halo Earrings' },
  { id: 'chandelier', label: 'Chandelier' },
  { id: 'hoop',       label: 'Hoop Earrings' },
];

export const BRACELET_STYLES: StyleDef[] = [
  { id: 'tennis',   label: 'Tennis Bracelet' },
  { id: 'bangle',   label: 'Bangle' },
  { id: 'link',     label: 'Link Bracelet' },
  { id: 'pave',     label: 'Pavé Bracelet' },
  { id: 'eternity', label: 'Eternity Bracelet' },
];
