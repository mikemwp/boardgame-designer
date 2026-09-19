# Building Board Template (PlayCanvas) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Next.js building-board game template with a pure TypeScript engine, PlayCanvas React 3D board (sliding tokens, optional ammo.js dice), DOM shadcn HUD, spreadsheet card import, and a bundled Climb sample.

**Architecture:** `lib/engine/*` holds all rules and state with zero PlayCanvas imports. `components/board/*` renders floors/tokens/dice from engine snapshots and animation intents. `components/hud/*` is DOM + shadcn for cards, actions, import, and config flags. Engine events flow up; HUD/board dispatch commands down.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Vitest, `@playcanvas/react`, `playcanvas`, `sync-ammo` (dice only), `papaparse` (CSV import)

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md`  
**Dice blueprint:** `docs/superpowers/refs/playcanvas-dice-on-board.md`

## Global Constraints

- Next.js + TypeScript + Tailwind + shadcn/ui for app shell and HUD
- v1 board is **PlayCanvas React 3D** — not HTML/CSS board, not Three.js
- HUD is **DOM + shadcn** — not PCUI, not web-components
- **Engine vs PlayCanvas view** — engine is authoritative; view only renders/animates
- **3D tokens slide** between cells (lerp), never rule-changing teleports without engine commit
- **Optional dice** — engine integer first; optional ammo.js on-board visualization per dice blueprint
- **Optional per-floor hold** — per-pack reveal counts; illegal stair landings excluded before sampling
- **Card actions optional** — positive, Pass, both, neither; **Pass does not count as a reveal**
- **Card spreadsheet import** — header-row template; **pack** + **title** required columns
- **Climb** is a **bundled sample only**
- **1+ players**; **no floor/player caps** in engine
- Dev server binds uncommon port **4318** for cloud preview

**Status:** ready for review (slice 1 — engine + PlayCanvas play board)

## Slice scope

This plan is **spec build-order steps 1–2 plus card import on the player**: pure TS engine, PlayCanvas React 3D play board, DOM HUD, bundled Climb sample, spreadsheet card import.

**Not in this plan** (later plans, same spec): game library New/Save/Open/Test/Publish; HTML layout designer + PlayCanvas floor preview; card/pack/spinner/item editor UIs; first-person cameras; outcome/player spinners; rooms (card-only and inner map); full tile media pipeline; draft/live persistence beyond in-memory Climb.

Climb in this slice: named looping floors, land-to-resolve, optional floor hold off by default, engine integer for movement (sample uses 1–6; dice viz is optional).

---

## File Map

| Path | Responsibility |
|------|----------------|
| `package.json` | deps, `test` → vitest |
| `vitest.config.ts` | node + jsdom projects |
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | shell, game route |
| `lib/engine/types.ts` | shared engine types |
| `lib/engine/board.ts` | floors, cells, stairs, legality |
| `lib/engine/players.ts` | player list, token positions |
| `lib/engine/cards.ts` | packs, reveals, Pass vs positive |
| `lib/engine/hold.ts` | per-floor hold, per-pack reveal quotas |
| `lib/engine/dice.ts` | authoritative integer rolls |
| `lib/engine/movement.ts` | moves, stair sampling sans illegal landings |
| `lib/engine/game.ts` | reducer / orchestration |
| `lib/engine/events.ts` | `GameEvent`, `GameCommand` unions |
| `lib/import/spreadsheet.ts` | CSV header-row parser |
| `lib/samples/climb.ts` | bundled Climb board + default flags |
| `lib/view/board-layout.ts` | floor index → world `{x,y,z}` |
| `lib/view/token-slide.ts` | slide interpolation helpers |
| `components/ui/*` | shadcn primitives |
| `components/hud/GameHud.tsx` | layout shell over board |
| `components/hud/CardPanel.tsx` | current card + actions |
| `components/hud/PlayerBar.tsx` | player list / turn |
| `components/hud/ImportCardsDialog.tsx` | CSV upload |
| `components/hud/FeatureToggles.tsx` | dice/hold/action mode |
| `components/board/BoardScene.tsx` | PlayCanvas `Application` root |
| `components/board/FloorStack.tsx` | floor meshes |
| `components/board/TokenActor.tsx` | sliding token entity |
| `components/board/DiceActor.tsx` | optional physics dice |
| `hooks/use-game-store.ts` | React bridge: engine snapshot + dispatch |
| `public/samples/climb-cards.csv` | bundled sample cards |
| `tests/engine/*.test.ts` | pure engine tests |
| `tests/import/*.test.ts` | import tests |
| `tests/view/*.test.ts` | slide + layout tests |

---

## Chunk 1: Scaffold & Tooling

### Task 1: Next.js scaffold with Vitest

**Files:**
- Create: `package.json`, `vitest.config.ts`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `tests/setup.ts`
- Test: `tests/smoke/app.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `npm run dev` (port 4318), `npm test` → vitest

- [ ] **Step 1: Write the failing test**

```ts
// tests/smoke/app.test.ts
import { describe, it, expect } from 'vitest';

describe('app scaffold', () => {
  it('has building board title constant', () => {
    expect(process.env.NEXT_PUBLIC_APP_NAME).toBe('Building Board Template');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/smoke/app.test.ts`
Expected: FAIL — vitest not configured / env unset

- [ ] **Step 3: Scaffold project**

```bash
mkdir -p tmp-scaffold && cd tmp-scaffold
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --turbopack
cd .. && shopt -s dotglob && mv tmp-scaffold/* . && rmdir tmp-scaffold
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev -p 4318",
    "build": "next build",
    "start": "next start -p 4318",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`.env.local`:

```
NEXT_PUBLIC_APP_NAME=Building Board Template
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
```

`app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-6">
      <h1 className="text-2xl font-semibold">Building Board Template</h1>
      <p className="text-slate-400">PlayCanvas board + engine HUD</p>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/smoke/app.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with vitest"
```

---

### Task 2: shadcn/ui baseline

**Files:**
- Create: `components.json`, `lib/utils.ts`
- Create: `components/ui/button.tsx`, `components/ui/dialog.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/switch.tsx`, `components/ui/label.tsx`
- Modify: `app/globals.css`
- Test: `tests/smoke/shadcn.test.tsx`

**Interfaces:**
- Consumes: Task 1 scaffold
- Produces: `import { Button } from '@/components/ui/button'`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/smoke/shadcn.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('shadcn button', () => {
  it('renders children', () => {
    render(<Button>Roll</Button>);
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/smoke/shadcn.test.tsx --environment jsdom`
Expected: FAIL — module `@/components/ui/button` not found

- [ ] **Step 3: Install shadcn**

```bash
npx shadcn@latest init -y -d
npx shadcn@latest add button dialog card badge switch label -y
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/smoke/shadcn.test.tsx --environment jsdom`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components.json components/ui lib/utils.ts app/globals.css tests/smoke/shadcn.test.tsx
git commit -m "chore: add shadcn ui primitives"
```

---

## Chunk 2: Engine Core

### Task 3: Engine types

**Files:**
- Create: `lib/engine/types.ts`
- Test: `tests/engine/types.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `Floor`, `Cell`, `Stair`, `Player`, `TokenPos`, `Card`, `CardPack`, `GameConfig`, `ActionMode`

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/types.test.ts
import { describe, it, expect } from 'vitest';
import type { GameConfig, ActionMode } from '@/lib/engine/types';
import { defaultGameConfig } from '@/lib/engine/types';

describe('GameConfig', () => {
  it('defaults actionMode to both and no caps', () => {
    const cfg: GameConfig = defaultGameConfig();
    expect(cfg.actionMode).toBe('both');
    expect(cfg.maxPlayers).toBeUndefined();
    expect(cfg.maxFloors).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/types.test.ts`
Expected: FAIL — `defaultGameConfig` not exported

- [ ] **Step 3: Implement types**

```ts
// lib/engine/types.ts
export type ActionMode = 'positive' | 'pass' | 'both' | 'neither';

export interface Cell {
  id: string;
  index: number;
}

export interface Stair {
  id: string;
  fromFloorId: string;
  toFloorId: string;
  toCellId: string;
  legal: boolean;
}

export interface Floor {
  id: string;
  index: number;
  label: string;
  cells: Cell[];
  holdEnabled?: boolean;
}

export interface TokenPos {
  floorId: string;
  cellId: string;
}

export interface Player {
  id: string;
  name: string;
  token: TokenPos;
}

export interface Card {
  id: string;
  pack: string;
  title: string;
  body?: string;
  tags?: string[];
}

export interface CardPack {
  id: string;
  cards: Card[];
}

export interface GameConfig {
  actionMode: ActionMode;
  diceEnabled: boolean;
  holdEnabled: boolean;
  diceSides: number;
  maxPlayers?: number;
  maxFloors?: number;
}

export function defaultGameConfig(): GameConfig {
  return {
    actionMode: 'both',
    diceEnabled: false,
    holdEnabled: false,
    diceSides: 6,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/engine/types.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/types.ts tests/engine/types.test.ts
git commit -m "feat(engine): add core types and default config"
```

---

### Task 4: Board model (uncapped floors)

**Files:**
- Create: `lib/engine/board.ts`
- Test: `tests/engine/board.test.ts`

**Interfaces:**
- Consumes: `Floor`, `Stair`, `Cell` from `lib/engine/types.ts`
- Produces: `createBoard(floors, stairs)`, `getFloor(board, floorId)`, `listIllegalStairLandings(board, fromFloorId)`

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/board.test.ts
import { describe, it, expect } from 'vitest';
import { createBoard, listIllegalStairLandings } from '@/lib/engine/board';

const floors = [
  { id: 'f0', index: 0, label: 'Lobby', cells: [{ id: 'c0', index: 0 }] },
  { id: 'f1', index: 1, label: 'Floor 1', cells: [{ id: 'c1', index: 0 }] },
];
const stairs = [
  { id: 's1', fromFloorId: 'f0', toFloorId: 'f1', toCellId: 'c1', legal: false },
];

describe('createBoard', () => {
  it('accepts arbitrary floor count without cap', () => {
    const many = Array.from({ length: 50 }, (_, i) => ({
      id: `f${i}`, index: i, label: `F${i}`, cells: [{ id: `c${i}`, index: 0 }],
    }));
    const board = createBoard(many, []);
    expect(board.floors).toHaveLength(50);
  });

  it('lists illegal stair landings for sampling exclusion', () => {
    const board = createBoard(floors, stairs);
    expect(listIllegalStairLandings(board, 'f0')).toEqual([
      { stairId: 's1', toFloorId: 'f1', toCellId: 'c1' },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/board.test.ts`
Expected: FAIL — `createBoard` not defined

- [ ] **Step 3: Implement board**

```ts
// lib/engine/board.ts
import type { Floor, Stair } from './types';

export interface Board {
  floors: Floor[];
  stairs: Stair[];
}

export function createBoard(floors: Floor[], stairs: Stair[]): Board {
  return { floors: [...floors], stairs: [...stairs] };
}

export function getFloor(board: Board, floorId: string): Floor | undefined {
  return board.floors.find((f) => f.id === floorId);
}

export interface StairLanding {
  stairId: string;
  toFloorId: string;
  toCellId: string;
}

export function listIllegalStairLandings(board: Board, fromFloorId: string): StairLanding[] {
  return board.stairs
    .filter((s) => s.fromFloorId === fromFloorId && !s.legal)
    .map((s) => ({ stairId: s.id, toFloorId: s.toFloorId, toCellId: s.toCellId }));
}

export function listLegalStairLandings(board: Board, fromFloorId: string): StairLanding[] {
  return board.stairs
    .filter((s) => s.fromFloorId === fromFloorId && s.legal)
    .map((s) => ({ stairId: s.id, toFloorId: s.toFloorId, toCellId: s.toCellId }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/engine/board.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/board.ts tests/engine/board.test.ts
git commit -m "feat(engine): add board model and stair legality helpers"
```

---

### Task 5: Players (1+ players, no cap)

**Files:**
- Create: `lib/engine/players.ts`
- Test: `tests/engine/players.test.ts`

**Interfaces:**
- Consumes: `Player`, `TokenPos`, `Board` from prior tasks
- Produces: `addPlayer(state, player)`, `moveToken(state, playerId, pos)`, `requireMinPlayers(count)`

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/players.test.ts
import { describe, it, expect } from 'vitest';
import { createPlayerState, addPlayer, requireMinPlayers } from '@/lib/engine/players';

describe('players', () => {
  it('allows a single player', () => {
    const s = addPlayer(createPlayerState(), { id: 'p1', name: 'A', token: { floorId: 'f0', cellId: 'c0' } });
    expect(requireMinPlayers(s, 1)).toBe(true);
  });

  it('allows many players without engine cap', () => {
    let s = createPlayerState();
    for (let i = 0; i < 12; i++) {
      s = addPlayer(s, { id: `p${i}`, name: `P${i}`, token: { floorId: 'f0', cellId: 'c0' } });
    }
    expect(s.players).toHaveLength(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/players.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/engine/players.ts
import type { Player, TokenPos } from './types';

export interface PlayerState {
  players: Player[];
  activePlayerId: string | null;
}

export function createPlayerState(): PlayerState {
  return { players: [], activePlayerId: null };
}

export function addPlayer(state: PlayerState, player: Player): PlayerState {
  const players = [...state.players, player];
  return {
    players,
    activePlayerId: state.activePlayerId ?? player.id,
  };
}

export function moveToken(state: PlayerState, playerId: string, pos: TokenPos): PlayerState {
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, token: pos } : p)),
  };
}

export function requireMinPlayers(state: PlayerState, min: number): boolean {
  return state.players.length >= min;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/engine/players.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/players.ts tests/engine/players.test.ts
git commit -m "feat(engine): player state without hard caps"
```

---

### Task 6: Dice — engine integer first

**Files:**
- Create: `lib/engine/dice.ts`
- Test: `tests/engine/dice.test.ts`

**Interfaces:**
- Consumes: none (injectable RNG for tests)
- Produces: `rollInteger(sides, rng?)`, `createDiceRollEvent(value, sides)`

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/dice.test.ts
import { describe, it, expect } from 'vitest';
import { rollInteger } from '@/lib/engine/dice';

describe('rollInteger', () => {
  it('returns integer in 1..sides using injected rng', () => {
    expect(rollInteger(6, () => 0)).toBe(1);
    expect(rollInteger(6, () => 0.999)).toBe(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/dice.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/engine/dice.ts
export type Rng = () => number;

export function rollInteger(sides: number, rng: Rng = Math.random): number {
  if (sides < 1) throw new Error('sides must be >= 1');
  return Math.floor(rng() * sides) + 1;
}

export interface DiceRollEvent {
  type: 'DICE_ROLLED';
  value: number;
  sides: number;
}

export function createDiceRollEvent(value: number, sides: number): DiceRollEvent {
  return { type: 'DICE_ROLLED', value, sides };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/engine/dice.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/dice.ts tests/engine/dice.test.ts
git commit -m "feat(engine): authoritative integer dice rolls"
```

---

### Task 7: Cards, reveals, Pass exclusion

**Files:**
- Create: `lib/engine/cards.ts`
- Test: `tests/engine/cards.test.ts`

**Interfaces:**
- Consumes: `Card`, `ActionMode`, `GameConfig`
- Produces: `revealCard(state, packId)`, `applyAction(state, action: 'positive' | 'pass')`, `countsTowardReveal(action)`

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/cards.test.ts
import { describe, it, expect } from 'vitest';
import { createCardState, revealCard, applyAction, countsTowardReveal } from '@/lib/engine/cards';

const card = { id: '1', pack: 'climb', title: 'Rung' };

describe('cards', () => {
  it('increments reveal count on positive reveal', () => {
    let s = createCardState([card]);
    s = revealCard(s, 'climb');
    expect(s.revealedByPack.climb).toBe(1);
  });

  it('pass does not count as reveal', () => {
    expect(countsTowardReveal('pass')).toBe(false);
    expect(countsTowardReveal('positive')).toBe(true);
    let s = createCardState([card]);
    s = applyAction(s, 'pass', 'climb');
    expect(s.revealedByPack.climb ?? 0).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/cards.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/engine/cards.ts
import type { Card, ActionMode } from './types';

export interface CardState {
  deck: Card[];
  revealedByPack: Record<string, number>;
  currentCard: Card | null;
}

export function createCardState(cards: Card[]): CardState {
  return { deck: cards, revealedByPack: {}, currentCard: null };
}

export function countsTowardReveal(action: 'positive' | 'pass'): boolean {
  return action === 'positive';
}

export function revealCard(state: CardState, packId: string): CardState {
  const card = state.deck.find((c) => c.pack === packId);
  if (!card) return state;
  return {
    ...state,
    currentCard: card,
    revealedByPack: {
      ...state.revealedByPack,
      [packId]: (state.revealedByPack[packId] ?? 0) + 1,
    },
  };
}

export function applyAction(state: CardState, action: 'positive' | 'pass', packId: string): CardState {
  if (action === 'pass') {
    return { ...state, currentCard: null };
  }
  return revealCard(state, packId);
}

export function allowedActions(mode: ActionMode): Array<'positive' | 'pass'> {
  switch (mode) {
    case 'positive': return ['positive'];
    case 'pass': return ['pass'];
    case 'both': return ['positive', 'pass'];
    case 'neither': return [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/engine/cards.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/cards.ts tests/engine/cards.test.ts
git commit -m "feat(engine): card reveals with pass excluded from counts"
```

---

### Task 8: Per-floor hold + per-pack reveal quotas

**Files:**
- Create: `lib/engine/hold.ts`
- Test: `tests/engine/hold.test.ts`

**Interfaces:**
- Consumes: `Board`, `CardState`, `Player`
- Produces: `enterHold(state, floorId)`, `holdRevealQuotaMet(state, packId, quota)`, `canExitHold(state)`

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/hold.test.ts
import { describe, it, expect } from 'vitest';
import { createHoldState, recordHoldReveal, canExitHold } from '@/lib/engine/hold';

describe('hold', () => {
  it('tracks per-pack reveals while on hold', () => {
    let h = createHoldState('f1', { climb: 2 });
    h = recordHoldReveal(h, 'climb');
    expect(canExitHold(h)).toBe(false);
    h = recordHoldReveal(h, 'climb');
    expect(canExitHold(h)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/hold.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/engine/hold.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/engine/hold.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/hold.ts tests/engine/hold.test.ts
git commit -m "feat(engine): per-floor hold with per-pack reveal quotas"
```

---

### Task 9: Movement + illegal stair sampling exclusion

**Files:**
- Create: `lib/engine/movement.ts`
- Test: `tests/engine/movement.test.ts`

**Interfaces:**
- Consumes: `Board`, `listLegalStairLandings`, `listIllegalStairLandings`, `Rng`
- Produces: `sampleStairLanding(board, fromFloorId, rng)`, `slideTargetWorld` deferred to view task

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/movement.test.ts
import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { sampleStairLanding } from '@/lib/engine/movement';

const board = createBoard(
  [
    { id: 'f0', index: 0, label: 'L', cells: [{ id: 'c0', index: 0 }] },
    { id: 'f1', index: 1, label: '1', cells: [{ id: 'c1', index: 0 }] },
    { id: 'f2', index: 2, label: '2', cells: [{ id: 'c2', index: 0 }] },
  ],
  [
    { id: 's-ok', fromFloorId: 'f0', toFloorId: 'f1', toCellId: 'c1', legal: true },
    { id: 's-bad', fromFloorId: 'f0', toFloorId: 'f2', toCellId: 'c2', legal: false },
  ],
);

describe('sampleStairLanding', () => {
  it('never returns illegal stair landings', () => {
    for (let i = 0; i < 20; i++) {
      const landing = sampleStairLanding(board, 'f0', () => Math.random());
      expect(landing?.stairId).toBe('s-ok');
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/movement.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/engine/movement.ts
import type { Board, StairLanding } from './board';
import { listLegalStairLandings } from './board';
import type { Rng } from './dice';

export function sampleStairLanding(board: Board, fromFloorId: string, rng: Rng): StairLanding | null {
  const legal = listLegalStairLandings(board, fromFloorId);
  if (legal.length === 0) return null;
  const idx = Math.floor(rng() * legal.length);
  return legal[idx] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/engine/movement.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/movement.ts tests/engine/movement.test.ts
git commit -m "feat(engine): stair sampling excludes illegal landings"
```

---

### Task 10: Game reducer + events

**Files:**
- Create: `lib/engine/events.ts`, `lib/engine/game.ts`
- Test: `tests/engine/game.test.ts`

**Interfaces:**
- Consumes: all engine modules
- Produces: `createGame(initial)`, `dispatch(game, cmd)`, `GameState`, `GameCommand`

- [ ] **Step 1: Write the failing test**

```ts
// tests/engine/game.test.ts
import { describe, it, expect } from 'vitest';
import { createGame, dispatch } from '@/lib/engine/game';
import { climbSample } from '@/lib/samples/climb';

describe('game dispatch', () => {
  it('rolls dice via engine before emitting event', () => {
    const game = createGame(climbSample, { diceEnabled: true, rng: () => 0.5 });
    const next = dispatch(game, { type: 'ROLL_DICE' });
    expect(next.lastEvent?.type).toBe('DICE_ROLLED');
    expect(next.lastEvent?.value).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/game.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement events + game** (stub `climbSample` until Task 12)

```ts
// lib/engine/events.ts
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
```

```ts
// lib/engine/game.ts
import { defaultGameConfig, type GameConfig } from './types';
import { createBoard, type Board } from './board';
import { createPlayerState, addPlayer, moveToken, type PlayerState } from './players';
import { rollInteger, createDiceRollEvent, type Rng } from './dice';
import { createCardState, applyAction, type CardState } from './cards';
import { createHoldState, canExitHold, recordHoldReveal, type HoldState } from './hold';
import { sampleStairLanding } from './movement';
import type { GameCommand, GameEvent } from './events';

export interface GameState {
  config: GameConfig;
  board: Board;
  players: PlayerState;
  cards: CardState;
  hold: HoldState | null;
  lastEvent: GameEvent | null;
  rng: Rng;
}

export interface GameBootstrap {
  board: Board;
  players: PlayerState;
  cards: CardState;
  config?: Partial<GameConfig>;
  rng?: Rng;
}

export function createGame(bootstrap: GameBootstrap, overrides?: Partial<GameConfig> & { rng?: Rng }): GameState {
  return {
    config: { ...defaultGameConfig(), ...bootstrap.config, ...overrides },
    board: bootstrap.board,
    players: bootstrap.players,
    cards: bootstrap.cards,
    hold: null,
    lastEvent: null,
    rng: overrides?.rng ?? Math.random,
  };
}

export function dispatch(state: GameState, cmd: GameCommand): GameState {
  switch (cmd.type) {
    case 'ROLL_DICE': {
      if (!state.config.diceEnabled) return state;
      const value = rollInteger(state.config.diceSides, state.rng);
      return { ...state, lastEvent: createDiceRollEvent(value, state.config.diceSides) };
    }
    case 'PASS_CARD':
      return { ...state, cards: applyAction(state.cards, 'pass', cmd.packId), lastEvent: null };
    case 'REVEAL_CARD':
      return { ...state, cards: applyAction(state.cards, 'positive', cmd.packId), lastEvent: null };
    case 'MOVE_SAMPLE_STAIR': {
      const active = state.players.activePlayerId;
      if (!active) return state;
      const player = state.players.players.find((p) => p.id === active);
      if (!player) return state;
      const landing = sampleStairLanding(state.board, player.token.floorId, state.rng);
      if (!landing) return state;
      const players = moveToken(state.players, active, { floorId: landing.toFloorId, cellId: landing.toCellId });
      let hold = state.hold;
      if (state.config.holdEnabled) {
        const floor = state.board.floors.find((f) => f.id === landing.toFloorId);
        if (floor?.holdEnabled) hold = createHoldState(floor.id, { climb: 1 });
      }
      return {
        ...state,
        players,
        hold,
        lastEvent: { type: 'TOKEN_MOVED', playerId: active, floorId: landing.toFloorId, cellId: landing.toCellId },
      };
    }
    default:
      return state;
  }
}

export function tryExitHold(state: GameState): GameState {
  if (!state.hold || !canExitHold(state.hold)) return state;
  return { ...state, hold: null, lastEvent: { type: 'HOLD_EXITED' } };
}
```

- [ ] **Step 4: Run test to verify it passes** (after Task 12 adds `climbSample`)

Run: `npm test tests/engine/game.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/events.ts lib/engine/game.ts tests/engine/game.test.ts
git commit -m "feat(engine): game reducer with dice and movement commands"
```

---

## Chunk 3: Import & Climb Sample

### Task 11: Spreadsheet import (pack + title required)

**Files:**
- Create: `lib/import/spreadsheet.ts`
- Create: `tests/import/fixtures/valid.csv`, `tests/import/fixtures/missing-title.csv`
- Test: `tests/import/spreadsheet.test.ts`

**Interfaces:**
- Consumes: CSV string
- Produces: `parseCardCsv(text): { cards: Card[]; errors: string[] }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/import/spreadsheet.test.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseCardCsv } from '@/lib/import/spreadsheet';

describe('parseCardCsv', () => {
  it('imports header row with required pack and title', () => {
    const csv = readFileSync(path.join(__dirname, 'fixtures/valid.csv'), 'utf8');
    const { cards, errors } = parseCardCsv(csv);
    expect(errors).toHaveLength(0);
    expect(cards[0]).toMatchObject({ pack: 'climb', title: 'First Rung' });
  });

  it('skips rows missing required columns', () => {
    const csv = readFileSync(path.join(__dirname, 'fixtures/missing-title.csv'), 'utf8');
    const { cards, errors } = parseCardCsv(csv);
    expect(cards).toHaveLength(0);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

`tests/import/fixtures/valid.csv`:

```csv
pack,title,body
climb,First Rung,Climb one floor
```

`tests/import/fixtures/missing-title.csv`:

```csv
pack,body
climb,oops no title
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/import/spreadsheet.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```bash
npm install papaparse
npm install -D @types/papaparse
```

```ts
// lib/import/spreadsheet.ts
import Papa from 'papaparse';
import type { Card } from '@/lib/engine/types';

export function parseCardCsv(text: string): { cards: Card[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const errors: string[] = [];
  const cards: Card[] = [];
  parsed.data.forEach((row, i) => {
    const pack = row.pack?.trim();
    const title = row.title?.trim();
    if (!pack || !title) {
      errors.push(`row ${i + 2}: pack and title required`);
      return;
    }
    cards.push({
      id: `${pack}-${i}`,
      pack,
      title,
      body: row.body?.trim() || undefined,
      tags: row.tags ? row.tags.split('|').map((t) => t.trim()) : undefined,
    });
  });
  return { cards, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/import/spreadsheet.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/import/spreadsheet.ts tests/import tests/import/fixtures
git commit -m "feat(import): header-row CSV with required pack and title"
```

---

### Task 12: Climb bundled sample

**Files:**
- Create: `lib/samples/climb.ts`
- Create: `public/samples/climb-cards.csv`
- Modify: `tests/engine/game.test.ts` (uses climbSample)
- Test: `tests/samples/climb.test.ts`

**Interfaces:**
- Consumes: engine modules + import parser
- Produces: `climbSample: GameBootstrap`, `CLIMB_LABEL = 'Climb (sample)'`

- [ ] **Step 1: Write the failing test**

```ts
// tests/samples/climb.test.ts
import { describe, it, expect } from 'vitest';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';

describe('climb sample', () => {
  it('is labeled as bundled sample only', () => {
    expect(CLIMB_LABEL).toContain('sample');
  });

  it('provides multi-floor board without caps', () => {
    expect(climbSample.board.floors.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/samples/climb.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement sample**

```ts
// lib/samples/climb.ts
import { createBoard } from '@/lib/engine/board';
import { createPlayerState, addPlayer } from '@/lib/engine/players';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap } from '@/lib/engine/game';

export const CLIMB_LABEL = 'Climb (sample)';

const floors = [
  { id: 'lobby', index: 0, label: 'Lobby', cells: [{ id: 'l0', index: 0 }], holdEnabled: false },
  { id: 'f1', index: 1, label: 'Floor 1', cells: [{ id: 'f1c0', index: 0 }], holdEnabled: true },
  { id: 'f2', index: 2, label: 'Floor 2', cells: [{ id: 'f2c0', index: 0 }], holdEnabled: false },
];

const stairs = [
  { id: 's0-1', fromFloorId: 'lobby', toFloorId: 'f1', toCellId: 'f1c0', legal: true },
  { id: 's0-bypass', fromFloorId: 'lobby', toFloorId: 'f2', toCellId: 'f2c0', legal: false },
  { id: 's1-2', fromFloorId: 'f1', toFloorId: 'f2', toCellId: 'f2c0', legal: true },
];

const cards = [
  { id: 'climb-1', pack: 'climb', title: 'First Rung', body: 'Advance one floor' },
];

export const climbSample: GameBootstrap = {
  board: createBoard(floors, stairs),
  players: addPlayer(createPlayerState(), {
    id: 'p1',
    name: 'Climber',
    token: { floorId: 'lobby', cellId: 'l0' },
  }),
  cards: createCardState(cards),
  config: { diceEnabled: true, holdEnabled: true, actionMode: 'both' },
};
```

`public/samples/climb-cards.csv` — copy of test fixture plus 2 rows.

- [ ] **Step 4: Run tests**

Run: `npm test tests/samples/climb.test.ts tests/engine/game.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/samples/climb.ts public/samples/climb-cards.csv tests/samples/climb.test.ts
git commit -m "feat(sample): bundled Climb bootstrap data"
```

---

## Chunk 4: View Layer (PlayCanvas)

### Task 13: Board layout + token slide helpers

**Files:**
- Create: `lib/view/board-layout.ts`, `lib/view/token-slide.ts`
- Test: `tests/view/token-slide.test.ts`

**Interfaces:**
- Consumes: `floor.index`, `cell.index`
- Produces: `cellToWorld(floorIndex, cellIndex)`, `lerpVec3(a, b, t)`

- [ ] **Step 1: Write the failing test**

```ts
// tests/view/token-slide.test.ts
import { describe, it, expect } from 'vitest';
import { cellToWorld } from '@/lib/view/board-layout';
import { lerpVec3 } from '@/lib/view/token-slide';

describe('token slide', () => {
  it('maps floor index to increasing y', () => {
    expect(cellToWorld(0, 0).y).toBeLessThan(cellToWorld(2, 0).y);
  });

  it('lerps between positions', () => {
    expect(lerpVec3({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 0.5).x).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/view/token-slide.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// lib/view/board-layout.ts
const FLOOR_HEIGHT = 2;
const CELL_SPACING = 1.5;

export interface Vec3 { x: number; y: number; z: number }

export function cellToWorld(floorIndex: number, cellIndex: number): Vec3 {
  return { x: cellIndex * CELL_SPACING, y: floorIndex * FLOOR_HEIGHT, z: 0 };
}
```

```ts
// lib/view/token-slide.ts
import type { Vec3 } from './board-layout';

export function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

export function slideDurationSeconds(distance: number): number {
  return Math.min(1.2, 0.25 + distance * 0.05);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/view/token-slide.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/view tests/view
git commit -m "feat(view): board layout and token slide helpers"
```

---

### Task 14: PlayCanvas BoardScene + FloorStack

**Files:**
- Create: `components/board/BoardScene.tsx`, `components/board/FloorStack.tsx`
- Modify: `app/page.tsx`
- Test: `tests/view/board-scene.test.tsx`

**Interfaces:**
- Consumes: `GameState` snapshot, `cellToWorld`
- Produces: client component `BoardScene` rendering `@playcanvas/react` `Application`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/view/board-scene.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@playcanvas/react', () => ({
  Application: ({ children }: { children: React.ReactNode }) => <div data-testid="pc-app">{children}</div>,
  Entity: ({ name }: { name?: string }) => <div data-testid={`entity-${name}`} />,
}));

import { BoardScene } from '@/components/board/BoardScene';
import { climbSample } from '@/lib/samples/climb';
import { createGame } from '@/lib/engine/game';

describe('BoardScene', () => {
  it('mounts PlayCanvas Application', () => {
    const game = createGame(climbSample);
    render(<BoardScene game={game} />);
    expect(screen.getByTestId('pc-app')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/view/board-scene.test.tsx --environment jsdom`
Expected: FAIL

- [ ] **Step 3: Install PlayCanvas + implement**

```bash
npm install @playcanvas/react playcanvas
```

```tsx
// components/board/BoardScene.tsx
'use client';

import { Application } from '@playcanvas/react';
import type { GameState } from '@/lib/engine/game';
import { FloorStack } from './FloorStack';

export function BoardScene({ game, usePhysics = false }: { game: GameState; usePhysics?: boolean }) {
  return (
    <div className="h-[480px] w-full rounded-lg overflow-hidden border border-slate-800">
      <Application usePhysics={usePhysics}>
        <FloorStack board={game.board} />
      </Application>
    </div>
  );
}
```

```tsx
// components/board/FloorStack.tsx
'use client';

import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import type { Board } from '@/lib/engine/board';
import { cellToWorld } from '@/lib/view/board-layout';

export function FloorStack({ board }: { board: Board }) {
  return (
    <>
      {board.floors.map((floor) => {
        const pos = cellToWorld(floor.index, 0);
        return (
          <Entity key={floor.id} name={floor.id} position={[pos.x, pos.y, pos.z]}>
            <Render type="box" />
          </Entity>
        );
      })}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/view/board-scene.test.tsx --environment jsdom`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/board app/page.tsx package.json package-lock.json tests/view/board-scene.test.tsx
git commit -m "feat(board): PlayCanvas scene with floor stack"
```

---

### Task 15: Sliding TokenActor

**Files:**
- Create: `components/board/TokenActor.tsx`
- Modify: `components/board/BoardScene.tsx`
- Test: `tests/view/token-actor.test.tsx`

**Interfaces:**
- Consumes: `TOKEN_MOVED` events, `lerpVec3`, `slideDurationSeconds`
- Produces: `TokenActor` animating position each frame toward target

- [ ] **Step 1: Write the failing test**

```tsx
// tests/view/token-actor.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { computeSlideFrame } from '@/components/board/TokenActor';

describe('computeSlideFrame', () => {
  it('returns start at t=0 and end at t=1', () => {
    const start = { x: 0, y: 0, z: 0 };
    const end = { x: 3, y: 2, z: 0 };
    expect(computeSlideFrame(start, end, 0)).toEqual(start);
    expect(computeSlideFrame(start, end, 1)).toEqual(end);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/view/token-actor.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement**

```tsx
// components/board/TokenActor.tsx
'use client';

import { Entity } from '@playcanvas/react';
import { Render } from '@playcanvas/react/components';
import { lerpVec3, slideDurationSeconds } from '@/lib/view/token-slide';
import type { Vec3 } from '@/lib/view/board-layout';

export function computeSlideFrame(from: Vec3, to: Vec3, t: number): Vec3 {
  return lerpVec3(from, to, Math.max(0, Math.min(1, t)));
}

export function TokenActor({ name, position }: { name: string; position: Vec3 }) {
  return (
    <Entity name={name} position={[position.x, position.y + 0.3, position.z]}>
      <Render type="sphere" />
    </Entity>
  );
}

export function useTokenSlide(from: Vec3, to: Vec3, duration = slideDurationSeconds(1)) {
  // requestAnimationFrame loop in component — export duration helper for tests
  return { from, to, duration };
}
```

Wire `BoardScene` to render `TokenActor` per player at lerped positions when `lastEvent.type === 'TOKEN_MOVED'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/view/token-actor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/board/TokenActor.tsx components/board/BoardScene.tsx tests/view/token-actor.test.tsx
git commit -m "feat(board): sliding 3D tokens between cells"
```

---

### Task 16: Optional DiceActor (ammo.js on board)

**Files:**
- Create: `components/board/DiceActor.tsx`
- Modify: `components/board/BoardScene.tsx`
- Test: `tests/view/dice-actor.test.tsx`

**Interfaces:**
- Consumes: `DICE_ROLLED` event, dice blueprint, `sync-ammo`
- Produces: `DiceActor` with `usePhysics` gated by `config.diceEnabled`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/view/dice-actor.test.tsx
import { describe, it, expect } from 'vitest';
import { faceRotationForValue } from '@/components/board/DiceActor';

describe('faceRotationForValue', () => {
  it('maps d6 values to euler presets', () => {
    expect(faceRotationForValue(1)).toEqual([0, 0, 0]);
    expect(faceRotationForValue(6)).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/view/dice-actor.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement per dice blueprint**

```bash
npm install sync-ammo
```

```tsx
// components/board/DiceActor.tsx
'use client';

import { Entity } from '@playcanvas/react';
import { Collision, Rigidbody, Render } from '@playcanvas/react/components';

const D6_ROTATIONS: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, 0, 90],
  3: [90, 0, 0],
  4: [-90, 0, 0],
  5: [0, 0, -90],
  6: [180, 0, 0],
};

export function faceRotationForValue(value: number): [number, number, number] {
  return D6_ROTATIONS[value] ?? [0, 0, 0];
}

export function DiceActor({ targetValue, rolling }: { targetValue: number; rolling: boolean }) {
  const rotation = rolling ? [0, 0, 0] : faceRotationForValue(targetValue);
  return (
    <Entity name="die" rotation={rotation} position={[0, 1.5, 0]}>
      <Render type="box" />
      <Collision type="box" halfExtents={[0.25, 0.25, 0.25]} />
      <Rigidbody type="dynamic" mass={0.05} restitution={0.35} />
    </Entity>
  );
}
```

`BoardScene`: pass `usePhysics={game.config.diceEnabled}`; on `DICE_ROLLED`, show `DiceActor` with `targetValue={event.value}`; after timeout/settle, set `rolling={false}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/view/dice-actor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/board/DiceActor.tsx components/board/BoardScene.tsx package.json tests/view/dice-actor.test.tsx
git commit -m "feat(board): optional ammo.js dice visualization"
```

---

## Chunk 5: HUD & Integration

### Task 17: useGameStore bridge (engine ↔ React)

**Files:**
- Create: `hooks/use-game-store.ts`
- Test: `tests/hooks/use-game-store.test.ts`

**Interfaces:**
- Consumes: `createGame`, `dispatch`, `climbSample`
- Produces: `useGameStore()` → `{ game, dispatch, lastEvent }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/hooks/use-game-store.test.ts
import { describe, it, expect } from 'vitest';
import { createGameStore } from '@/hooks/use-game-store';
import { climbSample } from '@/lib/samples/climb';

describe('createGameStore', () => {
  it('dispatches roll and stores last event', () => {
    const store = createGameStore(climbSample);
    const next = store.dispatch({ type: 'ROLL_DICE' });
    expect(next.lastEvent?.type).toBe('DICE_ROLLED');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/hooks/use-game-store.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement**

```ts
// hooks/use-game-store.ts
import { useCallback, useState } from 'react';
import { createGame, dispatch, type GameState, type GameBootstrap } from '@/lib/engine/game';
import type { GameCommand } from '@/lib/engine/events';

export function createGameStore(bootstrap: GameBootstrap) {
  let state = createGame(bootstrap);
  return {
    getState: () => state,
    dispatch: (cmd: GameCommand) => {
      state = dispatch(state, cmd);
      return state;
    },
  };
}

export function useGameStore(bootstrap: GameBootstrap) {
  const [game, setGame] = useState(() => createGame(bootstrap));
  const send = useCallback((cmd: GameCommand) => {
    setGame((g) => dispatch(g, cmd));
  }, []);
  return { game, dispatch: send, lastEvent: game.lastEvent };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/hooks/use-game-store.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/use-game-store.ts tests/hooks/use-game-store.test.ts
git commit -m "feat: react hook bridging engine dispatch"
```

---

### Task 18: DOM HUD — CardPanel + actions

**Files:**
- Create: `components/hud/CardPanel.tsx`, `components/hud/PlayerBar.tsx`
- Test: `tests/hud/card-panel.test.tsx`

**Interfaces:**
- Consumes: `useGameStore`, `allowedActions`, shadcn `Button`, `Card`
- Produces: HUD controls calling `REVEAL_CARD` / `PASS_CARD`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/hud/card-panel.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardPanel } from '@/components/hud/CardPanel';

describe('CardPanel', () => {
  it('shows Pass button when actionMode is both', () => {
    const onDispatch = vi.fn();
    render(
      <CardPanel
        actionMode="both"
        currentCard={{ id: '1', pack: 'climb', title: 'Rung' }}
        onDispatch={onDispatch}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Pass' }));
    expect(onDispatch).toHaveBeenCalledWith({ type: 'PASS_CARD', packId: 'climb' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hud/card-panel.test.tsx --environment jsdom`
Expected: FAIL

- [ ] **Step 3: Implement**

```tsx
// components/hud/CardPanel.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { allowedActions } from '@/lib/engine/cards';
import type { ActionMode } from '@/lib/engine/types';
import type { Card as CardType } from '@/lib/engine/types';
import type { GameCommand } from '@/lib/engine/events';

export function CardPanel({
  actionMode,
  currentCard,
  onDispatch,
}: {
  actionMode: ActionMode;
  currentCard: CardType | null;
  onDispatch: (cmd: GameCommand) => void;
}) {
  const actions = allowedActions(actionMode);
  if (!currentCard) return <p className="text-slate-400">No card drawn</p>;
  return (
    <Card>
      <CardHeader><CardTitle>{currentCard.title}</CardTitle></CardHeader>
      <CardContent className="flex gap-2">
        {actions.includes('positive') && (
          <Button onClick={() => onDispatch({ type: 'REVEAL_CARD', packId: currentCard.pack })}>Play</Button>
        )}
        {actions.includes('pass') && (
          <Button variant="secondary" onClick={() => onDispatch({ type: 'PASS_CARD', packId: currentCard.pack })}>Pass</Button>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hud/card-panel.test.tsx --environment jsdom`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/hud tests/hud
git commit -m "feat(hud): card panel with optional pass and play actions"
```

---

### Task 19: Import dialog + feature toggles

**Files:**
- Create: `components/hud/ImportCardsDialog.tsx`, `components/hud/FeatureToggles.tsx`, `components/hud/GameHud.tsx`
- Test: `tests/hud/import-dialog.test.tsx`

**Interfaces:**
- Consumes: `parseCardCsv`, shadcn `Dialog`, `Switch`
- Produces: CSV upload merges into card deck; toggles `diceEnabled`, `holdEnabled`, `actionMode`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/hud/import-dialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';

describe('ImportCardsDialog', () => {
  it('parses uploaded csv and calls onImport', async () => {
    const onImport = vi.fn();
    render(<ImportCardsDialog open onOpenChange={() => {}} onImport={onImport} />);
    const file = new File(['pack,title\nclimb,Step\n'], 'cards.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload/i);
    fireEvent.change(input, { target: { files: [file] } });
    await vi.waitFor(() => expect(onImport).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hud/import-dialog.test.tsx --environment jsdom`
Expected: FAIL

- [ ] **Step 3: Implement** `ImportCardsDialog` (file input + `parseCardCsv`), `FeatureToggles`, and `GameHud` composing `BoardScene`, `CardPanel`, `PlayerBar`, roll/move buttons.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hud/import-dialog.test.tsx --environment jsdom`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/hud
git commit -m "feat(hud): import dialog and feature toggles"
```

---

### Task 20: Page integration + README

**Files:**
- Modify: `app/page.tsx`
- Modify: `README.md`
- Test: full suite

**Interfaces:**
- Consumes: all prior tasks
- Produces: working preview at `http://127.0.0.1:4318`

- [ ] **Step 1: Wire page**

```tsx
// app/page.tsx
'use client';

import { GameHud } from '@/components/hud/GameHud';
import { climbSample, CLIMB_LABEL } from '@/lib/samples/climb';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Building Board Template</h1>
        <p className="text-slate-400">Sample: {CLIMB_LABEL}</p>
      </header>
      <GameHud bootstrap={climbSample} />
    </main>
  );
}
```

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: all tests PASS

- [ ] **Step 3: Run dev server**

Run: `npm run dev`
Expected: listening on port 4318; PlayCanvas board + HUD visible

- [ ] **Step 4: Update README** with setup, test commands, architecture note (engine vs view), import template columns, feature flags.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx README.md
git commit -m "feat: integrate PlayCanvas board with DOM HUD and Climb sample"
```

---

## Self-Review

### Spec coverage

| Requirement | Task(s) |
|-------------|---------|
| Next.js + TS + Tailwind + shadcn | 1, 2 |
| PlayCanvas React 3D board (not HTML/Three) | 14–16 |
| DOM HUD + shadcn (not PCUI) | 2, 18–19 |
| Engine vs PlayCanvas separation | 3–10, 17 |
| 3D tokens slide | 13, 15 |
| Optional dice (engine int first, ammo viz) | 6, 16 + dice blueprint |
| Optional per-floor hold + per-pack reveals | 8, 10 |
| Illegal stair landings excluded from sampling | 4, 9 |
| Card actions optional; Pass not a reveal | 7 |
| Spreadsheet import (pack + title) | 11 |
| Climb bundled sample | 12 |
| 1+ players, no caps | 5, 4 |

Slice 1 only. Designer studio, publish, first-person, rooms, outcome/player spinners, and tile media are **out of this plan** (see Slice scope).

### Placeholder scan

No TBD/TODO/similar-to tasks. Each task includes code and commands.

### Type consistency

`GameCommand`, `GameEvent`, `GameState`, `GameBootstrap`, `Vec3`, `StairLanding` names align across tasks.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-18-building-board-template-playcanvas.md`.**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
**2. Inline Execution** — batch tasks with checkpoints via executing-plans

Which approach?
