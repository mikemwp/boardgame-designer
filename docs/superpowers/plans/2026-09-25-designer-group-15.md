# Designer Group 15 — Chrome, preview, packs on tiles, card types, clockwise, Imports

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, no approval pauses). TDD per task. Commit after each task. Cursor models only. Do not implement the hosted studio website.

**Goal:** Ship Group 15 on the local designer: chrome (title, metadata, Preview), tab switching, 3D preview End tiles + in-popup level/room switch, Pack vs Card tile modes, standard card types, clockwise Test movement, and an Imports tab (CSV + one-game JSON/zip) compatible with the later hosted importer.

**Architecture:** Keep mutations in `lib/designer/*` and `lib/library/*`, rules in `lib/engine/*`. Export is a **single-game bundle** (`schemaVersion` + document + `media/<assetId>`), not the library. Hosted Publish stays a later slice.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest. Uncompressed ZIP writer/reader in-repo (no new package). Dev port **4318**.

**Spec:** store `docs/designer-screen-amendments.md` Group 15. Export contract: store `docs/studio-website-spec.md` §7.

**Base:** GitHub / origin `main` at `0916431` (Groups 12–14).

## Global Constraints

- Cursor models only. No approval pauses.
- Do **not** implement hosted auth, dashboard, purchases, or live `/play` on a remote domain.
- Do **not** rewrite `docs/studio-website-spec.md`. Leave hosted-Publish “later slice” notes intact.
- Local Publish button stays local-only.
- Polar shapes stay hidden. No PlayCanvas in engine / designer / library.
- GitHub: `mikemwp/boardgame-designer`. Push `github HEAD:main` after verify. Michael `git pull origin main`.
- Do not start Group 16.

## Locked answers

### Chrome
- Center title: **game name · current level** (or **room name** when the 2D canvas shows a room). Drop `(draft)` / `(Published)` from this title. Open / New / `/play` still use `formatGameTitle`.
- Bottom metadata: last saved left, **status centered** (`draft` / `Published` via existing `formatDesignerStatus`), save location **`localStorage` key `building-board.library.v1`**.
- **Preview** moves to the tile-tool row, **right-justified** (not metadata row).

### Tabs
- Levels tab: one **Level background** label (drop the extra heading).
- Click a **level** button → right pane **Levels**.
- Click a **tile** on the 2D board → right pane **Tiles**.

### Preview
- **End** tiles: distinct 3D color, no text (same rule as other kinds).
- Popup defaults to the level or room being edited. Switch level / room **inside** the open popup.

### Pack vs Card
- After a pack is on a tile: **Draw** (deal from pack) or **Card** (show the attached card).
- 2D fill + label **Pack** or **Card** (two colors). Same colors on Preview, no 3D text.
- Start / End / Stair / Room / Door / HUD / Board labels still win over Pack/Card when those kinds apply.

### Card types
Standard types (not a free-form function picker). Remove the **Extra button** field.

| Type | Effect |
|------|--------|
| `miss-a-turn` | Next player skips (consume one `ROLL_DICE` as a skip). |
| `change-direction` | Next move goes **right** of clockwise travel for **N** tiles, then clockwise again. Legal only if the land tile has clockwise-forward **and** a right neighbour. |
| `change-direction-choice` | Same detour, two buttons (default **Continue forward** / **Make turn**; designer text). |
| `go-back` | Move back **N** tiles. N on the card, or from a linked spinner if present. |
| `timer` | Auto-adds **Start timer** (designer label, default `Start timer`). Timer seconds stay. Roll locked until the timer elapses or that button is pressed. |

### Clockwise
- Re-verify Test movement. Prior fix ordered loops clockwise in XZ-from-+Y, which walks **down the left** from the top-left tile and **looks anti-clockwise** on the top-down board (row 0 at top).
- **Fix:** visual clockwise: from top-left, first step is **+col** (right along the top). Flip `walkRectRing`, `isClockwiseTurn`, and the helper sign.

### Imports
- New **Imports** tab: CSV card import (move off Test HUD) + **Export game** / **Import game**.
- Import creates or replaces a **local draft**. Does not hosted-publish.

### Bundle (§7 — hosted upload later is an importer)

```ts
export const GAME_BUNDLE_FORMAT = 'building-board.game';
export const GAME_SCHEMA_VERSION = 1;

export type GameBundle = {
  format: typeof GAME_BUNDLE_FORMAT;
  schemaVersion: typeof GAME_SCHEMA_VERSION;
  id: string;
  name: string;
  version: string | null; // Version A string
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  lastSaved: string;
  source: 'climb' | 'empty' | 'copy';
  publishedAt?: string;
  published?: boolean;
  slug?: string; // suggestion only
  bootstrap: StoredBootstrap;
};
```

Zip layout:

```
game.json
media/<assetId>          // or media/<assetId>.<ext> from mime
```

Rules:

1. **Schema version** on the exported game JSON (`schemaVersion`). Library `version: 1` is unchanged. Bump `GAME_SCHEMA_VERSION` only on breaking `bootstrap` changes.
2. **One game per bundle.** Never the whole library.
3. **`file` media** at `media/<assetId>` (optional ext). Keep `{ id, name, source, src?, mime? }`. **No base64 in JSON.**
4. **`url` media** stay external (not copied into the zip).
5. **Floating packs/cards are not in the bundle.**
6. **Game id** is the document UUID. Re-export keeps it. New id only on New → copy (already true).
7. **Local slug** is a suggestion. Site will not trust it for uniqueness.
8. **Version** stays the Version A string (`1`, `1.1`, …). Do not switch to semver/integers.
9. **No prices, accounts, or listing text** in the game JSON.
10. Local import replaces **by id**. If that id is the dirty active draft, prompt. Imported document becomes a local **draft** (does not Publish).

---

## File map

| Path | Change |
|------|--------|
| `lib/library/version.ts` | `formatDesignerChromeTitle`; save-location copy |
| `lib/library/types.ts` | `GAME_BUNDLE_FORMAT`, `GAME_SCHEMA_VERSION`, `GameBundle` |
| `lib/library/game-bundle.ts` | `toGameBundle`, `fromGameBundle`, `collectFileMediaRefs`, `bundleFileName` |
| `lib/library/zip.ts` | Uncompressed zip encode/decode |
| `lib/library/state.ts` | `importGameDocument` (replace by id); parse `cardType` |
| `hooks/use-library.ts` | `importGame` |
| `lib/engine/types.ts` | `CardTypeId`, card fields, `Cell.packMode` / `cardId` |
| `lib/engine/layout.ts` | Visual-clockwise loop; `rightNeighbor`; `landingDeal` |
| `lib/engine/shape-layout.ts` | `walkRectRing` visual clockwise |
| `lib/engine/movement.ts` | Detour / go-back helpers if needed |
| `lib/engine/cards.ts` | `showAttachedCard` |
| `lib/engine/game.ts` / `events.ts` | Card-type effects; skip turn; `CHOOSE_DIRECTION` |
| `lib/engine/players.ts` | `skipTurns` |
| `lib/designer/tile-chrome.ts` | End, Pack, Card colors + 2D labels |
| `lib/designer/mutate.ts` | `setCellDeal` |
| `lib/designer/packs.ts` | Card-type patch; drop Extra button writes |
| `lib/view/card-hold.ts` | Hold from timer type / `timerButtonLabel` |
| `components/library/StudioShell.tsx` | Chrome title; save location; import/export wiring |
| `components/designer/LayoutDesigner.tsx` | Preview on tool row; tabs; Imports; preview switcher |
| `components/designer/DesignerPalette.tsx` | Optional right-side Preview slot |
| `components/designer/HoldEditor.tsx` | Single Level background label |
| `components/designer/CellInspector.tsx` | Draw / Card |
| `components/designer/PackEditor.tsx` | Card type UI; no Extra button |
| `components/designer/ImportExportPanel.tsx` | New Imports tab |
| `components/board/FloorPreview.tsx` | Room board + optional target |
| `components/board/FloorStack.tsx` | End / Pack / Card materials |
| `components/hud/GameHud.tsx` | Remove Import cards |
| `components/hud/CardPanel.tsx` | Type buttons + Start timer |
| `README.md` | Group 15 + bundle §7 |
| Tests per task | Fail first |

**Out:** Hosted website. Group 16. Prices/accounts/listing in JSON.

---

### Task 1: Visual clockwise (TDD)

**Files:** `tests/helpers/clockwise.ts`, `lib/engine/shape-layout.ts`, `lib/engine/layout.ts`, movement / layout / shape-layout / climb tests

**Produces:** `walkRectRing` and `orderCellsAlongLoop` walk **right along the top** from the top-left tile.

- [ ] **Write failing test** in `tests/engine/shape-layout.test.ts` (and keep the helper name, change the sign):

```ts
it('orders square ring slots clockwise on the top-down board (row 0 at top)', () => {
  const layout = buildShapeLayout({ kind: 'square', tilesPerSide: 3 });
  expect(layout.slots[0]).toMatchObject({ col: 0, row: 0 });
  expect(layout.slots[1]).toMatchObject({ col: 1, row: 0 }); // right, not down
  expect(isClockwiseOnBoard(cellsToXZ(layout.slots))).toBe(true);
});
```

Helper: signed area of (col, row) with row-down. **Visual clockwise ⇒ area > 0.** Rename usage to `isClockwiseOnBoard` (keep `isClockwiseFromPlusY` as a deprecated alias that matches the new sign, or flip its body).

Flip `walkRectRing`:

```ts
// Visual clockwise: along the top, down the right, back along the bottom, up the left.
for (let col = left; col < right; col += 1) positions.push({ col, row: top });
for (let row = top; row < bottom; row += 1) positions.push({ col: right, row });
for (let col = right; col > left; col -= 1) positions.push({ col, row: bottom });
for (let row = bottom; row > top; row -= 1) positions.push({ col: left, row });
```

`isClockwiseTurn`: `ax * bz - az * bx > 0`.

Layout rewrite test: a down-the-left ring is rewritten so `[0]` stays start and `[1]` is +col.

- [ ] Fail, implement, pass (`npx vitest run tests/engine/shape-layout.test.ts tests/engine/layout.test.ts tests/engine/movement.test.ts tests/samples/climb.test.ts`)
- [ ] Commit `fix(engine): clockwise walk matches top-down view`

---

### Task 2: Chrome title, metadata, Preview on tool row (TDD)

**Files:** `lib/library/version.ts`, `StudioShell.tsx`, `LayoutDesigner.tsx`, `DesignerPalette.tsx`

```ts
export function formatDesignerChromeTitle(
  gameName: string | undefined,
  levelName?: string,
  roomName?: string,
): string {
  if (!gameName) return '';
  const place = roomName?.trim() || levelName?.trim();
  return place ? `${gameName} · ${place}` : gameName;
}

export const LIBRARY_SAVE_LOCATION = 'Browser localStorage (building-board.library.v1)';
```

Tests: `tests/library/version.test.ts`, `tests/designer/layout-designer.test.tsx`, `tests/library/studio-shell.test.tsx`

- Title has no `(draft)` / `(Published)`.
- Metadata: status centered (`justify-center` on the status span’s group; last saved left; location right of status or a 3-col grid: left / center / empty).
- Preview is inside `designer-toolbar`, `ml-auto`, not in `designer-bottom-row-meta`.
- Default location string uses the localStorage key.

`LayoutDesigner` reports context via `onDesignerContextChange?.({ levelLabel, roomName })`. StudioShell feeds LibraryBar.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): chrome title, status, preview on tools`

---

### Task 3: Tab switching + single Level background (TDD)

**Files:** `HoldEditor.tsx`, `LayoutDesigner.tsx`  
**Test:** `tests/designer/hold-editor.test.tsx`, `tests/designer/layout-designer.test.tsx`

- Remove the extra `<p>Level background</p>`; keep `MediaField` `label="Level background"`.
- Level button `onSelect` also `setSideTab('levels')`.
- Tile click (`activateCartesian` / polar activate when a cell exists or is selected) `setSideTab('tiles')`.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): Levels/Tiles tab switching`

---

### Task 4: End tiles + preview level/room switch (TDD)

**Files:** `tile-chrome.ts`, `FloorStack.tsx`, `FloorPreview.tsx`, `LayoutDesigner.tsx`  
**Test:** `tests/designer/tile-chrome.test.ts`, `tests/view/floor-preview.test.tsx`, `tests/designer/layout-designer.test.tsx`

```ts
PREVIEW_TILE_COLORS.end = { diffuse: '#fb7185', emissive: '#be123c' };
```

`previewTileColor`: `cell.end` after `start`. `previewMaterialName` includes `'end'`. 2D label `End` when `end` and not Start.

Preview dialog: local `previewFloorId` / `previewRoomId` defaulting to the canvas target when opened. Buttons for each level and each multi-tile room. `FloorPreview` accepts `board` already preview-sliced (level via `previewBoardForFloor`, room via `createBoard([roomAsFloor(room)],[],…)`).

- [ ] Fail, implement, pass
- [ ] Commit `feat(preview): End color and in-popup level/room switch`

---

### Task 5: Pack vs Card on tiles (TDD)

**Files:** `types.ts` (`packMode?: 'draw' | 'card'`, `cardId?: string`), `mutate.ts`, `tile-chrome.ts`, `layout.ts` `landingDeal`, `cards.ts` `showAttachedCard`, `game.ts` `dealOnLand`, `CellInspector.tsx`, `LayoutGrid.tsx`, `FloorStack.tsx`

```ts
export function landingDeal(cell: Cell): { packId: string; mode: 'draw' | 'card'; cardId?: string } | undefined;
export function setCellDeal(board, floorId, cellId, packId, mode?: 'draw' | 'card', cardId?: string): Board;
```

Colors: Pack `#2563eb` / `#1d4ed8`; Card `#d97706` / `#b45309`. Labels `Pack` / `Card` when a corridor/room/door has a pack and is not Start/End/Stair.

Inspector: after Pack select, **Draw** / **Card** toggles; Card mode shows a card picker from that pack.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): Draw vs Card tile modes`

---

### Task 6: Card types + remove Extra button (TDD)

**Files:** `types.ts`, `packs.ts`, `PackEditor.tsx`, `card-hold.ts`, `CardPanel.tsx`, `game.ts`, `events.ts`, `players.ts`, `state.ts` parseCard

```ts
export type CardTypeId =
  | 'miss-a-turn'
  | 'change-direction'
  | 'change-direction-choice'
  | 'go-back'
  | 'timer';

// Card: cardType?, moveSteps?, continueLabel?, turnLabel?, timerButtonLabel?
```

`rightNeighbor(floor, cell)`: heading = clockwise next − current; right = `(-dr, dc)` in (col, row).

On `REVEAL_CARD` apply type. `CHOOSE_DIRECTION` `{ choice: 'forward' | 'turn' }`.

Timer type: default `timerButtonLabel = 'Start timer'`; no Extra button field. `cardNeedsHold` true for timer type / `timerSeconds > 0`.

- [ ] Fail, implement, pass (`tests/designer/packs.test.ts`, `pack-editor`, `card-hold`, `card-panel`, `game`, `studio-shell`)
- [ ] Commit `feat(cards): standard card types, drop Extra button`

---

### Task 7: Imports tab + §7 bundle (TDD)

**Files:** `lib/library/game-bundle.ts`, `lib/library/zip.ts`, `lib/library/state.ts`, `hooks/use-library.ts`, `components/designer/ImportExportPanel.tsx`, `LayoutDesigner.tsx`, `GameHud.tsx`

```ts
export function toGameBundle(doc: GameDocument): GameBundle; // copies document fields; no floating; no prices
export function parseGameBundle(raw: unknown): GameBundle | { error: string };
export function collectFileMediaRefs(bootstrap: StoredBootstrap): Array<{ id: string; mime?: string }>;
export function encodeZip(files: Record<string, Uint8Array>): Uint8Array;
export function decodeZip(bytes: Uint8Array): Record<string, Uint8Array>;
```

Tests (`tests/library/game-bundle.test.ts`, `zip.test.ts`, `import-export-panel.test.tsx`, `game-hud.test.tsx`):

- Bundle has `schemaVersion: 1` and `format: 'building-board.game'`.
- One game; no `drafts` array; no floating; no price/account/listing keys.
- Re-export keeps `id`; version string unchanged.
- File ref listed; JSON has no base64; zip has `media/<id>`.
- Unknown `schemaVersion` → error.
- Import replaces by id as draft.
- Imports tab has Import cards / Export JSON / Export zip / Import game.
- Test HUD has no **Import cards**.

CSV import reuses `ImportCardsDialog` + existing `parseCardCsv` / `onDraftChange` to merge cards + pack ids.

Export zip: `game.json` + `media/` blobs from `MediaStore.get` for file refs. Import zip writes blobs via `media.put`.

Dirty replace: reuse `UnsavedChangesDialog` when importing over the dirty active id.

- [ ] Fail, implement, pass
- [ ] Commit `feat(library): game JSON+zip bundle and Imports tab`

---

### Task 8: Docs, amendments, verify, ship

- Update repo + store `README.md` (title, Preview, Imports, card types, bundle §7, clockwise).
- Mark Group 15 **implemented** in store `docs/designer-screen-amendments.md`. Leave hosted-Publish later-slice notes. Do not start Group 16. Do not edit `studio-website-spec.md`.
- Copy this plan to the store path if not already.
- `npx vitest run` then `npm run build`.
- Commit remaining docs. Push origin branch. Add `github` remote if missing. `git push github HEAD:main` (retry with backoff). Fast-forward local `main` to this SHA so Michael’s GitHub `main` matches.

---

## Self-review

| Spec item | Task |
|-----------|------|
| Title without draft/Published; level/room name | 2 |
| Status centered; localStorage location; Preview on tool row | 2 |
| One Level background label | 3 |
| Level click → Levels; tile click → Tiles | 3 |
| End tiles in 3D; preview level/room switch | 4 |
| Draw vs Card colors/labels | 5 |
| Card types + Timer / no Extra button | 6 |
| Clockwise Test | 1 |
| Imports CSV + JSON/zip; not hosted publish | 7 |
| §7 schema, one game, media path, stable id, slug suggestion, Version A, no prices | 7 |
| Hosted site not implemented | all |
