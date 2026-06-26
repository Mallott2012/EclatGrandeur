// Types
export type {
  PairStatus,
  StoneSlotRole,
  SlotSelectionMode,
  SlotPriceMode,
  DiamondPairRecord,
  DiamondPair,
  JewelleryStoneSlotRecord,
  JewelleryStoneSlot,
  SlotConstraints,
  CreatePairInput,
  CreateSlotInput,
} from './types';
export { parseDiamondPair, parseJewelleryStoneSlot } from './types';

// Eligibility (pure — importable in non-server contexts)
export type { PairLockInput, PairMemberInput, PairEligibilityInput } from './eligibility';
export { isPairLockingDiamonds, isPairEligible, arePairMembersAvailable } from './eligibility';

// Compatibility (pure — importable in non-server contexts)
export type { PairCompatibilityInput } from './compatibility';
export { isPairCompatibleWithSlot, validateSlotCoverage } from './compatibility';
