# Designer Group 11 — Resize lock, vanilla layout, Board tiles, room Door

> **For agentic workers:** TDD per task. Commit after each task. No approval pauses. Cursor models only. Implement **before** Group 10 on `feat/designer-groups-10-11` (designer-blocking).

**Goal:** Size locks only after a real paint/configure. Every vanilla resize rebuilds perimeter + one inner free ring + centre HUD (HUD never touches the perimeter). Rooms fill the **entire** centre with HUD. New **Board** scenery kind + **Fill**. Canvas **Clear** after Erase. Reinstate **Door only in room interiors**. Door type is Leave/Stay vs auto-leave. Multi-tile rooms need a Door before Test.

**Architecture:** PlayCanvas-free helpers in `lib/engine/layout` and `lib/designer/*`. `CellKind` adds `board` and `door`. `createLoopedFloor` takes an interior fill (`inset-hud` for levels, `full-hud` for rooms). Vanilla `applyFloorShape` replaces the floor with a fresh template (no leftover HUD extras). Door is walkable room-start; Board is off-path scenery.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest. No new packages.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 11 + Door-in-rooms lock.

**Base:** `origin/main` `75d56fa` or newer. **Branch:** `feat/designer-groups-10-11`. Push `github HEAD:main` + origin when Groups 10 and 11 pass.

## Global Constraints

- Engine / designer / library have **zero** PlayCanvas imports
- Polar UI stays **hidden**
- Door is **not** a level palette tool — disabled on levels, enabled only while the 2D canvas shows a room
- Stair and Room tools **disabled** on a room canvas
- Do **not** implement Group 10 in this plan (viewport background / Join Game)
- Do **not** remap Start/Stair/Room across a locked resize
- Dev port **4318**
- GitHub: `mikemwp/boardgame-designer`. If github push fails, still push origin and return the SHA

## Locked answers

- Size lock: only after Start, Stair, Room, extra tile, HUD change, pack, media (or Board / Door / face / look). Vanilla reshape including square ↔ rectangle stays unlocked.
- Vanilla level: (1) perimeter corridor (2) one inner free ring all around (3) remaining centre = HUD.
- Vanilla room: perimeter walkable loop; **all** non-perimeter cells are HUD (no free ring).
- Door type: `auto-leave` or `leave-or-stay` (Tiles tab). Leave returns the token to the **level’s room tile**.
- Canvas Clear does **not** apply to Board.

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `CellKind` += `board` \| `door`; `DoorExit`; `Cell.doorExit` |
| `lib/engine/layout.ts` | `isOffPathCell` includes `board`; `createLoopedFloor(..., interior)`; `defaultRoomHudFill`; vanilla geometry helpers |
| `lib/designer/level-size.ts` | `applyFloorShape` path: vanilla → fresh template only; Board/Door count as configured |
| `lib/designer/mutate.ts` | vanilla reshape = template; `placeBoard`, `fillFreeWithBoard`, `canvasClearCell`, `attachDoor`, `setDoorExit` |
| `lib/designer/rooms.ts` | interiors use `full-hud`; Door is configured; `isVanillaRoom` matches full-hud template |
| `lib/designer/tile-chrome.ts` | Board + Door colors and labels |
| `lib/designer/validate.ts` | `missing-room-door` |
| `lib/engine/game.ts` / `events.ts` | door entrance; auto-leave vs Leave/Stay; `STAY_ROOM`; `awaitingDoorExit` |
| `components/designer/DesignerPalette.tsx` | Board, Door, Fill, Clear; disable Stair/Room on rooms; Door only on rooms |
| `components/designer/LayoutDesigner.tsx` | wire tools + Fill/Clear + door |
| `components/designer/LayoutGrid.tsx` | Board + Door fills |
| `components/designer/CellInspector.tsx` | Door type select |
| `components/hud/RoomPrompt.tsx` | Leave / Stay |
| `README.md` | Board, Fill, Clear, Door-in-rooms, vanilla ring |
| Tests listed per task | Fail first, then implement |

**Out:** Group 10 Start background / Join Game. Django/WebSocket. Polar unhide.

---

### Task 1: Vanilla level geometry + reshape does not lock

**Files:**
- Modify: `lib/engine/layout.ts`, `lib/designer/mutate.ts`, `lib/designer/level-size.ts`
- Test: `tests/engine/layout.test.ts`, `tests/designer/level-size.test.ts`, `tests/designer/mutate.test.ts`

Vanilla reshape must **replace** the floor with `createLoopedFloor` (no leftover HUD extras from the old size). That is why 8×8 → 11×11 → 12×12 → rectangle currently locks: remapped extras fail `isVanillaFloor`.

```ts
export type LoopInterior = 'inset-hud' | 'full-hud'

export function createLoopedFloor(
  id: string,
  label: string,
  index: number,
  shapeInput?: BoardShape,
  interior?: LoopInterior, // default 'inset-hud'
): Floor

export function hudTouchesPerimeter(floor: Floor): boolean
export function hasInnerFreeRing(floor: Floor): boolean
```

- [ ] **Step 1: Write the failing tests**

```ts
it('keeps a vanilla floor unlocked after square↔rectangle reshapes with no paint', () => {
  let board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
  board = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 11 });
  board = applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 12 });
  board = applyFloorShape(board, 'ground', { kind: 'rectangle', length: 8, width: 6 });
  expect(isVanillaFloor(board.floors[0]!)).toBe(true);
  expect(applyFloorShape(board, 'ground', { kind: 'square', tilesPerSide: 8 })).not.toBe(board);
});

it('rebuilds 8×6 with a free ring all around and HUD never on the perimeter', () => {
  const board = applyFloorShape(
    createBoard([createLoopedFloor('ground', 'Level 1', 0, { kind: 'square', tilesPerSide: 12 })], []),
    'ground',
    { kind: 'rectangle', length: 8, width: 6 },
  );
  const floor = board.floors[0]!;
  expect(floor.columns).toBe(8);
  expect(floor.rows).toBe(6);
  const hud = floor.cells.filter((c) => c.kind === 'hud');
  expect(hud.length).toBeGreaterThan(0);
  for (const cell of hud) {
    expect(cell.col === 0 || cell.row === 0 || cell.col === 7 || cell.row === 5).toBe(false);
  }
  // free cells exist on every inner side (row 1, row 4, col 1, col 6)
  const occupied = new Set(floor.cells.map((c) => `${c.col},${c.row}`));
  expect(occupied.has('1,1')).toBe(false);
  expect(occupied.has('6,1')).toBe(false);
  expect(occupied.has('1,4')).toBe(false);
  expect(occupied.has('6,4')).toBe(false);
});
```

- [ ] **Step 2: Run tests — expect FAIL** (reshape leftovers lock / HUD on edge)
- [ ] **Step 3: Implement** — `applyFloorShape` when vanilla: `createLoopedFloor(...)` only. Keep `isVanillaFloor` positional compare.
- [ ] **Step 4: Tests PASS**
- [ ] **Step 5: Commit** `fix(designer): keep vanilla reshape unlocked and rebuild HUD ring`

---

### Task 2: Room centre is all HUD

**Files:**
- Modify: `lib/engine/layout.ts`, `lib/designer/rooms.ts`
- Test: `tests/designer/rooms.test.ts`

```ts
it('fills every non-perimeter cell with HUD on a 4×4 room', () => {
  let board = attachRoom(groundBoard(), 'ground', 'ground-c3');
  board = setRoomMode(board, board.rooms![0]!.id, 'multi');
  board = applyRoomShape(board, board.rooms![0]!.id, { kind: 'square', tilesPerSide: 4 });
  const cells = board.rooms![0]!.cells!;
  const hud = cells.filter((c) => c.kind === 'hud');
  expect(hud).toHaveLength(4);
  expect(hud.every((c) => c.col !== 0 && c.row !== 0 && c.col !== 3 && c.row !== 3)).toBe(true);
  expect(isVanillaRoom(board.rooms![0]!)).toBe(true);
});
```

`setRoomMode` / `applyRoomShape` / `resetRoom` / `roomAsFloor` call `createLoopedFloor(..., 'full-hud')`.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): fill room interiors with centre HUD`

---

### Task 3: Board kind, Fill, canvas Clear

**Files:**
- Modify: `lib/engine/types.ts`, `lib/engine/layout.ts` (`isOffPathCell`), `lib/designer/mutate.ts`, `lib/designer/tile-chrome.ts`, `lib/designer/level-size.ts`
- Test: `tests/designer/mutate.test.ts`, `tests/designer/tile-chrome.test.ts`

```ts
export function placeBoard(board, floorId, col, row, cellId): Board
export function fillFreeWithBoard(board, floorId): Board
export function canvasClearCell(board, floorId, cellId): Board
```

- Board: not playable, not HUD, distinct 2D/preview color (e.g. warm stone `#b45309` / `#78716c`).
- Fill: every **empty** in-bounds slot becomes `board`.
- Canvas Clear: HUD or corridor → erase (Free); Stair or Room → corridor via `clearCell`; Board unchanged; Door → corridor.

Painting Board or Fill locks size (`isVanillaFloor` false).

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): add Board tiles, Fill, and canvas Clear`

---

### Task 4: Door only in rooms + door type + Test gate

**Files:**
- Modify: types, `mutate.ts`, `rooms.ts`, `validate.ts`, `game.ts`, `events.ts`
- Test: `tests/designer/rooms.test.ts`, `tests/designer/validate.test.ts`, `tests/engine/game.test.ts`

```ts
export type DoorExit = 'auto-leave' | 'leave-or-stay'
export function attachDoor(board, floorId, cellId): Board
export function setDoorExit(board, floorId, cellId, exit: DoorExit): Board
```

- `attachDoor` converts a room-interior **corridor** to `door` (one door: previous door returns to corridor). Default `doorExit: 'leave-or-stay'`.
- `roomEntrance` prefers `kind === 'door'`.
- Landing on the door **again** while `insideRoom`: `auto-leave` clears `insideRoom`; `leave-or-stay` sets `awaitingDoorExit`. `LEAVE_ROOM` always returns to the host room tile. `STAY_ROOM` dismisses the prompt.
- `validateLayout`: multi-tile room without a door → `missing-room-door`.
- Reverse `placeDoor is not exported` in `rooms.test.ts`.

- [ ] Fail, implement, pass
- [ ] Commit `feat(engine): reinstate room Door with leave modes`

---

### Task 5: Palette + inspector + canvas chrome

**Files:**
- Modify: `DesignerPalette.tsx`, `LayoutDesigner.tsx`, `LayoutGrid.tsx`, `CellInspector.tsx`, `RoomPrompt.tsx`
- Test: `tests/designer/designer-palette.test.tsx`, `tests/designer/layout-designer.test.tsx`, `tests/designer/cell-inspector.test.tsx`, `tests/hud/room-prompt.test.tsx` (create if needed)

Palette order: **Select, Tile, HUD, Board, Stair, Room, Door, Fill, Erase, Clear**.

Props: `viewingRoom?: boolean`. Stair + Room `disabled` when `viewingRoom`. Door `disabled` when not `viewingRoom`. Fill and Clear are actions (not sticky tools).

Inspector: on `kind === 'door'`, show **Door type** (`Leave / Stay` | `Auto-leave`).

RoomPrompt: when `awaitingDoorExit`, **Leave** and **Stay**.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): Board/Door/Fill/Clear chrome and door type`

---

### Task 6: README

Document vanilla ring, size-lock rule, Board + Fill, canvas Clear, Door-in-rooms, Test requires a room Door.

- [ ] Commit `docs: Group 11 board resize and room Door`
