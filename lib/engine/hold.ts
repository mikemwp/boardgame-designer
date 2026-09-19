export interface HoldState {
  floorId: string;
  quotas: Record<string, number>;
  counts: Record<string, number>;
  active: boolean;
}

export function createHoldState(floorId: string, quotas: Record<string, number>): HoldState {
  return { floorId, quotas, counts: {}, active: true };
}

export function recordHoldReveal(state: HoldState, packId: string): HoldState {
  return {
    ...state,
    counts: { ...state.counts, [packId]: (state.counts[packId] ?? 0) + 1 },
  };
}

export function canExitHold(state: HoldState): boolean {
  return Object.entries(state.quotas).every(([pack, quota]) => (state.counts[pack] ?? 0) >= quota);
}

export function clearHold(): HoldState | null {
  return null;
}
