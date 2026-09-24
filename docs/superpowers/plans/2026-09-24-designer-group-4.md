# Designer Group 4 — bottom chrome, preview popup, tile chrome

Implement **Group 4** and every **Group 4 (continued)** section from `docs/designer-screen-amendments.md`. Do not invent later groups.

**Base:** `github/main` (`728ce25` or newer). **Branch:** `feat/designer-group-4`. Cursor models only. TDD. No approval pauses. Push `github HEAD:main` + origin when tests pass.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` (Group 4 only)

## Goal

Reclaim the wasted strip under the 2D board with a 3-row bottom pane, move the 3D preview into a popup, give the right pane the full height and a **Levels** tab, and fix tile chrome so Room/Door/Start/HUD and the preview highlight match the 2D grid in world/board space.

## Current state (728ce25)

- One toolbar on the canvas: FloorTabs + BoardShapeFields + DesignerPalette + Level name.
- Right pane tabs: **Tile Actions / Packs / Start**. Hold editor lives on Tile Actions. Inline `FloorPreview` fills the bottom of the right column (`2fr_1fr`).
- `placeHud` requires `isHudSlot` — the inner free ring (e.g. 1,1 on 8×8) refuses HUD.
- 2D Room/Door already have fill + label. Start has a green outline only (no **Start** text).
- `cellToWorld(..., floor)` prefers `slotPolygon`. Painted extras have `col/row` but no `slot`; `slotPolygon` matches `region:'ring'` + `slot === cell.index` and lands the mesh on a **perimeter ring tile**, not the painted square. Orbit does not cause this; wrong board-space lookup does.
- `FloorStack` colors stair/room/door/selected; HUD and Start use the corridor gray. No 3D text (keep that).
- Inspector heading is **Tile Actions** with kind on the next line. Audio only. No unused Title input today — do not add one.
- `AudioField` is audio-only. Start splash already has a private image picker.

## Architecture

Keep rules in PlayCanvas-free TypeScript. HTML designer chrome stays DOM + shadcn. PlayCanvas is **read-only preview**, now mounted only inside the Preview dialog (one app; do not mount `FloorPreview` and play `BoardScene` together).

New helper `lib/designer/tile-chrome.ts` owns 2D labels and preview kind colors so grid and 3D stay aligned. `cellToWorld` for square/rectangle **always** uses `gridToWorld(col, row)` (HUD-centered XZ). Polar boards still use slot polygons. Camera yaw/pitch/distance never rewrite tile positions.

Tile attachments become three independent refs on `Cell`: `audio`, `image`, `video`. Generalize `AudioField` into a kinded `MediaField` (AudioField remains a thin audio wrapper for Start/Packs).

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `VideoRef`; `Cell.image`, `Cell.video` |
| `lib/designer/mutate.ts` | HUD on any empty in-bounds square; `setCellImage` / `setCellVideo`; persist extra HUD + media on resize |
| `lib/designer/tile-chrome.ts` | **Create.** 2D label + preview color from kind/start |
| `lib/view/board-layout.ts` | Cartesian `cellToWorld` = `gridToWorld`; no ring-index match |
| `lib/library/media-store.ts` | `isAllowedVideoMime` |
| `components/designer/LayoutDesigner.tsx` | Bottom pane; shape-only top row; tabs; preview dialog; no inline preview |
| `components/designer/LayoutGrid.tsx` | Start label; Room/Door/Stair labels via helper |
| `components/designer/CellInspector.tsx` | Kind beside **Tile Actions**; no Title; three attach rows |
| `components/designer/AudioField.tsx` | Kinded attach rows (or shared `MediaField`) |
| `components/designer/DesignerPalette.tsx` | Order: Select / Tile / HUD / Stair / Room / Door / Erase |
| `components/library/StudioShell.tsx` | Pass last saved, status, saved location |
| `components/board/FloorStack.tsx` | Kind colors (HUD violet, Start green, …); no text |
| `components/board/FloorPreview.tsx` | Dialog-friendly fill (orbit/zoom unchanged) |
| `README.md` | Bottom pane, Preview popup, Levels tab, HUD-anywhere, attachments |
| Tests listed per task | Fail first, then implement |

**Out:** polar UI unhide, later amendment groups, live publish, first-person, custom tile styles beyond kind colors.

---

## Task 1: Tile chrome helpers + HUD on any free square

**Failing tests**

- `tests/designer/tile-chrome.test.ts` — Start → `Start`; stair/room/door labels; HUD widget label; preview colors: Start green, Stair amber, Room teal, Door indigo, HUD violet, corridor slate. Preview label always `null` (no 3D text).
- `tests/designer/mutate.test.ts` — rewrite `placeHud`: empty inner ring `(1,1)` **places**; occupied corridor **rejects**; erased center HUD still replaceable. `setCellImage` / `setCellVideo` set/clear independently of audio. Extra HUD on the inner ring survives `applyFloorShape` when the square stays free.
- `tests/engine/types.test.ts` — Cell may hold `image` and `video` together with `audio`.

**Implement** `tile-chrome.ts`, `placeHud` without `isHudSlot`, media setters, `designerProps` includes `image`/`video`, extras keep off-block HUD.

---

## Task 2: Preview world/board space + kind colors

**Failing tests**

- `tests/view/board-layout.test.ts` — painted cell `{ index: 99, col: 3, row: 6 }` on an 8×8 floor worlds at `gridToWorld(0, 3, 6, hud)`, **not** ring slot 99. Adjacent painted cells stay flush on XZ. `orbitCameraPose(..., yaw=90)` does not change `cellToWorld`.
- `tests/view/floor-stack.test.tsx` — selected entity still named by `cell.id`; helper/material path uses Start/HUD colors; no text nodes on tiles.

**Implement** cartesian `cellToWorld` via `gridToWorld`. Polar unchanged. `FloorStack` picks materials from `previewTileColor`. Camera stays orbit-only.

---

## Task 3: 2D Start / Room / Door labels; HUD tool on inner ring

**Failing tests**

- `tests/designer/layout-grid.test.tsx` — start cell shows white **Start** and keeps the green outline class; Room/Door/Stair still labeled.
- `tests/designer/layout-designer.test.tsx` — HUD tool on `slot-1-1` places `kind:'hud'`.
- `tests/designer/designer-palette.test.tsx` — button order Select, Tile, HUD, Stair, Room, Door, Erase.

**Implement** `LayoutGrid` labels via `designerCellLabel`. `placeHud` already allows the square.

---

## Task 4: Bottom pane, shape-only top row, tabs, preview popup

**Failing tests** (`layout-designer.test.tsx`, `studio-shell.test.tsx`)

- `designer-toolbar` contains **only** Board shape + Tiles (or length/width), center-justified. No Add level / Select / Level name on that row.
- `designer-bottom-pane` is full canvas width, three rows with dividers:
  1. FloorTabs (levels + name) + palette (Select / Tile / HUD / Stair / Room / Door / Erase)
  2. Blank (`aria-hidden` or empty middle row)
  3. Metadata (last saved, status, saved location **This device**) + right-justified **Preview**
- Side tabs: **Levels**, **Tiles**, **Packs**, **Start**. Default **Tiles**.
- **Levels** shows Level hold + quotas. **Tiles** shows Tile Actions only (no hold).
- No `preview-pane` / inline `floor-preview` on the right. Right pane is `h-full` / `flex-1` (no 50/50 preview split).
- **Preview** opens a dialog (`preview-dialog`) that mounts `FloorPreview` with the same orbit/zoom. Close unmounts it.
- Studio Design shows a Preview **button**, not an inline preview. Test still has no preview.

Pass `metadata?: { lastSaved?: string; status: 'draft' | 'published'; version?: string | null; savedLocation?: string }` from `StudioShell`.

Keep the `2fr_1fr` split. ValidationList stays in the canvas column above the bottom pane.

---

## Task 5: Tile Actions heading + three attach rows

**Failing tests**

- `tests/designer/cell-inspector.test.tsx` — heading **Tile Actions** + kind beside it (`Start`, `Stair`, `HUD`, `Room`, `Door`, `Tile`). `queryByLabelText('Title')` is null. Corridor shows Audio, Image, Video rows; attaching image does not clear audio. HUD/door still hide attachments.
- `tests/designer/audio-field.test.tsx` (or `media-field.test.tsx`) — image/video accept lists; independent URL commit.
- `tests/library/media-store.test.ts` — `isAllowedVideoMime('video/mp4')`.

**Implement** kind next to the heading (`cell.start` → Start). Three `MediaField` rows. `LayoutDesigner` wires `setCellImage` / `setCellVideo`.

---

## Task 6: README + verify + push

Update README: bottom pane, Preview popup, Levels tab, HUD on any free square, 2D Start label, preview kind colors in board space, Audio/Image/Video.

```bash
npm test
```

On green:

```bash
git push -u origin feat/designer-group-4
git push github HEAD:main
git push origin HEAD:main
```

GitHub remote: `mikemwp/boardgame-designer`. If github push fails, still push origin and return the origin SHA.

## Acceptance

- Bottom 3-row pane under the 2D canvas; canvas top is only Board shape + size, centered.
- Preview is a popup; right pane is full height with Levels / Tiles / Packs / Start; hold lives on Levels.
- Room/Door labeled on 2D; HUD places on the inner ring; Start is green border + white **Start**; 3D is colors only.
- New tiles and the blue highlight sit on fixed XZ from `col/row`, independent of orbit.
- No Title field; Tile Actions + kind; three independent attach rows.
