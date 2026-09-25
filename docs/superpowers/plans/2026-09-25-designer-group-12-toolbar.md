# Designer Group 12 — Toolbar: Start/End on canvas, Shape with levels

> **For agentic workers:** TDD per task. Commit after each task. No approval pauses. Cursor models only. Implement first on `feat/designer-groups-12-14`.

**Goal:** Start/End leave the Tiles tab and sit on the tile-tool row after Door. Tile tools move to the **top of the canvas**, center-justified. Shape/Tiles move onto the **level-button row**, right-justified. When multi-tile room buttons show, that room row also gets Shape/Tiles for the **room** grid.

**Architecture:** One `DesignerPalette` (tools + Start/End). Two `BoardShapeFields` instances: level scope on the bottom level row, room scope on the middle room row. Canvas top row is tools only.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest. No new packages.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 12.

**Base:** `origin/main` `00799fe` or newer. **Branch:** `feat/designer-groups-12-14`. Push `github HEAD:main` + origin after Groups 12–14 pass.

## Global Constraints

- Engine / designer / library have **zero** PlayCanvas imports
- Polar UI stays **hidden**
- Level Shape/Tiles always size the **selected level**, even while a room canvas is showing
- Room Shape/Tiles size the **selected multi-tile room** (caps unchanged: square 4×4, rectangle 5×4)
- Tiles-tab **Clear** stays (inspector confirm). Canvas **Clear** after Erase stays
- Do **not** implement Groups 13–14 in this plan
- Dev port **4318**
- GitHub: `mikemwp/boardgame-designer`. If github push fails, still push origin and return the SHA

## Locked answers

- Start/End live on the palette after Door, same outline/secondary rule as today (white/secondary only when that selected tile is Start or End)
- Start/End disabled when no playable tile is selected (none, HUD, Board)
- Tile-tool row: Select / Tile / HUD / Board / Stair / Room / Door / **Start tile** / **End tile** / Fill / Erase / Clear
- Level row: level buttons + name + Reset/Delete, then Shape/Tiles **ml-auto** right
- Room row: room buttons + name + Reset/Delete, then room Shape/Tiles **ml-auto** right (only when multi-tile rooms exist)
- Distinct aria-labels so two Tiles pickers do not collide: level `Shape`/`Tiles`; room `Room shape`/`Room tiles`

---

## File map

| Path | Change |
|------|--------|
| `components/designer/DesignerPalette.tsx` | Start tile / End tile after Door; selected-cell variants |
| `components/designer/BoardShapeFields.tsx` | `scope` + `align` (`center` \| `end`) |
| `components/designer/LayoutDesigner.tsx` | Tools on canvas top (center); Shape on level/room rows (end) |
| `components/designer/CellInspector.tsx` | Remove Start/End from Tile Actions (Clear stays) |
| `README.md` | Toolbar layout |
| Tests listed per task | Fail first, then implement |

**Out:** Items tab. Movement dice/spinner on Start. Spinner templates.

---

### Task 1: Palette Start/End + inspector drop

**Files:**
- Modify: `DesignerPalette.tsx`, `CellInspector.tsx`
- Test: `tests/designer/designer-palette.test.tsx`, `tests/designer/cell-inspector.test.tsx`

```ts
it('places Start and End after Door and whites Start only when the cell is start', () => {
  const onSetStart = vi.fn();
  render(
    <DesignerPalette
      tool="select"
      onToolChange={() => {}}
      onSetStart={onSetStart}
      onSetEnd={() => {}}
      isStart
      startDisabled={false}
      endDisabled={false}
    />,
  );
  const labels = screen.getAllByRole('button').map((b) => b.textContent);
  expect(labels.indexOf('Door')).toBeLessThan(labels.indexOf('Start tile'));
  expect(labels.indexOf('Start tile')).toBeLessThan(labels.indexOf('End tile'));
  expect(labels.indexOf('End tile')).toBeLessThan(labels.indexOf('Fill'));
  expect(screen.getByRole('button', { name: 'Start tile' }).className).toMatch(/bg-secondary/);
  fireEvent.click(screen.getByRole('button', { name: 'Start tile' }));
  expect(onSetStart).toHaveBeenCalled();
});
```

Inspector: `queryByRole('button', { name: 'Start tile' })` is null; Clear still confirms.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): move Start/End onto the tile-tool row`

---

### Task 2: Tools on canvas top; Shape on level and room rows

**Files:**
- Modify: `BoardShapeFields.tsx`, `LayoutDesigner.tsx`
- Test: `tests/designer/layout-designer.test.tsx`, `tests/designer/board-shape-fields.test.tsx`

Replace the current “shape on canvas top / tools in bottom pane” test:

```ts
it('centers tile tools on the canvas top and puts Shape on the level row', () => {
  // toolbar contains Select, Start tile; justify-center
  // toolbar does not contain Shape or Level name
  // bottom pane contains Level 1, Level name, Shape, Tiles
  // board-shape-fields on the level row matches justify-end
});

it('puts Room shape on the room row while the level Shape stays the level size', () => {
  // after multi-tile Room 1: room row has Room tiles (3×3, 4×4)
  // level Tiles still reflects the level (8×8) and stays disabled after Start/Room paint
});
```

`BoardShapeFields` props:

```ts
scope?: 'level' | 'room' // default level
align?: 'center' | 'end' // default center
```

Room scope labels: **Room shape**, **Room tiles**, **Room length**, **Room width**.

Layout:

- `data-testid="designer-toolbar"`: `DesignerPalette` only, `justify-center`
- `designer-bottom-row-tools`: `FloorTabs` + level `BoardShapeFields` (`align="end"`, `ml-auto`)
- `designer-bottom-row-blank`: `RoomTabs` + room `BoardShapeFields` when multi-tile rooms exist

Start/End on the toolbar call `setStartCell` / `setEndCell` for the selected canvas cell (level or room interior).

Update existing tests that click **Start tile** from Tile Actions (`layout-designer`, `studio-shell`) to use the palette button after selecting a slot.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): center tile tools and right-justify Shape`

---

### Task 3: README

README layout bullets: tools on canvas top; Shape/Tiles on the level row (right); room Shape/Tiles on the room row; Start/End after Door, not on Tiles.

- [ ] Commit `docs: Group 12 toolbar layout`

## Acceptance

- No Start/End on Tiles tab
- Tile tools center on the canvas top, including Start/End after Door
- Level Shape/Tiles right on the level-button row
- Room Shape/Tiles right on the room-button row when multi-tile rooms exist
- Existing Start-to-lock / Reset / Test flows still work
