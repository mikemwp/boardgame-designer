export type GameCommand =
  | { type: 'ROLL_DICE' }
  | { type: 'REVEAL_CARD'; packId: string }
  | { type: 'PASS_CARD'; packId: string }
  | { type: 'SPIN_OUTCOME'; spinnerId: string }
  | { type: 'SET_INVENTORY'; itemIds: string[] }
  | { type: 'ENTER_ROOM' }
  | { type: 'PASS_ROOM' }
  | { type: 'LEAVE_ROOM' };

export type GameEvent =
  | { type: 'DICE_ROLLED'; value: number; sides: number }
  | { type: 'TOKEN_MOVED'; playerId: string; floorId: string; cellId: string }
  | { type: 'CARD_DEALT'; packId: string; cardId: string }
  | { type: 'HOLD_ENTERED'; floorId: string }
  | { type: 'HOLD_EXITED' }
  | { type: 'SPINNER_LANDED'; spinnerId: string; label: string }
  | { type: 'INVENTORY_SET' };
