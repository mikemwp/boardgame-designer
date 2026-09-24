# Designer Group 7 — Lock level size, Reset, Shape label

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per task. Commit after each task.

**Goal:** Stop silent tile loss on resize. A level can change **Shape** / **Tiles** only while it is a vanilla loop. After the first added or configured tile, those controls are not clickable. **Reset level** (confirm) wipes the active level back to vanilla at the current size and unlocks Shape. **Delete level** stays disabled on the last level and now confirms first.

**Architecture:** PlayCanvas-free helper `isVanillaFloor` / `resetFloor` in `lib/designer`. `applyFloorShape` is a no-op on a locked floor. Designer chrome disables Shape/Tiles when locked. Room Reset/Delete is specified on the amendments list but **not** built here — Group 6 owns rooms.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn Dialog/Button, Vitest. No new packages.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 7 (level parts only)

**Base:** `origin/main` / `github/main` (`8a34793` or newer). **Branch:** `feat/designer-group-7-size-lock`. Cursor models only. TDD. No approval pauses. Push `github HEAD:main` + origin when tests pass.

## Global Constraints

- Engine / designer / library have **zero** PlayCanvas imports
- Polar shape UI stays **hidden**
- Do **not** remap Start/Stair/Room across a resize
- Do **not** implement Group 5 (spinners/players/Clear) or Group 6 (remove door / stair-like rooms)
- If the worktree still has uncommitted `feat/spinner-player-tabs` files, **leave them out** of Group 7 commits
- Dev server port **4318**
- GitHub remote: `mikemwp/boardgame-designer`. If `github` push fails, still push origin and return the origin SHA

---

## File map

| Path | Change |
|------|--------|
| `lib/designer/level-size.ts` | **Create.** `isVanillaFloor`, `resetFloor` |
| `lib/designer/mutate.ts` | `applyFloorShape` no-op when `!isVanillaFloor`; export `resetFloor` if you re-export |
| `components/designer/BoardShapeFields.tsx` | Label **Shape**; `disabled` on all selects |
| `components/designer/FloorTabs.tsx` | Drop **Level name** visible label (keep `aria-label`). **Reset level**. Confirm Delete + Reset |
| `components/designer/LevelConfirmDialog.tsx` | **Create.** Shared confirm (or two thin dialogs) |
| `components/designer/LayoutDesigner.tsx` | Pass `disabled={!vanilla}`; wire Reset + confirms |
| `README.md` | Size lock, Reset, Shape label |
| Tests listed per task | Fail first, then implement |

**Out:** multi-tile room lock/reset/delete, spinner catalogs, door removal, polar unhide.

---

### Task 1: Vanilla detect + reset + locked reshape no-op

**Files:**
- Create: `lib/designer/level-size.ts`
- Modify: `lib/designer/mutate.ts`
- Test: `tests/designer/level-size.test.ts`, `tests/designer/mutate.test.ts`

**Interfaces:**

```ts
export function isVanillaFloor(floor: Floor): boolean
export function resetFloor(board: Board, floorId: string): Board
```

Vanilla means the floor still matches `createLoopedFloor(id, label, index, shape)` except cell ids may differ:

- Same ring + default HUD **positions** and kinds (`corridor` / `hud` only)
- No `start`, `end`, `stair`, `room`, `door`
- No `packId`, `spinnerId`, `audio`, `image`, `video`, `hudWidget`, `stairId`, `roomId`

Default center HUD cells from `createLoopedFloor` are vanilla. Setting a HUD type, painting an extra tile, erasing a ring tile, Start, Stair, pack, or media → **not** vanilla.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { applyFloorShape, attachStair, setStartCell } from '@/lib/designer/mutate';
import { isVanillaFloor, resetFloor } from '@/lib/designer/level-size';

describe('isVanillaFloor', () => {
  it('is true for a fresh looped floor and false after start or stair', () => {
    const floor = createLoopedFloor('ground', 'Level 1', 0);
    expect(isVanillaFloor(floor)).toBe(true);
    const board = createBoard([floor], []);
    const started = setStartCell(board, 'ground', floor.cells.find((c) => c.kind === 'corridor')!.id);
    expect(isVanillaFloor(started.floors[0]!)).toBe(false);
    const stair = attachStair(board, 'ground', floor.cells.find((c) => c.kind === 'corridor')!.id);
    expect(isVanillaFloor(stair.floors[0]!)).toBe(false);
  });
});

describe('resetFloor', () => {
  it('wipes start and stairs and keeps shape, size, and name', () => {
    let board = createBoard([createLoopedFloor('ground', 'Lobby', 0, { kind: 'square', tilesPerSide: 12 })], []);
    const cell = board.floors[0]!.cells.find((c) => c.kind === 'corridor')!;
    board = setStartCell(board, 'ground', cell.id);
    board = attachStair(board, 'ground', board.floors[0]!.cells.find((c) => c.kind === 'corridor' && !c.start)!.id);
    const next = resetFloor(board, 'ground');
    expect(next.floors[0]?.label).toBe('Lobby');
    expect(next.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 12 });
    expect(isVanillaFloor(next.floors[0]!)).toBe(true);
    expect(next.floors[0]!.cells.some((c) => c.start || c.kind === 'stair')).toBe(false);
    expect(next.stairs).toEqual([]);
  });
});

describe('applyFloorShape', () => {
  it('refuses to reshape a configured floor', () => {
    let board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    board = setStartCell(board, 'ground', board.floors[0]!.cells.find((c) => c.kind === 'corridor')!.id);
    const same = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 10 });
    expect(same).toBe(board);
  });

  it('still reshapes a vanilla floor', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const next = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 10 });
    expect(next.floors[0]?.shape).toEqual({ kind: 'square', tilesPerSide: 10 });
    expect(isVanillaFloor(next.floors[0]!)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL** (`isVanillaFloor` / `resetFloor` missing; reshape still mutates)

```bash
npx vitest run tests/designer/level-size.test.ts tests/designer/mutate.test.ts
```

- [ ] **Step 3: Implement**

`resetFloor`: `createLoopedFloor(floor.id, floor.label, floor.index, floor.shape)`; drop `board.stairs` where `fromFloorId === floorId` (leave inbound stairs dangling). Keep hold flags? **Wipe hold** too — vanilla loop only.

`applyFloorShape`: if `!isVanillaFloor(floor) return board;` then existing remap (vanilla-only now).

- [ ] **Step 4: Tests PASS**
- [ ] **Step 5: Commit** `feat(designer): lock reshape to vanilla levels`

---

### Task 2: Shape label + disabled fields

**Files:**
- Modify: `components/designer/BoardShapeFields.tsx`
- Test: `tests/designer/board-shape-fields.test.tsx` (every `Board shape` label → `Shape`)

```tsx
export function BoardShapeFields({
  shape,
  onChange,
  disabled = false,
}: {
  shape: BoardShape;
  onChange: (shape: BoardShape) => void;
  disabled?: boolean;
})
```

Visible label and `aria-label` are **Shape**. Every `<select>` gets `disabled={disabled}`.

- [ ] **Step 1: Failing tests** — `getByLabelText('Shape')`; when `disabled`, `expect(select).toHaveProperty('disabled', true)`. Old **Board shape** queries must be updated in this file and any other test that breaks (`layout-designer`, `studio-shell`).
- [ ] **Step 2: Run — FAIL** on new disabled assertion / missing Shape label
- [ ] **Step 3: Implement**
- [ ] **Step 4: Tests PASS**
- [ ] **Step 5: Commit** `feat(designer): rename Board shape to Shape and allow lock`

---

### Task 3: Reset level + confirm Delete/Reset; wire lock in LayoutDesigner

**Files:**
- Create: `components/designer/LevelConfirmDialog.tsx`
- Modify: `components/designer/FloorTabs.tsx`, `components/designer/LayoutDesigner.tsx`
- Test: `tests/designer/floor-tabs.test.tsx`, `tests/designer/layout-designer.test.tsx`

Copy:

- Delete title: `Delete {level name}?` — body: `This removes the level. It cannot be undone.` Buttons: Cancel / **Delete level**
- Reset title: `Reset {level name}?` — body: `This clears Start, stairs, rooms, and tile settings on this level. Shape and size stay. It cannot be undone.` Buttons: Cancel / **Reset level**

FloorTabs:

- Remove the visible **Level name** `<Label>` (Group 5 chrome that belongs with this row). Keep the input `aria-label="Level name"`.
- Add **Reset level** (outline), `disabled={resetDisabled}`.
- Delete and Reset **do not** fire immediately — `onRequestDelete` / `onRequestReset`. Parent opens the dialog.

LayoutDesigner:

- `const vanilla = isVanillaFloor(floor)`
- `<BoardShapeFields disabled={!vanilla} onChange={...} />` — when disabled, `onChange` must not fire
- Reset confirm → `onBoardChange(resetFloor(board, floor.id))`
- Delete confirm → existing `deleteFloor` (still no-op / disabled at 1 level)

- [ ] **Step 1: Failing tests**

```ts
it('disables Shape after Start and Reset restores it', () => {
  // render LayoutDesigner, mark Start, expect Shape disabled
  // click Reset level, confirm, expect Shape enabled and no Start
});

it('asks before Delete level', () => {
  // two levels, click Delete level, expect dialog, cancel keeps both
});
```

- [ ] **Step 2: Run — FAIL**
- [ ] **Step 3: Implement**
- [ ] **Step 4: Tests PASS**
- [ ] **Step 5: Commit** `feat(designer): confirm reset and delete level`

---

### Task 4: README + verify + push

README: vanilla levels can change Shape/Tiles; first Start/Stair/pack/extra tile locks those controls; Reset wipes the active level (confirm); Delete still needs 2+ levels (confirm). Label is **Shape**.

```bash
npm test
```

On green:

```bash
git push -u origin feat/designer-group-7-size-lock
git push github HEAD:main
git push origin HEAD:main
```

## Acceptance

- Fresh empty/Climb-style unused loop: Shape + Tiles work
- After Start, Stair, extra tile, pack, or media: Shape/Tiles **disabled**
- Resize of a configured level does not run (no more lost Start/Stair on 12×12 → other → 12×12)
- Reset (confirm) restores vanilla at the same size and re-enables Shape
- Delete (confirm) still disabled when one level remains
