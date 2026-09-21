# Slice 5 — Layout Designer (HTML Grid + PlayCanvas Floor Preview) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the studio author floors, corridor cells, and stairs on an HTML grid with pack assignment, show a PlayCanvas preview of the floor being edited, persist that layout into the local library draft (Save/Open), and Test-play the current draft board.

**Architecture:** Keep rules in PlayCanvas-free TypeScript. Extend `Cell` / `Floor` with optional grid coordinates and a reserved HUD rectangle so Game JSON round-trips the designer. `lib/engine/layout.ts` owns occupancy, loop detection, and start tokens. `lib/designer/*` mutates the board and validates Test. HTML designer chrome lives in `components/designer/*`. PlayCanvas stays in `components/board/*` as a **read-only** preview of the selected floor (not an in-canvas editor). `StudioShell` holds a working `Board` + start players, mode `design` | `test`, and Save/Open/Test against that working document. The live HUD still owns cards/config.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui (`Button`, `Input`, `Label` — native `<select>`, no new npm packages), Vitest, existing engine + library + HUD + PlayCanvas React board.

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md` (Layout designer, Building, Squares, UI states, Testing)  
**Slice 4 (done, GitHub main `ff7d5c3`):** `docs/superpowers/plans/2026-09-21-slice-4-game-library.md`  
**Preferences:** `docs/preferences.md` (HUD dice; Play/Pass cards; no timer cards)

**Base branch:** Implement from **GitHub `main`** (slice 4 library at `ff7d5c3`). Create `feat/slice-5-layout-designer` from that main. Do **not** implement on older slice branches.

**Harness today (slice 4):** `StudioShell` mounts `GameHud` for the active local draft. New / Save / Open persist `StoredBootstrap` (`board`, starting `players`, `cards`, `config`). Climb sample is three 6-cell loops with up stairs; empty board is one 6-cell Ground loop. Cells have `id`, `index`, `kind`, `packId`, `stairId` — **no** row/col. PlayCanvas `BoardScene` draws every floor; there is no designer grid and no Test gate.

## Global Constraints

- Engine is a small set of repeating mechanics; **Game JSON + the designer** own the rules (Climb is only the first bundled example)
- **PlayCanvas React** is the **3D board view only** (play board + this slice’s **creator floor preview**); engine, library, and designer mutations have **zero** PlayCanvas imports
- Do **not** build the editor inside the 3D canvas — HTML grid, palette, and forms author the board
- HUD, cards, setup, library, and designer chrome stay **DOM + shadcn/ui** — not PCUI, not PlayCanvas Screen/Element, not `@playcanvas/web-components`
- **Engine integer first** — designer must not change `ROLL_DICE` sampling or HUD tumble → slide → card sequence
- **Pass** does **not** count as a pack reveal; **neither** (no buttons) **does** count on deal
- Movement **samples only values that would not land on an illegal stair**; if every possible roll would, movement is **0**
- Resolve **only the square you stop on**
- **1+ players**; **no** engine floor/player caps
- **Climb** is a **bundled sample only**
- Session / drafts persist in the **browser**; no accounts
- **Save draft** is allowed even if stairs/loops are invalid for Test/Publish
- **Test** always uses the **current draft** (working board after save); not a public URL
- Stair squares **never** hold packs
- Dev server stays on uncommon port **4318**
- **Spec override (slice 3, still in force):** dice throw lives in **HUD space**, not on the 3D board
- **Spec override (slice 4, still in force):** Open lists **local drafts only**. No live publish slug
- **Spec override (this slice):** no end-floor exception yet — **every** floor with cells must be a **4-adjacent corridor loop** of at least 4 squares. No room-only floors. Stair direction is **one destination** (up or down from floor index). **Both** and player-choice stairs are later

## Slice scope

**In this plan:** HTML layout grid (floor tabs, named floors, palette, click-to-place, drag-to-move); reserved HUD slots that reject drops; corridor squares; stairs that must link to a destination floor + landing cell before Test; attach existing pack ids to corridor cells; mark one start square; PlayCanvas preview of the **selected floor only**; persist layout into the library draft; **Design / Test** studio modes; Test blocked with a named error list until the board is valid; Test remounts the existing HUD on that draft.

**Out of this plan:** first-person cameras; publish live / public slug; card/pack/spinner/item designer UI (CSV import in Test HUD stays); timer cards / extra card buttons; rooms, inner maps, item squares, **and** a door cell (a door is only meaningful with a room — skip both; next designer slice can add card-only rooms with a minimal door); buyable packs; media links (image/cutscene/audio); end-floor non-loop paths; stair direction **both**; floor-hold quota editor (Test HUD toggle still exists); downloadable JSON / copy-as-new-game; cloud accounts.

Do **not** rename `ROLL_DICE`. Do **not** remount leftover `DiceActor` / `DiceRollLayer`. Do **not** mount `BoardScene` and `FloorPreview` at the same time (one PlayCanvas app per mode).

---

## File Map

| Path | Slice 5 change |
|------|----------------|
| `lib/engine/types.ts` | Add `HudRect`; `Cell.col/row/start`; `Floor.columns/rows/hud` (all optional for old drafts) |
| `lib/engine/layout.ts` | **Create.** Defaults, `createLoopedFloor`, `ensureBoardLayout`, occupancy, spatial loop, start token, stair label, preview board |
| `lib/designer/mutate.ts` | **Create.** Place/move/erase cells, floors, pack, start, attach/link/clear stairs |
| `lib/designer/validate.ts` | **Create.** `LayoutIssue`, `validateLayout`, `canTestPlay` |
| `lib/samples/empty.ts` | Build Ground via `createLoopedFloor` |
| `lib/samples/climb.ts` | Bake grid coords, HUD rect, start on `lobby-c0` |
| `components/board/FloorStack.tsx` | Optional `selectedCellId` highlight |
| `components/board/FloorPreview.tsx` | **Create.** PlayCanvas preview of one floor; no tokens, no dice |
| `components/designer/DesignerPalette.tsx` | Select / Corridor square / Stair / Erase |
| `components/designer/FloorTabs.tsx` | Floor tabs, Add floor, delete |
| `components/designer/LayoutGrid.tsx` | HTML grid; HUD locked; click + pointer move |
| `components/designer/CellInspector.tsx` | Floor name, pack, start, stair destination |
| `components/designer/ValidationList.tsx` | Named Test blockers |
| `components/designer/LayoutDesigner.tsx` | Compose designer + preview |
| `components/library/LibraryBar.tsx` | **Design** and **Test** |
| `components/library/StudioShell.tsx` | Working board, Design/Test modes, Save/Open persist layout, Test gate |
| `README.md` | Designer + Test instructions |
| `tests/engine/layout.test.ts` | Defaults, ensure, occupancy, loop, start |
| `tests/engine/types.test.ts` | Optional grid fields |
| `tests/samples/empty.test.ts`, `climb.test.ts` | Coords outside HUD; start cell |
| `tests/designer/mutate.test.ts` | Mutations |
| `tests/designer/validate.test.ts` | Test gate |
| `tests/designer/*.test.tsx` | Palette, tabs, grid, inspector, designer |
| `tests/view/floor-preview.test.tsx` | Preview one floor, no die, selected entity |
| `tests/library/library-bar.test.tsx`, `studio-shell.test.tsx` | Design/Test + persist layout |

Do not add `app/play/[slug]`, first-person cameras, room/door types, timer-card UI, or card-template editors.

---

### Task 1: Grid fields, default loop, ensure layout

**Files:**
- Modify: `lib/engine/types.ts`
- Create: `lib/engine/layout.ts`
- Modify: `lib/samples/empty.ts`
- Modify: `lib/samples/climb.ts`
- Test: `tests/engine/layout.test.ts`
- Test: `tests/engine/types.test.ts` (add cases)
- Test: `tests/samples/empty.test.ts` (add cases)
- Test: `tests/samples/climb.test.ts` (add cases)

**Interfaces:**
- Consumes: `Board`, `createBoard`, `Cell`, `Floor`, `TokenPos`, `PlayerState`
- Produces:
  - `export interface HudRect { col: number; row: number; width: number; height: number }`
  - `Cell` optional `col?: number; row?: number; start?: boolean`
  - `Floor` optional `columns?: number; rows?: number; hud?: HudRect`
  - `export const DEFAULT_COLUMNS = 8`
  - `export const DEFAULT_ROWS = 6`
  - `export const DEFAULT_HUD: HudRect = { col: 2, row: 2, width: 4, height: 2 }`
  - `export function defaultLoopPositions(count: number): Array<{ col: number; row: number }>`
  - `export function createLoopedFloor(id: string, label: string, index: number, cellCount?: number): Floor`
  - `export function isHudSlot(floor: Floor, col: number, row: number): boolean`
  - `export function inBounds(floor: Floor, col: number, row: number): boolean`
  - `export function ensureFloorLayout(floor: Floor): Floor`
  - `export function ensureBoardLayout(board: Board): Board`

- [ ] **Step 1: Write the failing tests**

Create `tests/engine/layout.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import {
  DEFAULT_COLUMNS,
  DEFAULT_HUD,
  DEFAULT_ROWS,
  createLoopedFloor,
  defaultLoopPositions,
  ensureBoardLayout,
  isHudSlot,
} from '@/lib/engine/layout';

describe('defaultLoopPositions', () => {
  it('builds a 2-row rectangle so 6 cells wrap 4-adjacent', () => {
    expect(defaultLoopPositions(6)).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 2, row: 1 },
      { col: 1, row: 1 },
      { col: 0, row: 1 },
    ]);
  });
});

describe('createLoopedFloor', () => {
  it('uses the default grid, keeps cells off the HUD, and marks start on floor 0', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    expect(floor.columns).toBe(DEFAULT_COLUMNS);
    expect(floor.rows).toBe(DEFAULT_ROWS);
    expect(floor.hud).toEqual(DEFAULT_HUD);
    expect(floor.cells).toHaveLength(6);
    expect(floor.cells[0]).toMatchObject({
      id: 'ground-c0',
      index: 0,
      kind: 'corridor',
      col: 0,
      row: 0,
      start: true,
    });
    for (const cell of floor.cells) {
      expect(isHudSlot(floor, cell.col!, cell.row!)).toBe(false);
    }
    const later = createLoopedFloor('floor-1', 'Floor 1', 1);
    expect(later.cells.some((c) => c.start)).toBe(false);
  });
});

describe('ensureBoardLayout', () => {
  it('fills missing coords from index order and does not move existing col/row', () => {
    const board = createBoard(
      [
        {
          id: 'f0',
          index: 0,
          label: 'Lobby',
          cells: [
            { id: 'a', index: 0 },
            { id: 'b', index: 1 },
            { id: 'c', index: 2 },
            { id: 'd', index: 3 },
            { id: 'e', index: 4 },
            { id: 'f', index: 5, col: 7, row: 5 },
          ],
        },
      ],
      [],
    );
    const ensured = ensureBoardLayout(board);
    expect(ensured.floors[0]?.columns).toBe(8);
    expect(ensured.floors[0]?.cells[0]).toMatchObject({
      id: 'a',
      col: 0,
      row: 0,
      start: true,
    });
    expect(ensured.floors[0]?.cells[5]).toMatchObject({ col: 7, row: 5 });
    expect(board.floors[0]?.cells[0]?.col).toBeUndefined();
  });
});
```

Add to `tests/engine/types.test.ts` inside `Cell and Floor slice-2 fields`:

```ts
  it('allows optional designer grid fields', () => {
    const floor: Floor = {
      id: 'ground',
      index: 0,
      label: 'Ground',
      columns: 8,
      rows: 6,
      hud: { col: 2, row: 2, width: 4, height: 2 },
      cells: [{ id: 'ground-c0', index: 0, col: 0, row: 0, start: true }],
    };
    expect(floor.hud?.col).toBe(2);
    expect(floor.cells[0]?.start).toBe(true);
  });
```

Add to `tests/samples/empty.test.ts`:

```ts
  it('bakes grid coordinates outside the HUD and marks the start square', () => {
    const boot = emptyBootstrap();
    const floor = boot.board.floors[0]!;
    expect(floor.columns).toBe(8);
    expect(floor.cells[0]?.start).toBe(true);
    expect(floor.cells.map((c) => ({ col: c.col, row: c.row }))).toEqual([
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 2, row: 1 },
      { col: 1, row: 1 },
      { col: 0, row: 1 },
    ]);
  });
```

Add to `tests/samples/climb.test.ts`:

```ts
  it('bakes a start square on lobby-c0 and grid coords on every cell', () => {
    const lobby = climbSample.board.floors[0]!;
    expect(lobby.cells[0]?.id).toBe('lobby-c0');
    expect(lobby.cells[0]?.start).toBe(true);
    expect(lobby.columns).toBe(8);
    for (const floor of climbSample.board.floors) {
      expect(floor.hud).toEqual({ col: 2, row: 2, width: 4, height: 2 });
      for (const cell of floor.cells) {
        expect(typeof cell.col).toBe('number');
        expect(typeof cell.row).toBe('number');
      }
    }
    expect(climbSample.board.floors[1]?.cells.some((c) => c.start)).toBe(false);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/engine/layout.test.ts tests/engine/types.test.ts tests/samples/empty.test.ts tests/samples/climb.test.ts`

Expected: FAIL with cannot find module `@/lib/engine/layout` and missing `columns` / `start` on samples

- [ ] **Step 3: Write minimal implementation**

In `lib/engine/types.ts`, add after `CellKind`:

```ts
export interface HudRect {
  col: number;
  row: number;
  width: number;
  height: number;
}
```

Extend `Cell`:

```ts
export interface Cell {
  id: string;
  index: number;
  kind?: CellKind;
  packId?: string;
  stairId?: string;
  col?: number;
  row?: number;
  start?: boolean;
}
```

Extend `Floor`:

```ts
export interface Floor {
  id: string;
  index: number;
  label: string;
  cells: Cell[];
  holdEnabled?: boolean;
  holdQuotas?: Record<string, number>;
  columns?: number;
  rows?: number;
  hud?: HudRect;
}
```

Create `lib/engine/layout.ts`:

```ts
import { createBoard, type Board } from '@/lib/engine/board';
import type { Cell, Floor, HudRect } from '@/lib/engine/types';

export const DEFAULT_COLUMNS = 8;
export const DEFAULT_ROWS = 6;
export const DEFAULT_HUD: HudRect = { col: 2, row: 2, width: 4, height: 2 };

export function defaultLoopPositions(count: number): Array<{ col: number; row: number }> {
  const width = Math.max(2, Math.ceil(count / 2));
  const positions: Array<{ col: number; row: number }> = [];
  for (let i = 0; i < width; i += 1) {
    positions.push({ col: i, row: 0 });
  }
  const bottomCount = Math.max(0, count - width);
  for (let i = 0; i < bottomCount; i += 1) {
    positions.push({ col: width - 1 - i, row: 1 });
  }
  return positions.slice(0, count);
}

export function isHudSlot(floor: Floor, col: number, row: number): boolean {
  const hud = floor.hud ?? DEFAULT_HUD;
  return (
    col >= hud.col &&
    col < hud.col + hud.width &&
    row >= hud.row &&
    row < hud.row + hud.height
  );
}

export function inBounds(floor: Floor, col: number, row: number): boolean {
  const columns = floor.columns ?? DEFAULT_COLUMNS;
  const rows = floor.rows ?? DEFAULT_ROWS;
  return col >= 0 && row >= 0 && col < columns && row < rows;
}

export function createLoopedFloor(
  id: string,
  label: string,
  index: number,
  cellCount = 6,
): Floor {
  const positions = defaultLoopPositions(cellCount);
  const cells: Cell[] = positions.map((pos, i) => ({
    id: `${id}-c${i}`,
    index: i,
    kind: 'corridor',
    col: pos.col,
    row: pos.row,
    start: index === 0 && i === 0,
  }));
  return {
    id,
    index,
    label,
    holdEnabled: false,
    cells,
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
    hud: { ...DEFAULT_HUD },
  };
}

export function ensureFloorLayout(floor: Floor): Floor {
  const columns = floor.columns ?? DEFAULT_COLUMNS;
  const rows = floor.rows ?? DEFAULT_ROWS;
  const hud = floor.hud ?? { ...DEFAULT_HUD };
  const positions = defaultLoopPositions(floor.cells.length);
  const cells = floor.cells.map((cell, i) => ({
    ...cell,
    col: cell.col ?? positions[i]?.col ?? 0,
    row: cell.row ?? positions[i]?.row ?? 0,
  }));
  return { ...floor, columns, rows, hud, cells };
}

export function ensureBoardLayout(board: Board): Board {
  const floors = board.floors.map((floor) => ensureFloorLayout(floor));
  const hasStart = floors.some((floor) => floor.cells.some((cell) => cell.start));
  if (!hasStart && floors[0]?.cells[0]) {
    floors[0] = {
      ...floors[0],
      cells: floors[0].cells.map((cell, i) => (i === 0 ? { ...cell, start: true } : cell)),
    };
  }
  return createBoard(floors, board.stairs);
}
```

Replace `lib/samples/empty.ts` with:

```ts
import { createBoard } from '@/lib/engine/board';
import { createCardState } from '@/lib/engine/cards';
import type { GameBootstrap } from '@/lib/engine/game';
import { createLoopedFloor } from '@/lib/engine/layout';
import { addPlayer, createPlayerState } from '@/lib/engine/players';
import { defaultGameConfig } from '@/lib/engine/types';

export const EMPTY_LABEL = 'Empty board';

export function emptyBootstrap(): GameBootstrap {
  const floor = createLoopedFloor('ground', 'Ground', 0);
  return {
    board: createBoard([floor], []),
    players: addPlayer(createPlayerState(), {
      id: 'p1',
      name: 'Player 1',
      token: { floorId: floor.id, cellId: `${floor.id}-c0` },
    }),
    cards: createCardState([]),
    config: {
      ...defaultGameConfig(),
      diceEnabled: true,
    },
  };
}
```

In `lib/samples/climb.ts`, import layout helpers and rewrite `loopCells` plus each floor object:

```ts
import { createLoopedFloor, DEFAULT_COLUMNS, DEFAULT_HUD, DEFAULT_ROWS, defaultLoopPositions } from '@/lib/engine/layout';
```

(`createLoopedFloor` is unused in Climb — do **not** import it. Only `defaultLoopPositions`, `DEFAULT_COLUMNS`, `DEFAULT_ROWS`, `DEFAULT_HUD`.)

```ts
import { defaultLoopPositions, DEFAULT_COLUMNS, DEFAULT_HUD, DEFAULT_ROWS } from '@/lib/engine/layout';
```

Replace `loopCells` and `floors`:

```ts
function loopCells(
  floorId: string,
  stairId: string | null,
  packAt: number[],
  markStart: boolean,
): Cell[] {
  const positions = defaultLoopPositions(6);
  return [0, 1, 2, 3, 4, 5].map((index) => {
    const isStair = stairId !== null && index === 3;
    const pos = positions[index]!;
    return {
      id: `${floorId}-c${index}`,
      index,
      kind: isStair ? 'stair' : 'corridor',
      stairId: isStair ? stairId : undefined,
      packId: !isStair && packAt.includes(index) ? 'climb' : undefined,
      col: pos.col,
      row: pos.row,
      start: markStart && index === 0,
    };
  });
}

const floors = [
  {
    id: 'lobby',
    index: 0,
    label: 'Lobby',
    holdEnabled: false,
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
    hud: { ...DEFAULT_HUD },
    cells: loopCells('lobby', 's-lobby-f1', [1, 4], true),
  },
  {
    id: 'f1',
    index: 1,
    label: 'Floor 1',
    holdEnabled: true,
    holdQuotas: { climb: 1 },
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
    hud: { ...DEFAULT_HUD },
    cells: loopCells('f1', 's-f1-f2', [0, 2, 5], false),
  },
  {
    id: 'f2',
    index: 2,
    label: 'Floor 2',
    holdEnabled: false,
    columns: DEFAULT_COLUMNS,
    rows: DEFAULT_ROWS,
    hud: { ...DEFAULT_HUD },
    cells: loopCells('f2', null, [1, 4], false),
  },
];
```

Leave Climb stairs, cards, and `climbSample` export unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/engine/layout.test.ts tests/engine/types.test.ts tests/samples/empty.test.ts tests/samples/climb.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/types.ts lib/engine/layout.ts lib/samples/empty.ts lib/samples/climb.ts tests/engine/layout.test.ts tests/engine/types.test.ts tests/samples/empty.test.ts tests/samples/climb.test.ts
git commit -m "feat(layout): add designer grid fields and default looping floors"
```

---

### Task 2: Occupancy, spatial loop, start token, stair labels

**Files:**
- Modify: `lib/engine/layout.ts`
- Test: `tests/engine/layout.test.ts` (append)

**Interfaces:**
- Consumes: Task 1 helpers, `Board`, `Stair`, `PlayerState`
- Produces:
  - `export function cellAt(floor: Floor, col: number, row: number): Cell | undefined`
  - `export function areAdjacent(a: { col?: number; row?: number }, b: { col?: number; row?: number }): boolean`
  - `export function orderCellsAlongLoop(cells: Cell[]): Cell[] | null` — simple 4-adjacent cycle covering **all** cells, indices rewritten 0..n-1, walk starts at `start` else first cell; `null` if not a cycle of length ≥ 4
  - `export function retileFloor(floor: Floor): Floor` — apply `orderCellsAlongLoop` when it succeeds
  - `export function startToken(board: Board): { floorId: string; cellId: string } | undefined`
  - `export function applyStartToPlayers(players: PlayerState, board: Board): PlayerState`
  - `export function stairDirection(board: Board, fromFloorId: string, toFloorId: string): 'up' | 'down' | 'same'`
  - `export function stairLabel(board: Board, stair: { fromFloorId: string; toFloorId: string }): string` — `Up to {label}` / `Down to {label}` / `To {label}`
  - `export function previewBoardForFloor(board: Board, floorId: string): Board` — clone selected floor at `index: 0`
  - `export function listPackIds(cards: Array<{ pack: string }>): string[]`

- [ ] **Step 1: Write the failing tests**

Append to `tests/engine/layout.test.ts`:

```ts
import { applyStartToPlayers, areAdjacent, cellAt, listPackIds, orderCellsAlongLoop, previewBoardForFloor, stairLabel, startToken } from '@/lib/engine/layout';
import { addPlayer, createPlayerState } from '@/lib/engine/players';

describe('areAdjacent and cellAt', () => {
  it('uses 4-way adjacency only', () => {
    expect(areAdjacent({ col: 0, row: 0 }, { col: 1, row: 0 })).toBe(true);
    expect(areAdjacent({ col: 0, row: 0 }, { col: 1, row: 1 })).toBe(false);
    const floor = createLoopedFloor('ground', 'Ground', 0);
    expect(cellAt(floor, 2, 0)?.id).toBe('ground-c2');
    expect(cellAt(floor, 3, 0)).toBeUndefined();
  });
});

describe('orderCellsAlongLoop', () => {
  it('rewrites index around the start cell for the default 6-loop', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const ordered = orderCellsAlongLoop(floor.cells);
    expect(ordered?.map((c) => c.id)).toEqual([
      'ground-c0',
      'ground-c1',
      'ground-c2',
      'ground-c3',
      'ground-c4',
      'ground-c5',
    ]);
    expect(ordered?.every((c, i) => c.index === i)).toBe(true);
  });

  it('returns null when a cell sticks off the loop', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    floor.cells.push({
      id: 'ground-c9',
      index: 9,
      kind: 'corridor',
      col: 7,
      row: 5,
    });
    expect(orderCellsAlongLoop(floor.cells)).toBeNull();
  });
});

describe('startToken and applyStartToPlayers', () => {
  it('moves every player to the marked start square', () => {
    const board = createBoard(
      [
        {
          ...createLoopedFloor('ground', 'Ground', 0),
          cells: createLoopedFloor('ground', 'Ground', 0).cells.map((c) => ({
            ...c,
            start: c.id === 'ground-c2',
          })),
        },
      ],
      [],
    );
    expect(startToken(board)).toEqual({ floorId: 'ground', cellId: 'ground-c2' });
    const players = applyStartToPlayers(
      addPlayer(createPlayerState(), {
        id: 'p1',
        name: 'P',
        token: { floorId: 'ground', cellId: 'ground-c0' },
      }),
      board,
    );
    expect(players.players[0]?.token).toEqual({ floorId: 'ground', cellId: 'ground-c2' });
  });
});

describe('stairLabel and previewBoardForFloor', () => {
  it('labels up using the destination floor name and flattens preview Y', () => {
    const lobby = createLoopedFloor('lobby', 'Lobby', 0);
    const f1 = createLoopedFloor('f1', 'Floor 1', 1);
    const board = createBoard(
      [lobby, f1],
      [{ id: 's1', fromFloorId: 'lobby', toFloorId: 'f1', toCellId: 'f1-c0', legal: true }],
    );
    expect(stairLabel(board, board.stairs[0]!)).toBe('Up to Floor 1');
    const preview = previewBoardForFloor(board, 'f1');
    expect(preview.floors).toHaveLength(1);
    expect(preview.floors[0]?.index).toBe(0);
    expect(preview.floors[0]?.id).toBe('f1');
  });
});

describe('listPackIds', () => {
  it('returns sorted unique pack ids', () => {
    expect(listPackIds([{ pack: 'climb' }, { pack: 'notes' }, { pack: 'climb' }])).toEqual([
      'climb',
      'notes',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/engine/layout.test.ts`

Expected: FAIL with `orderCellsAlongLoop` / `stairLabel` is not a function

- [ ] **Step 3: Write minimal implementation**

Append to `lib/engine/layout.ts`:

```ts
import type { PlayerState } from '@/lib/engine/players';

export function cellAt(floor: Floor, col: number, row: number): Cell | undefined {
  return floor.cells.find((cell) => cell.col === col && cell.row === row);
}

export function areAdjacent(
  a: { col?: number; row?: number },
  b: { col?: number; row?: number },
): boolean {
  if (a.col === undefined || a.row === undefined || b.col === undefined || b.row === undefined) {
    return false;
  }
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row) === 1;
}

function neighborsOf(cells: Cell[], cell: Cell): Cell[] {
  return cells.filter((other) => other.id !== cell.id && areAdjacent(cell, other));
}

export function orderCellsAlongLoop(cells: Cell[]): Cell[] | null {
  if (cells.length < 4) return null;
  if (cells.some((cell) => neighborsOf(cells, cell).length !== 2)) return null;
  const start = cells.find((cell) => cell.start) ?? cells[0];
  if (!start) return null;
  const startNeighbors = neighborsOf(cells, start).sort((a, b) => {
    const dc = (a.col ?? 0) - (b.col ?? 0);
    return dc !== 0 ? dc : (a.row ?? 0) - (b.row ?? 0);
  });
  const first = startNeighbors[0];
  if (!first) return null;
  const ordered: Cell[] = [start];
  let prev = start;
  let current = first;
  while (current.id !== start.id) {
    ordered.push(current);
    const next = neighborsOf(cells, current).find((n) => n.id !== prev.id);
    if (!next) return null;
    prev = current;
    current = next;
    if (ordered.length > cells.length) return null;
  }
  if (ordered.length !== cells.length) return null;
  return ordered.map((cell, index) => ({ ...cell, index }));
}

export function retileFloor(floor: Floor): Floor {
  const ordered = orderCellsAlongLoop(floor.cells);
  return ordered ? { ...floor, cells: ordered } : floor;
}

export function startToken(board: Board): { floorId: string; cellId: string } | undefined {
  for (const floor of board.floors) {
    const cell = floor.cells.find((c) => c.start);
    if (cell) return { floorId: floor.id, cellId: cell.id };
  }
  const floor = board.floors[0];
  const cell = floor?.cells[0];
  if (!floor || !cell) return undefined;
  return { floorId: floor.id, cellId: cell.id };
}

export function applyStartToPlayers(players: PlayerState, board: Board): PlayerState {
  const token = startToken(board);
  if (!token) return players;
  return {
    ...players,
    players: players.players.map((player) => ({ ...player, token })),
  };
}

export function stairDirection(
  board: Board,
  fromFloorId: string,
  toFloorId: string,
): 'up' | 'down' | 'same' {
  const from = board.floors.find((f) => f.id === fromFloorId)?.index ?? 0;
  const to = board.floors.find((f) => f.id === toFloorId)?.index ?? 0;
  if (to > from) return 'up';
  if (to < from) return 'down';
  return 'same';
}

export function stairLabel(
  board: Board,
  stair: { fromFloorId: string; toFloorId: string },
): string {
  const dest = board.floors.find((f) => f.id === stair.toFloorId);
  const name = dest?.label ?? 'Unknown';
  const dir = stairDirection(board, stair.fromFloorId, stair.toFloorId);
  if (dir === 'up') return `Up to ${name}`;
  if (dir === 'down') return `Down to ${name}`;
  return `To ${name}`;
}

export function previewBoardForFloor(board: Board, floorId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor) return createBoard([], []);
  return createBoard(
    [{ ...floor, index: 0 }],
    board.stairs.filter((s) => s.fromFloorId === floorId),
  );
}

export function listPackIds(cards: Array<{ pack: string }>): string[] {
  return [...new Set(cards.map((card) => card.pack))].sort();
}
```

Also call `retileFloor` at the end of `ensureFloorLayout` so Open of a coord-less Climb draft gets a spatial loop:

In `ensureFloorLayout`, `return retileFloor({ ...floor, columns, rows, hud, cells });`

(`retileFloor` must be defined above `ensureFloorLayout`, or move `ensureFloorLayout` below `retileFloor`. Prefer: keep `ensureFloorLayout` after `retileFloor`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/engine/layout.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/layout.ts tests/engine/layout.test.ts
git commit -m "feat(layout): detect corridor loops, start square, and stair labels"
```

---

### Task 3: Board mutations — cells, floors, packs, start

**Files:**
- Create: `lib/designer/mutate.ts`
- Test: `tests/designer/mutate.test.ts`

**Interfaces:**
- Consumes: `createBoard`; layout helpers from Task 1–2
- Produces:
  - `export function nextCellId(floor: Floor): string` — `${floor.id}-c{n}` skipping used n
  - `export function nextFloorId(board: Board): string` — `floor-{n}`
  - `export function placeCorridor(board: Board, floorId: string, col: number, row: number, cellId: string): Board` — no-op on HUD, OOB, occupied
  - `export function moveCell(board: Board, floorId: string, cellId: string, col: number, row: number): Board`
  - `export function eraseCell(board: Board, floorId: string, cellId: string): Board` — drops stair records for that cell; if start erased, mark remaining index-0 start
  - `export function setCellPack(board: Board, floorId: string, cellId: string, packId: string | undefined): Board` — no-op on stair
  - `export function setStartCell(board: Board, floorId: string, cellId: string): Board` — exactly one start in the building
  - `export function addFloor(board: Board, id: string, label: string): Board` — append `createLoopedFloor`
  - `export function renameFloor(board: Board, floorId: string, label: string): Board`
  - `export function deleteFloor(board: Board, floorId: string): Board` — no-op if last floor; drop stairs involving it; reindex
  - After cell edits, `retileFloor` the touched floor

- [ ] **Step 1: Write the failing test**

Create `tests/designer/mutate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor, isHudSlot } from '@/lib/engine/layout';
import {
  addFloor,
  deleteFloor,
  eraseCell,
  moveCell,
  placeCorridor,
  renameFloor,
  setCellPack,
  setStartCell,
} from '@/lib/designer/mutate';

function groundBoard() {
  return createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
}

describe('placeCorridor', () => {
  it('rejects HUD and occupied slots, then appends an empty square', () => {
    const board = groundBoard();
    const floor = board.floors[0]!;
    const hudCol = floor.hud!.col;
    const hudRow = floor.hud!.row;
    expect(isHudSlot(floor, hudCol, hudRow)).toBe(true);
    expect(placeCorridor(board, 'ground', hudCol, hudRow, 'ground-c9')).toEqual(board);
    expect(placeCorridor(board, 'ground', 0, 0, 'ground-c9')).toEqual(board);
    const next = placeCorridor(board, 'ground', 0, 2, 'ground-c9');
    expect(next.floors[0]?.cells.some((c) => c.id === 'ground-c9')).toBe(true);
    expect(next.floors[0]?.cells.find((c) => c.id === 'ground-c9')).toMatchObject({
      kind: 'corridor',
      col: 0,
      row: 2,
    });
  });
});

describe('moveCell and eraseCell', () => {
  it('moves a cell onto an empty slot and erase drops it', () => {
    const moved = moveCell(groundBoard(), 'ground', 'ground-c5', 0, 2);
    expect(moved.floors[0]?.cells.find((c) => c.id === 'ground-c5')).toMatchObject({
      col: 0,
      row: 2,
    });
    const erased = eraseCell(moved, 'ground', 'ground-c5');
    expect(erased.floors[0]?.cells.some((c) => c.id === 'ground-c5')).toBe(false);
  });
});

describe('setCellPack and setStartCell', () => {
  it('assigns a pack on corridor only and keeps a single start', () => {
    const packed = setCellPack(groundBoard(), 'ground', 'ground-c1', 'notes');
    expect(packed.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.packId).toBe('notes');
    const started = setStartCell(packed, 'ground', 'ground-c1');
    const starts = started.floors[0]!.cells.filter((c) => c.start);
    expect(starts.map((c) => c.id)).toEqual(['ground-c1']);
  });
});

describe('floors', () => {
  it('adds, renames, and refuses to delete the last floor', () => {
    const added = addFloor(groundBoard(), 'floor-1', 'Cellar');
    expect(added.floors.map((f) => f.id)).toEqual(['ground', 'floor-1']);
    expect(added.floors[1]?.index).toBe(1);
    expect(added.floors[1]?.cells).toHaveLength(6);
    const renamed = renameFloor(added, 'floor-1', 'Basement');
    expect(renamed.floors[1]?.label).toBe('Basement');
    const deleted = deleteFloor(renamed, 'floor-1');
    expect(deleted.floors).toHaveLength(1);
    expect(deleteFloor(deleted, 'ground').floors).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/designer/mutate.test.ts`

Expected: FAIL with cannot find module `@/lib/designer/mutate`

- [ ] **Step 3: Write minimal implementation**

Create `lib/designer/mutate.ts`:

```ts
import { createBoard, type Board } from '@/lib/engine/board';
import {
  cellAt,
  createLoopedFloor,
  inBounds,
  isHudSlot,
  retileFloor,
} from '@/lib/engine/layout';
import type { Floor } from '@/lib/engine/types';

function mapFloor(board: Board, floorId: string, fn: (floor: Floor) => Floor): Board {
  return createBoard(
    board.floors.map((floor) => (floor.id === floorId ? retileFloor(fn(floor)) : floor)),
    board.stairs,
  );
}

export function nextCellId(floor: Floor): string {
  let i = 0;
  while (floor.cells.some((cell) => cell.id === `${floor.id}-c${i}`)) i += 1;
  return `${floor.id}-c${i}`;
}

export function nextFloorId(board: Board): string {
  let i = board.floors.length;
  while (board.floors.some((floor) => floor.id === `floor-${i}`)) i += 1;
  return `floor-${i}`;
}

export function placeCorridor(
  board: Board,
  floorId: string,
  col: number,
  row: number,
  cellId: string,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor || !inBounds(floor, col, row) || isHudSlot(floor, col, row) || cellAt(floor, col, row)) {
    return board;
  }
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: [
      ...current.cells,
      {
        id: cellId,
        index: current.cells.length,
        kind: 'corridor' as const,
        col,
        row,
      },
    ],
  }));
}

export function moveCell(
  board: Board,
  floorId: string,
  cellId: string,
  col: number,
  row: number,
): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  if (!floor || !inBounds(floor, col, row) || isHudSlot(floor, col, row) || cellAt(floor, col, row)) {
    return board;
  }
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) => (cell.id === cellId ? { ...cell, col, row } : cell)),
  }));
}

export function eraseCell(board: Board, floorId: string, cellId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell) return board;
  const stairs = board.stairs.filter((s) => s.id !== cell.stairId);
  const next = createBoard(
    board.floors.map((current) => {
      if (current.id !== floorId) return current;
      const cells = current.cells.filter((c) => c.id !== cellId);
      const hasStart = cells.some((c) => c.start);
      const withStart =
        hasStart || cells.length === 0
          ? cells
          : cells.map((c, i) => (i === 0 ? { ...c, start: true } : { ...c, start: false }));
      return retileFloor({ ...current, cells: withStart });
    }),
    stairs,
  );
  return next;
}

export function setCellPack(
  board: Board,
  floorId: string,
  cellId: string,
  packId: string | undefined,
): Board {
  return mapFloor(board, floorId, (current) => ({
    ...current,
    cells: current.cells.map((cell) => {
      if (cell.id !== cellId) return cell;
      if (cell.kind === 'stair') return cell;
      return { ...cell, packId };
    }),
  }));
}

export function setStartCell(board: Board, floorId: string, cellId: string): Board {
  const exists = board.floors.some(
    (floor) => floor.id === floorId && floor.cells.some((cell) => cell.id === cellId),
  );
  if (!exists) return board;
  return createBoard(
    board.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) => ({
        ...cell,
        start: floor.id === floorId && cell.id === cellId,
      })),
    })),
    board.stairs,
  );
}

export function addFloor(board: Board, id: string, label: string): Board {
  if (board.floors.some((floor) => floor.id === id)) return board;
  const floor = createLoopedFloor(id, label, board.floors.length);
  return createBoard([...board.floors, floor], board.stairs);
}

export function renameFloor(board: Board, floorId: string, label: string): Board {
  const trimmed = label.trim();
  if (!trimmed) return board;
  return createBoard(
    board.floors.map((floor) => (floor.id === floorId ? { ...floor, label: trimmed } : floor)),
    board.stairs,
  );
}

export function deleteFloor(board: Board, floorId: string): Board {
  if (board.floors.length <= 1) return board;
  if (!board.floors.some((floor) => floor.id === floorId)) return board;
  const floors = board.floors
    .filter((floor) => floor.id !== floorId)
    .map((floor, index) => ({ ...floor, index }));
  const stairs = board.stairs.filter(
    (stair) => stair.fromFloorId !== floorId && stair.toFloorId !== floorId,
  );
  return createBoard(floors, stairs);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/designer/mutate.test.ts tests/engine/layout.test.ts tests/samples/empty.test.ts`

Expected: PASS

If erase of a start cell fails to mark another start, set `start: true` on the first remaining cell only.

- [ ] **Step 5: Commit**

```bash
git add lib/designer/mutate.ts tests/designer/mutate.test.ts
git commit -m "feat(designer): mutate floors, corridor cells, packs, and start"
```

---

### Task 4: Stair mutations + Test validation

**Files:**
- Modify: `lib/designer/mutate.ts`
- Create: `lib/designer/validate.ts`
- Test: `tests/designer/mutate.test.ts` (append stair cases)
- Test: `tests/designer/validate.test.ts`

**Interfaces:**
- Consumes: Task 3 mutations, `orderCellsAlongLoop`, `Stair`
- Produces:
  - `export function nextStairId(cellId: string): string` — `s-${cellId}`
  - `export function attachStair(board: Board, floorId: string, cellId: string): Board` — corridor becomes stair, pack cleared, dangling `Stair` with `legal: false`, `toFloorId: ''`, `toCellId: ''`
  - `export function linkStair(board: Board, stairId: string, toFloorId: string, toCellId: string): Board` — destination must exist; then `legal: true`
  - `export function clearStair(board: Board, floorId: string, cellId: string): Board` — back to corridor, drop stair record
  - `export type LayoutIssueCode = 'empty-floor' | 'non-loop' | 'dangling-stair' | 'pack-on-stair' | 'missing-start'`
  - `export interface LayoutIssue { code: LayoutIssueCode; message: string; floorId?: string; cellId?: string; stairId?: string }`
  - `export function validateLayout(board: Board): LayoutIssue[]`
  - `export function canTestPlay(board: Board): boolean`
  - Copy:
    - empty-floor: `{label} has no squares.`
    - non-loop: `{label} must be a looping corridor.`
    - dangling-stair: `{label}: stair has no destination.`
    - pack-on-stair: `{label}: stair squares cannot hold a pack.`
    - missing-start: `Mark a start square.`

- [ ] **Step 1: Write the failing tests**

Append to `tests/designer/mutate.test.ts`:

```ts
import { attachStair, clearStair, linkStair } from '@/lib/designer/mutate';

describe('stairs', () => {
  it('attaches a dangling stair, links it, and can convert back to corridor', () => {
    const two = addFloor(groundBoard(), 'floor-1', 'Floor 1');
    const attached = attachStair(two, 'ground', 'ground-c3');
    const cell = attached.floors[0]?.cells.find((c) => c.id === 'ground-c3');
    expect(cell?.kind).toBe('stair');
    expect(cell?.packId).toBeUndefined();
    const stair = attached.stairs.find((s) => s.id === cell?.stairId);
    expect(stair).toMatchObject({
      fromFloorId: 'ground',
      toFloorId: '',
      toCellId: '',
      legal: false,
    });
    const linked = linkStair(attached, stair!.id, 'floor-1', 'floor-1-c0');
    expect(linked.stairs[0]).toMatchObject({
      toFloorId: 'floor-1',
      toCellId: 'floor-1-c0',
      legal: true,
    });
    const cleared = clearStair(linked, 'ground', 'ground-c3');
    expect(cleared.stairs).toHaveLength(0);
    expect(cleared.floors[0]?.cells.find((c) => c.id === 'ground-c3')?.kind).toBe('corridor');
  });

  it('does not put a pack on a stair', () => {
    const attached = attachStair(groundBoard(), 'ground', 'ground-c3');
    const packed = setCellPack(attached, 'ground', 'ground-c3', 'climb');
    expect(packed.floors[0]?.cells.find((c) => c.id === 'ground-c3')?.packId).toBeUndefined();
  });
});
```

Create `tests/designer/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';
import { addFloor, attachStair, eraseCell, placeCorridor } from '@/lib/designer/mutate';
import { canTestPlay, validateLayout } from '@/lib/designer/validate';

describe('validateLayout', () => {
  it('allows Climb and the empty board', () => {
    expect(validateLayout(climbSample.board)).toEqual([]);
    expect(canTestPlay(emptyBootstrap().board)).toBe(true);
  });

  it('blocks a dangling stair and a broken loop, but the board is still a value', () => {
    const two = addFloor(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'floor-1', 'Floor 1');
    const dangling = attachStair(two, 'ground', 'ground-c3');
    const issues = validateLayout(dangling);
    expect(issues.some((i) => i.code === 'dangling-stair')).toBe(true);
    expect(canTestPlay(dangling)).toBe(false);
    expect(issues.find((i) => i.code === 'dangling-stair')?.message).toBe(
      'Ground: stair has no destination.',
    );

    const broken = placeCorridor(
      createBoard([createLoopedFloor('ground', 'Ground', 0)], []),
      'ground',
      7,
      5,
      'ground-c9',
    );
    expect(validateLayout(broken).some((i) => i.code === 'non-loop')).toBe(true);
  });

  it('blocks an empty floor and a missing start', () => {
    let board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    for (const id of [...board.floors[0]!.cells.map((c) => c.id)]) {
      board = eraseCell(board, 'ground', id);
    }
    const issues = validateLayout(board);
    expect(issues.some((i) => i.code === 'empty-floor')).toBe(true);
    expect(issues.some((i) => i.code === 'missing-start')).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/designer/mutate.test.ts tests/designer/validate.test.ts`

Expected: FAIL with `attachStair` / `validateLayout` is not a function

- [ ] **Step 3: Write minimal implementation**

Append to `lib/designer/mutate.ts`:

```ts
export function nextStairId(cellId: string): string {
  return `s-${cellId}`;
}

export function attachStair(board: Board, floorId: string, cellId: string): Board {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  if (!floor || !cell || cell.kind === 'stair') return board;
  const stairId = nextStairId(cellId);
  const floors = board.floors.map((current) => {
    if (current.id !== floorId) return current;
    return retileFloor({
      ...current,
      cells: current.cells.map((c) =>
        c.id === cellId
          ? { ...c, kind: 'stair' as const, stairId, packId: undefined }
          : c,
      ),
    });
  });
  return createBoard(floors, [
    ...board.stairs,
    { id: stairId, fromFloorId: floorId, toFloorId: '', toCellId: '', legal: false },
  ]);
}

export function linkStair(
  board: Board,
  stairId: string,
  toFloorId: string,
  toCellId: string,
): Board {
  const dest = board.floors
    .find((floor) => floor.id === toFloorId)
    ?.cells.find((cell) => cell.id === toCellId);
  if (!dest) return board;
  return createBoard(
    board.floors,
    board.stairs.map((stair) =>
      stair.id === stairId
        ? { ...stair, toFloorId, toCellId, legal: true }
        : stair,
    ),
  );
}

export function clearStair(board: Board, floorId: string, cellId: string): Board {
  const cell = board.floors
    .find((floor) => floor.id === floorId)
    ?.cells.find((c) => c.id === cellId);
  if (!cell?.stairId) return board;
  const floors = board.floors.map((current) => {
    if (current.id !== floorId) return current;
    return retileFloor({
      ...current,
      cells: current.cells.map((c) =>
        c.id === cellId
          ? { ...c, kind: 'corridor' as const, stairId: undefined }
          : c,
      ),
    });
  });
  return createBoard(
    floors,
    board.stairs.filter((stair) => stair.id !== cell.stairId),
  );
}
```

Create `lib/designer/validate.ts`:

```ts
import type { Board } from '@/lib/engine/board';
import { orderCellsAlongLoop } from '@/lib/engine/layout';

export type LayoutIssueCode =
  | 'empty-floor'
  | 'non-loop'
  | 'dangling-stair'
  | 'pack-on-stair'
  | 'missing-start';

export interface LayoutIssue {
  code: LayoutIssueCode;
  message: string;
  floorId?: string;
  cellId?: string;
  stairId?: string;
}

export function validateLayout(board: Board): LayoutIssue[] {
  const issues: LayoutIssue[] = [];
  const hasStart = board.floors.some((floor) => floor.cells.some((cell) => cell.start));
  if (!hasStart) {
    issues.push({ code: 'missing-start', message: 'Mark a start square.' });
  }

  for (const floor of board.floors) {
    if (floor.cells.length === 0) {
      issues.push({
        code: 'empty-floor',
        message: `${floor.label} has no squares.`,
        floorId: floor.id,
      });
      continue;
    }
    if (!orderCellsAlongLoop(floor.cells)) {
      issues.push({
        code: 'non-loop',
        message: `${floor.label} must be a looping corridor.`,
        floorId: floor.id,
      });
    }
    for (const cell of floor.cells) {
      if (cell.kind === 'stair') {
        const stair = board.stairs.find((s) => s.id === cell.stairId);
        const destOk = Boolean(
          stair &&
            stair.legal &&
            board.floors.some(
              (f) => f.id === stair.toFloorId && f.cells.some((c) => c.id === stair.toCellId),
            ),
        );
        if (!destOk) {
          issues.push({
            code: 'dangling-stair',
            message: `${floor.label}: stair has no destination.`,
            floorId: floor.id,
            cellId: cell.id,
            stairId: cell.stairId,
          });
        }
        if (cell.packId) {
          issues.push({
            code: 'pack-on-stair',
            message: `${floor.label}: stair squares cannot hold a pack.`,
            floorId: floor.id,
            cellId: cell.id,
          });
        }
      }
    }
  }

  return issues;
}

export function canTestPlay(board: Board): boolean {
  return validateLayout(board).length === 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/designer/mutate.test.ts tests/designer/validate.test.ts tests/samples/climb.test.ts`

Expected: PASS. Climb must report zero layout issues (6-cell rectangle + linked stairs).

- [ ] **Step 5: Commit**

```bash
git add lib/designer/mutate.ts lib/designer/validate.ts tests/designer/mutate.test.ts tests/designer/validate.test.ts
git commit -m "feat(designer): link stairs and block Test on invalid layouts"
```

---

### Task 5: HTML designer chrome — palette, floor tabs, grid, inspector

**Files:**
- Create: `components/designer/DesignerPalette.tsx`
- Create: `components/designer/FloorTabs.tsx`
- Create: `components/designer/LayoutGrid.tsx`
- Create: `components/designer/CellInspector.tsx`
- Create: `components/designer/ValidationList.tsx`
- Test: `tests/designer/designer-palette.test.tsx`
- Test: `tests/designer/floor-tabs.test.tsx`
- Test: `tests/designer/layout-grid.test.tsx`
- Test: `tests/designer/cell-inspector.test.tsx`
- Test: `tests/designer/validation-list.test.tsx`

**Interfaces:**
- Consumes: existing `Button`, `Input`, `Label`; mutate + validate + layout helpers
- Produces:
  - `export type DesignerTool = 'select' | 'corridor' | 'stair' | 'erase'`
  - `export function DesignerPalette({ tool, onToolChange }: { tool: DesignerTool; onToolChange: (tool: DesignerTool) => void })` — buttons **Select**, **Corridor square**, **Stair**, **Erase**
  - `export function FloorTabs({ floors, selectedFloorId, onSelect, onAdd, onDelete }: { floors: Floor[]; selectedFloorId: string; onSelect: (id: string) => void; onAdd: () => void; onDelete: (id: string) => void })` — **Add floor**; delete disabled when `floors.length === 1`; `aria-label={`Delete ${label}`}`
  - `export function LayoutGrid({ floor, selectedCellId, onSlotActivate, onMoveCell }: { floor: Floor; selectedCellId?: string; onSlotActivate: (col: number, row: number) => void; onMoveCell: (cellId: string, col: number, row: number) => void })`
  - HUD slots: `aria-label="HUD — drops blocked"` and they must **not** call `onSlotActivate`
  - `data-testid={`slot-${col}-${row}`}`
  - Pointer: `pointerdown` on a filled slot remembers `cellId`; `pointerup` on empty non-HUD slot calls `onMoveCell`
  - `export function CellInspector({ board, floorId, cellId, packIds, onRenameFloor, onSetPack, onSetStart, onAttachStair, onLinkStair, onClearStair }: { board: Board; floorId: string; cellId: string | null; packIds: string[]; onRenameFloor: (label: string) => void; onSetPack: (packId: string | undefined) => void; onSetStart: () => void; onAttachStair: () => void; onLinkStair: (toFloorId: string, toCellId: string) => void; onClearStair: () => void })`
  - Pack `<select aria-label="Pack">` with **None**; disabled for stairs with help **Stair squares never hold packs.**
  - Empty packs: **No packs in this draft. Open Test and import cards, then attach a pack here.**
  - Stair destination: `<select aria-label="Destination floor">` and `<select aria-label="Landing square">`; live label via `stairLabel`
  - Floor name: `<Input aria-label="Floor name">`
  - Start: button **Start square**
  - `export function ValidationList({ issues }: { issues: LayoutIssue[] })` — heading **Test is blocked** when `issues.length > 0`; `data-testid="layout-issues"`

- [ ] **Step 1: Write the failing tests**

Create `tests/designer/designer-palette.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DesignerPalette } from '@/components/designer/DesignerPalette';

describe('DesignerPalette', () => {
  it('selects corridor from the palette', () => {
    const onToolChange = vi.fn();
    render(<DesignerPalette tool="select" onToolChange={onToolChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Corridor square' }));
    expect(onToolChange).toHaveBeenCalledWith('corridor');
  });
});
```

Create `tests/designer/floor-tabs.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { createLoopedFloor } from '@/lib/engine/layout';

describe('FloorTabs', () => {
  it('selects a floor, adds one, and will not delete the last floor', () => {
    const onSelect = vi.fn();
    const onAdd = vi.fn();
    const onDelete = vi.fn();
    render(
      <FloorTabs
        floors={[createLoopedFloor('ground', 'Ground', 0)]}
        selectedFloorId="ground"
        onSelect={onSelect}
        onAdd={onAdd}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add floor' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Delete Ground' })).toHaveProperty('disabled', true);
  });
});
```

Create `tests/designer/layout-grid.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { createLoopedFloor } from '@/lib/engine/layout';

describe('LayoutGrid', () => {
  it('activates empty slots, ignores HUD, and moves with pointer down/up', () => {
    const onSlotActivate = vi.fn();
    const onMoveCell = vi.fn();
    const floor = createLoopedFloor('ground', 'Ground', 0);
    render(
      <LayoutGrid
        floor={floor}
        selectedCellId="ground-c0"
        onSlotActivate={onSlotActivate}
        onMoveCell={onMoveCell}
      />,
    );
    fireEvent.click(screen.getByTestId('slot-0-2'));
    expect(onSlotActivate).toHaveBeenCalledWith(0, 2);
    onSlotActivate.mockClear();
    fireEvent.click(screen.getByTestId(`slot-${floor.hud!.col}-${floor.hud!.row}`));
    expect(onSlotActivate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('HUD — drops blocked')).toBeDefined();
    fireEvent.pointerDown(screen.getByTestId('slot-0-1'));
    fireEvent.pointerUp(screen.getByTestId('slot-0-2'));
    expect(onMoveCell).toHaveBeenCalledWith('ground-c5', 0, 2);
  });
});
```

Create `tests/designer/cell-inspector.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CellInspector } from '@/components/designer/CellInspector';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { addFloor, attachStair } from '@/lib/designer/mutate';

describe('CellInspector', () => {
  it('renames the floor, sets pack and start on a corridor', () => {
    const onRenameFloor = vi.fn();
    const onSetPack = vi.fn();
    const onSetStart = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c1"
        packIds={['climb']}
        onRenameFloor={onRenameFloor}
        onSetPack={onSetPack}
        onSetStart={onSetStart}
        onAttachStair={() => {}}
        onLinkStair={() => {}}
        onClearStair={() => {}}
      />,
    );
    fireEvent.change(screen.getByLabelText('Floor name'), { target: { value: 'Lobby' } });
    fireEvent.blur(screen.getByLabelText('Floor name'));
    expect(onRenameFloor).toHaveBeenCalledWith('Lobby');
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'climb' } });
    expect(onSetPack).toHaveBeenCalledWith('climb');
    fireEvent.click(screen.getByRole('button', { name: 'Start square' }));
    expect(onSetStart).toHaveBeenCalled();
  });

  it('links a dangling stair to another floor', () => {
    const onLinkStair = vi.fn();
    const two = addFloor(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'floor-1', 'Floor 1');
    const board = attachStair(two, 'ground', 'ground-c3');
    render(
      <CellInspector
        board={board}
        floorId="ground"
        cellId="ground-c3"
        packIds={['climb']}
        onRenameFloor={() => {}}
        onSetPack={() => {}}
        onSetStart={() => {}}
        onAttachStair={() => {}}
        onLinkStair={onLinkStair}
        onClearStair={() => {}}
      />,
    );
    expect(screen.getByText('Stair squares never hold packs.')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Destination floor'), { target: { value: 'floor-1' } });
    fireEvent.change(screen.getByLabelText('Landing square'), { target: { value: 'floor-1-c0' } });
    expect(onLinkStair).toHaveBeenCalledWith('floor-1', 'floor-1-c0');
  });
});
```

Create `tests/designer/validation-list.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ValidationList } from '@/components/designer/ValidationList';

describe('ValidationList', () => {
  it('lists Test blockers', () => {
    render(
      <ValidationList
        issues={[
          { code: 'dangling-stair', message: 'Ground: stair has no destination.' },
        ]}
      />,
    );
    expect(screen.getByTestId('layout-issues').textContent).toContain('Test is blocked');
    expect(screen.getByText('Ground: stair has no destination.')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/designer/designer-palette.test.tsx tests/designer/floor-tabs.test.tsx tests/designer/layout-grid.test.tsx tests/designer/cell-inspector.test.tsx tests/designer/validation-list.test.tsx`

Expected: FAIL with cannot find module for designer components

- [ ] **Step 3: Write minimal implementation**

Create `components/designer/DesignerPalette.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';

export type DesignerTool = 'select' | 'corridor' | 'stair' | 'erase';

const TOOLS: Array<{ id: DesignerTool; label: string }> = [
  { id: 'select', label: 'Select' },
  { id: 'corridor', label: 'Corridor square' },
  { id: 'stair', label: 'Stair' },
  { id: 'erase', label: 'Erase' },
];

export function DesignerPalette({
  tool,
  onToolChange,
}: {
  tool: DesignerTool;
  onToolChange: (tool: DesignerTool) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="designer-palette">
      {TOOLS.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={tool === item.id ? 'secondary' : 'outline'}
          aria-pressed={tool === item.id}
          onClick={() => onToolChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
```

Create `components/designer/FloorTabs.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import type { Floor } from '@/lib/engine/types';

export function FloorTabs({
  floors,
  selectedFloorId,
  onSelect,
  onAdd,
  onDelete,
}: {
  floors: Floor[];
  selectedFloorId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {floors.map((floor) => (
        <Button
          key={floor.id}
          type="button"
          variant={floor.id === selectedFloorId ? 'secondary' : 'outline'}
          aria-pressed={floor.id === selectedFloorId}
          onClick={() => onSelect(floor.id)}
        >
          {floor.label}
        </Button>
      ))}
      <Button type="button" variant="outline" onClick={onAdd}>
        Add floor
      </Button>
      <Button
        type="button"
        variant="ghost"
        disabled={floors.length <= 1}
        aria-label={`Delete ${floors.find((f) => f.id === selectedFloorId)?.label ?? 'floor'}`}
        onClick={() => onDelete(selectedFloorId)}
      >
        Delete floor
      </Button>
    </div>
  );
}
```

The delete button’s accessible name in the test is **Delete Ground**. Use `aria-label={`Delete ${label}`}` where `label` is the selected floor’s label, and keep visible text **Delete floor**.

Create `components/designer/LayoutGrid.tsx`:

```tsx
'use client';

import { useRef } from 'react';
import { cellAt, DEFAULT_COLUMNS, DEFAULT_ROWS, isHudSlot } from '@/lib/engine/layout';
import type { Floor } from '@/lib/engine/types';

export function LayoutGrid({
  floor,
  selectedCellId,
  onSlotActivate,
  onMoveCell,
}: {
  floor: Floor;
  selectedCellId?: string;
  onSlotActivate: (col: number, row: number) => void;
  onMoveCell: (cellId: string, col: number, row: number) => void;
}) {
  const dragId = useRef<string | null>(null);
  const columns = floor.columns ?? DEFAULT_COLUMNS;
  const rows = floor.rows ?? DEFAULT_ROWS;
  const slots: Array<{ col: number; row: number }> = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      slots.push({ col, row });
    }
  }

  return (
    <div
      className="grid w-full gap-1 overflow-x-auto"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(2.25rem, 1fr))` }}
      aria-label="Layout grid"
    >
      {slots.map(({ col, row }) => {
        const hud = isHudSlot(floor, col, row);
        const cell = cellAt(floor, col, row);
        const selected = cell?.id === selectedCellId;
        let className = 'h-10 rounded border text-[10px] md:text-xs';
        if (hud) className += ' border-slate-700 bg-slate-800 text-slate-500';
        else if (cell?.kind === 'stair') className += ' border-amber-500 bg-amber-700 text-amber-50';
        else if (cell) className += ' border-slate-500 bg-slate-600 text-slate-50';
        else className += ' border-slate-800 bg-slate-950 text-slate-500';
        if (selected) className += ' ring-2 ring-sky-400';
        if (cell?.start) className += ' outline outline-1 outline-emerald-400';
        return (
          <button
            key={`${col}-${row}`}
            type="button"
            data-testid={`slot-${col}-${row}`}
            className={className}
            aria-label={hud ? 'HUD — drops blocked' : cell ? cell.id : `Empty ${col},${row}`}
            onPointerDown={() => {
              if (cell) dragId.current = cell.id;
            }}
            onPointerUp={() => {
              const from = dragId.current;
              dragId.current = null;
              if (from && !hud && !cell) {
                onMoveCell(from, col, row);
                return;
              }
            }}
            onClick={() => {
              if (hud) return;
              onSlotActivate(col, row);
            }}
          >
            {hud ? 'HUD' : cell?.kind === 'stair' ? 'Stair' : cell ? String(cell.index) : ''}
          </button>
        );
      })}
    </div>
  );
}
```

Create `components/designer/CellInspector.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Board } from '@/lib/engine/board';
import { stairLabel } from '@/lib/engine/layout';

export function CellInspector({
  board,
  floorId,
  cellId,
  packIds,
  onRenameFloor,
  onSetPack,
  onSetStart,
  onAttachStair,
  onLinkStair,
  onClearStair,
}: {
  board: Board;
  floorId: string;
  cellId: string | null;
  packIds: string[];
  onRenameFloor: (label: string) => void;
  onSetPack: (packId: string | undefined) => void;
  onSetStart: () => void;
  onAttachStair: () => void;
  onLinkStair: (toFloorId: string, toCellId: string) => void;
  onClearStair: () => void;
}) {
  const floor = board.floors.find((f) => f.id === floorId);
  const cell = floor?.cells.find((c) => c.id === cellId);
  const stair = board.stairs.find((s) => s.id === cell?.stairId);

  if (!floor) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-800 p-3">
      <div className="flex flex-col gap-1">
        <Label htmlFor="floor-name">Floor name</Label>
        <Input
          id="floor-name"
          aria-label="Floor name"
          defaultValue={floor.label}
          onBlur={(e) => onRenameFloor(e.target.value)}
        />
      </div>
      {!cell ? (
        <p className="text-sm text-slate-400">Select a square to edit pack, stairs, or start.</p>
      ) : (
        <>
          <p className="text-sm text-slate-300">{cell.kind === 'stair' ? 'Stair' : 'Corridor square'}</p>
          {cell.kind === 'stair' ? (
            <>
              <p className="text-xs text-slate-400">Stair squares never hold packs.</p>
              {stair ? (
                <p className="text-sm">{stair.legal ? stairLabel(board, stair) : 'Stair has no destination.'}</p>
              ) : null}
              <Label htmlFor="dest-floor">Destination floor</Label>
              <select
                id="dest-floor"
                aria-label="Destination floor"
                className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                value={stair?.toFloorId ?? ''}
                onChange={(e) => {
                  const dest = board.floors.find((f) => f.id === e.target.value);
                  const landing = dest?.cells[0]?.id;
                  if (dest && landing) onLinkStair(dest.id, landing);
                }}
              >
                <option value="">Choose floor</option>
                {board.floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
              <Label htmlFor="dest-cell">Landing square</Label>
              <select
                id="dest-cell"
                aria-label="Landing square"
                className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                value={stair?.toCellId ?? ''}
                onChange={(e) => {
                  if (stair?.toFloorId) onLinkStair(stair.toFloorId, e.target.value);
                }}
              >
                <option value="">Choose square</option>
                {board.floors
                  .find((f) => f.id === (stair?.toFloorId || board.floors.find((x) => x.id !== floorId)?.id))
                  ?.cells.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id}
                    </option>
                  ))}
              </select>
              <Button type="button" variant="outline" onClick={onClearStair}>
                Convert to corridor
              </Button>
            </>
          ) : (
            <>
              {packIds.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No packs in this draft. Open Test and import cards, then attach a pack here.
                </p>
              ) : (
                <>
                  <Label htmlFor="cell-pack">Pack</Label>
                  <select
                    id="cell-pack"
                    aria-label="Pack"
                    className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
                    value={cell.packId ?? ''}
                    onChange={(e) => onSetPack(e.target.value || undefined)}
                  >
                    <option value="">None</option>
                    {packIds.map((id) => (
                      <option key={id} value={id}>
                        {id}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <Button type="button" variant="outline" onClick={onAttachStair}>
                Make stair
              </Button>
            </>
          )}
          <Button type="button" onClick={onSetStart}>
            Start square
          </Button>
        </>
      )}
    </div>
  );
}
```

Landing-square `onChange` must still fire `onLinkStair` after the floor select. The floor `<select>` should pick that floor’s first cell so the first `onLinkStair` call in the test (`floor-1`, `floor-1-c0`) happens on destination-floor change. Then landing change can fire again with the same args.

If the destination-floor `onChange` uses `dest.cells[0].id` (`floor-1-c0`), the test’s two `fireEvent.change` calls still pass (`toHaveBeenCalledWith('floor-1', 'floor-1-c0')`).

Create `components/designer/ValidationList.tsx`:

```tsx
'use client';

import type { LayoutIssue } from '@/lib/designer/validate';

export function ValidationList({ issues }: { issues: LayoutIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-100"
      data-testid="layout-issues"
    >
      <p className="font-medium">Test is blocked</p>
      <ul className="mt-2 list-disc pl-5">
        {issues.map((issue, i) => (
          <li key={`${issue.code}-${issue.cellId ?? issue.floorId ?? i}`}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/designer/designer-palette.test.tsx tests/designer/floor-tabs.test.tsx tests/designer/layout-grid.test.tsx tests/designer/cell-inspector.test.tsx tests/designer/validation-list.test.tsx`

Expected: PASS

If FloorTabs delete accessible name does not match, set `aria-label={`Delete ${selected.label}`}` and do not put the floor name in the visible button text.

Pointer move: `ground-c5` is default loop position `{col:0,row:1}` — `slot-0-1`. Confirm `createLoopedFloor` cells before changing the test.

- [ ] **Step 5: Commit**

```bash
git add components/designer/DesignerPalette.tsx components/designer/FloorTabs.tsx components/designer/LayoutGrid.tsx components/designer/CellInspector.tsx components/designer/ValidationList.tsx tests/designer/designer-palette.test.tsx tests/designer/floor-tabs.test.tsx tests/designer/layout-grid.test.tsx tests/designer/cell-inspector.test.tsx tests/designer/validation-list.test.tsx
git commit -m "feat(designer): add HTML grid, floor tabs, palette, and inspector"
```

---

### Task 6: PlayCanvas floor preview

**Files:**
- Modify: `components/board/FloorStack.tsx`
- Create: `components/board/FloorPreview.tsx`
- Test: `tests/view/floor-preview.test.tsx`
- Test: `tests/view/board-scene.test.tsx` (must still pass; no `entity-die`)

**Interfaces:**
- Consumes: `PlayCanvasViewport`, `FloorStack`, `previewBoardForFloor`, `cellToWorld`
- Produces:
  - `FloorStack` optional `selectedCellId?: string` — selected cell uses sky material `#38bdf8`
  - `export function FloorPreview({ board, floorId, selectedCellId }: { board: Board; floorId: string; selectedCellId?: string })`
  - Same camera/lights as `BoardScene` but **no** `PlayerTokens`, **no** dice
  - Wrapper `data-testid="floor-preview"`
  - Physics off

- [ ] **Step 1: Write the failing test**

Create `tests/view/floor-preview.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/board/PlayCanvasViewport', () => ({
  PlayCanvasViewport: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pc-app">{children}</div>
  ),
}));

vi.mock('@playcanvas/react', () => ({
  Entity: ({ name }: { name?: string }) => <div data-testid={`entity-${name}`} />,
}));

vi.mock('@playcanvas/react/components', () => ({
  Render: () => null,
  Collision: () => null,
  RigidBody: () => null,
  Camera: () => null,
  Light: () => null,
}));

vi.mock('@playcanvas/react/hooks', () => ({
  useMaterial: () => ({}),
}));

import { FloorPreview } from '@/components/board/FloorPreview';
import { climbSample } from '@/lib/samples/climb';

describe('FloorPreview', () => {
  it('renders only the selected floor cells and never a 3D die', () => {
    render(
      <FloorPreview
        board={climbSample.board}
        floorId="lobby"
        selectedCellId="lobby-c0"
      />,
    );
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    expect(screen.getByTestId('pc-app')).toBeDefined();
    expect(screen.getByTestId('entity-lobby-c0')).toBeDefined();
    expect(screen.queryByTestId('entity-f1-c0')).toBeNull();
    expect(screen.queryByTestId('entity-die')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/view/floor-preview.test.tsx`

Expected: FAIL with cannot find module `@/components/board/FloorPreview`

- [ ] **Step 3: Write minimal implementation**

In `components/board/FloorStack.tsx`, add `selectedCellId?: string` to props and a selected material:

```tsx
export function FloorStack({
  board,
  usePhysics = false,
  selectedCellId,
}: {
  board: Board;
  usePhysics?: boolean;
  selectedCellId?: string;
}) {
  const corridorMat = useMaterial({ diffuse: '#94a3b8', emissive: '#475569', emissiveIntensity: 0.9 });
  const stairMat = useMaterial({ diffuse: '#f59e0b', emissive: '#b45309', emissiveIntensity: 0.8 });
  const selectedMat = useMaterial({ diffuse: '#38bdf8', emissive: '#0369a1', emissiveIntensity: 0.9 });
```

When picking the material:

```tsx
const selected = cell.id === selectedCellId;
const material = selected ? selectedMat : stair ? stairMat : corridorMat;
```

`<Render type="box" material={material} />`

Create `components/board/FloorPreview.tsx`:

```tsx
'use client';

import { Entity } from '@playcanvas/react';
import { Camera, Light } from '@playcanvas/react/components';
import type { Board } from '@/lib/engine/board';
import { previewBoardForFloor } from '@/lib/engine/layout';
import { FloorStack } from './FloorStack';
import { PlayCanvasViewport } from './PlayCanvasViewport';

export function FloorPreview({
  board,
  floorId,
  selectedCellId,
}: {
  board: Board;
  floorId: string;
  selectedCellId?: string;
}) {
  const preview = previewBoardForFloor(board, floorId);

  return (
    <div
      className="h-[280px] w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900 md:h-[360px]"
      data-testid="floor-preview"
    >
      <PlayCanvasViewport usePhysics={false}>
        <Entity name="camera" position={[0, 7, 10]} rotation={[-32, 0, 0]}>
          <Camera clearColor="#0f172a" fov={50} nearClip={0.1} farClip={100} />
        </Entity>
        <Entity name="sun" rotation={[-55, 40, 0]}>
          <Light type="directional" intensity={1.5} />
        </Entity>
        <Entity name="fill" position={[2, 5, 3]}>
          <Light type="omni" intensity={0.8} />
        </Entity>
        <FloorStack board={preview} selectedCellId={selectedCellId} />
      </PlayCanvasViewport>
    </div>
  );
}
```

Do **not** import `FloorPreview` from `BoardScene`. Play `BoardScene` omits `selectedCellId`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/view/floor-preview.test.tsx tests/view/board-scene.test.tsx`

Expected: PASS. Play board still has no `entity-die`. Preview has lobby cells only.

- [ ] **Step 5: Commit**

```bash
git add components/board/FloorStack.tsx components/board/FloorPreview.tsx tests/view/floor-preview.test.tsx
git commit -m "feat(board): preview the selected designer floor in PlayCanvas"
```

---

### Task 7: LayoutDesigner compose + Studio Design/Test persist

**Files:**
- Create: `components/designer/LayoutDesigner.tsx`
- Modify: `components/library/LibraryBar.tsx`
- Modify: `components/library/StudioShell.tsx`
- Test: `tests/designer/layout-designer.test.tsx`
- Test: `tests/library/library-bar.test.tsx`
- Test: `tests/library/studio-shell.test.tsx`

**Interfaces:**
- Consumes: designer chrome, `FloorPreview`, mutate/validate, `useLibrary`, `capture` of cards/config from HUD snapshot, `ensureBoardLayout`, `applyStartToPlayers`, `fromStoredBootstrap`
- Produces:
  - `export type StudioMode = 'design' | 'test'`
  - `export function LayoutDesigner({ board, cards, selectedFloorId, selectedCellId, tool, issues, onBoardChange, onSelectFloor, onSelectCell, onToolChange }: { board: Board; cards: Array<{ pack: string }>; selectedFloorId: string; selectedCellId: string | null; tool: DesignerTool; issues: LayoutIssue[]; onBoardChange: (board: Board) => void; onSelectFloor: (id: string) => void; onSelectCell: (id: string | null) => void; onToolChange: (tool: DesignerTool) => void })`
  - Slot click: `select` → select cell or clear; `corridor` → `placeCorridor` using `nextCellId`; `stair` → `attachStair` if corridor else ignore empty; `erase` → `eraseCell`
  - `LibraryBar` adds `mode: StudioMode; onDesign: () => void; onTest: () => void`
  - Buttons **Design** and **Test** (`aria-pressed` from `mode`)
  - `StudioShell` default `mode: 'design'`
  - Working board: `ensureBoardLayout(cloneJson(active.bootstrap.board))` when `active.id` changes
  - **Save / New / Open** persist `{ board: workingBoard, players: applyStartToPlayers(workingPlayers, workingBoard), cards: snapshot?.cards.deck ?? active.bootstrap.cards, config: snapshot?.config ?? active.bootstrap.config }` — **never** `captureBootstrap`’s `game.board`
  - **Test:** `validateLayout(workingBoard)`; if issues, stay in design and show `ValidationList`; if valid, persist then `mode: 'test'` and remount HUD with `key={`${active.id}-test-${testNonce}`}` (`testNonce` increments each successful Test)
  - Design unmounts `GameHud` / `BoardScene`; Test unmounts `LayoutDesigner` / `FloorPreview`
  - Loading copy unchanged: `Loading library…`

- [ ] **Step 1: Write the failing tests**

Create `tests/designer/layout-designer.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LayoutDesigner } from '@/components/designer/LayoutDesigner';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';

vi.mock('@/components/board/FloorPreview', () => ({
  FloorPreview: () => <div data-testid="floor-preview" />,
}));

describe('LayoutDesigner', () => {
  it('places a corridor on an empty slot with the corridor tool', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Ground', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[{ pack: 'climb' }]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="corridor"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('slot-0-2'));
    expect(onBoardChange).toHaveBeenCalled();
    const next = onBoardChange.mock.calls[0][0];
    expect(next.floors[0].cells.some((c: { col?: number; row?: number }) => c.col === 0 && c.row === 2)).toBe(true);
  });
});
```

Replace `tests/library/library-bar.test.tsx` render props to include Design/Test:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LibraryBar } from '@/components/library/LibraryBar';

describe('LibraryBar', () => {
  it('shows the active name and fires New / Save / Open / Design / Test', () => {
    const onNew = vi.fn();
    const onSave = vi.fn();
    const onOpen = vi.fn();
    const onDesign = vi.fn();
    const onTest = vi.fn();
    render(
      <LibraryBar
        activeName="Climb (sample)"
        savedAt="2026-09-21T12:00:00.000Z"
        canSave
        mode="design"
        onNew={onNew}
        onSave={onSave}
        onOpen={onOpen}
        onDesign={onDesign}
        onTest={onTest}
      />,
    );
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(onNew).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDesign).toHaveBeenCalledTimes(1);
    expect(onTest).toHaveBeenCalledTimes(1);
  });

  it('disables Save when there is no active draft', () => {
    render(
      <LibraryBar
        activeName="No game"
        canSave={false}
        mode="design"
        onNew={() => {}}
        onSave={() => {}}
        onOpen={() => {}}
        onDesign={() => {}}
        onTest={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
  });
});
```

Rewrite `tests/library/studio-shell.test.tsx` (keep BoardScene mock, add FloorPreview mock):

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StudioShell } from '@/components/library/StudioShell';
import { loadLibrary, memoryStorage } from '@/lib/library/storage';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: () => <div data-testid="board" />,
}));

vi.mock('@/components/board/FloorPreview', () => ({
  FloorPreview: () => <div data-testid="floor-preview" />,
}));

const NOW = '2026-09-21T12:00:00.000Z';

function renderStudio(storage = memoryStorage(), id = 'seed-1', now = NOW, createId = () => 'n1') {
  const initialState = loadLibrary(storage, { now: NOW, id: 'seed-1' });
  return render(
    <StudioShell
      storage={storage}
      initialState={initialState}
      now={() => now}
      createId={createId}
    />,
  );
}

describe('StudioShell', () => {
  it('opens in Design on Climb and Test reveals Roll dice', () => {
    renderStudio();
    expect(screen.getByText('Climb (sample)')).toBeDefined();
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.getByText('No card drawn')).toBeDefined();
    expect(screen.queryByTestId('floor-preview')).toBeNull();
  });

  it('blocks Test on a dangling stair and still allows Save', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-21T13:00:00.000Z');
    fireEvent.click(screen.getByRole('button', { name: 'Corridor square' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stair' }));
    fireEvent.click(screen.getByTestId('slot-2-0'));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByTestId('layout-issues').textContent).toContain('stair has no destination');
    expect(screen.queryByRole('button', { name: 'Roll dice' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByTestId('library-saved-at').textContent).toContain('2026-09-21T13:00:00.000Z');
  });

  it('New empty stays in Design, then Test plays a board with no climb passes', () => {
    renderStudio(memoryStorage(), 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('Sandbox')).toBeDefined();
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByText('Passes left: climb 1')).toBeNull();
  });

  it('Open switches back to Climb and Design can return to the grid', () => {
    renderStudio(memoryStorage(), 'seed-1', '2026-09-21T13:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open Climb (sample)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Design' }));
    expect(screen.getByTestId('floor-preview')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Lobby' })).toBeDefined();
  });

  it('Save persists a pack attached in Design into storage', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-21T14:00:00.000Z');
    fireEvent.click(screen.getByTestId('slot-0-0'));
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'climb' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    const lobby = reloaded.drafts[0]?.bootstrap.board.floors.find((f) => f.id === 'lobby');
    expect(lobby?.cells.find((c) => c.id === 'lobby-c0')?.packId).toBe('climb');
  });
});
```

The dangling-stair case: Climb `slot-2-0` is `lobby-c2` (corridor with pack in sample). Selecting **Stair** then clicking that slot should `attachStair`. If the grid click with tool stair attaches on an existing corridor, do **not** require selecting the cell first.

If `slot-2-0` is already a corridor, `onSlotActivate` with tool `stair` calls `attachStair`. Update LayoutDesigner accordingly. Do **not** use an empty HUD slot.

Climb default positions: index 2 = `{col:2,row:0}` = `lobby-c2`, kind corridor. Good.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/designer/layout-designer.test.tsx tests/library/library-bar.test.tsx tests/library/studio-shell.test.tsx`

Expected: FAIL with cannot find `LayoutDesigner` and LibraryBar missing `mode`

- [ ] **Step 3: Write minimal implementation**

Create `components/designer/LayoutDesigner.tsx`:

```tsx
'use client';

import { FloorPreview } from '@/components/board/FloorPreview';
import { CellInspector } from '@/components/designer/CellInspector';
import { DesignerPalette, type DesignerTool } from '@/components/designer/DesignerPalette';
import { FloorTabs } from '@/components/designer/FloorTabs';
import { LayoutGrid } from '@/components/designer/LayoutGrid';
import { ValidationList } from '@/components/designer/ValidationList';
import {
  addFloor,
  attachStair,
  clearStair,
  deleteFloor,
  eraseCell,
  linkStair,
  moveCell,
  nextCellId,
  nextFloorId,
  placeCorridor,
  renameFloor,
  setCellPack,
  setStartCell,
} from '@/lib/designer/mutate';
import type { LayoutIssue } from '@/lib/designer/validate';
import type { Board } from '@/lib/engine/board';
import { cellAt, listPackIds } from '@/lib/engine/layout';

export function LayoutDesigner({
  board,
  cards,
  selectedFloorId,
  selectedCellId,
  tool,
  issues,
  onBoardChange,
  onSelectFloor,
  onSelectCell,
  onToolChange,
}: {
  board: Board;
  cards: Array<{ pack: string }>;
  selectedFloorId: string;
  selectedCellId: string | null;
  tool: DesignerTool;
  issues: LayoutIssue[];
  onBoardChange: (board: Board) => void;
  onSelectFloor: (id: string) => void;
  onSelectCell: (id: string | null) => void;
  onToolChange: (tool: DesignerTool) => void;
}) {
  const floor = board.floors.find((f) => f.id === selectedFloorId) ?? board.floors[0];
  if (!floor) return <p className="text-slate-400">This draft has no floors.</p>;

  const activate = (col: number, row: number) => {
    const existing = cellAt(floor, col, row);
    if (tool === 'erase') {
      if (existing) {
        onBoardChange(eraseCell(board, floor.id, existing.id));
        onSelectCell(null);
      }
      return;
    }
    if (tool === 'corridor') {
      if (existing) {
        onSelectCell(existing.id);
        return;
      }
      const id = nextCellId(floor);
      onBoardChange(placeCorridor(board, floor.id, col, row, id));
      onSelectCell(id);
      return;
    }
    if (tool === 'stair') {
      if (!existing) return;
      if (existing.kind === 'stair') {
        onSelectCell(existing.id);
        return;
      }
      onBoardChange(attachStair(board, floor.id, existing.id));
      onSelectCell(existing.id);
      return;
    }
    onSelectCell(existing?.id ?? null);
  };

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-3">
        <FloorTabs
          floors={board.floors}
          selectedFloorId={floor.id}
          onSelect={(id) => {
            onSelectFloor(id);
            onSelectCell(null);
          }}
          onAdd={() => {
            const id = nextFloorId(board);
            const next = addFloor(board, id, `Floor ${board.floors.length + 1}`);
            onBoardChange(next);
            onSelectFloor(id);
            onSelectCell(null);
          }}
          onDelete={(id) => {
            const next = deleteFloor(board, id);
            onBoardChange(next);
            onSelectFloor(next.floors[0]?.id ?? id);
            onSelectCell(null);
          }}
        />
        <DesignerPalette tool={tool} onToolChange={onToolChange} />
        <LayoutGrid
          floor={floor}
          selectedCellId={selectedCellId ?? undefined}
          onSlotActivate={activate}
          onMoveCell={(cellId, col, row) => onBoardChange(moveCell(board, floor.id, cellId, col, row))}
        />
        <ValidationList issues={issues} />
      </div>
      <aside className="flex flex-col gap-3">
        <CellInspector
          board={board}
          floorId={floor.id}
          cellId={selectedCellId}
          packIds={listPackIds(cards)}
          onRenameFloor={(label) => onBoardChange(renameFloor(board, floor.id, label))}
          onSetPack={(packId) => {
            if (!selectedCellId) return;
            onBoardChange(setCellPack(board, floor.id, selectedCellId, packId));
          }}
          onSetStart={() => {
            if (!selectedCellId) return;
            onBoardChange(setStartCell(board, floor.id, selectedCellId));
          }}
          onAttachStair={() => {
            if (!selectedCellId) return;
            onBoardChange(attachStair(board, floor.id, selectedCellId));
          }}
          onLinkStair={(toFloorId, toCellId) => {
            const cell = floor.cells.find((c) => c.id === selectedCellId);
            if (!cell?.stairId) return;
            onBoardChange(linkStair(board, cell.stairId, toFloorId, toCellId));
          }}
          onClearStair={() => {
            if (!selectedCellId) return;
            onBoardChange(clearStair(board, floor.id, selectedCellId));
          }}
        />
        <FloorPreview board={board} floorId={floor.id} selectedCellId={selectedCellId ?? undefined} />
      </aside>
    </div>
  );
}
```

Update `components/library/LibraryBar.tsx` — add props and two buttons after Open:

```tsx
export type StudioMode = 'design' | 'test';

export function LibraryBar({
  activeName,
  savedAt,
  canSave,
  mode,
  onNew,
  onSave,
  onOpen,
  onDesign,
  onTest,
}: {
  activeName: string;
  savedAt?: string;
  canSave: boolean;
  mode: StudioMode;
  onNew: () => void;
  onSave: () => void;
  onOpen: () => void;
  onDesign: () => void;
  onTest: () => void;
}) {
```

In the button row, keep New / Save / Open and append:

```tsx
        <Button type="button" variant={mode === 'design' ? 'secondary' : 'outline'} aria-pressed={mode === 'design'} onClick={onDesign}>
          Design
        </Button>
        <Button type="button" variant={mode === 'test' ? 'secondary' : 'outline'} aria-pressed={mode === 'test'} onClick={onTest}>
          Test
        </Button>
```

Replace `components/library/StudioShell.tsx` with:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { LayoutDesigner } from '@/components/designer/LayoutDesigner';
import type { DesignerTool } from '@/components/designer/DesignerPalette';
import { GameHud } from '@/components/hud/GameHud';
import { LibraryBar, type StudioMode } from '@/components/library/LibraryBar';
import { NewGameDialog } from '@/components/library/NewGameDialog';
import { OpenGameDialog } from '@/components/library/OpenGameDialog';
import { validateLayout, type LayoutIssue } from '@/lib/designer/validate';
import { useLibrary, type UseLibraryOptions } from '@/hooks/use-library';
import type { GameState } from '@/lib/engine/game';
import { applyStartToPlayers, ensureBoardLayout } from '@/lib/engine/layout';
import { cloneJson, fromStoredBootstrap } from '@/lib/library/bootstrap';
import type { NewGameSource } from '@/lib/library/types';
import type { Board } from '@/lib/engine/board';
import type { PlayerState } from '@/lib/engine/players';

export function StudioShell(options: UseLibraryOptions = {}) {
  const { active, activeId, drafts, ready, newGame, openGame, saveActive } = useLibrary(options);
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [openOpen, setOpenOpen] = useState(false);
  const [mode, setMode] = useState<StudioMode>('design');
  const [workingBoard, setWorkingBoard] = useState<Board | null>(null);
  const [workingPlayers, setWorkingPlayers] = useState<PlayerState | null>(null);
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null);
  const [tool, setTool] = useState<DesignerTool>('select');
  const [issues, setIssues] = useState<LayoutIssue[]>([]);
  const [testNonce, setTestNonce] = useState(0);

  useEffect(() => {
    if (!active) {
      setWorkingBoard(null);
      setWorkingPlayers(null);
      return;
    }
    const board = ensureBoardLayout(cloneJson(active.bootstrap.board));
    setWorkingBoard(board);
    setWorkingPlayers(cloneJson(active.bootstrap.players));
    setSelectedFloorId(board.floors[0]?.id ?? '');
    setSelectedCellId(null);
    setIssues([]);
    setMode('design');
    setSnapshot(null);
  }, [active?.id]);

  const persistWorking = useCallback(() => {
    if (!active || !workingBoard || !workingPlayers) return;
    saveActive({
      board: cloneJson(workingBoard),
      players: applyStartToPlayers(cloneJson(workingPlayers), workingBoard),
      cards: snapshot?.cards.deck ?? active.bootstrap.cards,
      config: snapshot?.config ?? active.bootstrap.config,
    });
  }, [active, workingBoard, workingPlayers, snapshot, saveActive]);

  const onCreate = (input: { name: string; source: NewGameSource }) => {
    persistWorking();
    newGame(input);
    setNewOpen(false);
  };

  const onOpenDraft = (id: string) => {
    persistWorking();
    openGame(id);
    setOpenOpen(false);
  };

  const onTest = () => {
    if (!workingBoard) return;
    const nextIssues = validateLayout(workingBoard);
    setIssues(nextIssues);
    if (nextIssues.length > 0) {
      setMode('design');
      return;
    }
    persistWorking();
    setTestNonce((n) => n + 1);
    setMode('test');
  };

  if (!ready) {
    return <p className="text-slate-400">Loading library…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <LibraryBar
        activeName={active?.name ?? 'No game'}
        savedAt={active?.updatedAt}
        canSave={Boolean(active)}
        mode={mode}
        onNew={() => setNewOpen(true)}
        onSave={persistWorking}
        onOpen={() => setOpenOpen(true)}
        onDesign={() => setMode('design')}
        onTest={onTest}
      />
      {active && workingBoard && workingPlayers ? (
        mode === 'design' ? (
          <LayoutDesigner
            board={workingBoard}
            cards={snapshot?.cards.deck ?? active.bootstrap.cards}
            selectedFloorId={selectedFloorId || workingBoard.floors[0]!.id}
            selectedCellId={selectedCellId}
            tool={tool}
            issues={issues}
            onBoardChange={setWorkingBoard}
            onSelectFloor={setSelectedFloorId}
            onSelectCell={setSelectedCellId}
            onToolChange={setTool}
          />
        ) : (
          <GameHud
            key={`${active.id}-test-${testNonce}`}
            bootstrap={fromStoredBootstrap({
              board: workingBoard,
              players: applyStartToPlayers(workingPlayers, workingBoard),
              cards: snapshot?.cards.deck ?? active.bootstrap.cards,
              config: snapshot?.config ?? active.bootstrap.config,
            })}
            onStateChange={setSnapshot}
          />
        )
      ) : (
        <p className="text-slate-400">Create a game to start playing.</p>
      )}
      <NewGameDialog open={newOpen} onOpenChange={setNewOpen} onCreate={onCreate} />
      <OpenGameDialog
        open={openOpen}
        onOpenChange={setOpenOpen}
        drafts={drafts}
        activeId={activeId}
        onOpen={onOpenDraft}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/designer/layout-designer.test.tsx tests/library/library-bar.test.tsx tests/library/studio-shell.test.tsx tests/hud/game-hud.test.tsx`

Expected: PASS.

Pitfalls:

- `useEffect` on `active?.id` resets Design after Save (same id) — **do not** depend on `active` itself or Save will wipe in-progress cells. Depend on `active?.id` only.
- After New/Open, `active.id` changes and the effect reloads the new draft — correct.
- Dangling-stair studio test: tool must be **Stair** before clicking `slot-2-0`. Palette click sets tool.
- If Save after dangling stair does not update `savedAt`, `persistWorking` is stale — destructure `saveActive` as in slice 4.
- `fromStoredBootstrap` expects `StoredBootstrap`; passing `workingBoard` directly is fine.
- FloorTabs **Lobby** appears for Climb in Design.

- [ ] **Step 5: Commit**

```bash
git add components/designer/LayoutDesigner.tsx components/library/LibraryBar.tsx components/library/StudioShell.tsx tests/designer/layout-designer.test.tsx tests/library/library-bar.test.tsx tests/library/studio-shell.test.tsx
git commit -m "feat(studio): persist designer layout and Test the current draft"
```

---

### Task 8: README + full regression

**Files:**
- Modify: `README.md`
- Test: full `npm test` (no new assertion file required)

**Interfaces:**
- Consumes: behavior from tasks 1–7
- Produces: README that describes Design / Test, HUD-locked grid, Save of invalid drafts, and that play still uses HUD dice

- [ ] **Step 1: Update README**

After **Game library**, add **Layout designer** and adjust the library bullets so step 1 is Design, not a hard-coded HUD:

```md
## Layout designer

The studio opens in **Design**. The HTML grid authors the active draft. A PlayCanvas preview shows **the floor being edited** (not the whole stack, not first-person). HUD slots in the grid refuse drops.

1. Floor tabs rename and add floors (no max). Each non-empty floor must be a looping corridor of at least four 4-adjacent squares.
2. Palette: **Select**, **Corridor square**, **Stair**, **Erase**. Click empty slots to place; pointer-down on a square and pointer-up on an empty slot to move. Stair converts a corridor cell and must link a destination floor + landing square before **Test**.
3. Inspector: floor name, pack (from cards already in the draft — import under **Test**), start square, stair destination. Stair squares never hold packs.
4. **Save** writes the working layout even if stairs or loops are invalid.
5. **Test** is blocked with a named list until the layout is valid. Then it remounts the existing play HUD on that draft (not a public URL). **Design** returns to the grid. Live publish is not included.

Rooms, inner maps, doors, first-person, and the card template editor are not in this slice.

## Game library
```

Keep the four New/Save/Open bullets, and change the last sentence from “this slice does not add Test or Publish buttons” to:

```md
**Test** plays the current draft after layout validation. Publish live is not included.
```

In **Play the Climb sample**, step 1 becomes: open the app, library bar shows **Climb (sample)** in **Design**, click **Test**, then Roll dice as today.

Add step 6:

```md
6. **Design** on Climb: Lobby / Floor 1 / Floor 2 tabs, 3D preview of the selected floor, pack `climb` on content squares, up stairs already linked. **New → Empty board** is a Ground loop you can edit, Save, then Test.
```

In **Architecture**, add:

```md
- **`lib/engine/layout.ts`** — Grid occupancy, corridor loops, start square. No PlayCanvas.
- **`lib/designer/*`** — Board mutations and Test validation. No PlayCanvas.
- **`components/designer/*`** — HTML layout grid over the library draft.
- **`components/board/FloorPreview.tsx`** — PlayCanvas preview of the floor being edited.
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`

Expected: all tests PASS (slice 4 suite plus layout/designer/preview/studio Design-Test cases).

- [ ] **Step 3: Manual check (dev server)**

Run: `npm run dev`

Expected at http://127.0.0.1:4318:

1. Header **Building Board Template**, library bar **Climb (sample)**, buttons **New / Save / Open / Design / Test**. Design is pressed. HTML grid + **Lobby** tab + floor preview. No Roll dice.
2. **Test** → HUD **Roll dice**, Climb loop unchanged (HUD dice → token slide → Play/Pass). Preview unmounted.
3. **Design** → grid again. Attach a dangling stair → **Test** stays on Design with **Test is blocked** / **stair has no destination**. **Save** still updates the timestamp.
4. Link that stair to Floor 1, **Test** works.
5. **New → Empty board** named `Sandbox` → Design Ground loop → **Test** rolls with no climb pass line.
6. **Open → Climb (sample)** → Design shows Lobby. Reload the tab: same active draft, Design default.
7. No `/play/…` slug, no Live list, no first-person camera, no room/door palette, no timer cards, no 3D dice on the board.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: describe HTML layout designer and draft Test play"
```

---

## Self-Review

### Spec coverage (slice 5 only)

| Requirement | Task(s) |
|-------------|---------|
| Floor tabs; any number of named floors; no max / no special types | 3 `addFloor` / `renameFloor`, 5 FloorTabs, 7 |
| HUD cannot receive drops; reserved HUD rectangle in the grid | 1 `DEFAULT_HUD` / `isHudSlot`, 5 LayoutGrid |
| Palette corridor square; adjacent cells form paths; loop required | 1–4 `orderCellsAlongLoop` / `validateLayout`, 5 palette |
| Stair: corridor cell becomes stair; must link destination before Test; Save still allowed | 4 attach/link + validate, 7 Test gate vs Save |
| Stair label uses destination floor name (`Up to …` / `Down to …`) | 2 `stairLabel`, 5 inspector |
| Attach pack to corridor cells; never on stairs | 3 `setCellPack`, 4 pack-on-stair, 5 inspector |
| Mark one start cell; Test play uses it | 2 `applyStartToPlayers`, 3 `setStartCell`, 7 persist |
| PlayCanvas preview of the floor being edited; editor is HTML not 3D | 6 FloorPreview; 7 unmounts BoardScene in Design |
| Persist into library draft Save/Open | 7 `persistWorking` |
| Test uses current draft; not public; validation must pass | 7 `onTest` + `validateLayout` |
| Invalid stairs/loops block Test, not Save | 4, 7 |
| New named game still does not overwrite others | unchanged library + 7 persist then `newGame` |
| Dice stay HUD-space; ROLL_DICE unchanged | no engine dispatch edits |
| Rooms / inner maps / door | **out** (door only exists with a room) |
| First-person | **out** |
| Publish live | **out** |
| Card designer UI / timer cards | **out** |
| Buyable packs | **out** |
| End-floor non-loop / room-only floor | **out** (all floors must loop) |
| Stair direction **both** | **out** (one destination) |

### Placeholder scan

No TBD / implement-later / similar-to-Task-N. New files have full contents. Studio Save no longer uses live `game.board`.

### Type consistency

`HudRect`, `DEFAULT_COLUMNS` 8, `DEFAULT_ROWS` 6, `DEFAULT_HUD` `{ col: 2, row: 2, width: 4, height: 2 }`, `DesignerTool`, `StudioMode`, `LayoutIssue` / `LayoutIssueCode`, `createLoopedFloor`, `ensureBoardLayout`, `orderCellsAlongLoop`, `placeCorridor`, `attachStair`, `linkStair`, `validateLayout`, `canTestPlay`, `previewBoardForFloor`, `applyStartToPlayers`, `listPackIds` names are stable. Empty / Climb 6-cell rectangle is `(0,0)-(1,0)-(2,0)-(2,1)-(1,1)-(0,1)`. Stair ids are `s-${cellId}`. Buttons **Design**, **Test**, **Corridor square**, **Add floor**, **Start square**. Copy **HUD — drops blocked**, **Test is blocked**, **Stair squares never hold packs.**

### Known implementer pitfalls

- Implement from **GitHub main `ff7d5c3`**, not `feat/slice-2-*`.
- Do not JSON-serialize `rng`. Save still stores `cards: Card[]`.
- Do not mount `FloorPreview` and `BoardScene` together (WebGL / jsdom double app).
- `useGameStore` only reads bootstrap on mount — Test **must** remount `GameHud` (`key` includes `testNonce`).
- Save must write `workingBoard`, not the HUD snapshot board, or Design edits after a Test session are lost.
- `useEffect` reset of working board must key on `active.id` only, or Save will clobber the in-memory grid.
- Leftover `DiceActor` / `DiceRollLayer` stay off play and preview.
- Old localStorage Climb drafts without `col`/`row` go through `ensureBoardLayout` on open.
- Do not add a publish slug or room palette “while you are here.”

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-21-slice-5-layout-designer.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints. REQUIRED SUB-SKILL: superpowers:executing-plans.

This planning pass does **not** implement the slice.
