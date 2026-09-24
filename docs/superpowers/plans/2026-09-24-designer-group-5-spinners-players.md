# Designer Group 5 — Tile Actions chrome, Spinners, Players

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. TDD per task. Commit after each task.

**Goal:** Finish Group 5 chrome (Clear, Start/End row, tab fill, Room/Door color if still wrong) and add **Spinners** + **Players** catalogs. Attach an outcome spinner to a tile or card. Seed inventory in Test (choose or random). HUD movement spinner stays as-is. Spinner **effects** (consume lock pick, turn a corridor) are reserved — labels only.

**Architecture:** Catalog types live on the engine (`SpinnerDef`, `InventoryItem`). Designer modules own CRUD. Engine owns `sampleSegment` and `assignStartingItems` (designer re-exports for tests). Persist on `StoredBootstrap`. Do not import designer from engine.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, shadcn, Vitest.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 5

**Base:** `origin/main` **after Group 7 is on main**. **Branch:** `feat/designer-group-5-spinners-players`. Cursor models only. TDD. No approval pauses. Push `github HEAD:main` + origin when tests pass.

**Reuse:** Uncommitted work on `feat/spinner-player-tabs` already has catalog helpers, editors, and HUD stubs. Copy those files onto this branch after Group 7; do not invent a second model. Finish StudioShell persist + GameHud (those were never wired).

## Global Constraints

- Zero PlayCanvas in engine / designer / library
- HUD tile **spinner** widget = movement wheel, not an outcome spinner
- No lock-pick consume, no direction-turn movement
- Polar UI hidden
- Save allowed if percent segments ≠ 100
- Dev port **4318**
- GitHub: `mikemwp/boardgame-designer`. If github push fails, push origin and return the SHA

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `SpinnerDef`, `InventoryItem`, `ItemAssign`; `Cell.spinnerId?`; `Card.spinnerId?`; `Player.inventory?` |
| `lib/engine/spinner.ts` | `sampleSegment` |
| `lib/engine/inventory.ts` | `startingItems`, `assignStartingItems`, `itemNames` |
| `lib/engine/events.ts` / `game.ts` | `SPIN_OUTCOME`, `SET_INVENTORY`; `lastSpin`; seed inventory; land/card spin |
| `lib/designer/spinners.ts` / `items.ts` | Catalog CRUD |
| `lib/designer/mutate.ts` | `setCellSpinner` (no-op on HUD); `clearCell` |
| `lib/designer/packs.ts` | Card `spinnerId` |
| `lib/library/types.ts` / `bootstrap.ts` | Persist catalogs |
| `components/designer/SpinnerEditor.tsx` / `PlayerEditor.tsx` | Tabs |
| `components/designer/CellInspector.tsx` | Clear, Start/End row, no Make buttons, spinner select (not HUD) |
| `components/designer/PackEditor.tsx` | Card spinner |
| `components/designer/LayoutDesigner.tsx` | Tabs Spinners / Players; catalog callbacks |
| `components/library/StudioShell.tsx` | Persist + Test bootstrap catalogs |
| `components/hud/*` | `InventoryBar`, `LastSpin`, `ItemSetup`; CardPanel **Spin outcome** |
| `README.md` | Spinners, Players, Clear, Start/End row |
| Tests per task | Fail first |

**Out:** Group 6 rooms, Group 7 already shipped, polar, first-person, item consume.

If Group 7 already removed the visible **Level name** label, do not put it back. Only add Clear / Start / End / spinner chrome here.

---

### Task 1: Tile Actions chrome (Clear, Start/End, no Make)

**Files:** `lib/designer/mutate.ts` (`clearCell`), `CellInspector.tsx`, `LayoutDesigner.tsx`  
**Test:** `tests/designer/mutate.test.ts`, `tests/designer/cell-inspector.test.tsx`

`clearCell(board, floorId, cellId)`:

- HUD → no-op
- Stair/Room/Door → corridor, drop stair/room/door links, drop pack/spinner/media/start/end
- Corridor already → drop pack/spinner/media/start/end only

Inspector top row (right-justified): compact **Start tile**, **End tile**, then **Clear** (hidden/disabled on HUD). Confirm Clear (`Clear this tile?` / Cancel / Clear). Start/End use default outline; **secondary/white only when that cell is** start or end.

Remove **Make stair** / Convert buttons that change type from the inspector. Palette still places Stair/Room/Door.

- [ ] Failing tests for `clearCell` + inspector layout
- [ ] Implement
- [ ] Commit `feat(designer): Clear tile and compact Start/End`

---

### Task 2: Catalog types + helpers (TDD)

Reuse `tests/designer/spinners.test.ts` and `tests/designer/items.test.ts` from the WIP branch (6 tests). Model:

```ts
export type SpinnerSplit = 'equal' | 'percent';
export type ItemAssign = 'choose' | 'random';
export interface SpinnerSegment { id: string; label: string; percent?: number }
export interface SpinnerDef {
  id: string; name: string; split: SpinnerSplit; segments: SpinnerSegment[]; linked?: boolean;
}
export interface InventoryItem { id: string; name: string; starting?: boolean }
```

`sampleSegment` in `lib/engine/spinner.ts` (equal or percent weights).  
`assignStartingItems`: random → every player gets **all** starting ids; choose → leave inventory unset.

- [ ] Tests fail, implement, commit `feat(engine): outcome spinner and item catalogs`

---

### Task 3: Designer tabs + attach

Tabs: Levels / Tiles / Packs / **Spinners** / **Players** / Start (wrap ok).

`SpinnerEditor`: New spinner, name, equal/percent, named segments (min 2), percent total hint, linked checkbox, delete (rewrites cell/card `spinnerId`).  
`PlayerEditor`: assign mode choose/random, New item, name, starting checkbox, delete.

Tile Actions: Spinner select on corridor/room (not HUD). Packs card: Spinner select. Show names, not only ids.

- [ ] `layout-designer` tests: create spinner, attach to corridor, create starting item
- [ ] Commit `feat(designer): Spinners and Players tabs`

---

### Task 4: Persist + Test HUD

`StudioShell` working state: `spinners`, `items`, `itemAssign` in snapshotKey, Save, Test `fromStoredBootstrap`.

`createGame` seeds random inventory. `afterMove` samples tile `spinnerId` → `lastSpin`. `SPIN_OUTCOME` for cards. `SET_INVENTORY` for choose.

GameHud:

- `InventoryBar` always
- `LastSpin` always (`Last spin: {label} ({name})` / `No outcome spin yet`)
- After start overlay, if `itemAssign === 'choose'`, `ItemSetup` (starting pool) then Confirm — same kit for all players; lock Roll until confirmed
- Card **Spin outcome** (not the movement **Spin** button)

- [ ] `bootstrap.test.ts` catalog round-trip
- [ ] `studio-shell.test.tsx` Save persists spinner + item + tile `spinnerId`
- [ ] `game-hud.test.tsx` inventory + choose setup + last spin
- [ ] `game.test.ts` land spin + SET_INVENTORY
- [ ] Commit `feat(library): persist spinner and player catalogs`

---

### Task 5: README + verify + push

README: Spinners/Players tabs; attach to tile/card; HUD spinner unchanged; choose/random starting items; Clear; Start/End only white when set.

```bash
npm test
git push -u origin feat/designer-group-5-spinners-players
git push github HEAD:main
git push origin HEAD:main
```

## Acceptance

- Clear / Start / End chrome matches the list
- Unlimited named spinners; equal or percent; attach to tile or card; not HUD
- Unlimited items; starting flag; Test assign choose or random
- Save/Open restores catalogs
- No consume / no path turn
