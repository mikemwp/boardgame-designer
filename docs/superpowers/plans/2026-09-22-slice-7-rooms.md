# Slice 7 — Rooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per task. Commit after each task. Cursor models only. No approval pauses.

**Goal:** Let the studio place **card-only rooms** on inner/free squares, mark a **minimal door** on the corridor so the room is enterable, validate door/room topology for Test, deal the room pack when landing on that door, and persist rooms/doors with Save.

**Architecture:** Rooms are off-path cells (`kind: 'room'`), like HUD extras — they do **not** join the corridor loop walk. A door is a **converted corridor cell** (`kind: 'door'`) that stays on the loop and must be 4-adjacent to a room. Landing on the door deals the adjacent room’s `packId` and the token **stays on the door** (spec card-only snap-back; simplest rule consistent with index-order `walkSteps`). No inner maps, no first-person, no room-only floors.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, existing shadcn/ui, Vitest, existing engine + library + HUD + designer. No new npm packages. No PlayCanvas imports in engine / designer / library.

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md` (Rooms — card-only this slice)  
**Slice 5 (done):** rooms/doors deferred; “next designer slice can add card-only rooms with a minimal door”  
**Slice 6 (done, GitHub / origin `main` `27b0e09`):** packs + Tile Actions; this plan does **not** start publish or HUD tile types.

**Base branch:** Implement from **origin/main** (`27b0e09` or newer if github/main has it). Branch **`feat/slice-7-rooms`**. Do **not** implement publish, HUD tile-type designer, timer cards, polar UI, first-person, or inner maps.

## Global Constraints

- Engine is a small set of repeating mechanics; **Game JSON + the designer** own the rules
- **PlayCanvas React** is the **3D board view only**; engine, library, and designer mutations have **zero** PlayCanvas imports
- Rooms are **card-only** (pack on the room). No inner maps / item squares / first-person
- Door is **minimal**: convert a corridor tile that touches a room. Not a separate off-path cell
- **Every floor still loops.** Rooms must not break `orderCellsAlongLoop`
- Stair squares **never** hold packs. Door squares do **not** hold a pack this slice — the room does
- **Save draft** is allowed even if rooms/doors/stairs/loops are invalid for Test
- **Test** always uses the **current draft**
- Polar board-shape UI stays **hidden**
- Dev server stays on uncommon port **4318**
- Do **not** rename `ROLL_DICE`. Do **not** add a Publish button

## Slice scope

**In this plan:** `room` + `door` cell kinds; Room / Door palette tools; room on inner/free squares; door converts an adjacent corridor; End room via existing End tile; validation `room-without-door` + `door-not-connecting`; landing on door deals the room pack; 3D + grid paint; Save persists kinds/pack/end.

**Out of this plan:** publish button / live slug, HUD tile-type designer, timer cards, extra card buttons, polar UI, first-person, inner maps, resizable multi-cell rooms, room-only floors, end-floor non-loop paths, door locks, media/backgrounds, buyable packs.

**Locked engine rule:** rooms are **not walkable**. Movement stays on the corridor/door/stair loop. Landing on a door deals the adjacent room’s pack like a packed corridor. Token does not enter the room cell.

---

## File Map

| Path | Slice 7 change |
|------|----------------|
| `lib/engine/types.ts` | `CellKind` += `'room' \| 'door'` |
| `lib/engine/layout.ts` | Off-path helper; `loopCells` / `retileFloor` keep rooms; `landingPackId`, adjacency helpers |
| `lib/engine/movement.ts` | `walkableCells` excludes rooms (same as HUD) |
| `lib/engine/game.ts` | `afterMove` uses `landingPackId` |
| `lib/designer/mutate.ts` | `placeRoom`, `placeDoor`, `clearDoor`; pack on room not door/stair; preserve rooms on retile/reshape |
| `lib/designer/validate.ts` | `room-without-door`, `door-not-connecting` |
| `components/designer/DesignerPalette.tsx` | Room + Door tools |
| `components/designer/LayoutGrid.tsx` | Room / Door colors + labels |
| `components/designer/CellInspector.tsx` | Room / Door copy; End room; pack on room |
| `components/designer/LayoutDesigner.tsx` | Wire Room / Door tools |
| `components/board/FloorStack.tsx` | Distinct room / door materials |
| `README.md` | Rooms + doors; publish / HUD types / polar / FP still out |
| `tests/engine/types.test.ts` | Room + door kinds |
| `tests/engine/layout.test.ts` | Rooms survive retile; `landingPackId` |
| `tests/engine/movement.test.ts` | Walk skips rooms; door stays on path |
| `tests/engine/game.test.ts` | Land on door deals room pack |
| `tests/designer/mutate.test.ts` | placeRoom / placeDoor |
| `tests/designer/validate.test.ts` | New issue codes |
| `tests/designer/designer-palette.test.tsx` | Room / Door buttons |
| `tests/designer/layout-grid.test.tsx` | Room / Door labels |
| `tests/designer/cell-inspector.test.tsx` | End room + room pack |
| `tests/designer/layout-designer.test.tsx` | Place room then door |
| `tests/library/studio-shell.test.tsx` | Save room + door + pack |

Do not add `app/play/[slug]`, Publish button, HUD slot-type editor, timer-card UI, polar shape pickers, or inner-map cells.

---

### Task 1: Cell kinds + off-path loop

**Files:**
- Modify: `lib/engine/types.ts`, `lib/engine/layout.ts`, `lib/engine/movement.ts`
- Test: `tests/engine/types.test.ts`, `tests/engine/layout.test.ts`, `tests/engine/movement.test.ts`

**Interfaces:**

```ts
export type CellKind = 'corridor' | 'stair' | 'hud' | 'room' | 'door';

export function isOffPathCell(cell: { kind?: string }): boolean {
  return cell.kind === 'hud' || cell.kind === 'room';
}

export function adjacentCells(floor: Floor, cell: Cell): Cell[]

export function landingPackId(floor: Floor, cell: Cell): string | undefined
```

- `loopCells(floor)` = cells where `!isOffPathCell` (corridor, stair, **door**)
- `retileFloor` keeps **HUD and room** extras after the ordered loop (today it only keeps HUD — rooms would be dropped)
- `walkableCells` excludes HUD **and** room (door stays walkable)
- `landingPackId`: stair → `undefined`; door → adjacent `kind === 'room'` `packId`; else `cell.packId`

- [ ] **Step 1: Write the failing tests**

Add to `tests/engine/types.test.ts`:

```ts
  it('allows card-only room and door cells', () => {
    const room: Cell = { id: 'r1', index: 8, kind: 'room', packId: 'notes', col: 1, row: 1 };
    const door: Cell = { id: 'd1', index: 1, kind: 'door', col: 1, row: 0 };
    expect(room.kind).toBe('room');
    expect(door.kind).toBe('door');
    expect(room.packId).toBe('notes');
  });
```

Add to `tests/engine/layout.test.ts`:

```ts
describe('rooms stay off the corridor loop', () => {
  it('does not drop a room when retileFloor / ensureBoardLayout runs', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const withRoom = {
      ...floor,
      cells: [
        ...floor.cells,
        { id: 'ground-room', index: 99, kind: 'room' as const, col: 1, row: 1, packId: 'notes' },
      ],
    };
    const board = ensureBoardLayout(createBoard([withRoom], []));
    const room = board.floors[0]?.cells.find((c) => c.id === 'ground-room');
    expect(room).toMatchObject({ kind: 'room', col: 1, row: 1, packId: 'notes' });
    expect(loopCells(board.floors[0]!).every((c) => c.kind !== 'room')).toBe(true);
    expect(orderCellsAlongLoop(loopCells(board.floors[0]!))).not.toBeNull();
  });

  it('landingPackId uses the adjacent room pack on a door', () => {
    const floor = createLoopedFloor('ground', 'Ground', 0);
    const corridor = floor.cells.find((c) => c.col === 1 && c.row === 0)!;
    const room = { id: 'ground-room', index: 99, kind: 'room' as const, col: 1, row: 1, packId: 'notes' };
    const door = { ...corridor, kind: 'door' as const };
    const next = {
      ...floor,
      cells: floor.cells.map((c) => (c.id === corridor.id ? door : c)).concat(room),
    };
    expect(landingPackId(next, door)).toBe('notes');
    expect(landingPackId(next, corridor)).toBeUndefined();
  });
});
```

Add to `tests/engine/movement.test.ts`:

```ts
  it('walks doors on the loop and skips room cells', () => {
    const floor = {
      id: 'lobby',
      index: 0,
      label: 'Lobby',
      cells: [
        { id: 'l0', index: 0, kind: 'corridor' as const },
        { id: 'l1', index: 1, kind: 'door' as const },
        { id: 'l2', index: 2, kind: 'corridor' as const },
        { id: 'room', index: 3, kind: 'room' as const, packId: 'notes' },
      ],
    };
    expect(walkSteps(floor, 'l0', 1)?.id).toBe('l1');
    expect(walkSteps(floor, 'l0', 2)?.id).toBe('l2');
    expect(walkSteps(floor, 'l0', 3)?.id).toBe('l0');
    expect(walkableCells(floor).map((c) => c.id)).toEqual(['l0', 'l1', 'l2']);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/engine/types.test.ts tests/engine/layout.test.ts tests/engine/movement.test.ts`

Expected: FAIL — `'room'` not assignable and/or room dropped / `landingPackId` missing / walk visits room.

- [ ] **Step 3: Minimal implementation**

Update `CellKind`. Export `isOffPathCell`, `adjacentCells`, `landingPackId`. Change `loopCells` and `retileFloor`. Change `walkableCells` to exclude rooms.

- [ ] **Step 4: Pass tests**

Run: `npm test tests/engine/types.test.ts tests/engine/layout.test.ts tests/engine/movement.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/engine/types.ts lib/engine/layout.ts lib/engine/movement.ts \
  tests/engine/types.test.ts tests/engine/layout.test.ts tests/engine/movement.test.ts
git commit -m "feat(engine): room cells stay off the corridor walk"
```

---

### Task 2: placeRoom / placeDoor mutations

**Files:**
- Modify: `lib/designer/mutate.ts`
- Test: `tests/designer/mutate.test.ts`

**Interfaces:**

- `placeRoom(board, floorId, col, row, cellId)` — empty in-bounds square only. `kind: 'room'`. No-op if occupied or out of bounds. Not required on the perimeter.
- `placeDoor(board, floorId, cellId)` — cell must be `kind: 'corridor'` and 4-adjacent to a `kind: 'room'`. Sets `kind: 'door'`. No-op on stair, room, hud, door, or corridor with no adjacent room.
- `clearDoor(board, floorId, cellId)` — door → corridor. No-op otherwise.
- `setCellPack` — allow room; **reject** stair **and** door (pack lives on the room).
- `attachStair` — reject room and door (and existing stair).
- `designerProps` / reshape extras already keep interior non-perimeter cells; rooms must survive `mapFloor` → `retileFloor` (Task 1).
- `applyFloorShape` extras: keep `kind: 'room'` interiors (already keeps non-perimeter extras if retile preserves them).

- [ ] **Step 1: Failing tests** in `tests/designer/mutate.test.ts`:

```ts
describe('placeRoom and placeDoor', () => {
  it('places a room on an inner square and converts an adjacent corridor to a door', () => {
    const placed = placeRoom(groundBoard(), 'ground', 1, 1, 'ground-room');
    const room = placed.floors[0]?.cells.find((c) => c.id === 'ground-room');
    expect(room).toMatchObject({ kind: 'room', col: 1, row: 1 });
    expect(placeRoom(placed, 'ground', 1, 1, 'ground-room-2')).toEqual(placed);

    const neighbor = placed.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    const withDoor = placeDoor(placed, 'ground', neighbor.id);
    expect(withDoor.floors[0]?.cells.find((c) => c.id === neighbor.id)?.kind).toBe('door');
    expect(placeDoor(placed, 'ground', 'ground-c0').floors[0]?.cells.find((c) => c.id === 'ground-c0')?.kind).not.toBe('door');

    const cleared = clearDoor(withDoor, 'ground', neighbor.id);
    expect(cleared.floors[0]?.cells.find((c) => c.id === neighbor.id)?.kind).toBe('corridor');
  });

  it('assigns a pack on a room and refuses a pack on a door', () => {
    let board = placeRoom(groundBoard(), 'ground', 1, 1, 'ground-room');
    const neighbor = board.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    board = placeDoor(board, 'ground', neighbor.id);
    board = setCellPack(board, 'ground', 'ground-room', 'notes');
    expect(board.floors[0]?.cells.find((c) => c.id === 'ground-room')?.packId).toBe('notes');
    const refused = setCellPack(board, 'ground', neighbor.id, 'notes');
    expect(refused.floors[0]?.cells.find((c) => c.id === neighbor.id)?.packId).toBeUndefined();
  });
});
```

- [ ] **Step 2–4:** Fail, implement, pass. `npm test tests/designer/mutate.test.ts`
- [ ] **Step 5: Commit**

```bash
git add lib/designer/mutate.ts tests/designer/mutate.test.ts
git commit -m "feat(designer): place card-only rooms and corridor doors"
```

---

### Task 3: Validation — room needs a door; door must connect

**Files:**
- Modify: `lib/designer/validate.ts`
- Test: `tests/designer/validate.test.ts`

**Issue codes:**

```ts
| 'room-without-door'
| 'door-not-connecting'
```

Copy:

- `{floor.label}: room needs a door.`
- `{floor.label}: door must connect a corridor to a room.`

Rules:

- A **room** is invalid unless 4-adjacent to at least one `kind: 'door'`
- A **door** is invalid unless 4-adjacent to at least one `kind: 'room'` **and** 4-adjacent to at least one path cell (`corridor` | `stair` | other `door`)
- A room on an inner square with a valid door **does not** emit `non-loop`
- An extra **corridor** on an inner square still emits `non-loop` (existing test)
- Save is unaffected (`canTestPlay` false only)

- [ ] **Step 1: Failing tests**

```ts
  it('blocks a room without a door and a door that does not touch a room', () => {
    const lonely = placeRoom(createBoard([createLoopedFloor('ground', 'Ground', 0)], []), 'ground', 1, 1, 'ground-room');
    const start = setStartCell(lonely, 'ground', 'ground-c0');
    expect(validateLayout(start).some((i) => i.code === 'room-without-door')).toBe(true);
    expect(validateLayout(start).find((i) => i.code === 'room-without-door')?.message).toBe(
      'Ground: room needs a door.',
    );
    expect(validateLayout(start).some((i) => i.code === 'non-loop')).toBe(false);

    const neighbor = start.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    const connected = placeDoor(start, 'ground', neighbor.id);
    expect(validateLayout(connected).filter((i) => i.code === 'room-without-door' || i.code === 'door-not-connecting')).toEqual([]);

    const orphanDoor = createBoard(
      [{
        ...createLoopedFloor('ground', 'Ground', 0),
        cells: createLoopedFloor('ground', 'Ground', 0).cells.map((c, i) =>
          i === 1 ? { ...c, kind: 'door' as const } : c,
        ),
      }],
      [],
    );
    const orphanStarted = setStartCell(orphanDoor, 'ground', 'ground-c0');
    expect(validateLayout(orphanStarted).some((i) => i.code === 'door-not-connecting')).toBe(true);
    expect(validateLayout(orphanStarted).find((i) => i.code === 'door-not-connecting')?.message).toBe(
      'Ground: door must connect a corridor to a room.',
    );
  });
```

- [ ] **Step 2–4:** Fail, implement in `validateLayout` after the existing per-cell stair checks, pass. `npm test tests/designer/validate.test.ts`
- [ ] **Step 5: Commit**

```bash
git add lib/designer/validate.ts tests/designer/validate.test.ts
git commit -m "feat(designer): reject rooms without doors and unconnected doors"
```

---

### Task 4: Movement deals the room pack on the door

**Files:**
- Modify: `lib/engine/game.ts`
- Test: `tests/engine/game.test.ts`

**Behavior:** `afterMove` already deals `cell.packId` on non-stair landings. Switch that to `landingPackId(floor, cell)` so a door with no own pack still deals the adjacent room pack. Token stays on the door. Crossing a door without stopping does nothing (existing land-to-resolve).

- [ ] **Step 1: Failing test**

```ts
  it('deals the room pack when landing on the door and stays on the door', () => {
    const bootstrap: GameBootstrap = {
      board: createBoard(
        [{
          id: 'lobby',
          index: 0,
          label: 'Lobby',
          cells: [
            { id: 'l0', index: 0, kind: 'corridor', col: 0, row: 0 },
            { id: 'l1', index: 1, kind: 'door', col: 1, row: 0 },
            { id: 'l2', index: 2, kind: 'corridor', col: 2, row: 0 },
            { id: 'room', index: 3, kind: 'room', col: 1, row: 1, packId: 'notes' },
          ],
        }],
        [],
      ),
      players: createPlayerState([
        { id: 'p1', name: 'A', token: { floorId: 'lobby', cellId: 'l0' } },
      ]),
      cards: createCardState([{ id: 'n1', pack: 'notes', title: 'Clue' }]),
      config: { ...defaultGameConfig(), diceEnabled: true, actionMode: 'neither' },
    };
    const next = dispatch(createGame(bootstrap, { rng: () => 0 }), { type: 'ROLL_DICE' });
    expect(next.lastRoll?.value).toBe(1);
    expect(next.players.players[0]?.token).toEqual({ floorId: 'lobby', cellId: 'l1' });
    expect(next.cards.currentCard?.id).toBe('n1');
    expect(next.lastEvent?.type).toBe('CARD_DEALT');
  });
```

Reuse existing `createGame` / `dispatch` imports in that file. If `rng: () => 0` does not yield 1 on this board, match the existing “content landing” test’s RNG pattern (`() => 0` → value 1 on 1d6).

- [ ] **Step 2–4:** Fail, change `afterMove` to `landingPackId`, pass. Keep stair branch unchanged. `npm test tests/engine/game.test.ts`
- [ ] **Step 5: Commit**

```bash
git add lib/engine/game.ts tests/engine/game.test.ts
git commit -m "feat(engine): deal room pack when landing on its door"
```

---

### Task 5: Designer palette, grid, inspector, 3D

**Files:**
- Modify: `DesignerPalette.tsx`, `LayoutGrid.tsx`, `CellInspector.tsx`, `LayoutDesigner.tsx`, `FloorStack.tsx`
- Test: `designer-palette.test.tsx`, `layout-grid.test.tsx`, `cell-inspector.test.tsx`, `layout-designer.test.tsx`

**UI (real copy):**

- Palette buttons **Room** and **Door** (`DesignerTool` += `'room' | 'door'`). Order: Select, Tile, Room, Door, HUD, Stair, Erase.
- Grid: Room = teal (`bg-teal-800 border-teal-400`), label `Room`; Door = indigo (`bg-indigo-800 border-indigo-400`), label `Door`. Polar path fill: room `#0f766e`, door `#4338ca` (polar UI stays hidden; still paint if present).
- Inspector:
  - Room: heading **Room**; pack select (same as corridor); **no** Make stair; End button **End room**
  - Door: heading **Door**; copy **Landing here deals the adjacent room's pack.**; **Convert to tile** (`onClearDoor`); no pack; no Make stair
  - Corridor End button stays **End tile**
- `LayoutDesigner`:
  - Room tool on empty cartesian slot → `placeRoom`
  - Door tool on existing corridor → `placeDoor`
  - `onClearDoor` → `clearDoor`
  - Polar Room/Door: no-op place (select only) — polar UI hidden
- `FloorStack`: room material `#14b8a6` / door `#818cf8` (not stair amber, not corridor slate)

- [ ] **Step 1: Failing tests**

Palette: include `'Room'` and `'Door'` in the visible-names list.

Grid: render a floor that includes a room at (1,1) and a door; `getByText('Room')` / `getByText('Door')`.

Inspector: room cell → **End room**, pack select works; door cell → the landing copy, no Pack label.

LayoutDesigner:

```ts
  it('places a room then a door from the palette tools', () => {
    const onBoardChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    const { rerender } = render(
      <LayoutDesigner
        board={board}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={null}
        tool="room"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId('slot-1-1'));
    expect(onBoardChange).toHaveBeenCalled();
    const afterRoom = onBoardChange.mock.calls[0][0] as Board;
    expect(afterRoom.floors[0]?.cells.some((c) => c.kind === 'room' && c.col === 1 && c.row === 1)).toBe(true);

    const neighbor = afterRoom.floors[0]!.cells.find((c) => c.col === 1 && c.row === 0)!;
    rerender(
      <LayoutDesigner
        board={afterRoom}
        cards={[]}
        selectedFloorId="ground"
        selectedCellId={neighbor.id}
        tool="door"
        issues={[]}
        onBoardChange={onBoardChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId(`slot-${neighbor.col}-${neighbor.row}`));
    const afterDoor = onBoardChange.mock.calls.at(-1)![0] as Board;
    expect(afterDoor.floors[0]?.cells.find((c) => c.id === neighbor.id)?.kind).toBe('door');
  });
```

- [ ] **Step 2–4:** Fail, implement, pass those four test files.
- [ ] **Step 5: Commit**

```bash
git add components/designer/DesignerPalette.tsx components/designer/LayoutGrid.tsx \
  components/designer/CellInspector.tsx components/designer/LayoutDesigner.tsx \
  components/board/FloorStack.tsx \
  tests/designer/designer-palette.test.tsx tests/designer/layout-grid.test.tsx \
  tests/designer/cell-inspector.test.tsx tests/designer/layout-designer.test.tsx
git commit -m "feat(designer): Room and Door tools with card-only Tile Actions"
```

---

### Task 6: Save persist + README + suite

**Files:**
- Test: `tests/library/studio-shell.test.tsx`
- Modify: `README.md`
- Plan: `docs/superpowers/plans/2026-09-22-slice-7-rooms.md`

Board JSON already stores `kind` / `packId` / `end`. No bootstrap schema change. Studio Save already writes `workingBoard`.

- [ ] **Step 1: Failing studio test**

```ts
  it('Save persists a room, door, pack, and end-room on an empty board', () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-22T19:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('button', { name: 'Room' }));
    fireEvent.click(screen.getByTestId('slot-1-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Door' }));
    fireEvent.click(screen.getByTestId('slot-1-0'));
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Tile Actions' }));
    fireEvent.click(screen.getByTestId('slot-1-1'));
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'pack-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'End room' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    const floor = getActive(reloaded)?.bootstrap.board.floors[0];
    expect(floor?.cells.find((c) => c.col === 1 && c.row === 1)).toMatchObject({
      kind: 'room',
      packId: 'pack-1',
      end: true,
    });
    expect(floor?.cells.find((c) => c.col === 1 && c.row === 0)?.kind).toBe('door');
  });
```

Default empty board is square 8 — `slot-1-0` is the corridor north of (1,1). If the ring uses a different cell at (1,0), assert via the neighbor the same way Task 2 does.

README: replace “Rooms, inner maps, doors…” with how to place Room + Door, attach a pack on the room, End room, Save, Test blockers. Keep publish / HUD types / timer / polar / first-person / inner maps **out**.

- [ ] **Step 2–4:** Pass `npm test tests/library/studio-shell.test.tsx` then `npm test`
- [ ] **Step 5: Commit**

```bash
git add tests/library/studio-shell.test.tsx README.md docs/superpowers/plans/2026-09-22-slice-7-rooms.md
git commit -m "docs: describe card-only rooms and persist them on Save"
```

---

## Self-Review

### Spec coverage (slice 7 only)

| Requirement | Task(s) |
|-------------|---------|
| Room tile on inner/free squares | 2, 5 |
| Minimal door from corridor to room | 2, 5 |
| End-room via existing End tile | 5 (`End room`) |
| Card-only (pack on room) | 2, 4, 5 |
| Room without door invalid | 3 |
| Door must connect corridor to room | 3 |
| Land/enter deals pack; token stays on door | 1, 4 |
| Persist with Save | 6 (existing board JSON) |
| No publish / HUD types / polar / FP / inner maps | **out** |

### Placeholder scan

No TBD / implement-later / similar-to-Task-N. Door is a corridor conversion, not a new off-path square.

### Type consistency

Stable names: `isOffPathCell`, `adjacentCells`, `landingPackId`, `placeRoom`, `placeDoor`, `clearDoor`. Issue codes `room-without-door`, `door-not-connecting`. Buttons **Room**, **Door**, **End room**, **Convert to tile**. Copy **Landing here deals the adjacent room's pack.** / **Ground: room needs a door.** / **Ground: door must connect a corridor to a room.**

### Known implementer pitfalls

- Implement from **origin/main `27b0e09`+**. Branch `feat/slice-7-rooms`.
- **`retileFloor` must keep rooms** or every mutation deletes them.
- Do not put rooms in `loopCells` / `walkableCells` or Test will fail `non-loop` and movement will visit the room.
- Do not add a Publish button, HUD slot-type editor, or polar picker “while you are here.”
- `setCellPack` must refuse doors so Tile Actions cannot hide the pack on the door instead of the room.
- After this slice is on `origin/main` (and `github HEAD:main` if that remote exists), **STOP**. Do not start Slice 8 publish.

---

## Execution

1. Worktree / branch `feat/slice-7-rooms` from origin/main (`27b0e09`+).
2. TDD each task; commit as you go. Cursor models only. No approval pauses.
3. Push `origin` (`feat/slice-7-rooms` and update `main`) and `git push github HEAD:main`.
4. Return SHA + this plan path. Do not start publish / HUD types.
