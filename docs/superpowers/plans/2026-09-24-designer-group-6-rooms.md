# Designer Group 6 — Stair-like rooms, no door tile

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. TDD per task. Commit after each task.

**Goal:** Remove the **Door** tool. **Room** converts a standard corridor tile (same gesture as Stair). The host tile stays on the loop. Single-tile rooms show media on **Enter**. Multi-tile rooms get their own Shape/Tiles (square ≤4×4, rectangle ≤5×4) edited on the 2D canvas when a **Room N** button in the middle bottom row is selected. Level button restores the level canvas. Landing offers **Enter** or **Pass** (Pass stays on the corridor; next roll continues the loop). Size lock / Reset / Delete from Group 7 apply to multi-tile rooms.

**Architecture:** `Board.rooms: RoomDef[]`. Host cell `kind: 'room'` + `roomId` (like `stairId`). Interiors are cells on the `RoomDef`, shown as a synthetic `Floor` in `LayoutGrid`. Engine: land on host → `awaitingRoom` Enter/Pass; Enter single plays host media; Enter multi sets `insideRoom` and walks that loop until **Leave** on the entrance cell. 3D Test swaps to a synthetic floor while inside. Slice 7 inner-square rooms + door cells **migrate**: doors → corridor; off-path `kind:'room'` extras are dropped on load (`normalizeBoardRooms`).

**Tech Stack:** Next.js 16, TypeScript, Tailwind, shadcn, Vitest.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Groups 6 + 7 (room parts)

**Base:** `origin/main` **after Groups 7 and 5**. **Branch:** `feat/designer-group-6-rooms`. Cursor models only. TDD. No approval pauses. Push `github HEAD:main` + origin when tests pass.

## Global Constraints

- Zero PlayCanvas in engine / designer / library
- Polar room shapes **hidden**
- First-person **out**
- Do not implement spinner effects
- HUD tiles unchanged
- Save allowed with dangling stairs / empty rooms
- Test still blocked on invalid stairs; add blockers for multi-tile room with no interior loop if you cannot walk it
- Dev port **4318**
- GitHub: `mikemwp/boardgame-designer`. If github push fails, push origin and return the SHA

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `RoomMode`, `RoomDef`; `Cell.roomId?`; drop `door` from *new* designer writes; `Board.rooms` |
| `lib/engine/board.ts` | `rooms?: RoomDef[]` on `Board` |
| `lib/engine/layout.ts` | Rooms on the **loop** (not off-path). Remove door landing-pack. `isOffPathCell` = HUD only |
| `lib/engine/movement.ts` / `game.ts` | `awaitingRoom`, `insideRoom`; ENTER_ROOM / PASS_ROOM / LEAVE_ROOM |
| `lib/designer/rooms.ts` | **Create.** attach/clear, single vs multi, interior loop, reset/delete, vanilla, next name |
| `lib/designer/level-size.ts` | `isVanillaRoom`, `resetRoom` (same rules as floors) |
| `lib/designer/mutate.ts` | `attachRoom` like `attachStair`; delete `placeRoom` (empty square) + `placeDoor`; `clearDoor` unused |
| `lib/designer/validate.ts` | Drop `room-without-door` / `door-not-connecting`. Room on loop is valid. |
| `lib/library/bootstrap.ts` | Persist `board.rooms`; normalize old doors |
| `components/designer/DesignerPalette.tsx` | Remove Door |
| `components/designer/RoomTabs.tsx` | **Create.** Middle bottom row |
| `components/designer/BoardShapeFields.tsx` | Optional `maxSquare` / `maxRect` for rooms (4 / 5×4) |
| `components/designer/LayoutDesigner.tsx` | Canvas target = level or room; Shape binds to that target |
| `components/designer/CellInspector.tsx` | Room mode single/multi; no Door inspector |
| `components/hud/RoomPrompt.tsx` | Enter / Pass / Leave |
| `components/hud/GameHud.tsx` | Wire prompt; lock Roll while awaiting |
| `README.md` | New room model |
| Tests per task | Fail first |

**Out:** first-person, polar rooms, item consume, direction turn, inner-square rooms as a kept feature.

---

## Model

```ts
export type RoomMode = 'single' | 'multi';

export interface RoomDef {
  id: string;
  name: string;
  mode: RoomMode;
  shape?: BoardShape; // multi only
  cells?: Cell[];     // multi interior, looped like a tiny level
}

export interface Board {
  floors: Floor[];
  stairs: Stair[];
  rooms?: RoomDef[];
}

// host cell on a level loop
// kind: 'room'; roomId: RoomDef.id
```

Multi default shape: square **3×3**. Caps: square `tilesPerSide` 3–4; rectangle length/width 3–5, not equal, max 5×4 (so 5×3 or 4×3 or 5×4). Add `normalizeRoomShape` in `lib/designer/rooms.ts` (do not change level `normalizeShape` caps).

Vanilla multi room: interior equals `createLoopedFloor(room.id, room.name, 0, room.shape)` with no extras. Shape/Tiles disabled when `!isVanillaRoom`. **Reset room** wipes interior at current shape/size, keeps name. **Delete room** removes `RoomDef`, sets host cell back to corridor (confirm). Delete room stays enabled if it is the only room.

---

### Task 1: Types, attachRoom, drop door placement

**Files:** types, board, `lib/designer/rooms.ts`, mutate, palette  
**Test:** `tests/engine/types.test.ts`, `tests/designer/rooms.test.ts`, `tests/designer/mutate.test.ts`, `tests/designer/designer-palette.test.tsx`

- `attachRoom` on corridor only (reject HUD/stair/existing room)
- `placeRoom` on empty inner square **removed** (or becomes no-op)
- `placeDoor` **removed** / no-op
- Palette order: Select / Tile / HUD / Stair / Room / Erase

Migration helper `normalizeBoardRooms(board)`: every `kind==='door'` → `corridor`; every off-path `kind==='room'` (not on `loopCells` positions) dropped; keep packs on leftover corridors.

- [ ] Tests FAIL, implement, commit `feat(engine): room converts a corridor tile`

---

### Task 2: Single vs multi + canvas switch

**Files:** `RoomTabs.tsx`, `LayoutDesigner.tsx`, `CellInspector.tsx`, `BoardShapeFields.tsx`  
**Test:** `tests/designer/layout-designer.test.tsx`, `tests/designer/room-tabs.test.tsx`

- Tile Actions on a room host: **single-tile** / **multi-tile**
- Switching to multi creates interior vanilla loop + **Room 1** button in `designer-bottom-row-blank` (middle row). Name field beside buttons (like level name, no “Room name” visible label — `aria-label="Room name"`)
- Selected room highlighted; 2D `LayoutGrid` shows that interior
- Clicking a **level** button shows the level canvas again
- Shape/Tiles bind to the **visible** target (level or room). Room uses `normalizeRoomShape` caps
- Locked room → Shape/Tiles disabled (Group 7 helper)
- Reset room / Delete room confirms (reuse `LevelConfirmDialog` copy with room name)

- [ ] Tests FAIL, implement, commit `feat(designer): multi-tile room canvas and room tabs`

---

### Task 3: Test play — Enter / Pass / Leave

**Files:** `lib/engine/events.ts`, `game.ts`, `RoomPrompt.tsx`, `GameHud.tsx`  
**Test:** `tests/engine/game.test.ts`, `tests/hud/game-hud.test.tsx`

Commands: `ENTER_ROOM` | `PASS_ROOM` | `LEAVE_ROOM`

- Land on `kind==='room'` → `awaitingRoom: { roomId, cellId }`; lock Roll
- **Pass:** clear awaiting; token stays on host; next roll continues the **level** loop
- **Enter + single:** play host audio/image/video cues (reuse land media); clear awaiting; stay on host
- **Enter + multi:** `insideRoom: { roomId, cellId: entrance }` where entrance is the interior cell with `start` or `cells[0]`; 3D `BoardScene` receives a synthetic one-floor board of that room; Roll walks the room loop (`walkSteps` on room cells)
- Stop on the entrance cell while inside → show **Leave** (and any pack on that cell). Leave returns token to the host corridor cell and restores the level 3D floor
- Room interior tiles may hold pack / spinner / media like corridors

- [ ] Tests FAIL, implement, commit `feat(engine): enter pass and leave rooms`

---

### Task 4: Validation, persist, README, push

- Drop door validation codes. Old drafts normalize on `fromStoredBootstrap`
- Climb sample: no doors to migrate if Climb has none; empty board unchanged
- README: Room tool on a corridor tile; Door gone; Enter/Pass; middle-row Room buttons; size lock on interiors
- Update tests that still click **Door** or expect `placeRoom` on `slot-1-1` (`layout-designer`, `studio-shell`, `cell-inspector`, `validate`, `layout-grid`, `tile-chrome`)

```bash
npm test
git push -u origin feat/designer-group-6-rooms
git push github HEAD:main
git push origin HEAD:main
```

## Acceptance

- No Door tool
- Room on a loop tile, not an empty inner square
- Single: Enter shows media; Pass continues the corridor
- Multi: Room 1… in the middle bottom row; canvas swaps; Shape/Tiles capped and lock after first paint; Reset/Delete with confirm
- Level button restores the level canvas
- Save persists `board.rooms`
