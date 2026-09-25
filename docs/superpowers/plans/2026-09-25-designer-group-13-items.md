# Designer Group 13 — Items tab + current-level Levels pane

> **For agentic workers:** TDD per task. Commit after each task. No approval pauses. Cursor models only. Implement after Group 12 on `feat/designer-groups-12-14`.

**Goal:** One **Items** catalog (extend today’s `InventoryItem`, do not invent a second system). Designer authors title, description, usage notes, uses remaining, image/video/audio, and links an item to players, cards, and tiles. **Players** no longer creates items. **Levels** tab shows the level being designed.

**Architecture:** Grow `InventoryItem` in `lib/engine/types`. Designer CRUD stays in `lib/designer/items.ts`. Attach with `Cell.itemId` / `Card.itemId` (same pattern as `spinnerId`). Players still mark **starting** and choose/random assign. Engine `USE_ITEM` decrements remaining uses and drops the item at 0.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest. No new packages.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 13.

**Base:** Group 12 committed on `feat/designer-groups-12-14`.

## Global Constraints

- **One catalog.** Reuse `items` / `itemAssign` / `createItem` / `updateItem`. No parallel item type
- `name` is the **title** (UI label **Title**)
- Uses remaining empty / omitted = unlimited. `0` is not a starting value — treat non-positive as unlimited when authoring
- HUD tiles do not take an item (same as spinner)
- Do **not** implement Group 14 here
- Polar hidden. No PlayCanvas in engine/designer/library
- Dev port **4318**

## Locked answers

- Players tab: assign mode + starting checkboxes only. No **New item**. Empty copy points at the Items tab. Delete lives on Items
- Linking: Tile Actions **Item** select; Packs card **Item** select; Players **Starting item**
- Levels tab: heading = selected level name, editable name field, Level hold, quotas, Level background — not an empty generic pane

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `InventoryItem` fields; `Cell.itemId`; `Card.itemId`; `Player.itemUses` |
| `lib/engine/inventory.ts` | seed uses; `useItem`; `itemUsesLeft` |
| `lib/engine/events.ts` / `game.ts` | `USE_ITEM`; destroy at 0 |
| `lib/designer/items.ts` | patch new fields; rewrite refs |
| `lib/designer/mutate.ts` | `setCellItem`; `clearCell` drops `itemId` |
| `lib/designer/packs.ts` | `updateCard` accepts `itemId` |
| `components/designer/ItemEditor.tsx` | new tab |
| `components/designer/PlayerEditor.tsx` | drop New item / create |
| `components/designer/HoldEditor.tsx` | current level name |
| `components/designer/LayoutDesigner.tsx` | Items tab; tile item; level name |
| `components/designer/CellInspector.tsx` / `PackEditor.tsx` | Item select |
| `components/hud/InventoryBar.tsx` / `GameHud.tsx` | remaining uses + Use |
| Tests per task | Fail first |

**Out:** Movement dice/spinner on Start. Spinner templates.

---

### Task 1: Catalog fields + use/destroy (TDD)

**Files:** `lib/engine/types.ts`, `lib/engine/inventory.ts`, `lib/designer/items.ts`, `lib/engine/events.ts`, `lib/engine/game.ts`  
**Test:** `tests/designer/items.test.ts`, `tests/engine/game.test.ts`

```ts
export interface InventoryItem {
  id: string;
  name: string;
  starting?: boolean;
  description?: string;
  usageNotes?: string;
  usesRemaining?: number;
  image?: ImageRef;
  video?: VideoRef;
  audio?: AudioRef;
}
```

`updateItem` accepts those fields. `createItem` still `{ id, name: Item N, starting: false }`.

```ts
it('tracks remaining uses and destroys the item at 0', () => {
  const items = updateItem(createItem([], 'item-1'), 'item-1', {
    name: 'Lock pick',
    starting: true,
    usesRemaining: 2,
  });
  // assignStartingItems copies uses onto player.itemUses
  // useItem → 1 left; useItem again → inventory empty, item gone
});
```

`dispatch(state, { type: 'USE_ITEM', itemId })` on the active player.

- [ ] Fail, implement, pass
- [ ] Commit `feat(engine): item details and consume-on-zero`

---

### Task 2: Items tab + Players drop New item + attach

**Files:** `ItemEditor.tsx`, `PlayerEditor.tsx`, `LayoutDesigner.tsx`, `CellInspector.tsx`, `PackEditor.tsx`, `mutate.ts`, `packs.ts`  
**Test:** `tests/designer/layout-designer.test.tsx`, new `tests/designer/item-editor.test.tsx`, `tests/designer/player-editor.test.tsx`

Tabs: Levels / Tiles / Packs / Board / Spinners / **Items** / Players / Start.

`ItemEditor`: New item, list, Title / Description / Usage notes / Uses remaining, Image/Video/Audio (existing `MediaField` / `AudioField`), Delete item.

Players: no New item; “Create items on the Items tab.” Starting checkbox still works when an item is selected.

Tile Actions + card detail: **Item** select (names, not only ids). `setCellItem` no-op on HUD/Board.

Rewrite `itemId` when an item is deleted (cells + cards), same as spinner delete.

Update studio-shell persist test: create the item on **Items**, then mark starting on **Players**.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): Items tab and tile/card links`

---

### Task 3: Levels tab shows the current level

**Files:** `HoldEditor.tsx`, `LayoutDesigner.tsx`  
**Test:** `tests/designer/hold-editor.test.tsx`, `tests/designer/layout-designer.test.tsx`

Hold editor heading: selected `floor.label`. Editable **Level name** (blur commit, same as the bottom-row field). Keep hold + background.

```ts
it('shows the selected level name and hold on the Levels tab', () => {
  fireEvent.click(screen.getByRole('tab', { name: 'Levels' }));
  expect(screen.getByTestId('hold-editor').textContent).toContain('Level 1');
  expect(screen.getByLabelText('Level hold')).toBeDefined();
});
```

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): Levels tab shows the current level`

---

### Task 4: Inventory HUD uses + README

Inventory: `Lock pick (2 left)` when tracked; **Use** dispatches `USE_ITEM`. Unlimited items list name only.

README: Items tab; Players no New item; uses remaining; links; Levels shows current level.

- [ ] Commit `docs: Group 13 Items catalog`

## Acceptance

- One `InventoryItem` catalog
- Items created only on Items
- Players assign starting from that list
- Tile/card can link an item
- Uses hit 0 → item leaves inventory
- Levels tab is the selected level, not a blank pane
