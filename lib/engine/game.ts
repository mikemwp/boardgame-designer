import {
  defaultGameConfig,
  type GameConfig,
  type GameStart,
  type Cell,
  type Floor,
  type InventoryItem,
  type ItemAssign,
  type RoomDef,
  type SpinnerDef,
  type TokenPos,
} from './types';
import { createBoard, getFloor, type Board } from './board';
import { initPlayerPasses, moveToken, setPlayerPassesLeft, type PlayerState } from './players';
import { assignStartingItems } from './inventory';
import { sampleSegment } from './spinner';
import { canSpendPass, createPassesLeft, spendPass } from './passes';
import { movementRange, sampleMovement, type Rng } from './dice';
import { applyAction, countsTowardReveal, dealFromPack, type CardState } from './cards';
import { canExitHold, createHoldState, recordHoldReveal, type HoldState } from './hold';
import { landingPackId } from './layout';
import { allowedMoveValues, walkSteps } from './movement';
import type { GameCommand, GameEvent } from './events';
import { cueForCard, cuesForLanding, type AudioCue } from './audio';

export interface LastRoll {
  value: number;
  sides: number;
  id: number;
  faces: number[];
}

export interface LastSpin {
  spinnerId: string;
  spinnerName: string;
  label: string;
  id: number;
}

export interface AwaitingRoom {
  roomId: string;
  cellId: string;
}

export interface InsideRoom {
  roomId: string;
  cellId: string;
}

export interface GameState {
  config: GameConfig;
  board: Board;
  players: PlayerState;
  cards: CardState;
  hold: HoldState | null;
  lastEvent: GameEvent | null;
  lastRoll: LastRoll | null;
  lastSpin: LastSpin | null;
  lastAudioCues: AudioCue[];
  audioCueId: number;
  rng: Rng;
  spinners: SpinnerDef[];
  items: InventoryItem[];
  itemAssign: ItemAssign;
  awaitingRoom: AwaitingRoom | null;
  insideRoom: InsideRoom | null;
  awaitingDoorExit: boolean;
}

export interface GameBootstrap {
  board: Board;
  players: PlayerState;
  cards: CardState;
  config?: Partial<GameConfig>;
  rng?: Rng;
  gameStart?: GameStart;
  spinners?: SpinnerDef[];
  items?: InventoryItem[];
  itemAssign?: ItemAssign;
}

export function createGame(bootstrap: GameBootstrap, overrides?: Partial<GameConfig> & { rng?: Rng }): GameState {
  const config = { ...defaultGameConfig(), ...bootstrap.config, ...overrides };
  const rng = overrides?.rng ?? bootstrap.rng ?? Math.random;
  const items = bootstrap.items ?? [];
  const itemAssign = bootstrap.itemAssign ?? 'random';
  let players = config.passesEnabled && Object.keys(config.passesPerPack).length > 0
    ? initPlayerPasses(bootstrap.players, createPassesLeft(config.passesPerPack))
    : bootstrap.players;
  players = assignStartingItems(players, items, itemAssign, rng);
  return {
    config,
    board: bootstrap.board,
    players,
    cards: bootstrap.cards,
    hold: null,
    lastEvent: null,
    lastRoll: null,
    lastSpin: null,
    lastAudioCues: [],
    audioCueId: 0,
    rng,
    spinners: bootstrap.spinners ?? [],
    items,
    itemAssign,
    awaitingRoom: null,
    insideRoom: null,
    awaitingDoorExit: false,
  };
}

function roomOf(board: Board, roomId: string | undefined): RoomDef | undefined {
  if (!roomId) return undefined;
  return (board.rooms ?? []).find((room) => room.id === roomId);
}

export function roomEntrance(room: RoomDef): Cell | undefined {
  return (
    room.cells?.find((cell) => cell.kind === 'door') ??
    room.cells?.find((cell) => cell.start) ??
    room.cells?.[0]
  );
}

export function roomPlayFloor(room: RoomDef): Floor {
  return {
    id: room.id,
    index: 0,
    label: room.name,
    cells: room.cells ?? [],
    shape: room.shape,
  };
}

export function isOnRoomEntrance(state: Pick<GameState, 'insideRoom' | 'board'>): boolean {
  if (!state.insideRoom) return false;
  const room = roomOf(state.board, state.insideRoom.roomId);
  if (!room) return false;
  return roomEntrance(room)?.id === state.insideRoom.cellId;
}

export function tryExitHold(state: GameState): GameState {
  if (!state.hold || !canExitHold(state.hold)) return state;
  return { ...state, hold: null, lastEvent: { type: 'HOLD_EXITED' } };
}

function withCues(state: GameState, cues: AudioCue[]): GameState {
  return {
    ...state,
    lastAudioCues: cues,
    audioCueId: state.audioCueId + 1,
  };
}

function dealOnLand(state: GameState, packId: string, landCues: AudioCue[]): GameState {
  const cards = dealFromPack(state.cards, packId, state.config.actionMode);
  let hold = state.hold;
  if (hold && state.config.actionMode === 'neither' && cards.currentCard) {
    hold = recordHoldReveal(hold, packId);
  }
  const lastEvent: GameEvent = cards.currentCard
    ? { type: 'CARD_DEALT', packId, cardId: cards.currentCard.id }
    : state.lastEvent;
  const cues = [...landCues, ...cueForCard(cards.currentCard)];
  return tryExitHold(withCues({ ...state, cards, hold, lastEvent }, cues));
}

function applyOutcomeSpin(state: GameState, spinnerId: string | undefined): GameState {
  if (!spinnerId) return state;
  const spinner = state.spinners.find((entry) => entry.id === spinnerId);
  if (!spinner) return state;
  const segment = sampleSegment(spinner, state.rng);
  if (!segment) return state;
  return {
    ...state,
    lastSpin: {
      spinnerId: spinner.id,
      spinnerName: spinner.name,
      label: segment.label,
      id: (state.lastSpin?.id ?? 0) + 1,
    },
    lastEvent: { type: 'SPINNER_LANDED', spinnerId: spinner.id, label: segment.label },
  };
}

function afterMove(state: GameState, playerId: string, landing: TokenPos): GameState {
  const floor = getFloor(state.board, landing.floorId);
  const cell = floor?.cells.find((c) => c.id === landing.cellId);
  if (!cell) return state;
  state = applyOutcomeSpin(state, cell.spinnerId);

  const landCues = cuesForLanding(state.board, landing.floorId, landing.cellId);

  if (cell.kind === 'stair' && cell.stairId) {
    const stair = state.board.stairs.find((s) => s.id === cell.stairId);
    const heldExit = Boolean(
      state.config.holdEnabled && state.hold?.active && state.hold.floorId === landing.floorId,
    );
    if (!stair || !stair.legal || heldExit) {
      return withCues(
        {
          ...state,
          lastEvent: { type: 'TOKEN_MOVED', playerId, floorId: landing.floorId, cellId: landing.cellId },
        },
        landCues,
      );
    }
    const dest: TokenPos = { floorId: stair.toFloorId, cellId: stair.toCellId };
    const players = moveToken(state.players, playerId, dest);
    const destFloor = getFloor(state.board, dest.floorId);
    let hold = state.hold;
    let lastEvent: GameEvent = {
      type: 'TOKEN_MOVED',
      playerId,
      floorId: dest.floorId,
      cellId: dest.cellId,
    };
    if (state.config.holdEnabled && destFloor?.holdEnabled) {
      hold = createHoldState(destFloor.id, destFloor.holdQuotas ?? { climb: 1 });
      lastEvent = { type: 'HOLD_ENTERED', floorId: destFloor.id };
    }
    const destCues = cuesForLanding(state.board, dest.floorId, dest.cellId);
    const cues = [...landCues, ...destCues];
    const moved: GameState = { ...state, players, hold, lastEvent };
    const destCell = destFloor?.cells.find((c) => c.id === dest.cellId);
    const spun = applyOutcomeSpin(moved, destCell?.spinnerId);
    const destPack = destFloor && destCell ? landingPackId(destFloor, destCell) : undefined;
    if (destPack) {
      return dealOnLand(spun, destPack, cues);
    }
    return withCues(spun, cues);
  }

  if (cell.kind === 'room' && cell.roomId) {
    return {
      ...state,
      awaitingRoom: { roomId: cell.roomId, cellId: cell.id },
      lastEvent: { type: 'TOKEN_MOVED', playerId, floorId: landing.floorId, cellId: landing.cellId },
      lastAudioCues: [],
    };
  }

  const packId = landingPackId(floor, cell);
  if (packId) {
    return dealOnLand(state, packId, landCues);
  }

  return withCues(
    {
      ...state,
      lastEvent: { type: 'TOKEN_MOVED', playerId, floorId: landing.floorId, cellId: landing.cellId },
    },
    landCues,
  );
}

function afterMoveInside(state: GameState, playerId: string, floor: Floor, cell: Cell): GameState {
  state = applyOutcomeSpin(state, cell.spinnerId);
  const landCues = cuesForLanding(createBoard([floor], state.board.stairs, state.board.rooms), floor.id, cell.id);
  const packId = landingPackId(floor, cell);
  const moved: GameState = {
    ...state,
    lastEvent: { type: 'TOKEN_MOVED', playerId, floorId: floor.id, cellId: cell.id },
  };
  if (cell.kind === 'door') {
    if (cell.doorExit === 'auto-leave') {
      return withCues({ ...moved, insideRoom: null, awaitingDoorExit: false }, landCues);
    }
    const prompted = { ...moved, awaitingDoorExit: true };
    if (packId) return dealOnLand(prompted, packId, landCues);
    return withCues(prompted, landCues);
  }
  if (packId) return dealOnLand(moved, packId, landCues);
  return withCues(moved, landCues);
}

export function dispatch(state: GameState, cmd: GameCommand): GameState {
  switch (cmd.type) {
    case 'ROLL_DICE': {
      if (state.awaitingRoom || state.awaitingDoorExit) return state;
      const active = state.players.activePlayerId;
      if (!active) return state;
      const player = state.players.players.find((p) => p.id === active);
      if (!player) return state;
      const { min, max } = movementRange(state.config.movementViz, state.config.diceCount);
      const inside = state.insideRoom ? roomOf(state.board, state.insideRoom.roomId) : undefined;
      const moveBoard = inside
        ? createBoard([roomPlayFloor(inside)], [], state.board.rooms)
        : state.board;
      const from = inside && state.insideRoom
        ? { floorId: inside.id, cellId: state.insideRoom.cellId }
        : player.token;
      const allowed = allowedMoveValues(
        moveBoard,
        from,
        max,
        state.hold,
        state.config.holdEnabled,
        min,
      );
      const { value, faces, sides } = sampleMovement(
        state.config.movementViz,
        state.config.diceCount,
        allowed,
        state.rng,
      );
      const lastRoll: LastRoll = {
        value,
        sides,
        faces,
        id: (state.lastRoll?.id ?? 0) + 1,
      };
      const rolled: GameState = {
        ...state,
        lastRoll,
        lastEvent: { type: 'DICE_ROLLED', value, sides },
      };
      if (value === 0) return rolled;
      if (state.insideRoom) {
        const room = roomOf(state.board, state.insideRoom.roomId);
        if (!room) return rolled;
        const floor = roomPlayFloor(room);
        const landingCell = walkSteps(floor, state.insideRoom.cellId, value);
        if (!landingCell) return rolled;
        const next: GameState = {
          ...rolled,
          insideRoom: { ...state.insideRoom, cellId: landingCell.id },
        };
        return afterMoveInside(next, active, floor, landingCell);
      }
      const floor = getFloor(state.board, player.token.floorId);
      if (!floor) return rolled;
      const landingCell = walkSteps(floor, player.token.cellId, value);
      if (!landingCell) return rolled;
      const landing: TokenPos = { floorId: player.token.floorId, cellId: landingCell.id };
      const players = moveToken(rolled.players, active, landing);
      return afterMove({ ...rolled, players }, active, landing);
    }
    case 'PASS_ROOM': {
      if (!state.awaitingRoom) return state;
      return { ...state, awaitingRoom: null };
    }
    case 'ENTER_ROOM': {
      if (!state.awaitingRoom) return state;
      const room = roomOf(state.board, state.awaitingRoom.roomId);
      const hostFloor = getFloor(state.board, state.players.players.find((p) => p.id === state.players.activePlayerId)?.token.floorId ?? '');
      const host = hostFloor?.cells.find((cell) => cell.id === state.awaitingRoom?.cellId);
      if (!room || !host) return { ...state, awaitingRoom: null };
      if (room.mode !== 'multi') {
        const landCues = cuesForLanding(state.board, hostFloor!.id, host.id);
        const cleared: GameState = { ...state, awaitingRoom: null };
        const packId = landingPackId(hostFloor!, host);
        if (packId) return dealOnLand(cleared, packId, landCues);
        return withCues(cleared, landCues);
      }
      const entrance = roomEntrance(room);
      if (!entrance) return { ...state, awaitingRoom: null };
      return {
        ...state,
        awaitingRoom: null,
        insideRoom: { roomId: room.id, cellId: entrance.id },
      };
    }
    case 'LEAVE_ROOM': {
      if (!state.insideRoom) return state;
      if (!state.awaitingDoorExit && !isOnRoomEntrance(state)) return state;
      return { ...state, insideRoom: null, awaitingDoorExit: false };
    }
    case 'STAY_ROOM': {
      if (!state.awaitingDoorExit) return state;
      return { ...state, awaitingDoorExit: false };
    }
    case 'PASS_CARD': {
      const active = state.players.activePlayerId;
      if (!active) return state;
      const player = state.players.players.find((p) => p.id === active);
      if (!player) return state;
      if (
        state.config.passesEnabled
        && !canSpendPass(player.passesLeftByPack ?? {}, cmd.packId)
      ) {
        return state;
      }
      const cards = applyAction(state.cards, 'pass', cmd.packId);
      const players = state.config.passesEnabled
        ? setPlayerPassesLeft(
          state.players,
          active,
          spendPass(player.passesLeftByPack ?? {}, cmd.packId),
        )
        : state.players;
      return { ...state, cards, players };
    }
    case 'REVEAL_CARD': {
      const cards = applyAction(state.cards, 'positive', cmd.packId);
      let hold = state.hold;
      if (hold && countsTowardReveal('positive')) {
        hold = recordHoldReveal(hold, cmd.packId);
      }
      return tryExitHold({ ...state, cards, hold });
    }
    case 'SPIN_OUTCOME':
      return applyOutcomeSpin(state, cmd.spinnerId);
    case 'SET_INVENTORY':
      return {
        ...state,
        players: {
          ...state.players,
          players: state.players.players.map((player) => ({
            ...player,
            inventory: [...cmd.itemIds],
          })),
        },
        lastEvent: { type: 'INVENTORY_SET' },
      };
    default:
      return state;
  }
}
