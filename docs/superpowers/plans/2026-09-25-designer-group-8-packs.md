# Designer Group 8 — Packs copy/remove/delete, cards stay here

> **For agentic workers:** TDD per task. Commit after each task. No approval pauses. Cursor models only (Composer / Cursor Grok). Do not invent later groups.

**Goal:** Replace Pack-id chrome with **New pack / Copy pack**, per-row **Remove** (float) and **Delete** (destroy this copy), pack **name + Rename**, **Back of pack** image, and **cards that stay on this tab** (New/Copy card, per-row Remove/Delete, card image as optional back override). Floating packs/cards live in the device library and appear only in Copy pickers.

**Architecture:** Keep game pack **ids === visible names** (today’s `packs: string[]` + `card.pack`). Add `packBacks` on the game document, `Card.image` as a back override, and `floatingPacks` / `floatingCards` on `LibraryState`. Remove writes a deep copy into the floating library then drops game refs (tiles, rooms, hold quotas). Delete destroys this game’s pack/cards only. Copy is a deep copy with a unique name (`climb`, `climb 2`).

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn Dialog/Button/Input, Vitest. No new packages.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 8

**Base:** `origin/main` / `github/main` (`d0dfbaf` or newer). **Branch:** `feat/designer-groups-8-9`. Sequential: this plan, then Group 9. One worker. TDD. Push `github HEAD:main` + origin when both groups validate.

## Global Constraints

- Engine / designer / library have **zero** PlayCanvas imports
- **No Cards tab**
- Do **not** implement Group 9 (Board tab, board image, edge, surround, centre mesh)
- Do **not** change Test CSV import
- Do **not** invent cloud / shared / buyable packs
- Card titles are **not** required unique; ids stay unique
- Dev server port **4318**
- GitHub remote: `mikemwp/boardgame-designer`. If `github` push fails, still push origin and return the origin SHA

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `Card.image?: ImageRef` |
| `lib/designer/packs.ts` | unique name, copy pack/card, remove vs delete, packBacks rewrite, room-cell pack drop |
| `lib/library/types.ts` | `packBacks`, `FloatingPack`, `floatingPacks`, `floatingCards` |
| `lib/library/state.ts` | parse/round-trip floating + packBacks |
| `lib/library/floating.ts` | **Create.** list copy sources, add/remove floating records |
| `lib/library/bootstrap.ts` | persist `packBacks` |
| `hooks/use-library.ts` | expose floating mutators / persist |
| `components/designer/PackEditor.tsx` | New/Copy row, per-row Remove/Delete, name field, back image, cards stay, no detail Delete |
| `components/designer/LayoutDesigner.tsx` | wire copy/remove + confirms + packBacks |
| `components/library/StudioShell.tsx` | pass other-game + floating copy sources; persist floating |
| `README.md` | Packs copy/remove/float |
| Tests listed per task | Fail first, then implement |

**Out:** Board tab, cloud packs, CSV import changes, Move-card chrome (float → Copy is enough).

---

## Model

```ts
// Card — add optional back override (not 3D)
image?: ImageRef

// StoredBootstrap
packs?: string[]
packBacks?: Record<string, ImageRef>  // key = pack id/name

// LibraryState
floatingPacks?: FloatingPack[]
floatingCards?: Card[]  // pack field unused while floating

export interface FloatingPack {
  id: string            // unique in the floating library
  name: string
  cards: Card[]
  backImage?: ImageRef
}

export type CopyPackSource =
  | { kind: 'game'; gameId: string; gameName: string; packName: string }
  | { kind: 'floating'; floatingId: string; packName: string }

export type CopyCardSource =
  | { kind: 'game'; gameId: string; gameName: string; packName: string; cardId: string; cardTitle: string }
  | { kind: 'floating'; cardId: string; cardTitle: string }
```

`uniquePackName(existing, desired)` → `desired` or `desired 2`, `desired 3`, … (first free). Trim. Empty desired is refused.

Copy pickers: **other games** show `game name` + `pack name` (cards: + `card title`). **Floating** shows the pack/card name only. Current game’s own packs/cards are **not** listed as game sources.

Remove pack: deep-copy `{ name, cards, backImage }` into `floatingPacks` (new floating id), then `deletePack` (drop tile/room/hold refs, drop cards from this game, drop packBacks key). Confirm.

Delete pack: `deletePack` only. Other games’ copies and any floating original stay. Confirm.

Remove card: splice card out of this game, push a clone onto `floatingCards` (keep content; new id if the floating id would collide). Confirm.

Delete card: destroy this copy. Confirm. **No** Delete in the card detail — only the list row.

---

### Task 1: Unique names, copy, remove vs delete, packBacks, room refs

**Files:**
- Modify: `lib/designer/packs.ts`, `lib/engine/types.ts`
- Test: `tests/designer/packs.test.ts`

**Interfaces:**

```ts
export function uniquePackName(existing: string[], desired: string): string | null
export function copyPack(input: {
  packIds: string[]
  cards: Card[]
  board: Board
  packBacks?: Record<string, ImageRef>
  source: { name: string; cards: Card[]; backImage?: ImageRef }
}): { packIds: string[]; cards: Card[]; board: Board; packBacks: Record<string, ImageRef> }

export function removePack(input: {
  packIds: string[]
  cards: Card[]
  board: Board
  packBacks?: Record<string, ImageRef>
  packId: string
}): {
  packIds: string[]
  cards: Card[]
  board: Board
  packBacks: Record<string, ImageRef>
  floating: FloatingPack
}

export function deletePack(/* existing + packBacks */)
export function copyCard(cards: Card[], packId: string, source: Card): Card[]
export function removeCard(cards: Card[], cardId: string): { cards: Card[]; floating: Card }
export function renamePack(/* also rewrite packBacks keys */)
export function setPackBack(packBacks, packId, image): Record<string, ImageRef>
export function cardBackImage(card: Card, packBack?: ImageRef): ImageRef | undefined
```

- [ ] **Step 1: Write the failing tests**
  - `uniquePackName(['climb'], 'climb')` → `'climb 2'`; unused `'notes'` stays `'notes'`; blank → `null`
  - `copyPack` from `{ name: 'climb', cards: [rung] }` into a game that already has `climb` yields pack `climb 2`, new card ids, source cards unchanged
  - `removePack` returns a floating pack with the cards and drops `packId` on a floor cell, a **room interior** cell, and a hold quota
  - `deletePack` destroys cards and does **not** return floating
  - `removeCard` / `deleteCard` as specified
  - `cardBackImage` prefers `card.image`, else pack back
  - `renamePack` moves `packBacks[from]` → `packBacks[to]`
  - `updateCard` can set/clear `image`

- [ ] **Step 2: Run tests — they must fail**
- [ ] **Step 3: Implement the functions**
- [ ] **Step 4: Run tests — they must pass**
- [ ] **Step 5: Commit**

`rewriteBoardPack` must walk `board.floors` **and** `board.rooms[].cells`.

---

### Task 2: Floating library parse + copy-source lists

**Files:**
- Create: `lib/library/floating.ts`
- Modify: `lib/library/types.ts`, `lib/library/state.ts`, `lib/library/bootstrap.ts`
- Test: `tests/library/state.test.ts`, `tests/library/floating.test.ts`, `tests/library/bootstrap.test.ts`

- [ ] **Step 1: Failing tests**
  - `parseLibrary` keeps `floatingPacks` / `floatingCards`; missing fields → `[]`
  - `toStoredBootstrap` / `fromStoredBootstrap` / `captureBootstrap` round-trip `packBacks`
  - `listCopyPackSources(state, currentGameId)` lists other-game packs as `{ gameName, packName }` and floating as `{ packName }` only
  - `listCopyCardSources` same pattern
  - `addFloatingPack` / `addFloatingCard` assign unique floating ids

- [ ] **Step 2: Fail first, implement, pass, commit**

---

### Task 3: PackEditor chrome

**Files:**
- Modify: `components/designer/PackEditor.tsx`
- Test: `tests/designer/pack-editor.test.tsx`

**UI (locked):**

1. Top row: **New pack** | **Copy pack**
2. Pack list rows: name (click to select) + **Remove** + **Delete** (right). Footer Delete pack is gone.
3. Selected pack: **no** “Pack id” label. Same row: name field (`aria-label="Pack name"`) + **Rename pack**. Then **Back of pack** (`MediaField` kind=image).
4. Cards (under selected pack only): **New card** | **Copy card** — both **disabled** until a pack is selected.
5. Card rows: title + **Remove** + **Delete**. No Delete card in the detail.
6. Card detail: Title / Body / timer / extra / spinner / audio unchanged + **Card image** (back override).
7. Copy pack / Copy card open a dialog of radio sources (labels as above). Confirm copies.
8. Remove/Delete open confirm dialogs (`LevelConfirmDialog` is fine).

- [ ] **Step 1: Rewrite `pack-editor.test.tsx` to the new chrome (fail on old “Pack id” / detail Delete card)**
- [ ] **Step 2: Implement PackEditor**
- [ ] **Step 3: Pass + commit**

Empty state copy: keep a short “No packs yet…” line. Copy pack stays enabled even with zero packs in this game.

---

### Task 4: Wire LayoutDesigner + StudioShell

**Files:**
- Modify: `components/designer/LayoutDesigner.tsx`, `components/library/StudioShell.tsx`, `hooks/use-library.ts`
- Test: `tests/designer/layout-designer.test.tsx`, `tests/library/studio-shell.test.tsx`

- [ ] **Step 1: Failing tests**
  - LayoutDesigner: New pack still works; Rename uses Pack name; Copy pack from a provided floating source; Remove pack calls `onFloatPack` and drops the pack from the catalog; row Delete pack confirms
  - StudioShell: Remove pack persists a floating pack in library JSON; Copy pack from another draft game creates a unique-named pack on Save; current game is not listed as a copy source
  - Existing Save-empty-pack / attach-pack tests still pass (New pack label unchanged)

- [ ] **Step 2: Implement wiring** (`packBacks` on working state + snapshotKey)
- [ ] **Step 3: Pass + commit**

---

### Task 5: README

- Packs tab: New/Copy, per-row Remove (float) vs Delete, unique names, back image, cards stay here, floating only in Copy pickers.

- [ ] Update README, commit

---

## Verification

```bash
npm test
```

Do **not** start Group 9 until Group 8 tests pass and are committed.
