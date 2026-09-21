export type MovementPhase = 'idle' | 'tumble' | 'slide';

export function phaseAfterNewRoll(value: number): MovementPhase {
  return value >= 1 ? 'tumble' : 'idle';
}

export function phaseAfterTumble(phase: MovementPhase): MovementPhase {
  return phase === 'tumble' ? 'slide' : phase;
}

export function phaseAfterSlide(phase: MovementPhase): MovementPhase {
  return phase === 'slide' ? 'idle' : phase;
}

export function shouldShowMovementViz(phase: MovementPhase): boolean {
  return phase === 'tumble' || phase === 'slide';
}

export function shouldAllowTokenSlide(phase: MovementPhase): boolean {
  return phase === 'slide';
}

export function isMovementVizActive(phase: MovementPhase): boolean {
  return phase !== 'idle';
}
