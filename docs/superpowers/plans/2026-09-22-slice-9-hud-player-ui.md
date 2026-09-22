# Slice 9 — HUD / Player UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per task. Commit after each task. Cursor models only. No approval pauses. Do **not** start Publish.

**Goal:** Let the studio set what each HUD cell is, edit per-level hold quotas in Design, author card timers and extra buttons, persist all of that on Save, and lock Test Roll until a timer elapses or the extra button is pressed.

**Architecture:** HUD widget types live on the existing HUD `Cell` (`hudWidget`). Floor hold already exists (`holdEnabled` + `holdQuotas`); Design gets an editor and pack rename/delete rewrites quota keys. Card timer/extra are optional fields on `Card`. Test HUD stays the existing DOM overlay — it shows or hides PlayerBar / LastRoll from designed widgets and picks dice vs spinner when exactly one of those widgets is placed. Timer and extra-button lock is view-level (`lib/view/card-hold.ts` + `isRollLocked`); no new engine command. PlayCanvas stays off this slice.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, existing shadcn/ui (`Button`, `Input`, `Label`, `Switch` — native `<select>`, no new npm packages), Vitest, existing engine + library + HUD + designer.

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md` (centre HUD widgets; floor hold / pack reveal counts; card timer + extra buttons)  
**Preferences:** Dice stay in HUD space; if a card has a timer or extra button, Roll stays locked until the timer elapses **or** that button is pressed.  
**Slice 6 (done):** packs + card title/body. **Slice 7 (done, GitHub / origin `main` `b660339` or newer):** card-only rooms. This plan **does not start Publish**.

**Base branch:** Implement from **origin/main** or **github/main** (`b660339` or newer). Branch **`feat/slice-9-hud-player-ui`**. Isolated worktree. Do **not** implement publish, polar UI, first-person, or inner maps.

## Global Constraints

- Engine is a small set of repeating mechanics; **Game JSON + the designer** own the rules (Climb is only the first bundled example)
- **PlayCanvas React** is the **3D board view only**; engine, library, designer, and HUD lock helpers have **zero** PlayCanvas imports
- HUD, cards, setup, library, and designer chrome stay **DOM + shadcn/ui**
- **Pass** does **not** count as a pack reveal and does **not** start a card timer / extra-button hold
- **Save draft** is allowed even if stairs/loops/rooms are invalid for Test
- **Test** always uses the **current draft**
- Polar board-shape UI stays **hidden**
- Dev server stays on uncommon port **4318**
- Do **not** rename `ROLL_DICE`. Do **not** remount leftover `DiceActor` / `DiceRollLayer`. Do **not** add a Publish button
- Test HUD hold toggle (`config.holdEnabled`) remains; Design edits per-level `floor.holdEnabled` + `floor.holdQuotas`

## Slice scope

**In this plan:** HUD cell types (`empty`, `dice`, `spinner`, `last-roll`, `player-bar`); Hold quota editor in Design; card `timerSeconds` + `extraButton`; Test Roll lock until timer elapses or extra button; Save persists widget types, hold quotas, and card fields.

**Out of this plan:** publish button / live slug, polar UI, first-person, inner maps, rearranging the live HUD into the designer grid, inventory, minimap, extra timer fail effects (lose item / nudge), per-card Play/Pass overrides (game-level `actionMode` stays).

**Locked Test rule:** If the dealt card has `timerSeconds > 0` or a non-blank `extraButton`, after the body is visible Roll stays locked until the timer hits zero **or** the extra button is pressed (either one unlocks). Pass dismisses the card and unlocks immediately.

---

## File Map

| Path | Slice 9 change |
|------|----------------|
| `lib/engine/types.ts` | `HudWidget`; `Cell.hudWidget?`; `Card.timerSeconds?`; `Card.extraButton?` |
| `lib/designer/hud.ts` | **Create.** Widget list, labels, `preferredMovementViz` |
| `lib/designer/mutate.ts` | `setHudWidget`; `setFloorHold`; `designerProps` keeps `hudWidget` |
| `lib/designer/packs.ts` | `updateCard` accepts timer/extra; rename/delete rewrite `holdQuotas` |
| `lib/view/card-hold.ts` | **Create.** `cardNeedsHold`, `isCardHoldActive`, `formatCardTimer` |
| `lib/view/turn-loop.ts` | `isRollLocked` takes `cardHoldActive` |
| `components/designer/HoldEditor.tsx` | **Create.** Per-level hold + pack quotas |
| `components/designer/CellInspector.tsx` | HUD type dropdown; skip pack/stair/start/end on HUD |
| `components/designer/LayoutGrid.tsx` | HUD widget labels |
| `components/designer/LayoutDesigner.tsx` | Wire HUD type + HoldEditor |
| `components/designer/PackEditor.tsx` | Timer seconds + extra button fields |
| `components/hud/CardPanel.tsx` | Extra button + timer text after body visible |
| `components/hud/GameHud.tsx` | Card-hold lock; hide LastRoll / PlayerBar from designed widgets |
| `components/library/StudioShell.tsx` | Test bootstrap uses `preferredMovementViz` |
| `README.md` | HUD types, hold editor, timer / extra button |
| `tests/engine/types.test.ts` | Widget + card fields |
| `tests/designer/hud.test.ts` | **Create.** Labels + movement viz |
| `tests/designer/mutate.test.ts` | `setHudWidget`, `setFloorHold` |
| `tests/designer/packs.test.ts` | Timer fields + holdQuota rewrite |
| `tests/designer/hold-editor.test.tsx` | **Create.** |
| `tests/designer/cell-inspector.test.tsx` | HUD type |
| `tests/designer/layout-grid.test.tsx` | Widget labels |
| `tests/designer/layout-designer.test.tsx` | Set HUD type + hold |
| `tests/designer/pack-editor.test.tsx` | Timer + extra fields |
| `tests/view/card-hold.test.ts` | **Create.** |
| `tests/view/turn-loop.test.ts` | Card-hold lock |
| `tests/hud/card-panel.test.tsx` | Extra button + timer |
| `tests/hud/game-hud.test.tsx` | Timer/extra lock Roll; widget hide |
| `tests/library/studio-shell.test.tsx` | Save persist + Test spinner from HUD widget |

Do not add `app/play/[slug]`, Publish button, polar shape pickers, first-person cameras, or inner-map cells.

---

### Task 1: HUD widget type + floor hold mutation

**Files:**
- Modify: `lib/engine/types.ts`
- Create: `lib/designer/hud.ts`
- Modify: `lib/designer/mutate.ts`
- Test: `tests/engine/types.test.ts`, `tests/designer/hud.test.ts`, `tests/designer/mutate.test.ts`

**Interfaces:**
- Consumes: existing `Cell`, `Floor`, `Board`, `designerProps`, `mapFloor`
- Produces:
  - `export type HudWidget = 'empty' | 'dice' | 'spinner' | 'last-roll' | 'player-bar'`
  - `export const HUD_WIDGETS: HudWidget[] = ['empty', 'dice', 'spinner', 'last-roll', 'player-bar']`
  - `Cell.hudWidget?: HudWidget` — omit or `'empty'` means empty HUD slot; only meaningful when `kind === 'hud'`
  - `export function hudWidgetOf(cell: { kind?: string; hudWidget?: HudWidget }): HudWidget` — `'empty'` unless `kind === 'hud'` and `hudWidget` is set
  - `export function hudWidgetLabel(widget: HudWidget): string` — `empty` → `HUD`, `dice` → `Dice`, `spinner` → `Spin`, `last-roll` → `Roll`, `player-bar` → `Players`
  - `export function listHudWidgets(board: { floors: Array<{ cells: Array<{ kind?: string; hudWidget?: HudWidget }> }> }): HudWidget[]` — unique widgets on HUD cells, including `'empty'`
  - `export function preferredMovementViz(board, fallback: 'dice' | 'spinner'): 'dice' | 'spinner'` — spinner if HUD has spinner and not dice; dice if HUD has dice and not spinner; else `fallback`
  - `export function setHudWidget(board: Board, floorId: string, cellId: string, widget: HudWidget): Board` — no-op unless the cell is `kind === 'hud'`; store `undefined` when `widget === 'empty'`
  - `export function setFloorHold(board: Board, floorId: string, patch: { holdEnabled?: boolean; holdQuotas?: Record<string, number> }): Board` — merge onto that floor; drop quota keys whose value is `<= 0`
  - `designerProps` also copies `hudWidget`

- [ ] **Step 1: Write the failing tests**

Append to `tests/engine/types.test.ts` inside the Cell/Floor describe:

```ts
it('allows an optional HUD widget on a HUD cell', () => {
  const cell: Cell = { id: 'h0', index: 20, kind: 'hud', col: 2, row: 2, hudWidget: 'dice' };
  expect(cell.hudWidget).toBe('dice');
});

it('allows optional card timer and extra button', () => {
  const card: import('@/lib/engine/types').Card = {
    id: 'c1',
    pack: 'notes',
    title: 'Clue',
    timerSeconds: 12,
    extraButton: 'Done',
  };
  expect(card.timerSeconds).toBe(12);
  expect(card.extraButton).toBe('Done');
});
```

Create `tests/designer/hud.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import {
  HUD_WIDGETS,
  hudWidgetLabel,
  hudWidgetOf,
  listHudWidgets,
  preferredMovementViz,
} from '@/lib/designer/hud';

describe('hud widgets', () => {
  it('labels the five HUD types', () => {
    expect(HUD_WIDGETS).toEqual(['empty', 'dice', 'spinner', 'last-roll', 'player-bar']);
    expect(hudWidgetLabel('empty')).toBe('HUD');
    expect(hudWidgetLabel('dice')).toBe('Dice');
    expect(hudWidgetLabel('spinner')).toBe('Spin');
    expect(hudWidgetLabel('last-roll')).toBe('Roll');
    expect(hudWidgetLabel('player-bar')).toBe('Players');
    expect(hudWidgetOf({ kind: 'corridor', hudWidget: 'dice' })).toBe('empty');
    expect(hudWidgetOf({ kind: 'hud' })).toBe('empty');
    expect(hudWidgetOf({ kind: 'hud', hudWidget: 'spinner' })).toBe('spinner');
  });

  it('picks movement viz when exactly one of dice or spinner is placed', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    expect(preferredMovementViz(board, 'dice')).toBe('dice');
    const withSpin = {
      ...board,
      floors: board.floors.map((f) => ({
        ...f,
        cells: f.cells.map((c) => (c.id === hud.id ? { ...c, hudWidget: 'spinner' as const } : c)),
      })),
    };
    expect(listHudWidgets(withSpin)).toEqual(expect.arrayContaining(['spinner', 'empty']));
    expect(preferredMovementViz(withSpin, 'dice')).toBe('spinner');
  });
});
```

Append to `tests/designer/mutate.test.ts` (keep existing imports; add `setHudWidget`, `setFloorHold`, `applyFloorShape`):

```ts
describe('setHudWidget', () => {
  it('sets and clears a HUD widget and ignores corridor cells', () => {
    const floor = createLoopedFloor('ground', 'Level 1', 0);
    const board = createBoard([floor], []);
    const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
    const corridor = board.floors[0]!.cells.find((c) => c.kind === 'corridor')!;
    const next = setHudWidget(board, 'ground', hud.id, 'dice');
    expect(next.floors[0]!.cells.find((c) => c.id === hud.id)?.hudWidget).toBe('dice');
    expect(setHudWidget(board, 'ground', corridor.id, 'dice')).toEqual(board);
    expect(setHudWidget(next, 'ground', hud.id, 'empty').floors[0]!.cells.find((c) => c.id === hud.id)?.hudWidget).toBeUndefined();
  });
});

describe('setFloorHold', () => {
  it('toggles hold and drops non-positive quotas', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const next = setFloorHold(board, 'ground', { holdEnabled: true, holdQuotas: { climb: 2, notes: 0 } });
    expect(next.floors[0]?.holdEnabled).toBe(true);
    expect(next.floors[0]?.holdQuotas).toEqual({ climb: 2 });
  });
});
```

Also add a reshape preserve assertion in the existing `applyFloorShape` describe if one exists; otherwise append:

```ts
it('keeps hudWidget when the square is reshaped', () => {
  const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
  const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
  const marked = setHudWidget(board, 'ground', hud.id, 'player-bar');
  const resized = applyFloorShape(marked, 'ground', { kind: 'square', tilesPerSide: 10 });
  const kept = resized.floors[0]!.cells.find((c) => c.col === hud.col && c.row === hud.row && c.kind === 'hud');
  expect(kept?.hudWidget).toBe('player-bar');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/engine/types.test.ts tests/designer/hud.test.ts tests/designer/mutate.test.ts`
Expected: FAIL — `HudWidget` / `setHudWidget` / `lib/designer/hud.ts` missing.

- [ ] **Step 3: Write minimal implementation**

In `lib/engine/types.ts` add:

```ts
export type HudWidget = 'empty' | 'dice' | 'spinner' | 'last-roll' | 'player-bar';
```

Add `hudWidget?: HudWidget` to `Cell`. Add `timerSeconds?: number` and `extraButton?: string` to `Card`.

Create `lib/designer/hud.ts` with the functions named above. `listHudWidgets` walks HUD cells only and returns a sorted unique list.

In `lib/designer/mutate.ts`, extend `designerProps` to copy `hudWidget`. Implement `setHudWidget` and `setFloorHold` via `mapFloor`. For empty widget, omit the field (`const { hudWidget: _drop, ...rest } = cell`). For quotas, build a new record from entries with `quota > 0`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/engine/types.test.ts tests/designer/hud.test.ts tests/designer/mutate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/engine/types.ts lib/designer/hud.ts lib/designer/mutate.ts tests/engine/types.test.ts tests/designer/hud.test.ts tests/designer/mutate.test.ts
git commit -m "feat: add HUD widget types and floor hold mutation"
```

---

### Task 2: Design HUD type inspector + grid labels

**Files:**
- Modify: `components/designer/CellInspector.tsx`
- Modify: `components/designer/LayoutGrid.tsx`
- Modify: `components/designer/LayoutDesigner.tsx`
- Test: `tests/designer/cell-inspector.test.tsx`, `tests/designer/layout-grid.test.tsx`, `tests/designer/layout-designer.test.tsx`

**Interfaces:**
- Consumes: `HudWidget`, `HUD_WIDGETS`, `hudWidgetOf`, `hudWidgetLabel`, `setHudWidget`
- Produces:
  - `CellInspector` optional `onSetHudWidget?: (widget: HudWidget) => void`
  - When `cell.kind === 'hud'`, heading **HUD**, select `aria-label="HUD type"` with options Empty slot / Dice / Spinner / Last roll / Player bar (`value` is the `HudWidget`). No pack, stair, start, or end controls on HUD cells
  - Grid HUD tile text is `hudWidgetLabel(hudWidgetOf(cell))` instead of always `HUD`
  - `LayoutDesigner` calls `setHudWidget` from `onSetHudWidget`

HUD type option labels (select text, not grid text):

| value | option |
|-------|--------|
| `empty` | Empty slot |
| `dice` | Dice |
| `spinner` | Spinner |
| `last-roll` | Last roll |
| `player-bar` | Player bar |

- [ ] **Step 1: Write the failing tests**

Append to `tests/designer/cell-inspector.test.tsx`:

```ts
it('sets HUD type on a HUD cell and hides pack controls', () => {
  const onSetHudWidget = vi.fn();
  const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
  const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
  render(
    <CellInspector
      board={board}
      floorId="ground"
      cellId={hud.id}
      packIds={['climb']}
      onSetPack={() => {}}
      onSetStart={() => {}}
      onSetEnd={() => {}}
      onAttachStair={() => {}}
      onLinkStair={() => {}}
      onClearStair={() => {}}
      onSetHudWidget={onSetHudWidget}
    />,
  );
  expect(screen.getByText('HUD')).toBeDefined();
  expect(screen.queryByLabelText('Pack')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Start tile' })).toBeNull();
  fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'dice' } });
  expect(onSetHudWidget).toHaveBeenCalledWith('dice');
});
```

Append to `tests/designer/layout-grid.test.tsx`:

```ts
it('labels a dice HUD widget Dice', () => {
  const floor = createLoopedFloor('ground', 'Ground', 0);
  const hud = floor.cells.find((c) => c.kind === 'hud')!;
  const withDice = {
    ...floor,
    cells: floor.cells.map((c) => (c.id === hud.id ? { ...c, hudWidget: 'dice' as const } : c)),
  };
  render(<LayoutGrid floor={withDice} onSlotActivate={() => {}} onMoveCell={() => {}} />);
  expect(screen.getByText('Dice')).toBeDefined();
});
```

Append to `tests/designer/layout-designer.test.tsx`:

```ts
it('sets a HUD cell to spinner from Tile Actions', () => {
  const onBoardChange = vi.fn();
  const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
  const hud = board.floors[0]!.cells.find((c) => c.kind === 'hud')!;
  render(
    <LayoutDesigner
      board={board}
      cards={[]}
      selectedFloorId="ground"
      selectedCellId={hud.id}
      tool="select"
      issues={[]}
      onBoardChange={onBoardChange}
      onSelectFloor={() => {}}
      onSelectCell={() => {}}
      onToolChange={() => {}}
    />,
  );
  fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'spinner' } });
  expect(onBoardChange).toHaveBeenCalled();
  const next = onBoardChange.mock.calls[0][0] as Board;
  expect(next.floors[0]!.cells.find((c) => c.id === hud.id)?.hudWidget).toBe('spinner');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/designer/cell-inspector.test.tsx tests/designer/layout-grid.test.tsx tests/designer/layout-designer.test.tsx`
Expected: FAIL — no `HUD type` control / always `HUD` label.

- [ ] **Step 3: Write minimal implementation**

`CellInspector`: if `cell.kind === 'hud'`, render heading HUD + labeled select; call `onSetHudWidget`. Do not render pack/stair/start/end for HUD.

`LayoutGrid`: for `kind === 'hud'` use `hudWidgetLabel(hudWidgetOf(cell))`.

`LayoutDesigner`: pass `onSetHudWidget` that calls `setHudWidget` + `onBoardChange`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/designer/cell-inspector.test.tsx tests/designer/layout-grid.test.tsx tests/designer/layout-designer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/designer/CellInspector.tsx components/designer/LayoutGrid.tsx components/designer/LayoutDesigner.tsx tests/designer/cell-inspector.test.tsx tests/designer/layout-grid.test.tsx tests/designer/layout-designer.test.tsx
git commit -m "feat: let Design set HUD cell types"
```

---

### Task 3: Hold quota editor + pack quota rewrite

**Files:**
- Create: `components/designer/HoldEditor.tsx`
- Modify: `components/designer/LayoutDesigner.tsx`
- Modify: `lib/designer/packs.ts`
- Test: `tests/designer/hold-editor.test.tsx`, `tests/designer/packs.test.ts`, `tests/designer/layout-designer.test.tsx`

**Interfaces:**
- Consumes: `setFloorHold`, `Floor`, pack ids, `renamePack` / `deletePack`
- Produces:
  - `HoldEditor` props: `floor: Floor`, `packIds: string[]`, `onChange: (patch: { holdEnabled?: boolean; holdQuotas?: Record<string, number> }) => void`
  - Root `data-testid="hold-editor"`
  - Switch `id="level-hold"` labeled **Level hold** (`htmlFor` / `aria-label="Level hold"`)
  - When hold is on and `packIds` is empty: copy `Create a pack in Packs to set reveal quotas.`
  - When hold is on, one number input per pack: `aria-label="Quota for {packId}"`, value is `floor.holdQuotas?.[packId] ?? ''` (empty means 0 / omitted)
  - Changing a quota calls `onChange({ holdQuotas: { ...existing, [packId]: Number(value) } })` — `setFloorHold` drops `<= 0`
  - `renamePack` / `deletePack` rewrite `floor.holdQuotas` keys the same way as cell `packId`
  - Tile Actions pane renders `HoldEditor` above `CellInspector`

- [ ] **Step 1: Write the failing tests**

Create `tests/designer/hold-editor.test.tsx`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HoldEditor } from '@/components/designer/HoldEditor';
import { createLoopedFloor } from '@/lib/engine/layout';

describe('HoldEditor', () => {
  it('enables level hold and sets a pack quota', () => {
    const onChange = vi.fn();
    const floor = { ...createLoopedFloor('ground', 'Level 1', 0), holdEnabled: false, holdQuotas: {} };
    const { rerender } = render(<HoldEditor floor={floor} packIds={['climb']} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Level hold'));
    expect(onChange).toHaveBeenCalledWith({ holdEnabled: true });
    rerender(
      <HoldEditor
        floor={{ ...floor, holdEnabled: true, holdQuotas: { climb: 1 } }}
        packIds={['climb']}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Quota for climb'), { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith({ holdQuotas: { climb: 3 } });
  });

  it('asks for packs when hold is on and the catalog is empty', () => {
    const floor = { ...createLoopedFloor('ground', 'Level 1', 0), holdEnabled: true };
    render(<HoldEditor floor={floor} packIds={[]} onChange={() => {}} />);
    expect(screen.getByText('Create a pack in Packs to set reveal quotas.')).toBeDefined();
  });
});
```

Append to `tests/designer/packs.test.ts` inside the rename/delete describe:

```ts
it('rewrites and drops hold quota keys with the pack', () => {
  const held = createBoard(
    [{ ...createLoopedFloor('ground', 'Level 1', 0), holdEnabled: true, holdQuotas: { notes: 2 } }],
    [],
  );
  const renamed = renamePack({
    packIds: ['notes'],
    cards: [],
    board: held,
    from: 'notes',
    to: 'clues',
  });
  expect(renamed.board.floors[0]?.holdQuotas).toEqual({ clues: 2 });
  const deleted = deletePack({
    packIds: renamed.packIds,
    cards: [],
    board: renamed.board,
    packId: 'clues',
  });
  expect(deleted.board.floors[0]?.holdQuotas).toEqual({});
});
```

Append to `tests/designer/layout-designer.test.tsx`:

```ts
it('enables level hold from Tile Actions', () => {
  const onBoardChange = vi.fn();
  const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
  render(
    <LayoutDesigner
      board={board}
      cards={[{ pack: 'climb' }]}
      selectedFloorId="ground"
      selectedCellId={null}
      tool="select"
      issues={[]}
      onBoardChange={onBoardChange}
      onSelectFloor={() => {}}
      onSelectCell={() => {}}
      onToolChange={() => {}}
    />,
  );
  expect(screen.getByTestId('hold-editor')).toBeDefined();
  fireEvent.click(screen.getByLabelText('Level hold'));
  const next = onBoardChange.mock.calls[0][0] as Board;
  expect(next.floors[0]?.holdEnabled).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/designer/hold-editor.test.tsx tests/designer/packs.test.ts tests/designer/layout-designer.test.tsx`
Expected: FAIL — `HoldEditor` missing; quotas not rewritten.

- [ ] **Step 3: Write minimal implementation**

`HoldEditor`: Switch + quota inputs as specified.

`packs.ts`: extend `rewriteBoardPack` so each floor’s `holdQuotas` renames `from` → `to` or deletes `from`. Empty leftover object is `{}`.

`LayoutDesigner`: render `<HoldEditor floor={floor} packIds={catalog} onChange={(patch) => onBoardChange(setFloorHold(board, floor.id, patch))} />` at the top of the Tile Actions tab.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/designer/hold-editor.test.tsx tests/designer/packs.test.ts tests/designer/layout-designer.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/designer/HoldEditor.tsx components/designer/LayoutDesigner.tsx lib/designer/packs.ts tests/designer/hold-editor.test.tsx tests/designer/packs.test.ts tests/designer/layout-designer.test.tsx
git commit -m "feat: add Design hold quota editor"
```

---

### Task 4: Card timer and extra button fields

**Files:**
- Modify: `lib/designer/packs.ts`
- Modify: `components/designer/PackEditor.tsx`
- Test: `tests/designer/packs.test.ts`, `tests/designer/pack-editor.test.tsx`

**Interfaces:**
- Consumes: `Card.timerSeconds?`, `Card.extraButton?`
- Produces:
  - `updateCard(cards, cardId, patch: Partial<Pick<Card, 'title' | 'body' | 'timerSeconds' | 'extraButton'>>)`
  - `timerSeconds`: omit the field when `undefined`, `NaN`, or `<= 0`; otherwise store a positive integer (`Math.floor`)
  - `extraButton`: omit when blank / undefined after trim; otherwise store trimmed label
  - PackEditor fields when a card is selected:
    - Number input `aria-label="Timer seconds"` (`id="card-timer"`), value `selectedCard.timerSeconds ?? ''`
    - Text input `aria-label="Extra button"` (`id="card-extra-button"`), value `selectedCard.extraButton ?? ''`
    - `onUpdateCard` already used; widen its patch type to include the two fields

- [ ] **Step 1: Write the failing tests**

Append to `tests/designer/packs.test.ts` in the cards describe:

```ts
it('stores a timer and extra button and clears them when blank', () => {
  const added = addCard([], { id: 'notes-1', pack: 'notes', title: 'Clue' });
  const timed = updateCard(added, 'notes-1', { timerSeconds: 8, extraButton: ' Done ' });
  expect(timed[0]).toMatchObject({ timerSeconds: 8, extraButton: 'Done' });
  const cleared = updateCard(timed, 'notes-1', { timerSeconds: 0, extraButton: '  ' });
  expect(cleared[0]?.timerSeconds).toBeUndefined();
  expect(cleared[0]?.extraButton).toBeUndefined();
});
```

Append to `tests/designer/pack-editor.test.tsx` after the body change assertions (same selected-card rerender):

```ts
    fireEvent.change(screen.getByLabelText('Timer seconds'), { target: { value: '15' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ timerSeconds: 15 });
    fireEvent.change(screen.getByLabelText('Extra button'), { target: { value: 'Done' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ extraButton: 'Done' });
```

(If cleaner, add a dedicated `it` that rerenders the selected card and only asserts those two fields.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/designer/packs.test.ts tests/designer/pack-editor.test.tsx`
Expected: FAIL — `updateCard` ignores timer; no Timer seconds field.

- [ ] **Step 3: Write minimal implementation**

Widen `updateCard` and PackEditor `onUpdateCard` patch. Add the two inputs. Parse timer with `Number(e.target.value)` and pass through (empty string → `0` so it clears). Extra button passes the raw string (mutation trims).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/designer/packs.test.ts tests/designer/pack-editor.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/designer/packs.ts components/designer/PackEditor.tsx tests/designer/packs.test.ts tests/designer/pack-editor.test.tsx
git commit -m "feat: add card timer and extra button fields"
```

---

### Task 5: Test Roll lock for timer and extra button

**Files:**
- Create: `lib/view/card-hold.ts`
- Modify: `lib/view/turn-loop.ts`
- Modify: `components/hud/CardPanel.tsx`
- Modify: `components/hud/GameHud.tsx`
- Test: `tests/view/card-hold.test.ts`, `tests/view/turn-loop.test.ts`, `tests/hud/card-panel.test.tsx`, `tests/hud/game-hud.test.tsx`

**Interfaces:**
- Consumes: `Card.timerSeconds`, `Card.extraButton`, existing `isRollLocked`
- Produces:
  - `export function cardNeedsHold(card: { timerSeconds?: number; extraButton?: string } | null): boolean` — true when `timerSeconds > 0` or trimmed `extraButton` is non-empty
  - `export function isCardHoldActive(opts: { currentCard: { timerSeconds?: number; extraButton?: string } | null; bodyVisible: boolean; released: boolean }): boolean` — true when card needs hold, body is visible, and not released
  - `export function formatCardTimer(remainingSeconds: number): string` — `m:ss` with `remainingSeconds` clamped at 0 (e.g. `15` → `0:15`, `0` → `0:00`)
  - `isRollLocked` adds optional `cardHoldActive?: boolean` — if true, lock
  - `CardPanel` optional `onExtra?: () => void` and optional `timerLabel?: string`. When `bodyVisible` and the card has trimmed `extraButton`, show that button. When `timerLabel` is set, show `<p data-testid="card-timer">{timerLabel}</p>`
  - `GameHud`:
    - Reset `cardHoldReleased` when `visibleCard?.id` changes
    - `cardHoldActive = isCardHoldActive({ currentCard: visibleCard, bodyVisible: game.cards.bodyVisible, released: cardHoldReleased })`
    - Pass `cardHoldActive` into `isRollLocked`
    - If `visibleCard.timerSeconds > 0` and body visible and not released, start a timeout of `timerSeconds * 1000` that sets released; also tick remaining seconds every 1000ms for the label
    - Extra button sets released
    - Pass does **not** start hold (card is gone)

- [ ] **Step 1: Write the failing tests**

Create `tests/view/card-hold.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { cardNeedsHold, formatCardTimer, isCardHoldActive } from '@/lib/view/card-hold';

describe('card hold', () => {
  it('needs hold for a timer or extra button', () => {
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1' })).toBe(false);
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1', timerSeconds: 5 })).toBe(true);
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1', extraButton: 'Done' })).toBe(true);
    expect(cardNeedsHold({ title: 'A', pack: 'p', id: '1', extraButton: '  ' })).toBe(false);
  });

  it('is active only after the body is visible and before release', () => {
    const card = { title: 'A', pack: 'p', id: '1', timerSeconds: 5 };
    expect(isCardHoldActive({ currentCard: card, bodyVisible: false, released: false })).toBe(false);
    expect(isCardHoldActive({ currentCard: card, bodyVisible: true, released: false })).toBe(true);
    expect(isCardHoldActive({ currentCard: card, bodyVisible: true, released: true })).toBe(false);
  });

  it('formats remaining seconds as m:ss', () => {
    expect(formatCardTimer(15)).toBe('0:15');
    expect(formatCardTimer(0)).toBe('0:00');
    expect(formatCardTimer(75)).toBe('1:15');
  });
});
```

Append to `tests/view/turn-loop.test.ts`:

```ts
  it('locks while a card timer or extra button is still holding', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false, cardHoldActive: true })).toBe(true);
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false, cardHoldActive: false })).toBe(false);
  });
```

Append to `tests/hud/card-panel.test.tsx`:

```ts
  it('shows extra button and timer after the body is visible', () => {
    const onExtra = vi.fn();
    render(
      <CardPanel
        actionMode="neither"
        currentCard={{ id: '1', pack: 'climb', title: 'Rung', body: 'Clue', extraButton: 'Done' }}
        bodyVisible
        timerLabel="0:12"
        onExtra={onExtra}
        onDispatch={() => {}}
      />,
    );
    expect(screen.getByTestId('card-timer').textContent).toBe('0:12');
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onExtra).toHaveBeenCalled();
  });
```

Append to `tests/hud/game-hud.test.tsx` (file already uses fake timers). Add a helper bootstrap with a neither-mode timed card on the first corridor so Roll deals immediately after slide. Prefer constructing a small bootstrap from `climbSample` by patching the first packed cell / deck / `actionMode: 'neither'`. Example:

```ts
it('keeps Roll locked on a timer card until the timer elapses', () => {
  const bootstrap = {
    ...climbSample,
    rng: () => 0,
    config: { ...climbSample.config, actionMode: 'neither' as const },
    cards: {
      ...climbSample.cards,
      deck: [{ id: 't1', pack: 'climb', title: 'Timed', body: 'Wait', timerSeconds: 2 }],
    },
  };
  render(<GameHud bootstrap={bootstrap} />);
  fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
  act(() => { vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS); });
  fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
  const roll = screen.getByRole('button', { name: 'Roll dice' });
  expect(screen.getByTestId('card-timer')).toBeDefined();
  expect(roll).toHaveProperty('disabled', true);
  act(() => { vi.advanceTimersByTime(2000); });
  expect(roll).toHaveProperty('disabled', false);
});

it('unlocks Roll when the extra button is pressed', () => {
  const bootstrap = {
    ...climbSample,
    rng: () => 0,
    config: { ...climbSample.config, actionMode: 'neither' as const },
    cards: {
      ...climbSample.cards,
      deck: [{ id: 't1', pack: 'climb', title: 'Extra', body: 'Tap', extraButton: 'Done' }],
    },
  };
  render(<GameHud bootstrap={bootstrap} />);
  fireEvent.click(screen.getByRole('button', { name: 'Roll dice' }));
  act(() => { vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS); });
  fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
  const roll = screen.getByRole('button', { name: 'Roll dice' });
  expect(roll).toHaveProperty('disabled', true);
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  expect(roll).toHaveProperty('disabled', false);
});
```

If Climb’s first roll does not land on a packed cell with `rng: () => 0`, change the landing cell’s `packId` to `climb` in the bootstrap board (copy floors, set `packId` on the cell `walkSteps` would hit). Do **not** change Climb sample defaults.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/view/card-hold.test.ts tests/view/turn-loop.test.ts tests/hud/card-panel.test.tsx tests/hud/game-hud.test.tsx`
Expected: FAIL — module / lock / extra button missing.

- [ ] **Step 3: Write minimal implementation**

Implement `lib/view/card-hold.ts`. Extend `isRollLocked`. Wire `CardPanel` and `GameHud` as specified. Keep FeatureToggles and Import cards. Do not remount 3D dice.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/view/card-hold.test.ts tests/view/turn-loop.test.ts tests/hud/card-panel.test.tsx tests/hud/game-hud.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/view/card-hold.ts lib/view/turn-loop.ts components/hud/CardPanel.tsx components/hud/GameHud.tsx tests/view/card-hold.test.ts tests/view/turn-loop.test.ts tests/hud/card-panel.test.tsx tests/hud/game-hud.test.tsx
git commit -m "feat: lock Test Roll until card timer or extra button"
```

---

### Task 6: Test HUD widgets, Save persist, README

**Files:**
- Modify: `components/hud/GameHud.tsx`
- Modify: `components/library/StudioShell.tsx`
- Modify: `README.md`
- Test: `tests/hud/game-hud.test.tsx`, `tests/library/studio-shell.test.tsx`

**Interfaces:**
- Consumes: `listHudWidgets`, `preferredMovementViz`, `hudWidgetOf`
- Produces:
  - `designedHud = listHudWidgets(game.board).some((w) => w !== 'empty')`
  - `PlayerBar` renders when `!designedHud || widgets.includes('player-bar')`
  - `LastRoll` renders when `!designedHud || widgets.includes('last-roll')`
  - MovementStage and Roll always render (Test must stay playable)
  - `StudioShell` Test bootstrap config sets `movementViz: preferredMovementViz(workingBoard, snapshot?.config.movementViz ?? active.bootstrap.config.movementViz)`
  - README: Tile Actions can set HUD type; Level hold + quotas; Packs timer / extra button; Test Roll lock; publish / polar / first-person / inner maps still out

- [x] **Step 1: Write the failing tests**

Append to `tests/hud/game-hud.test.tsx`:

```ts
it('hides Last roll and Player bar when other HUD widgets are designed', () => {
  const board = {
    ...climbSample.board,
    floors: climbSample.board.floors.map((floor) => ({
      ...floor,
      cells: floor.cells.map((cell) =>
        cell.kind === 'hud' ? { ...cell, hudWidget: 'dice' as const } : cell,
      ),
    })),
  };
  render(<GameHud bootstrap={{ ...climbSample, board }} />);
  expect(screen.queryByText('No roll yet')).toBeNull();
  expect(screen.queryByText(/Climber/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
});
```

(If Climb’s player name string is different, assert `PlayerBar` absence via `data-testid="player-bar"` — add that test id to `PlayerBar` only if the name query is brittle.)

Append to `tests/library/studio-shell.test.tsx`:

```ts
it('Save persists HUD widget, level hold quotas, and card timer fields', () => {
  const storage = memoryStorage();
  renderStudio(storage, 'seed-1', '2026-09-22T20:00:00.000Z', () => 'empty-1');
  fireEvent.click(screen.getByRole('button', { name: 'New' }));
  fireEvent.click(screen.getByLabelText('Empty board'));
  fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  fireEvent.click(screen.getByRole('button', { name: 'HUD' }));
  fireEvent.click(screen.getByTestId('slot-2-2'));
  fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'spinner' } });
  fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
  fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
  fireEvent.click(screen.getByRole('button', { name: 'New card' }));
  fireEvent.change(screen.getByLabelText('Timer seconds'), { target: { value: '9' } });
  fireEvent.change(screen.getByLabelText('Extra button'), { target: { value: 'Done' } });
  fireEvent.click(screen.getByRole('tab', { name: 'Tile Actions' }));
  fireEvent.click(screen.getByLabelText('Level hold'));
  fireEvent.change(screen.getByLabelText('Quota for pack-1'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  const draft = getActive(loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' }));
  const floor = draft?.bootstrap.board.floors[0];
  expect(floor?.cells.find((c) => c.col === 2 && c.row === 2)).toMatchObject({
    kind: 'hud',
    hudWidget: 'spinner',
  });
  expect(floor?.holdEnabled).toBe(true);
  expect(floor?.holdQuotas).toEqual({ 'pack-1': 2 });
  expect(draft?.bootstrap.cards[0]).toMatchObject({
    timerSeconds: 9,
    extraButton: 'Done',
  });
});

it('Test uses spinner when a spinner HUD widget is designed', async () => {
  renderStudio();
  const hudSlot = screen.getAllByText('HUD')[0]?.parentElement;
  expect(hudSlot).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Select' }));
  const hud = document.querySelector('[data-testid^="slot-"]');
  // Click a known HUD cell on Climb (square 3 HUD is the inner 1×1 at 1,1 — Climb lobby is 8? use first HUD text button)
  fireEvent.click(screen.getAllByText('HUD')[0]!);
  fireEvent.change(screen.getByLabelText('HUD type'), { target: { value: 'spinner' } });
  fireEvent.click(screen.getByRole('button', { name: 'Test' }));
  await flushTestViewport();
  expect(screen.getByRole('button', { name: 'Spin' })).toBeDefined();
});
```

Climb’s HUD rectangle may not include `slot-2-2`. For the Save test, New empty 8×8 HUD is `col 2–5, row 2–5`, so `slot-2-2` is valid. For the spinner Test on Climb, click any existing `HUD` label as written.

If clicking the word `HUD` is flaky (multiple), select via `screen.getByTestId('slot-2-2')` on the empty-board test only, and for Climb find a HUD cell test id from the rendered grid (`slot-2-2` on Climb square-3 is HUD).

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hud/game-hud.test.tsx tests/library/studio-shell.test.tsx`
Expected: FAIL — widgets always shown; Save does not yet cover these fields in UI (fields exist after Task 4, this test fails if wiring/persist is incomplete).

- [x] **Step 3: Write minimal implementation**

Gate PlayerBar / LastRoll in `GameHud`. Apply `preferredMovementViz` in `StudioShell` Test bootstrap. Update README: HUD types, Level hold, timer/extra, persist on Save; publish / polar / first-person / inner maps still out.

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/hud/game-hud.test.tsx tests/library/studio-shell.test.tsx && npx vitest run`
Expected: PASS (full suite green)

- [x] **Step 5: Commit**

```bash
git add components/hud/GameHud.tsx components/hud/PlayerBar.tsx components/library/StudioShell.tsx README.md tests/hud/game-hud.test.tsx tests/library/studio-shell.test.tsx docs/superpowers/plans/2026-09-22-slice-9-hud-player-ui.md
git commit -m "feat: persist HUD widgets and hold quotas; Test respects designed HUD"
```

---

## Self-review

1. **Spec coverage:** HUD centre widgets (dice/spinner/last-roll/player strip) → Tasks 1–2, 6. Floor hold / pack reveal counts in Design → Task 3. Card timer + extra button + Roll lock → Tasks 4–5. Persist on Save → Task 6. Publish / polar / first-person / inner maps excluded.
2. **Placeholder scan:** No TBD / “implement later” steps. Timer fail effects (lose item) left out of scope on purpose (preferences: lock Roll only).
3. **Type consistency:** `HudWidget`, `setHudWidget`, `setFloorHold`, `cardNeedsHold`, `isCardHoldActive`, `preferredMovementViz` names match across tasks.
