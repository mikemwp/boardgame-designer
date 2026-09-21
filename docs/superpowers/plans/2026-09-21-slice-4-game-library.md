# Slice 4 — Game Library (New / Save / Open) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the play harness into a local studio library: create named drafts (Climb sample or empty board), save them on this device, open/switch between them, and keep playing the existing Climb loop + HUD.

**Architecture:** Add a PlayCanvas-free `lib/library/*` document store. Each draft is a named `GameDocument` whose `StoredBootstrap` is JSON (`board`, starting `players`, `cards` deck, `config`). `localStorage` is the only persistence (injectable adapter for tests). The live engine session stays in `useGameStore`; **Save** writes definition (layout, deck including imports, config flags) and keeps the current play session mounted; **Open** / **New** remount `GameHud` with `key={draft.id}` so play starts fresh from that draft. No slug, no backend, no live list.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui (`Button`, `Dialog`, `Label`, plus a small `Input`), Vitest, existing engine + HUD. No new npm packages.

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md` (Game library + Persistence)  
**Slice 3 (done, GitHub main `cc776ac`):** `docs/superpowers/plans/2026-09-21-slice-3-hud-movement.md`  
**Preferences:** `docs/preferences.md` (HUD dice, Play/Pass cards; no timer cards)

**Base branch:** Implement from **GitHub `main`** (slice 3 HUD movement at `cc776ac`). Do **not** implement on `feat/slice-2-turn-loop`. Create `feat/slice-4-game-library` from that main.

**Harness today (slice 3):** `app/page.tsx` always mounts `GameHud bootstrap={climbSample}`. HUD dice/spinner, turn-loop lock, Pass, hold, import CSV. No library, no `localStorage`, no empty bootstrap.

## Global Constraints

- Engine is a small set of repeating mechanics; **Game JSON + the designer** own the rules (Climb is only the first bundled example)
- **PlayCanvas React** is the **3D board view only**; engine and library have **zero** PlayCanvas imports
- HUD, cards, setup, and library chrome stay **DOM + shadcn/ui** — not PCUI, not PlayCanvas Screen/Element, not `@playcanvas/web-components`
- **Engine integer first** — library must not change `ROLL_DICE` sampling or HUD tumble → slide → card sequence
- **Pass** does **not** count as a pack reveal; **neither** (no buttons) **does** count on deal
- Movement **samples only values that would not land on an illegal stair**; if every possible roll would, movement is **0**
- Resolve **only the square you stop on**
- **1+ players**; **no** engine floor/player caps
- **Climb** is a **bundled sample only**
- Session / drafts persist in the **browser**; no accounts
- **Save draft** is allowed even if stairs/loops would be invalid for Test/Publish (this slice has no Test/Publish gates)
- Dev server stays on uncommon port **4318**
- **Spec override (slice 3, still in force):** dice throw lives in **HUD space**, not on the 3D board
- **Spec override (this slice):** Open lists **local drafts only**. No live publish slug, no live-games section

## Slice scope

**In this plan:** local drafts in `localStorage`; **New** (named game from Climb sample **or** empty looping board); **Save** (definition: board, starting players, deck, config); **Open** (list drafts, switch active); keep Climb loop + HUD playable on the active draft; first visit seeds one Climb draft; New/Open auto-save the current draft first so imports/toggles are not lost.

**Out of this plan:** HTML layout designer (next slice — do not add palette, floor tabs, drag-drop grid, or designer routes); first-person cameras; timer cards / extra card buttons; cloud accounts; buyable packs; publish live / public slug / live-games list; downloadable JSON export; copy-as-new-game; Test/Publish validation gates; play-session resume of `hold` / `currentCard` / `lastRoll` (Open starts a fresh `createGame` from the saved definition).

Do **not** rename `ROLL_DICE`. Do **not** remount leftover `DiceActor` / `DiceRollLayer`.

---

## File Map

| Path | Slice 4 change |
|------|----------------|
| `lib/library/types.ts` | **Create.** `StoredBootstrap`, `GameDocument`, `LibraryState`, `NewGameSource`, storage key + version |
| `lib/library/bootstrap.ts` | **Create.** `cloneJson`, `toStoredBootstrap`, `fromStoredBootstrap`, `captureBootstrap` |
| `lib/library/state.ts` | **Create.** Pure list/add/save/setActive/parse/seed |
| `lib/library/storage.ts` | **Create.** `LibraryStorage`, memory + `localStorage` adapters, load/write |
| `lib/samples/empty.ts` | **Create.** One looping Ground floor, no stairs, empty deck, one player |
| `lib/samples/climb.ts` | Unchanged (library clones it; do not mutate the module export) |
| `hooks/use-library.ts` | **Create.** React state + persist |
| `hooks/use-game-store.ts` | Unchanged |
| `components/ui/input.tsx` | **Create.** Native text input styled like existing HUD controls |
| `components/library/NewGameDialog.tsx` | **Create.** Name + Climb / Empty |
| `components/library/OpenGameDialog.tsx` | **Create.** Draft list |
| `components/library/LibraryBar.tsx` | **Create.** New / Save / Open + active name |
| `components/library/StudioShell.tsx` | **Create.** Load library, auto-save on switch, remount HUD |
| `components/hud/GameHud.tsx` | Optional `onStateChange(game)` so Save can capture deck/config |
| `app/page.tsx` | Mount `StudioShell` instead of hard-coded Climb |
| `README.md` | New / Save / Open instructions |
| `tests/library/*.test.ts` | Codec, reducer, storage |
| `tests/samples/empty.test.ts` | Empty board is a playable loop |
| `tests/hooks/use-library.test.tsx` | Hook + memory storage |
| `tests/library/new-game-dialog.test.tsx`, `open-game-dialog.test.tsx`, `library-bar.test.tsx`, `studio-shell.test.tsx` | Chrome + switch drafts |
| `tests/hud/game-hud.test.tsx` | Still pass with optional `onStateChange` omitted |

Do not add `app/designer/*`, `components/designer/*`, publish/slug routes, first-person files, or timer-card UI.

---

### Task 1: Empty bootstrap + stored Game JSON codec

**Files:**
- Create: `lib/samples/empty.ts`
- Create: `lib/library/types.ts`
- Create: `lib/library/bootstrap.ts`
- Test: `tests/samples/empty.test.ts`
- Test: `tests/library/bootstrap.test.ts`

**Interfaces:**
- Consumes: `GameBootstrap`, `createBoard`, `createCardState`, `createPlayerState`, `addPlayer`, `defaultGameConfig`, `climbSample`, `PlayerState`, `GameState` (for `captureBootstrap` input)
- Produces:
  - `export const EMPTY_LABEL = 'Empty board'`
  - `export function emptyBootstrap(): GameBootstrap`
  - `export const LIBRARY_STORAGE_KEY = 'building-board.library.v1'`
  - `export const LIBRARY_VERSION = 1 as const`
  - `export type NewGameSource = 'climb' | 'empty'`
  - `export interface StoredBootstrap { board: Board; players: PlayerState; cards: Card[]; config: GameConfig }`
  - `export interface GameDocument { id: string; name: string; createdAt: string; updatedAt: string; source: NewGameSource; bootstrap: StoredBootstrap }`
  - `export interface LibraryState { version: 1; activeId: string | null; drafts: GameDocument[] }`
  - `export function cloneJson<T>(value: T): T`
  - `export function toStoredBootstrap(bootstrap: GameBootstrap): StoredBootstrap`
  - `export function fromStoredBootstrap(stored: StoredBootstrap): GameBootstrap`
  - `export function captureBootstrap(game: Pick<GameState, 'board' | 'cards' | 'config'>, startPlayers: PlayerState): StoredBootstrap`

- [ ] **Step 1: Write the failing tests**

Create `tests/samples/empty.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createGame, dispatch } from '@/lib/engine/game';
import { emptyBootstrap, EMPTY_LABEL } from '@/lib/samples/empty';

describe('emptyBootstrap', () => {
  it('is labeled as an empty board, not Climb', () => {
    expect(EMPTY_LABEL).toBe('Empty board');
    const boot = emptyBootstrap();
    expect(boot.board.floors).toHaveLength(1);
    expect(boot.board.floors[0]?.id).toBe('ground');
    expect(boot.board.floors[0]?.label).toBe('Ground');
    expect(boot.board.floors[0]?.cells).toHaveLength(6);
    expect(boot.board.stairs).toHaveLength(0);
    expect(boot.cards.deck).toHaveLength(0);
    expect(boot.players.players[0]?.token).toEqual({
      floorId: 'ground',
      cellId: 'ground-c0',
    });
  });

  it('loops without packs so a roll moves and does not deal', () => {
    const game = createGame(emptyBootstrap(), { rng: () => 0 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(1);
    expect(next.players.players[0]?.token.cellId).toBe('ground-c1');
    expect(next.cards.currentCard).toBeNull();
  });

  it('does not share mutable board identity across calls', () => {
    const a = emptyBootstrap();
    const b = emptyBootstrap();
    a.board.floors[0]!.label = 'Mutated';
    expect(b.board.floors[0]!.label).toBe('Ground');
  });
});
```

Create `tests/library/bootstrap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createGame } from '@/lib/engine/game';
import { createCardState } from '@/lib/engine/cards';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import {
  captureBootstrap,
  fromStoredBootstrap,
  toStoredBootstrap,
} from '@/lib/library/bootstrap';

describe('stored bootstrap codec', () => {
  it('round-trips Climb without rng and with a full GameConfig', () => {
    const stored = toStoredBootstrap(climbSample);
    expect(stored.cards.map((c) => c.id)).toEqual([
      'climb-1',
      'climb-2',
      'climb-3',
    ]);
    expect(stored.config.movementViz).toBe('dice');
    expect(stored.config.passesEnabled).toBe(true);
    const boot = fromStoredBootstrap(stored);
    expect(boot.rng).toBeUndefined();
    const game = createGame(boot);
    expect(game.board.floors).toHaveLength(3);
    expect(game.players.players[0]?.name).toBe('Climber');
    expect(game.config.movementViz).toBe('dice');
  });

  it('clones so mutating the stored copy cannot change climbSample', () => {
    const stored = toStoredBootstrap(climbSample);
    stored.cards.push({ id: 'injected', pack: 'climb', title: 'Nope' });
    stored.board.floors[0]!.label = 'Hacked';
    expect(climbSample.cards.deck).toHaveLength(3);
    expect(climbSample.board.floors[0]?.label).toBe('Lobby');
  });

  it('captureBootstrap keeps start players, live deck, and live config', () => {
    const start = toStoredBootstrap(emptyBootstrap()).players;
    const game = createGame(emptyBootstrap());
    game.cards = createCardState([
      { id: 'n1', pack: 'notes', title: 'Imported' },
    ]);
    game.config = { ...game.config, movementViz: 'spinner', diceCount: 2 };
    game.players.players[0]!.token = { floorId: 'ground', cellId: 'ground-c4' };
    const captured = captureBootstrap(game, start);
    expect(captured.cards).toEqual([
      { id: 'n1', pack: 'notes', title: 'Imported' },
    ]);
    expect(captured.config.movementViz).toBe('spinner');
    expect(captured.config.diceCount).toBe(2);
    expect(captured.players.players[0]?.token.cellId).toBe('ground-c0');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/samples/empty.test.ts tests/library/bootstrap.test.ts`

Expected: FAIL with cannot find module `@/lib/samples/empty` and `@/lib/library/bootstrap`

- [ ] **Step 3: Write minimal implementation**

Create `lib/library/types.ts`:

```ts
import type { Board } from '@/lib/engine/board';
import type { PlayerState } from '@/lib/engine/players';
import type { Card, GameConfig } from '@/lib/engine/types';

export const LIBRARY_STORAGE_KEY = 'building-board.library.v1';
export const LIBRARY_VERSION = 1 as const;

export type NewGameSource = 'climb' | 'empty';

export interface StoredBootstrap {
  board: Board;
  players: PlayerState;
  cards: Card[];
  config: GameConfig;
}

export interface GameDocument {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  source: NewGameSource;
  bootstrap: StoredBootstrap;
}

export interface LibraryState {
  version: 1;
  activeId: string | null;
  drafts: GameDocument[];
}
```

Create `lib/samples/empty.ts`:

```ts
import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap } from '@/lib/engine/game';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import { defaultGameConfig, type Cell } from '@/lib/engine/types';

export const EMPTY_LABEL = 'Empty board';

export function emptyBootstrap(): GameBootstrap {
  const floorId = 'ground';
  const cells: Cell[] = [0, 1, 2, 3, 4, 5].map((index) => ({
    id: `${floorId}-c${index}`,
    index,
    kind: 'corridor',
  }));
  return {
    board: createBoard(
      [
        {
          id: floorId,
          index: 0,
          label: 'Ground',
          holdEnabled: false,
          cells,
        },
      ],
      [],
    ),
    players: addPlayer(createPlayerState(), {
      id: 'p1',
      name: 'Player 1',
      token: { floorId, cellId: `${floorId}-c0` },
    }),
    cards: createCardState([]),
    config: {
      ...defaultGameConfig(),
      diceEnabled: true,
    },
  };
}
```

Create `lib/library/bootstrap.ts`:

```ts
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap, GameState } from '@/lib/engine/game';
import type { PlayerState } from '@/lib/engine/players';
import { defaultGameConfig } from '@/lib/engine/types';
import type { StoredBootstrap } from '@/lib/library/types';

export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function toStoredBootstrap(bootstrap: GameBootstrap): StoredBootstrap {
  return {
    board: cloneJson(bootstrap.board),
    players: cloneJson(bootstrap.players),
    cards: cloneJson(bootstrap.cards.deck),
    config: cloneJson({ ...defaultGameConfig(), ...bootstrap.config }),
  };
}

export function fromStoredBootstrap(stored: StoredBootstrap): GameBootstrap {
  return {
    board: cloneJson(stored.board),
    players: cloneJson(stored.players),
    cards: createCardState(cloneJson(stored.cards)),
    config: cloneJson({ ...defaultGameConfig(), ...stored.config }),
  };
}

export function captureBootstrap(
  game: Pick<GameState, 'board' | 'cards' | 'config'>,
  startPlayers: PlayerState,
): StoredBootstrap {
  return {
    board: cloneJson(game.board),
    players: cloneJson(startPlayers),
    cards: cloneJson(game.cards.deck),
    config: cloneJson(game.config),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/samples/empty.test.ts tests/library/bootstrap.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/samples/empty.ts lib/library/types.ts lib/library/bootstrap.ts tests/samples/empty.test.ts tests/library/bootstrap.test.ts
git commit -m "feat(library): add empty bootstrap and stored game JSON codec"
```

---

### Task 2: Pure library state machine

**Files:**
- Create: `lib/library/state.ts`
- Test: `tests/library/state.test.ts`

**Interfaces:**
- Consumes: `GameDocument`, `LibraryState`, `StoredBootstrap`, `toStoredBootstrap`, `climbSample`
- Produces:
  - `export function createDocument(input: { id: string; name: string; source: NewGameSource; bootstrap: StoredBootstrap; now: string }): GameDocument`
  - `export function seedLibrary(now: string, id: string): LibraryState` — one Climb draft named `Climb (sample)`, `activeId` set
  - `export function addDraft(state: LibraryState, doc: GameDocument): LibraryState` — append, set `activeId` to `doc.id`, **do not** remove existing drafts
  - `export function saveDraft(state: LibraryState, id: string, bootstrap: StoredBootstrap, now: string): LibraryState` — update matching draft only
  - `export function setActive(state: LibraryState, id: string): LibraryState` — no-op if id missing
  - `export function getActive(state: LibraryState): GameDocument | undefined`
  - `export function listDrafts(state: LibraryState): GameDocument[]` — `updatedAt` descending
  - `export function parseLibrary(raw: string | null): LibraryState | null`

- [ ] **Step 1: Write the failing test**

Create `tests/library/state.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  addDraft,
  createDocument,
  getActive,
  listDrafts,
  parseLibrary,
  saveDraft,
  seedLibrary,
  setActive,
} from '@/lib/library/state';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import type { LibraryState } from '@/lib/library/types';

const climbStored = () => toStoredBootstrap(climbSample);
const emptyStored = () => toStoredBootstrap(emptyBootstrap());

describe('seedLibrary', () => {
  it('inserts one Climb draft and selects it', () => {
    const state = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    expect(state.version).toBe(1);
    expect(state.drafts).toHaveLength(1);
    expect(state.activeId).toBe('seed-1');
    expect(state.drafts[0]?.name).toBe('Climb (sample)');
    expect(state.drafts[0]?.source).toBe('climb');
    expect(state.drafts[0]?.bootstrap.cards).toHaveLength(3);
  });
});

describe('addDraft', () => {
  it('does not overwrite existing drafts', () => {
    const seeded = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    const extra = createDocument({
      id: 'd2',
      name: 'Blank',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T13:00:00.000Z',
    });
    const next = addDraft(seeded, extra);
    expect(next.drafts.map((d) => d.id)).toEqual(['seed-1', 'd2']);
    expect(next.activeId).toBe('d2');
    expect(getActive(next)?.name).toBe('Blank');
  });
});

describe('saveDraft', () => {
  it('updates bootstrap and updatedAt on the matching id only', () => {
    const seeded = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    const withEmpty = addDraft(
      seeded,
      createDocument({
        id: 'd2',
        name: 'Blank',
        source: 'empty',
        bootstrap: emptyStored(),
        now: '2026-09-21T13:00:00.000Z',
      }),
    );
    const patched = {
      ...climbStored(),
      cards: [{ id: 'x', pack: 'climb', title: 'Extra' }],
    };
    const saved = saveDraft(withEmpty, 'seed-1', patched, '2026-09-21T14:00:00.000Z');
    expect(saved.drafts.find((d) => d.id === 'seed-1')?.bootstrap.cards).toEqual([
      { id: 'x', pack: 'climb', title: 'Extra' },
    ]);
    expect(saved.drafts.find((d) => d.id === 'seed-1')?.updatedAt).toBe(
      '2026-09-21T14:00:00.000Z',
    );
    expect(saved.drafts.find((d) => d.id === 'd2')?.bootstrap.cards).toEqual([]);
  });

  it('is a no-op for an unknown id', () => {
    const seeded = seedLibrary('2026-09-21T12:00:00.000Z', 'seed-1');
    const next = saveDraft(seeded, 'missing', emptyStored(), '2026-09-21T14:00:00.000Z');
    expect(next).toEqual(seeded);
  });
});

describe('setActive and listDrafts', () => {
  it('switches active and lists newest updated first', () => {
    const a = createDocument({
      id: 'a',
      name: 'A',
      source: 'climb',
      bootstrap: climbStored(),
      now: '2026-09-21T10:00:00.000Z',
    });
    const b = createDocument({
      id: 'b',
      name: 'B',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T11:00:00.000Z',
    });
    let state: LibraryState = { version: 1, activeId: 'a', drafts: [a, b] };
    state = setActive(state, 'b');
    expect(state.activeId).toBe('b');
    expect(setActive(state, 'nope').activeId).toBe('b');
    const listed = listDrafts(state);
    expect(listed.map((d) => d.id)).toEqual(['b', 'a']);
  });
});

describe('parseLibrary', () => {
  it('returns null for junk, wrong version, or missing drafts', () => {
    expect(parseLibrary(null)).toBeNull();
    expect(parseLibrary('{')).toBeNull();
    expect(parseLibrary(JSON.stringify({ version: 2, activeId: null, drafts: [] }))).toBeNull();
    expect(parseLibrary(JSON.stringify({ version: 1, activeId: null, drafts: 'nope' }))).toBeNull();
  });

  it('keeps valid drafts and drops malformed ones', () => {
    const good = createDocument({
      id: 'ok',
      name: 'Ok',
      source: 'empty',
      bootstrap: emptyStored(),
      now: '2026-09-21T12:00:00.000Z',
    });
    const parsed = parseLibrary(
      JSON.stringify({
        version: 1,
        activeId: 'ok',
        drafts: [good, { id: 'bad' }, { ...good, bootstrap: { nope: true } }],
      }),
    );
    expect(parsed?.drafts).toHaveLength(1);
    expect(parsed?.drafts[0]?.id).toBe('ok');
    expect(parsed?.activeId).toBe('ok');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/library/state.test.ts`

Expected: FAIL with cannot find module `@/lib/library/state`

- [ ] **Step 3: Write minimal implementation**

Create `lib/library/state.ts`:

```ts
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import type {
  GameDocument,
  LibraryState,
  NewGameSource,
  StoredBootstrap,
} from '@/lib/library/types';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';

export function createDocument(input: {
  id: string;
  name: string;
  source: NewGameSource;
  bootstrap: StoredBootstrap;
  now: string;
}): GameDocument {
  return {
    id: input.id,
    name: input.name,
    source: input.source,
    bootstrap: input.bootstrap,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function seedLibrary(now: string, id: string): LibraryState {
  const doc = createDocument({
    id,
    name: CLIMB_LABEL,
    source: 'climb',
    bootstrap: toStoredBootstrap(climbSample),
    now,
  });
  return { version: 1, activeId: doc.id, drafts: [doc] };
}

export function addDraft(state: LibraryState, doc: GameDocument): LibraryState {
  return {
    ...state,
    activeId: doc.id,
    drafts: [...state.drafts, doc],
  };
}

export function saveDraft(
  state: LibraryState,
  id: string,
  bootstrap: StoredBootstrap,
  now: string,
): LibraryState {
  if (!state.drafts.some((d) => d.id === id)) return state;
  return {
    ...state,
    drafts: state.drafts.map((d) =>
      d.id === id ? { ...d, bootstrap, updatedAt: now } : d,
    ),
  };
}

export function setActive(state: LibraryState, id: string): LibraryState {
  if (!state.drafts.some((d) => d.id === id)) return state;
  return { ...state, activeId: id };
}

export function getActive(state: LibraryState): GameDocument | undefined {
  return state.drafts.find((d) => d.id === state.activeId);
}

export function listDrafts(state: LibraryState): GameDocument[] {
  return [...state.drafts].sort((a, b) => {
    if (a.updatedAt === b.updatedAt) return a.name.localeCompare(b.name);
    return a.updatedAt < b.updatedAt ? 1 : -1;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStoredBootstrap(value: unknown): value is StoredBootstrap {
  if (!isRecord(value)) return false;
  if (!isRecord(value.board) || !Array.isArray(value.board.floors) || !Array.isArray(value.board.stairs)) {
    return false;
  }
  if (!isRecord(value.players) || !Array.isArray(value.players.players)) return false;
  if (!Array.isArray(value.cards)) return false;
  if (!isRecord(value.config)) return false;
  return true;
}

function isNewGameSource(value: unknown): value is NewGameSource {
  return value === 'climb' || value === 'empty';
}

function parseDocument(value: unknown): GameDocument | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string' || value.id.length === 0) return null;
  if (typeof value.name !== 'string') return null;
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') return null;
  if (!isNewGameSource(value.source)) return null;
  if (!isStoredBootstrap(value.bootstrap)) return null;
  return {
    id: value.id,
    name: value.name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    source: value.source,
    bootstrap: value.bootstrap,
  };
}

export function parseLibrary(raw: string | null): LibraryState | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.drafts)) {
      return null;
    }
    const drafts = value.drafts
      .map(parseDocument)
      .filter((d): d is GameDocument => d !== null);
    if (drafts.length === 0) return null;
    const activeId =
      typeof value.activeId === 'string' && drafts.some((d) => d.id === value.activeId)
        ? value.activeId
        : drafts[0]!.id;
    return { version: 1, activeId, drafts };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/library/state.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/library/state.ts tests/library/state.test.ts
git commit -m "feat(library): add draft list, save, and seed state machine"
```

---

### Task 3: localStorage adapter (injectable)

**Files:**
- Create: `lib/library/storage.ts`
- Test: `tests/library/storage.test.ts`

**Interfaces:**
- Consumes: `parseLibrary`, `seedLibrary`, `LIBRARY_STORAGE_KEY`, `LibraryState`
- Produces:
  - `export interface LibraryStorage { read(): string | null; write(value: string): void }`
  - `export function memoryStorage(initial?: string | null): LibraryStorage`
  - `export function browserStorage(): LibraryStorage` — `window.localStorage` under `LIBRARY_STORAGE_KEY`; no-ops if `window` missing or throws
  - `export function writeLibrary(storage: LibraryStorage, state: LibraryState): void`
  - `export function loadLibrary(storage: LibraryStorage, opts: { now: string; id: string }): LibraryState` — parse or seed and persist the seed

- [ ] **Step 1: Write the failing test**

Create `tests/library/storage.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  browserStorage,
  loadLibrary,
  memoryStorage,
  writeLibrary,
} from '@/lib/library/storage';

const NOW = '2026-09-21T12:00:00.000Z';

describe('memoryStorage + loadLibrary', () => {
  it('seeds Climb when empty and round-trips after write', () => {
    const storage = memoryStorage();
    const seeded = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    expect(seeded.drafts).toHaveLength(1);
    expect(seeded.drafts[0]?.id).toBe('seed-1');
    expect(storage.read()).toContain('Climb (sample)');

    seeded.drafts[0]!.name = 'Renamed';
    writeLibrary(storage, seeded);
    const loaded = loadLibrary(storage, { now: '2026-09-21T99:00:00.000Z', id: 'other' });
    expect(loaded.drafts[0]?.name).toBe('Renamed');
    expect(loaded.drafts[0]?.id).toBe('seed-1');
  });

  it('reseeds when JSON is corrupt', () => {
    const storage = memoryStorage('{not json');
    const seeded = loadLibrary(storage, { now: NOW, id: 'fresh' });
    expect(seeded.activeId).toBe('fresh');
    expect(seeded.drafts).toHaveLength(1);
  });
});

describe('browserStorage', () => {
  it('does not throw when window is missing (node) or present', () => {
    expect(() => {
      const storage = browserStorage();
      storage.write('{"ok":true}');
      storage.read();
    }).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/library/storage.test.ts`

Expected: FAIL with cannot find module `@/lib/library/storage`

- [ ] **Step 3: Write minimal implementation**

Create `lib/library/storage.ts`:

```ts
import { parseLibrary, seedLibrary } from '@/lib/library/state';
import {
  LIBRARY_STORAGE_KEY,
  type LibraryState,
} from '@/lib/library/types';

export interface LibraryStorage {
  read(): string | null;
  write(value: string): void;
}

export function memoryStorage(initial: string | null = null): LibraryStorage {
  let data = initial;
  return {
    read: () => data,
    write: (value) => {
      data = value;
    },
  };
}

export function browserStorage(): LibraryStorage {
  return {
    read: () => {
      if (typeof window === 'undefined') return null;
      try {
        return window.localStorage.getItem(LIBRARY_STORAGE_KEY);
      } catch {
        return null;
      }
    },
    write: (value) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(LIBRARY_STORAGE_KEY, value);
      } catch {
        // quota / private mode — keep working in memory only
      }
    },
  };
}

export function writeLibrary(storage: LibraryStorage, state: LibraryState): void {
  storage.write(JSON.stringify(state));
}

export function loadLibrary(
  storage: LibraryStorage,
  opts: { now: string; id: string },
): LibraryState {
  const parsed = parseLibrary(storage.read());
  if (parsed) return parsed;
  const seeded = seedLibrary(opts.now, opts.id);
  writeLibrary(storage, seeded);
  return seeded;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/library/storage.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/library/storage.ts tests/library/storage.test.ts
git commit -m "feat(library): persist drafts through an injectable storage adapter"
```

---

### Task 4: Library chrome — New, Open, Save bar

**Files:**
- Create: `components/ui/input.tsx`
- Create: `components/library/NewGameDialog.tsx`
- Create: `components/library/OpenGameDialog.tsx`
- Create: `components/library/LibraryBar.tsx`
- Test: `tests/library/new-game-dialog.test.tsx`
- Test: `tests/library/open-game-dialog.test.tsx`
- Test: `tests/library/library-bar.test.tsx`

**Interfaces:**
- Consumes: existing `Button`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Label`; `GameDocument`, `NewGameSource`
- Produces:
  - `export function Input(props: React.ComponentProps<'input'>): JSX.Element`
  - `export function NewGameDialog({ open, onOpenChange, onCreate }: { open: boolean; onOpenChange: (open: boolean) => void; onCreate: (input: { name: string; source: NewGameSource }) => void })`
  - `export function OpenGameDialog({ open, onOpenChange, drafts, activeId, onOpen }: { open: boolean; onOpenChange: (open: boolean) => void; drafts: GameDocument[]; activeId: string | null; onOpen: (id: string) => void })`
  - `export function LibraryBar({ activeName, savedAt, canSave, onNew, onSave, onOpen }: { activeName: string; savedAt?: string; canSave: boolean; onNew: () => void; onSave: () => void; onOpen: () => void })`
  - Copy: buttons **New**, **Save**, **Open**; sources **Climb sample** and **Empty board**; empty open list **No drafts on this device.**; no Live section

- [ ] **Step 1: Write the failing tests**

Create `tests/library/new-game-dialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { NewGameDialog } from '@/components/library/NewGameDialog';

describe('NewGameDialog', () => {
  it('does not create when the name is blank', () => {
    const onCreate = vi.fn();
    render(
      <NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} />,
    );
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('creates a named Climb draft by default', () => {
    const onCreate = vi.fn();
    render(
      <NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} />,
    );
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Night Climb' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Night Climb',
      source: 'climb',
    });
  });

  it('can create from the empty board', () => {
    const onCreate = vi.fn();
    render(
      <NewGameDialog open onOpenChange={() => {}} onCreate={onCreate} />,
    );
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Sandbox' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Sandbox',
      source: 'empty',
    });
  });
});
```

Create `tests/library/open-game-dialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { OpenGameDialog } from '@/components/library/OpenGameDialog';
import { createDocument } from '@/lib/library/state';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { emptyBootstrap } from '@/lib/samples/empty';

const drafts = [
  createDocument({
    id: 'd1',
    name: 'Climb (sample)',
    source: 'climb',
    bootstrap: toStoredBootstrap(emptyBootstrap()),
    now: '2026-09-21T12:00:00.000Z',
  }),
  createDocument({
    id: 'd2',
    name: 'Sandbox',
    source: 'empty',
    bootstrap: toStoredBootstrap(emptyBootstrap()),
    now: '2026-09-21T13:00:00.000Z',
  }),
];

describe('OpenGameDialog', () => {
  it('lists drafts and opens the chosen one', () => {
    const onOpen = vi.fn();
    render(
      <OpenGameDialog
        open
        onOpenChange={() => {}}
        drafts={drafts}
        activeId="d1"
        onOpen={onOpen}
      />,
    );
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    expect(screen.getByText('Sandbox')).toBeDefined();
    expect(screen.queryByText(/live/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Open Sandbox' }));
    expect(onOpen).toHaveBeenCalledWith('d2');
  });

  it('shows an empty copy when there are no drafts', () => {
    render(
      <OpenGameDialog
        open
        onOpenChange={() => {}}
        drafts={[]}
        activeId={null}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByText('No drafts on this device.')).toBeDefined();
  });
});
```

Create `tests/library/library-bar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LibraryBar } from '@/components/library/LibraryBar';

describe('LibraryBar', () => {
  it('shows the active name and fires New / Save / Open', () => {
    const onNew = vi.fn();
    const onSave = vi.fn();
    const onOpen = vi.fn();
    render(
      <LibraryBar
        activeName="Climb (sample)"
        savedAt="2026-09-21T12:00:00.000Z"
        canSave
        onNew={onNew}
        onSave={onSave}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('disables Save when there is no active draft', () => {
    render(
      <LibraryBar
        activeName="No game"
        canSave={false}
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/library/new-game-dialog.test.tsx tests/library/open-game-dialog.test.tsx tests/library/library-bar.test.tsx`

Expected: FAIL with cannot find module for the library components

- [ ] **Step 3: Write minimal implementation**

Create `components/ui/input.tsx`:

```tsx
import * as React from 'react';
import { cn } from 'cn';

function Input({ className, type = 'text', ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-sm text-slate-50 outline-none',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
```

Create `components/library/NewGameDialog.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { NewGameSource } from '@/lib/library/types';

export function NewGameDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; source: NewGameSource }) => void;
}) {
  const [name, setName] = useState('Climb');
  const [source, setSource] = useState<NewGameSource>('climb');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed, source });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New game</DialogTitle>
          <DialogDescription>
            Create a named draft on this device. Existing drafts are not overwritten.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="game-name">Game name</Label>
          <Input
            id="game-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Game name"
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm">Start from</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="new-game-source"
                value="climb"
                checked={source === 'climb'}
                onChange={() => setSource('climb')}
                aria-label="Climb sample"
              />
              Climb sample
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="new-game-source"
                value="empty"
                checked={source === 'empty'}
                onChange={() => setSource('empty')}
                aria-label="Empty board"
              />
              Empty board
            </label>
          </fieldset>
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

Create `components/library/OpenGameDialog.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { GameDocument } from '@/lib/library/types';

export function OpenGameDialog({
  open,
  onOpenChange,
  drafts,
  activeId,
  onOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: GameDocument[];
  activeId: string | null;
  onOpen: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open game</DialogTitle>
          <DialogDescription>
            Drafts on this device. Live publish is not in this slice.
          </DialogDescription>
        </DialogHeader>
        {drafts.length === 0 ? (
          <p className="text-sm text-slate-400">No drafts on this device.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {drafts.map((draft) => (
              <li key={draft.id}>
                <Button
                  type="button"
                  variant={draft.id === activeId ? 'secondary' : 'outline'}
                  className="h-auto w-full justify-between py-2"
                  aria-current={draft.id === activeId ? 'true' : undefined}
                  aria-label={`Open ${draft.name}`}
                  onClick={() => onOpen(draft.id)}
                >
                  <span>{draft.name}</span>
                  <span className="text-xs text-slate-400">{draft.updatedAt}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

Create `components/library/LibraryBar.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';

export function LibraryBar({
  activeName,
  savedAt,
  canSave,
  onNew,
  onSave,
  onOpen,
}: {
  activeName: string;
  savedAt?: string;
  canSave: boolean;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-slate-800 p-3 md:flex-row md:items-center md:justify-between"
      data-testid="library-bar"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{activeName}</p>
        {savedAt ? (
          <p className="text-xs text-slate-400" data-testid="library-saved-at">
            Saved {savedAt}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onNew}>
          New
        </Button>
        <Button type="button" onClick={onSave} disabled={!canSave}>
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onOpen}>
          Open
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/library/new-game-dialog.test.tsx tests/library/open-game-dialog.test.tsx tests/library/library-bar.test.tsx`

Expected: PASS

If Create is still enabled with blank names, keep the trim-and-return guard (do not add a disabled attribute unless tests need it).

- [ ] **Step 5: Commit**

```bash
git add components/ui/input.tsx components/library/NewGameDialog.tsx components/library/OpenGameDialog.tsx components/library/LibraryBar.tsx tests/library/new-game-dialog.test.tsx tests/library/open-game-dialog.test.tsx tests/library/library-bar.test.tsx
git commit -m "feat(library): add New, Save, and Open chrome"
```

---

### Task 5: `useLibrary` hook

**Files:**
- Create: `hooks/use-library.ts`
- Test: `tests/hooks/use-library.test.tsx`

**Interfaces:**
- Consumes: `loadLibrary`, `writeLibrary`, `memoryStorage`, `browserStorage`, `addDraft`, `createDocument`, `saveDraft`, `setActive`, `getActive`, `listDrafts`, `toStoredBootstrap`, `emptyBootstrap`, `climbSample`
- Produces:
  - `export interface UseLibraryOptions { storage?: LibraryStorage; initialState?: LibraryState; now?: () => string; createId?: () => string }`
  - `export function useLibrary(options?: UseLibraryOptions): { ready: boolean; drafts: GameDocument[]; activeId: string | null; active: GameDocument | undefined; newGame: (input: { name: string; source: NewGameSource }) => void; openGame: (id: string) => void; saveActive: (bootstrap: StoredBootstrap) => void }`
  - Without `initialState`, start `ready: false` then load in `useEffect` (avoids SSR/`localStorage` hydration mismatch)
  - `newGame` clones Climb via `toStoredBootstrap(climbSample)` or `toStoredBootstrap(emptyBootstrap())` — never mutates the sample module

- [ ] **Step 1: Write the failing test**

Create `tests/hooks/use-library.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useLibrary } from '@/hooks/use-library';
import { loadLibrary, memoryStorage } from '@/lib/library/storage';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { emptyBootstrap } from '@/lib/samples/empty';
import { climbSample } from '@/lib/samples/climb';

const NOW = '2026-09-21T12:00:00.000Z';

describe('useLibrary', () => {
  it('adds a second Climb draft without replacing the seed', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    let n = 1;
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T13:00:00.000Z',
        createId: () => `id-${++n}`,
      }),
    );

    act(() => {
      result.current.newGame({ name: 'Climb two', source: 'climb' });
    });

    expect(result.current.drafts).toHaveLength(2);
    expect(result.current.active?.name).toBe('Climb two');
    expect(result.current.active?.id).toBe('id-2');
    expect(result.current.drafts.some((d) => d.id === 'seed-1')).toBe(true);
    expect(climbSample.cards.deck).toHaveLength(3);
  });

  it('saveActive writes imported cards into the active draft', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T15:00:00.000Z',
        createId: () => 'x',
      }),
    );
    const stored = toStoredBootstrap(emptyBootstrap());
    stored.cards = [{ id: 'n1', pack: 'notes', title: 'Imported' }];

    act(() => {
      result.current.saveActive(stored);
    });

    expect(result.current.active?.bootstrap.cards).toEqual([
      { id: 'n1', pack: 'notes', title: 'Imported' },
    ]);
    expect(result.current.active?.updatedAt).toBe('2026-09-21T15:00:00.000Z');
    const reloaded = loadLibrary(storage, { now: NOW, id: 'other' });
    expect(reloaded.drafts[0]?.bootstrap.cards[0]?.title).toBe('Imported');
  });

  it('openGame switches the active draft', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const { result } = renderHook(() =>
      useLibrary({
        storage,
        initialState,
        now: () => '2026-09-21T16:00:00.000Z',
        createId: () => 'blank',
      }),
    );

    act(() => {
      result.current.newGame({ name: 'Sandbox', source: 'empty' });
    });
    expect(result.current.activeId).toBe('blank');
    act(() => {
      result.current.openGame('seed-1');
    });
    expect(result.current.activeId).toBe('seed-1');
    expect(result.current.active?.name).toBe('Climb (sample)');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/hooks/use-library.test.tsx`

Expected: FAIL with cannot find module `@/hooks/use-library`

- [ ] **Step 3: Write minimal implementation**

Create `hooks/use-library.ts`:

```ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  addDraft,
  createDocument,
  getActive,
  listDrafts,
  saveDraft,
  setActive,
} from '@/lib/library/state';
import {
  browserStorage,
  loadLibrary,
  writeLibrary,
  type LibraryStorage,
} from '@/lib/library/storage';
import type {
  GameDocument,
  LibraryState,
  NewGameSource,
  StoredBootstrap,
} from '@/lib/library/types';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';

export interface UseLibraryOptions {
  storage?: LibraryStorage;
  initialState?: LibraryState;
  now?: () => string;
  createId?: () => string;
}

export function useLibrary(options: UseLibraryOptions = {}) {
  const storage = options.storage ?? browserStorage();
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? (() => crypto.randomUUID());
  const [state, setState] = useState<LibraryState | null>(
    options.initialState ?? null,
  );

  useEffect(() => {
    if (options.initialState) return;
    setState(
      loadLibrary(storage, {
        now: now(),
        id: createId(),
      }),
    );
    // Intentionally once on mount; tests pass initialState and skip this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (next: LibraryState) => {
      writeLibrary(storage, next);
      setState(next);
    },
    [storage],
  );

  const newGame = useCallback(
    (input: { name: string; source: NewGameSource }) => {
      setState((current) => {
        if (!current) return current;
        const bootstrap =
          input.source === 'empty'
            ? toStoredBootstrap(emptyBootstrap())
            : toStoredBootstrap(climbSample);
        const doc = createDocument({
          id: createId(),
          name: input.name.trim(),
          source: input.source,
          bootstrap,
          now: now(),
        });
        const next = addDraft(current, doc);
        writeLibrary(storage, next);
        return next;
      });
    },
    [createId, now, storage],
  );

  const openGame = useCallback(
    (id: string) => {
      setState((current) => {
        if (!current) return current;
        const next = setActive(current, id);
        writeLibrary(storage, next);
        return next;
      });
    },
    [storage],
  );

  const saveActive = useCallback(
    (bootstrap: StoredBootstrap) => {
      setState((current) => {
        if (!current?.activeId) return current;
        const next = saveDraft(current, current.activeId, bootstrap, now());
        writeLibrary(storage, next);
        return next;
      });
    },
    [now, storage],
  );

  return {
    ready: state !== null,
    drafts: state ? listDrafts(state) : ([] as GameDocument[]),
    activeId: state?.activeId ?? null,
    active: state ? getActive(state) : undefined,
    newGame,
    openGame,
    saveActive,
    persist,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/hooks/use-library.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/use-library.ts tests/hooks/use-library.test.tsx
git commit -m "feat(library): add useLibrary hook for local drafts"
```

---

### Task 6: Studio shell — switch drafts, keep HUD play

**Files:**
- Modify: `components/hud/GameHud.tsx` (add optional `onStateChange`)
- Create: `components/library/StudioShell.tsx`
- Modify: `app/page.tsx`
- Test: `tests/library/studio-shell.test.tsx`
- Test: `tests/hud/game-hud.test.tsx` (must still pass unchanged)

**Interfaces:**
- Consumes: `useLibrary`, `GameHud`, `LibraryBar`, `NewGameDialog`, `OpenGameDialog`, `captureBootstrap`, `fromStoredBootstrap`
- Produces:
  - `GameHud` optional `onStateChange?: (game: GameState) => void` called whenever `game` changes
  - `export function StudioShell(options?: UseLibraryOptions)`
  - `app/page.tsx` renders `StudioShell` (no hard-coded `climbSample`)
  - `GameHud` remounts with `key={active.id}`
  - **New** and **Open** call `saveActive(captureBootstrap(snapshot, active.bootstrap.players))` first when a snapshot exists
  - **Save** does the same capture and does **not** remount
  - Loading copy: `Loading library…`

- [ ] **Step 1: Write the failing tests**

Create `tests/library/studio-shell.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StudioShell } from '@/components/library/StudioShell';
import { loadLibrary, memoryStorage } from '@/lib/library/storage';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: () => <div data-testid="board" />,
}));

const NOW = '2026-09-21T12:00:00.000Z';

describe('StudioShell', () => {
  it('seeds Climb and keeps Roll dice plus the HUD card empty state', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => NOW}
        createId={() => 'n1'}
      />,
    );
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.getByText('No card drawn')).toBeDefined();
    expect(screen.getByText('No roll yet')).toBeDefined();
  });

  it('New empty remounts play onto a board with no climb passes', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => '2026-09-21T13:00:00.000Z'}
        createId={() => 'empty-1'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Sandbox' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Sandbox')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByText('Passes left: climb 1')).toBeNull();
    expect(screen.getByText('No card drawn')).toBeDefined();
  });

  it('Open switches back to the Climb draft', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => '2026-09-21T13:00:00.000Z'}
        createId={() => 'empty-1'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), {
      target: { value: 'Sandbox' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Climb (sample)' }));
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
  });

  it('Save persists imported-card capture across a remount from storage', () => {
    const storage = memoryStorage();
    const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
    const view = render(
      <StudioShell
        storage={storage}
        initialState={initialState}
        now={() => '2026-09-21T14:00:00.000Z'}
        createId={() => 'n1'}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Import cards' }));
    // Dialog is enough to prove HUD survived; persist via Save using live snapshot.
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('library-saved-at').textContent).toContain(
      '2026-09-21T14:00:00.000Z',
    );
    view.unmount();
    const reloaded = loadLibrary(memoryStorage(storage.read()), {
      now: NOW,
      id: 'other',
    });
    expect(reloaded.drafts[0]?.updatedAt).toBe('2026-09-21T14:00:00.000Z');
  });
});
```

The last case only asserts `updatedAt` after Save (no CSV file in this test). That is enough to prove Save writes through storage.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/library/studio-shell.test.tsx`

Expected: FAIL with cannot find module `@/components/library/StudioShell`

- [ ] **Step 3: Write minimal implementation**

In `components/hud/GameHud.tsx`, extend the props and report state (keep every existing HUD control). Change the existing `GameBootstrap` import to:

```ts
import type { GameBootstrap, GameState } from '@/lib/engine/game';
```

Replace the component signature and add the effect immediately after `useGameStore`:

```tsx
export function GameHud({
  bootstrap,
  onStateChange,
}: {
  bootstrap: GameBootstrap;
  onStateChange?: (game: GameState) => void;
}) {
  const { game, dispatch, updateConfig, importCards } = useGameStore(bootstrap);

  useEffect(() => {
    onStateChange?.(game);
  }, [game, onStateChange]);
```

`useEffect` is already imported in this file.

Create `components/library/StudioShell.tsx`:

```tsx
'use client';

import { useCallback, useState } from 'react';
import { GameHud } from '@/components/hud/GameHud';
import { LibraryBar } from '@/components/library/LibraryBar';
import { NewGameDialog } from '@/components/library/NewGameDialog';
import { OpenGameDialog } from '@/components/library/OpenGameDialog';
import { useLibrary, type UseLibraryOptions } from '@/hooks/use-library';
import type { GameState } from '@/lib/engine/game';
import {
  captureBootstrap,
  fromStoredBootstrap,
} from '@/lib/library/bootstrap';
import type { NewGameSource } from '@/lib/library/types';

export function StudioShell(options: UseLibraryOptions = {}) {
  const lib = useLibrary(options);
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [openOpen, setOpenOpen] = useState(false);

  const persistActive = useCallback(() => {
    if (!lib.active || !snapshot) return;
    lib.saveActive(captureBootstrap(snapshot, lib.active.bootstrap.players));
  }, [lib, snapshot]);

  const onCreate = (input: { name: string; source: NewGameSource }) => {
    persistActive();
    lib.newGame(input);
    setSnapshot(null);
    setNewOpen(false);
  };

  const onOpenDraft = (id: string) => {
    persistActive();
    lib.openGame(id);
    setSnapshot(null);
    setOpenOpen(false);
  };

  if (!lib.ready) {
    return <p className="text-slate-400">Loading library…</p>;
  }

  const active = lib.active;

  return (
    <div className="flex flex-col gap-4">
      <LibraryBar
        activeName={active?.name ?? 'No game'}
        savedAt={active?.updatedAt}
        canSave={Boolean(active)}
        onNew={() => setNewOpen(true)}
        onSave={persistActive}
        onOpen={() => setOpenOpen(true)}
      />
      {active ? (
        <GameHud
          key={active.id}
          bootstrap={fromStoredBootstrap(active.bootstrap)}
          onStateChange={setSnapshot}
        />
      ) : (
        <p className="text-slate-400">Create a game to start playing.</p>
      )}
      <NewGameDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={onCreate}
      />
      <OpenGameDialog
        open={openOpen}
        onOpenChange={setOpenOpen}
        drafts={lib.drafts}
        activeId={lib.activeId}
        onOpen={onOpenDraft}
      />
    </div>
  );
}
```

Replace `app/page.tsx` with:

```tsx
'use client';

import { StudioShell } from '@/components/library/StudioShell';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Building Board Template</h1>
        <p className="text-slate-400">Studio — drafts stay on this device</p>
      </header>
      <StudioShell />
    </main>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/library/studio-shell.test.tsx tests/hud/game-hud.test.tsx`

Expected: PASS. Existing GameHud tests omit `onStateChange` and still show Roll dice / HUD spinner.

If `persistActive` is stale because `lib` is a new object every render, destructure stable callbacks in `StudioShell`:

```tsx
const { active, activeId, drafts, ready, newGame, openGame, saveActive } = lib;
```

and list `active`, `snapshot`, `saveActive` in the `persistActive` dependency array.

- [ ] **Step 5: Commit**

```bash
git add components/hud/GameHud.tsx components/library/StudioShell.tsx app/page.tsx tests/library/studio-shell.test.tsx
git commit -m "feat(library): wire New/Save/Open studio shell to the play HUD"
```

---

### Task 7: README + full regression

**Files:**
- Modify: `README.md`
- Test: full `npm test` (no new assertion file required)

**Interfaces:**
- Consumes: behavior from tasks 1–6
- Produces: README that describes New / Save / Open, localStorage, and that Climb is still the seeded sample

- [ ] **Step 1: Update README**

After **Getting Started**, add a **Game library** section and adjust **Play the Climb sample** so step 1 is no longer “the page is always Climb”:

```md
## Game library

Drafts live in this browser (`localStorage` key `building-board.library.v1`). There is no account and no public slug in this slice.

1. First visit seeds **Climb (sample)** and opens it in the HUD.
2. **New** creates another named draft from **Climb sample** or **Empty board**. It does not overwrite other drafts. The current draft is saved first.
3. **Save** writes the active draft (board, starting players, card deck including CSV imports, feature-toggle config) and keeps the current play session on screen.
4. **Open** lists local drafts only. Choosing one remounts play from that draft’s saved definition (token back at start, no card up). Live publish is not included.

Invalid stairs would still be savable later; this slice does not add Test or Publish buttons.

## Play the Climb sample

1. `npm run dev` and open http://127.0.0.1:4318 — you should see **Climb (sample)** in the library bar.
2. Click **Roll dice**. HUD dice tumble to the engine integer, **then** the token slides, **then** the dice disappear and a card deals only if you **stop** on a packed corridor cell. Toggle **HUD spinner** to spin a uniform 1–6 (or **Spinner 1–12**) instead of 1d6 / 2d6.
3. **Play** counts as a pack reveal. **Pass** dismisses the card and does not.
4. Floor 1 hold (toggle **Per-floor hold**): you cannot land on that floor’s up stair until one climb card is revealed on that hold. If every face would hit that stair, last roll is **0 — stairs held**.
5. **New → Empty board** still shows **Roll dice** / HUD spinner on a 6-cell Ground loop with no climb cards.
```

In **Architecture**, add:

```md
- **`lib/library/*`** — Local draft documents (New / Save / Open). No PlayCanvas, no backend.
- **`components/library/*`** — Studio chrome over the existing HUD.
```

Fix the leftover Architecture line that still says `optional ammo.js dice visualization` on `components/board/*` — board is floors + tokens only.

- [ ] **Step 2: Run the full suite**

Run: `npm test`

Expected: all tests PASS (previous ~131 plus the new library/empty/hook/chrome tests).

- [ ] **Step 3: Manual check (dev server)**

Run: `npm run dev`

Expected at http://127.0.0.1:4318:

1. Header **Building Board Template**, library bar **Climb (sample)**, **New** / **Save** / **Open**, HUD **Roll dice**.
2. Play one Climb roll: HUD dice → token slide → card Play/Pass. Same slice-3 loop.
3. **New** → Empty board named `Sandbox` → bar shows Sandbox, Roll still works, no climb pass line, no card after a 1-step roll.
4. **Open** → Climb (sample) → passes `climb 1` back, play works again.
5. Toggle HUD spinner, **Save**, reload the tab → still on the same draft (Climb or Sandbox, whichever was active) with spinner still selected if it was saved on that draft’s config.
6. No `/play/…` slug, no Live list, no layout designer grid.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: describe local New/Save/Open game library"
```

---

## Self-Review

### Spec coverage (slice 4 only)

| Requirement | Task(s) |
|-------------|---------|
| New named game; does not overwrite other games | 2, 4, 5, 6 |
| New from empty grid / default HUD **or** Climb sample | 1, 4, 5, 6 |
| Save draft (layout, packs/deck, config); keep working | 1 `captureBootstrap`, 5, 6 |
| Save allowed without Test/Publish validation | no validator files |
| Open lists drafts; open one (here: to play) | 4, 5, 6 |
| Drafts in `localStorage`; no accounts | 3, 5 |
| Live play never silently uses an unsaved draft / publish slug | no slug; Open remounts saved definition; New/Open auto-save first |
| Session in the browser | 3, 6 first visit seeds; reload restores library |
| Keep Climb loop + HUD | 6 does not strip MovementStage / Roll lock / Pass |
| Test play of current draft | in-place HUD is the test surface; no public URL |
| Publish live / live games in Open | **out** |
| Layout designer | **out** |
| First-person | **out** |
| Timer cards / extra buttons | **out** |
| Cloud accounts / buyable packs | **out** |
| Downloadable JSON / copy-as-new-game | **out** (YAGNI this slice) |

### Placeholder scan

No TBD / implement-later / similar-to-Task-N. New files have full contents. `GameHud` change is one optional callback, not a HUD rewrite.

### Type consistency

`StoredBootstrap`, `GameDocument`, `LibraryState`, `NewGameSource`, `LibraryStorage`, `captureBootstrap`, `fromStoredBootstrap`, `newGame` / `openGame` / `saveActive` names are stable across tasks. `LIBRARY_STORAGE_KEY` is `building-board.library.v1`. Empty floor id is `ground` with cells `ground-c0`…`ground-c5`. Buttons are **New**, **Save**, **Open**, **Create**. Sources are **Climb sample** and **Empty board**.

### Known implementer pitfalls

- Implement from **GitHub main / slice 3**, not `feat/slice-2-turn-loop` (that branch lacks HUD `movementViz`).
- `useGameStore` only reads `bootstrap` on first mount — switching drafts **must** remount `GameHud` with `key={active.id}`.
- Do not JSON-serialize `rng` / function fields; the codec stores `cards: Card[]` and rebuilds `CardState` with `createCardState`.
- Do not mutate `climbSample` when creating a Climb draft — always `toStoredBootstrap`.
- Load library in `useEffect` unless tests pass `initialState`, or SSR will disagree with `localStorage`.
- Save captures **starting** `players` from the document, not the live token, so Open does not resume mid-loop (by design).
- Do not add a designer route or publish slug “while you are here.”
- Leftover `DiceActor` / `DiceRollLayer` stay off the play board.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-21-slice-4-game-library.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints. REQUIRED SUB-SKILL: superpowers:executing-plans.

This planning pass does **not** implement the slice.
