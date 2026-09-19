export type GameCommand =
  | { type: 'ROLL_DICE' }
  | { type: 'REVEAL_CARD'; packId: string }
  | { type: 'PASS_CARD'; packId: string }
  | { type: 'MOVE_SAMPLE_STAIR' };

export type GameEvent =
  | { type: 'DICE_ROLLED'; value: number; sides: number }
  | { type: 'TOKEN_MOVED'; playerId: string; floorId: string; cellId: string }
  | { type: 'HOLD_ENTERED'; floorId: string }
  | { type: 'HOLD_EXITED' };
