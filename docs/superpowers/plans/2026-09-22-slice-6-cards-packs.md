# Slice 6 — Cards & Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per task. Commit after each task. Cursor models only. No approval pauses.

**Goal:** Let the studio author packs and cards in Design (create / edit / delete), attach a pack to a corridor tile from Tile Actions without a CSV, and persist the pack catalog plus deck with the draft on Save. Test HUD CSV import stays.

**Architecture:** Packs become a first-class catalog (`string[]` of pack ids) stored on `StoredBootstrap.packs`, independent of whether the pack has cards yet. The engine deck stays `Card[]` (`id`, `pack`, `title`, optional `body` / `tags`). `lib/designer/packs.ts` owns catalog + card mutations (no PlayCanvas). Design UI is a **Packs** tab beside Tile Actions. `listPackIds` unions catalog ids with `card.pack` so Tile Actions can assign an empty pack. `StudioShell` keeps working cards/packs next to the working board and writes both on Save.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, existing shadcn/ui (`Button`, `Input`, `Label` — native `<textarea>` / `<select>`, no new npm packages), Vitest, existing engine + library + HUD + designer.

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md` (Cards & packs — title/body only this slice)  
**Slice 5 (done, GitHub main `7beac13` or newer):** `docs/superpowers/plans/2026-09-21-slice-5-layout-designer.md` — **OUT: card designer**  
**Roadmap:** Slice 6 then rooms. This plan **does not start rooms**.

**Base branch:** Implement from **GitHub `main`** (`7beac13` or newer). Create `feat/slice-6-cards-packs` from that main. Do **not** implement rooms, doors, publish, HUD tile types, timer cards, polar UI, or first-person.

**Harness today (slice 5 + chrome):** `StudioShell` holds a working `Board` + start players. Pack ids for Tile Actions come only from `listPackIds(cards)`. Empty board has `cards: []`, so Tile Actions says **No packs in this draft. Open Test and import cards, then attach a pack here.** Save writes `cards: snapshot?.cards.deck ?? active.bootstrap.cards`. CSV import lives in Test HUD and appends to the live deck.

## Global Constraints

- Engine is a small set of repeating mechanics; **Game JSON + the designer** own the rules (Climb is only the first bundled example)
- **PlayCanvas React** is the **3D board view only**; engine, library, and designer mutations have **zero** PlayCanvas imports
- HUD, cards, setup, library, and designer chrome stay **DOM + shadcn/ui**
- **Pass** does **not** count as a pack reveal; **neither** (no buttons) **does** count on deal
- Stair squares **never** hold packs
- **Save draft** is allowed even if stairs/loops are invalid for Test
- **Test** always uses the **current draft** (working board + working cards after save)
- Session / drafts persist in the **browser**; no accounts
- Dev server stays on uncommon port **4318**
- Card actions stay **game-level** `config.actionMode` — no per-card buttons this slice
- Do **not** rename `ROLL_DICE`. Do **not** remount leftover `DiceActor` / `DiceRollLayer`

## Slice scope

**In this plan:** pack list + card editor in Design; create / rename / delete packs; create / edit / delete cards (title + body); empty board can have packs with zero cards and no CSV; Tile Actions assigns those packs to corridor tiles; Save persists `cards` + `packs` on the draft; CSV import remains in Test HUD and merges into the same catalog; Climb still ships its three climb cards.

**Out of this plan:** rooms, doors, publish button / live slug, HUD tile-type designer, timer cards, extra card buttons, polar board-shape UI, first-person / inner maps, buyable packs, pack back images, card templates / slots, per-card action buttons, media / spinner / item links, no-show groups, XLSX import in Design.

---

## File Map

| Path | Slice 6 change |
|------|----------------|
| `lib/designer/packs.ts` | **Create.** Catalog + card mutations |
| `lib/engine/layout.ts` | `listPackIds(cards, packIds?)` unions catalog |
| `lib/engine/types.ts` | Keep `Card` / `CardPack`; no timer fields |
| `lib/library/types.ts` | Optional `StoredBootstrap.packs?: string[]` |
| `lib/library/bootstrap.ts` | Round-trip `packs` |
| `lib/library/state.ts` | Parse optional `packs` |
| `lib/samples/empty.ts` | `packs: []` via stored bootstrap (or empty catalog) |
| `lib/samples/climb.ts` | Unchanged deck; codec derives `['climb']` |
| `components/designer/PackEditor.tsx` | **Create.** Pack list + card fields |
| `components/designer/CellInspector.tsx` | Empty-pack copy points at Packs tab |
| `components/designer/LayoutDesigner.tsx` | Packs tab; pass catalog + change handlers |
| `components/library/StudioShell.tsx` | Working cards/packs; persist on Save; dirty key |
| `README.md` | Design pack editor + CSV still in Test |
| `tests/designer/packs.test.ts` | **Create.** Mutations |
| `tests/designer/pack-editor.test.tsx` | **Create.** UI |
| `tests/engine/layout.test.ts` | Union catalog + cards |
| `tests/library/bootstrap.test.ts` | Persist empty pack |
| `tests/designer/cell-inspector.test.tsx` | New empty copy |
| `tests/designer/layout-designer.test.tsx` | Optional packs props still compile |
| `tests/library/studio-shell.test.tsx` | Create pack on empty, assign, Save |

Do not add `app/play/[slug]`, room/door types, Publish button, timer-card UI, or polar shape pickers.

---

### Task 1: Pack catalog + card mutations

**Files:**
- Create: `lib/designer/packs.ts`
- Test: `tests/designer/packs.test.ts`

**Interfaces:**
- Consumes: `Card`, `Board`
- Produces:
  - `export function listDraftPackIds(cards: Array<{ pack: string }>, packIds: string[] = []): string[]` — unique, sorted, skip blanks
  - `export function nextPackId(existing: string[]): string` — `pack-1`, `pack-2`, … skipping used
  - `export function nextCardId(cards: Card[], packId: string): string` — `${packId}-1`, increment
  - `export function createPack(packIds: string[], id: string): string[]` — trim; no-op if blank or duplicate (case-sensitive)
  - `export function renamePack(input: { packIds: string[]; cards: Card[]; board: Board; from: string; to: string }): { packIds: string[]; cards: Card[]; board: Board }` — no-op if `to` blank, unchanged, or taken; rewrite `card.pack` and corridor `cell.packId`
  - `export function deletePack(input: { packIds: string[]; cards: Card[]; board: Board; packId: string }): { packIds: string[]; cards: Card[]; board: Board }` — drop pack + its cards; clear matching `cell.packId`
  - `export function addCard(cards: Card[], card: Card): Card[]` — no-op if title blank after trim or id already used
  - `export function updateCard(cards: Card[], cardId: string, patch: Partial<Pick<Card, 'title' | 'body'>>): Card[]` — no-op if patched title is blank
  - `export function deleteCard(cards: Card[], cardId: string): Card[]`
  - `export function cardsInPack(cards: Card[], packId: string): Card[]` — stable deck order

- [ ] **Step 1: Write the failing test**

Create `tests/designer/packs.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { setCellPack } from '@/lib/designer/mutate';
import {
  addCard,
  cardsInPack,
  createPack,
  deleteCard,
  deletePack,
  listDraftPackIds,
  nextCardId,
  nextPackId,
  renamePack,
  updateCard,
} from '@/lib/designer/packs';
import type { Card } from '@/lib/engine/types';

const rung: Card = { id: 'climb-1', pack: 'climb', title: 'Rung', body: 'Up' };

describe('listDraftPackIds', () => {
  it('unions catalog ids with card packs and keeps an empty pack', () => {
    expect(listDraftPackIds([], [])).toEqual([]);
    expect(listDraftPackIds([rung], ['notes'])).toEqual(['climb', 'notes']);
    expect(listDraftPackIds([], ['notes'])).toEqual(['notes']);
  });
});

describe('createPack and ids', () => {
  it('adds a trimmed unique pack and suggests the next id', () => {
    expect(nextPackId([])).toBe('pack-1');
    expect(nextPackId(['pack-1'])).toBe('pack-2');
    expect(createPack([], ' notes ')).toEqual(['notes']);
    expect(createPack(['notes'], 'notes')).toEqual(['notes']);
    expect(createPack(['notes'], '  ')).toEqual(['notes']);
  });
});

describe('renamePack and deletePack', () => {
  it('rewrites cards and tile packIds, then delete clears both', () => {
    const board = setCellPack(
      createBoard([createLoopedFloor('ground', 'Level 1', 0)], []),
      'ground',
      'ground-c1',
      'notes',
    );
    const renamed = renamePack({
      packIds: ['notes'],
      cards: [{ id: 'n1', pack: 'notes', title: 'Clue' }],
      board,
      from: 'notes',
      to: 'clues',
    });
    expect(renamed.packIds).toEqual(['clues']);
    expect(renamed.cards[0]?.pack).toBe('clues');
    expect(renamed.board.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.packId).toBe('clues');

    const deleted = deletePack({
      packIds: renamed.packIds,
      cards: renamed.cards,
      board: renamed.board,
      packId: 'clues',
    });
    expect(deleted.packIds).toEqual([]);
    expect(deleted.cards).toEqual([]);
    expect(deleted.board.floors[0]?.cells.find((c) => c.id === 'ground-c1')?.packId).toBeUndefined();
  });
});

describe('cards', () => {
  it('adds, updates, and deletes a titled card', () => {
    const added = addCard([], { id: nextCardId([], 'notes'), pack: 'notes', title: 'Clue' });
    expect(added).toEqual([{ id: 'notes-1', pack: 'notes', title: 'Clue' }]);
    expect(addCard(added, { id: 'x', pack: 'notes', title: '  ' })).toEqual(added);
    const updated = updateCard(added, 'notes-1', { title: 'Door', body: 'Knock' });
    expect(updated[0]).toMatchObject({ title: 'Door', body: 'Knock' });
    expect(updateCard(updated, 'notes-1', { title: '  ' })).toEqual(updated);
    expect(cardsInPack(updated, 'notes')).toHaveLength(1);
    expect(deleteCard(updated, 'notes-1')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/designer/packs.test.ts`

Expected: FAIL — cannot find module `@/lib/designer/packs`

- [ ] **Step 3: Write minimal implementation**

Create `lib/designer/packs.ts` implementing the interfaces above. Map cells with `cell.packId === from` when renaming; set `packId: undefined` when deleting. Do not touch stair cells' missing pack field.

Also extend `listPackIds` in `lib/engine/layout.ts` to accept an optional catalog and delegate to the same union (or implement the union there and have `listDraftPackIds` call it). Keep the existing one-arg call working.

Update `tests/engine/layout.test.ts` with one case: `listPackIds([], ['notes'])` → `['notes']`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/designer/packs.test.ts tests/engine/layout.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/designer/packs.ts lib/engine/layout.ts tests/designer/packs.test.ts tests/engine/layout.test.ts
git commit -m "feat(designer): mutate pack catalog and cards without CSV"
```

---

### Task 2: Persist packs on the draft bootstrap

**Files:**
- Modify: `lib/library/types.ts`, `lib/library/bootstrap.ts`, `lib/library/state.ts`
- Test: `tests/library/bootstrap.test.ts`, `tests/library/state.test.ts`

**Interfaces:**
- `StoredBootstrap.packs?: string[]` — optional so old localStorage drafts still parse
- `toStoredBootstrap` writes `packs: listDraftPackIds(deck, stored.packs ?? [])`
- `fromStoredBootstrap` keeps `packs` on the stored object only (engine bootstrap stays cards)
- `captureBootstrap` writes `packs: listDraftPackIds(game.cards.deck, [])`
- `isStoredBootstrap` accepts missing `packs` or `string[]`; reject non-array if present
- Climb stored bootstrap includes `packs: ['climb']`
- Empty stored bootstrap includes `packs: []`

- [ ] **Step 1: Write the failing test**

Add to `tests/library/bootstrap.test.ts`:

```ts
  it('round-trips an empty pack catalog with no cards', () => {
    const stored = toStoredBootstrap(emptyBootstrap());
    stored.packs = ['notes'];
    stored.cards = [];
    const again = toStoredBootstrap(fromStoredBootstrap(stored));
    expect(again.cards).toEqual([]);
    expect(listDraftPackIds(again.cards, again.packs ?? [])).toEqual(['notes']);
  });
```

`toStoredBootstrap` must preserve `stored.packs` when converting through `fromStoredBootstrap`. Because `fromStoredBootstrap` returns `GameBootstrap` (no packs field today), add optional `packs?: string[]` on `GameBootstrap` **or** have `toStoredBootstrap` accept `StoredBootstrap` fields via a small helper:

Preferred: add optional `packs?: string[]` on `GameBootstrap` in `lib/engine/game.ts` (or keep it only on `StoredBootstrap` and teach `toStoredBootstrap` / `fromStoredBootstrap` to pass it through a side field).

**Decision (locked):** keep engine `GameBootstrap` card-only. Persist packs only on `StoredBootstrap`.

```ts
export function toStoredBootstrap(
  bootstrap: GameBootstrap,
  packIds: string[] = [],
): StoredBootstrap {
  const cards = cloneJson(bootstrap.cards.deck);
  return {
    board: cloneJson(bootstrap.board),
    players: cloneJson(bootstrap.players),
    cards,
    packs: listDraftPackIds(cards, packIds),
    config: cloneJson({ ...defaultGameConfig(), ...bootstrap.config }),
  };
}

export function fromStoredBootstrap(stored: StoredBootstrap): GameBootstrap {
  // unchanged except clone; packs stay on stored for library callers
}

export function storedPackIds(stored: StoredBootstrap): string[] {
  return listDraftPackIds(stored.cards, stored.packs ?? []);
}
```

Existing `toStoredBootstrap(climbSample)` then yields `packs: ['climb']` automatically. Update the new test to:

```ts
  it('round-trips an empty pack catalog with no cards', () => {
    const stored = toStoredBootstrap(emptyBootstrap(), ['notes']);
    expect(stored.cards).toEqual([]);
    expect(stored.packs).toEqual(['notes']);
    const boot = fromStoredBootstrap(stored);
    expect(boot.cards.deck).toEqual([]);
    const again = toStoredBootstrap(boot, stored.packs);
    expect(again.packs).toEqual(['notes']);
  });
```

Add parse coverage in `tests/library/state.test.ts`: a document JSON with `"packs":["notes"]` and `"cards":[]` survives `parseLibrary`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/library/bootstrap.test.ts tests/library/state.test.ts`

Expected: FAIL — `packs` undefined or `toStoredBootstrap` arity

- [ ] **Step 3: Write minimal implementation**

Update types, codec, and parser. Default second arg `[]` so existing call sites compile.

- [ ] **Step 4: Run tests**

Run: `npm test tests/library/bootstrap.test.ts tests/library/state.test.ts tests/hooks/use-library.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add lib/library/types.ts lib/library/bootstrap.ts lib/library/state.ts tests/library/bootstrap.test.ts tests/library/state.test.ts
git commit -m "feat(library): persist pack catalog on draft bootstrap"
```

---

### Task 3: Pack list + card editor UI

**Files:**
- Create: `components/designer/PackEditor.tsx`
- Test: `tests/designer/pack-editor.test.tsx`

**UI (real copy, no lorem):**
- Heading **Packs**
- Empty: **No packs yet. Create a pack to attach to tiles, or import a CSV in Test.**
- Button **New pack** — uses `nextPackId`, selects it
- List of packs as buttons (`aria-label={`Select pack ${id}`}`), showing id and `N cards`
- Selected pack: Label **Pack id**, text input, button **Rename pack**; button **Delete pack**
- Heading **Cards**
- Empty pack: **This pack has no cards yet.**
- Button **New card** — id via `nextCardId`, title `Card N` (N = existing count + 1)
- Card buttons `aria-label={`Select card ${title}`}`
- Selected card: Label **Title**, Label **Body** (`<textarea aria-label="Body">`), button **Delete card**
- `data-testid="pack-editor"`

Props:

```ts
{
  packs: string[];
  cards: Card[];
  selectedPackId: string | null;
  selectedCardId: string | null;
  onSelectPack: (id: string | null) => void;
  onSelectCard: (id: string | null) => void;
  onCreatePack: () => void;
  onRenamePack: (nextId: string) => void;
  onDeletePack: () => void;
  onCreateCard: () => void;
  onUpdateCard: (patch: Partial<Pick<Card, 'title' | 'body'>>) => void;
  onDeleteCard: () => void;
}
```

The editor is presentational. Mutations stay in the parent (LayoutDesigner / StudioShell).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { PackEditor } from '@/components/designer/PackEditor';

describe('PackEditor', () => {
  it('shows empty copy then creates, edits, and deletes through callbacks', () => {
    const onCreatePack = vi.fn();
    const onRenamePack = vi.fn();
    const onDeletePack = vi.fn();
    const onCreateCard = vi.fn();
    const onUpdateCard = vi.fn();
    const onDeleteCard = vi.fn();
    const onSelectPack = vi.fn();
    const onSelectCard = vi.fn();

    const { rerender } = render(
      <PackEditor
        packs={[]}
        cards={[]}
        selectedPackId={null}
        selectedCardId={null}
        onSelectPack={onSelectPack}
        onSelectCard={onSelectCard}
        onCreatePack={onCreatePack}
        onRenamePack={onRenamePack}
        onDeletePack={onDeletePack}
        onCreateCard={onCreateCard}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />,
    );
    expect(screen.getByText(/Create a pack to attach to tiles/)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    expect(onCreatePack).toHaveBeenCalled();

    rerender(
      <PackEditor
        packs={['notes']}
        cards={[]}
        selectedPackId="notes"
        selectedCardId={null}
        onSelectPack={onSelectPack}
        onSelectCard={onSelectCard}
        onCreatePack={onCreatePack}
        onRenamePack={onRenamePack}
        onDeletePack={onDeletePack}
        onCreateCard={onCreateCard}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />,
    );
    expect(screen.getByText('This pack has no cards yet.')).toBeDefined();
    expect(screen.getByText('0 cards')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Pack id'), { target: { value: 'clues' } });
    fireEvent.click(screen.getByRole('button', { name: 'Rename pack' }));
    expect(onRenamePack).toHaveBeenCalledWith('clues');
    fireEvent.click(screen.getByRole('button', { name: 'New card' }));
    expect(onCreateCard).toHaveBeenCalled();

    rerender(
      <PackEditor
        packs={['notes']}
        cards={[{ id: 'notes-1', pack: 'notes', title: 'Card 1', body: '' }]}
        selectedPackId="notes"
        selectedCardId="notes-1"
        onSelectPack={onSelectPack}
        onSelectCard={onSelectCard}
        onCreatePack={onCreatePack}
        onRenamePack={onRenamePack}
        onDeletePack={onDeletePack}
        onCreateCard={onCreateCard}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
      />,
    );
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Door' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ title: 'Door' });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Knock' } });
    expect(onUpdateCard).toHaveBeenCalledWith({ body: 'Knock' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(onDeleteCard).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Delete pack' }));
    expect(onDeletePack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/designer/pack-editor.test.tsx`

- [ ] **Step 3: Implement `PackEditor`**

Use `Input`, `Label`, `Button`. Native textarea styled like `Input`. No new component library.

- [ ] **Step 4: Pass tests + commit**

```bash
git add components/designer/PackEditor.tsx tests/designer/pack-editor.test.tsx
git commit -m "feat(designer): pack list and card editor"
```

---

### Task 4: Wire Packs into Design + Tile Actions copy

**Files:**
- Modify: `components/designer/LayoutDesigner.tsx`, `components/designer/CellInspector.tsx`
- Test: `tests/designer/layout-designer.test.tsx`, `tests/designer/cell-inspector.test.tsx`

**Behavior:**
- Right pane tab row: **Tile Actions** | **Packs** (`role="tab"`). Default **Tile Actions**. Preview pane unchanged below.
- `data-testid="designer-side-tabs"`
- `LayoutDesigner` props:
  - keep `cards`
  - add optional `packs?: string[]` (default `listDraftPackIds(cards)`)
  - add optional `onDraftChange?: (next: { cards: Card[]; packs: string[]; board: Board }) => void`
  - if `onDraftChange` omitted, pack editor still renders (read-only create buttons no-op) — tests that omit it must not throw
- Tile Actions `packIds={listPackIds(cards, packs)}` so an empty catalog pack appears
- Empty inspector copy becomes: **No packs in this draft. Create a pack in Packs, or import a CSV in Test.**
- Local selected pack/card state lives in `LayoutDesigner`
- **New pack** / **New card** / rename / delete / update call `onDraftChange` with `createPack` / `addCard` / `renamePack` / `deletePack` / `updateCard` / `deleteCard`

- [ ] **Step 1: Failing tests**

`cell-inspector.test.tsx` — add (or replace the old string if a test asserts it):

```ts
    expect(
      screen.getByText('No packs in this draft. Create a pack in Packs, or import a CSV in Test.'),
    ).toBeDefined();
```

Render inspector with `packIds={[]}` and a corridor cell selected (reuse the start/pack test board).

`layout-designer.test.tsx`:

```ts
  it('creates a pack from the Packs tab so Tile Actions can assign it', () => {
    const onDraftChange = vi.fn();
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    render(
      <LayoutDesigner
        board={board}
        cards={[]}
        packs={[]}
        selectedFloorId="ground"
        selectedCellId="ground-c1"
        tool="select"
        issues={[]}
        onBoardChange={() => {}}
        onDraftChange={onDraftChange}
        onSelectFloor={() => {}}
        onSelectCell={() => {}}
        onToolChange={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    expect(onDraftChange).toHaveBeenCalled();
    const next = onDraftChange.mock.calls[0][0];
    expect(next.packs).toEqual(['pack-1']);
    expect(next.cards).toEqual([]);
  });
```

Existing layout-designer tests omit `packs` / `onDraftChange` and must still pass.

- [ ] **Step 2: Fail, implement, pass**

Run: `npm test tests/designer/layout-designer.test.tsx tests/designer/cell-inspector.test.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/designer/LayoutDesigner.tsx components/designer/CellInspector.tsx tests/designer/layout-designer.test.tsx tests/designer/cell-inspector.test.tsx
git commit -m "feat(designer): Packs tab and assign empty packs on tiles"
```

---

### Task 5: Studio working cards/packs + Save + Test CSV

**Files:**
- Modify: `components/library/StudioShell.tsx`
- Test: `tests/library/studio-shell.test.tsx`

**Behavior:**
- `workingCards: Card[]` and `workingPacks: string[]` reset when `active.id` changes from `active.bootstrap.cards` + `storedPackIds(active.bootstrap)`
- `snapshotKey` includes `{ board, players, cards, packs }` so pack edits dirty Save
- `persistWorking` writes `cards: snapshot?.cards.deck ?? workingCards` and `packs: listDraftPackIds(thoseCards, workingPacks)`
- Design `onDraftChange` updates working cards/packs/board and `markActiveEdited`
- When Test HUD imports CSV, `onStateChange` snapshot deck wins on next persist; merge new pack ids into `workingPacks` via `listDraftPackIds`
- After Test → Design, working cards reflect imported deck
- Empty board: create pack in Design, assign on a corridor, Save, reload storage — pack catalog + `packId` present with `cards: []`
- Climb Save still keeps three climb cards
- Import cards button remains on Test HUD (`GameHud`); do not add CSV to Design

- [ ] **Step 1: Failing studio-shell tests**

```ts
  it('Save persists a Design-created pack with no CSV on an empty board', async () => {
    const storage = memoryStorage();
    renderStudio(storage, 'seed-1', '2026-09-22T18:00:00.000Z', () => 'empty-1');
    fireEvent.click(screen.getByRole('button', { name: 'New' }));
    fireEvent.click(screen.getByLabelText('Empty board'));
    fireEvent.change(screen.getByLabelText('Game name'), { target: { value: 'Sandbox' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Packs' }));
    fireEvent.click(screen.getByRole('button', { name: 'New pack' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Tile Actions' }));
    fireEvent.click(screen.getByTestId('slot-0-0'));
    fireEvent.change(screen.getByLabelText('Pack'), { target: { value: 'pack-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    const reloaded = loadLibrary(memoryStorage(storage.read()), { now: NOW, id: 'other' });
    const draft = getActive(reloaded);
    expect(draft?.bootstrap.packs).toEqual(['pack-1']);
    expect(draft?.bootstrap.cards).toEqual([]);
    const floor = draft?.bootstrap.board.floors[0];
    expect(floor?.cells.find((c) => c.start || c.id.endsWith('-c0'))?.packId).toBe('pack-1');
  });

  it('Test CSV import still appends cards that Save writes back', async () => {
    // Existing GameHud import path: after Test, Import cards, then Design + Save
    // Assert bootstrap.cards includes the imported title and its pack id is in packs
  });
```

For the CSV test, reuse `ImportCardsDialog` from Test HUD: click **Test** (mark start first on empty), **Import cards**, upload `pack,title\nnotes,Clue\n`, return to Design, Save, expect `notes` / `Clue`.

If file-input in the full shell is awkward, a thinner assertion is enough: after Design creates a card via **New card**, Save persists `{ title: 'Card 1', pack: 'pack-1' }`. Keep a separate unit test that `persistWorking` uses snapshot deck when present (existing `use-library` import test stays).

Minimum required: empty-board pack-without-CSV Save, plus Design **New card** Save.

- [ ] **Step 2–4: Fail, implement, pass**

Run: `npm test tests/library/studio-shell.test.tsx`

Watch dirty prompt: pack edits must set `dirty` so New/Open asks to save.

Sync imported snapshot:

```ts
useEffect(() => {
  if (!snapshot) return;
  setWorkingCards(cloneJson(snapshot.cards.deck));
  setWorkingPacks((prev) => listDraftPackIds(snapshot.cards.deck, prev));
}, [snapshot]);
```

Avoid resetting on every dispatch: compare deck JSON before setState.

- [ ] **Step 5: Commit**

```bash
git add components/library/StudioShell.tsx tests/library/studio-shell.test.tsx
git commit -m "feat(studio): persist Design packs and cards on Save"
```

---

### Task 6: README + full suite

**Files:**
- Modify: `README.md`

Replace “card template editor are not in this slice” with pack editor instructions:

1. Design → **Packs** tab → **New pack** / **New card**
2. Tile Actions assigns the pack (including empty packs)
3. Save writes packs + cards with the draft
4. Test HUD **Import cards** CSV still appends (`pack`, `title` required)
5. Rooms / doors / publish / timer cards / polar UI / first-person still out

- [ ] **Step 1:** Update README (no test required beyond wording)
- [ ] **Step 2:** `npm test`
- [ ] **Step 3:** Commit

```bash
git add README.md docs/superpowers/plans/2026-09-22-slice-6-cards-packs.md
git commit -m "docs: describe Design pack editor and keep Test CSV import"
```

---

## Self-Review

### Spec coverage (slice 6 only)

| Requirement | Task(s) |
|-------------|---------|
| Pack list + card editor in Design | 1, 3, 4 |
| Create / edit / delete packs and cards | 1, 3 |
| Assign pack to corridor from Tile Actions | 4 (existing `setCellPack`) |
| Empty board can have packs without CSV | 1 empty catalog, 2 persist, 5 studio |
| CSV import stays in Test HUD | 5, 6; no Design upload |
| Persist packs/cards on Save | 2, 5 |
| Rooms / doors / publish / HUD types / timer / polar / FP | **out** |

### Placeholder scan

No TBD / implement-later / similar-to-Task-N. Pack ids are strings; empty packs are first-class.

### Type consistency

`listDraftPackIds`, `nextPackId`, `nextCardId`, `createPack`, `renamePack`, `deletePack`, `addCard`, `updateCard`, `deleteCard`, `cardsInPack`, `storedPackIds` names are stable. `StoredBootstrap.packs` is optional `string[]`. Buttons **New pack**, **Rename pack**, **Delete pack**, **New card**, **Delete card**. Tabs **Tile Actions**, **Packs**. Copy **No packs yet. Create a pack to attach to tiles, or import a CSV in Test.** and **No packs in this draft. Create a pack in Packs, or import a CSV in Test.**

### Known implementer pitfalls

- Implement from **GitHub main `7beac13` or newer**, not an older slice branch.
- Do not JSON-serialize `rng`. Save still stores `cards: Card[]` plus optional `packs`.
- Old drafts without `packs` must still parse; derive catalog from cards.
- `useEffect` reset of working cards must key on `active.id` only (same pitfall as working board).
- Save must write `workingCards` / `workingPacks`, not only the HUD snapshot, or Design edits after a Test session are lost unless snapshot is stale — prefer working state, overlay snapshot deck only when Test import changed the deck.
- Do not add a Publish button, room palette, or timer fields “while you are here.”
- After this slice is on `github/main`, **STOP**. Coordinator launches rooms separately.

---

## Execution

1. Worktree / branch `feat/slice-6-cards-packs` from github/main (`7beac13`+).
2. TDD each task; commit as you go.
3. Push `origin` (`feat/slice-6-cards-packs` and update `main` if that is the project convention) and `git push github HEAD:main`.
4. Return SHA + this plan path. Do not start Slice 7 rooms.
