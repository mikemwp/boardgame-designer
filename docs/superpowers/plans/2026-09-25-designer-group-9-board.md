# Designer Group 9 — Board face vs HUD media

> **For agentic workers:** TDD per task. Commit after each task. No approval pauses. Cursor models only (Composer / Cursor Grok). Implement **after** Group 8 on the same branch.

**Goal:** A Monopoly-style level is **one painting**. Add a **Board** tab for board image, wood/metal/plastic **edge**, **surround**, **centre mesh**, **popup spout**, and **camera bias**. Each tile samples a UV patch of the level image. Empty centre shows a full-board quad. Square/card **Image / Video / Audio** stay **HUD popups**, not 3D faces. HUD widgets stay dice/spinner/last-roll/player-bar — they are **not** the castle.

**Architecture:** PlayCanvas-free look helpers in `lib/view` + `lib/designer`. `Floor.look` holds table art. `Cell.face` is the optional 3D override. `Cell.image` / `Card.image` remain land/card media. FloorStack draws surround → edge → board quad → tiles (UV or face) → kind rim → centre mesh. Test camera yaws to the **token’s side** of the loop when a centre mesh would hide the far ring.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, shadcn, PlayCanvas React (view layer only), Vitest. No new packages. No GLB pipeline — centre mesh is a built-in **castle** primitive.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 9

**Base:** Group 8 committed on `feat/designer-groups-8-9`. Push `github HEAD:main` + origin after this plan validates.

## Global Constraints

- Engine / designer / library have **zero** PlayCanvas imports
- Polar boards, first-person, 40-file per-face export — **out**
- Surround is **not** walkable
- Do **not** drag-select HUD into a mesh
- Do **not** reuse `cell.image` as a floor texture
- Do **not** invent later groups
- Dev port **4318**
- GitHub: `mikemwp/boardgame-designer`. If github push fails, still push origin and return the SHA

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `FloorLook`, `Floor.look`, `Cell.face` |
| `lib/designer/board-look.ts` | **Create.** defaults, set look fields, vanilla lock, UV, spout, token-side yaw |
| `lib/designer/mutate.ts` | `setFloorLook`, `setCellFace`; `clearCell` drops `face` |
| `lib/designer/level-size.ts` | `look` / `face` count as configured (lock size) |
| `lib/view/board-layout.ts` | bounds include surround padding |
| `lib/view/orbit-camera.ts` | `tokenSideYaw` |
| `components/designer/BoardEditor.tsx` | **Create.** Board tab |
| `components/designer/LayoutDesigner.tsx` | Board tab; face field on Tiles; preview “as in Test” |
| `components/designer/CellInspector.tsx` | Tile face (3D) vs Image (HUD popup) labels |
| `components/board/FloorStack.tsx` | surround, edge, board quad, UV/face, kind rim, castle, no cell.image texture |
| `components/board/BoardScene.tsx` / `BoardOrbitCamera.tsx` / `FloorPreview.tsx` | token-side camera; game name on surround |
| `components/hud/LandMediaPopup.tsx` | **Create.** image/video HUD popup from spout |
| `components/hud/CardPanel.tsx` / `GameHud.tsx` | card back = card.image ?? pack back; land popup |
| `README.md` | Board tab + HUD vs face |
| Tests per task | Fail first |

**Out:** polar, first-person, walkable surround, HUD-as-mesh, per-tile 40-file export.

---

## Model

```ts
export type EdgeMaterial = 'wood' | 'metal' | 'plastic'
export type PopupSpout = 'mesh' | 'surround' | 'tile'
export type CameraBias = 'top-down' | 'token-side'
export type CentreMeshKind = 'none' | 'castle'

export interface BoardEdge {
  material: EdgeMaterial
  thickness: number  // default 0.12
  height: number     // default 0.08
}

export interface BoardSurround {
  padding: number    // default 0.8
  color?: string     // default felt #166534
  image?: ImageRef
}

export interface CentreMesh {
  kind: CentreMeshKind
  scale: number      // default 1
  offsetX: number
  offsetZ: number
  yaw: number
  height: number
}

export interface FloorLook {
  image?: ImageRef
  edge?: BoardEdge
  surround?: BoardSurround
  centreMesh?: CentreMesh
  popupSpout?: PopupSpout   // default 'tile'
  cameraBias?: CameraBias   // designer preview; Test uses token-side when mesh ≠ none
}

// Floor.look?: FloorLook
// Cell.face?: ImageRef   // 3D override only
```

Layering (outside → in): surround → edge → board image quad → centre mesh → tile face override → kind rim/badge → selection → land/card HUD popup.

---

### Task 1: Look helpers + mutations + size lock

**Files:**
- Create: `lib/designer/board-look.ts`
- Modify: `lib/engine/types.ts`, `lib/designer/mutate.ts`, `lib/designer/level-size.ts`
- Test: `tests/designer/board-look.test.ts`, `tests/designer/level-size.test.ts`, `tests/designer/mutate.test.ts`

```ts
export function defaultFloorLook(): FloorLook
export function boardImageUv(col: number, row: number, columns: number, rows: number): { u0: number; v0: number; u1: number; v1: number }
export function tileFaceRef(cell: Cell, look?: FloorLook): ImageRef | undefined  // face ?? look.image
export function usesBoardTexture(cell: Cell, look?: FloorLook): boolean
export function playCameraBias(look?: FloorLook): CameraBias  // token-side if castle, else look.cameraBias ?? top-down
export function tokenSideYaw(token: { x: number; z: number }, pivot: { x: number; z: number }): number
export function popupSpoutAnchor(spout: PopupSpout): 'mesh' | 'surround' | 'tile'
export function setFloorLook(board, floorId, patch): Board
export function setCellFace(board, floorId, cellId, face): Board
```

UV: col 0 / row 0 is the north-west cell; `u0 = col / columns`, `v0 = row / rows` (top of the image is row 0). Neighbours share edges.

- [ ] **Step 1: Failing tests** — UV neighbours share an edge; `tileFaceRef` prefers `cell.face`; `cell.image` is **not** a face; `isVanillaFloor` is false after `look.image` or `cell.face`; `clearCell` drops `face`; `playCameraBias` is token-side when `centreMesh.kind === 'castle'`
- [ ] **Step 2–4:** fail, implement, pass, commit

---

### Task 2: Board tab + Tiles face field

**Files:**
- Create: `components/designer/BoardEditor.tsx`
- Modify: `LayoutDesigner.tsx`, `CellInspector.tsx`
- Test: `tests/designer/board-editor.test.tsx`, `tests/designer/cell-inspector.test.tsx`, `tests/designer/layout-designer.test.tsx`

Board tab fields: **Board image**, **Edge** (wood/metal/plastic, thickness, height), **Surround** (padding, color, optional image), **Centre mesh** (None / Castle + scale/offset/yaw/height), **Popup spout** (mesh / surround / tile), **Camera** (top-down / as in Test). Live **game title** shown as surround name preview.

Tiles: keep Image/Video/Audio as HUD land media. Add **Tile face** (`MediaField`) for `cell.face`. Label Image helper: land / HUD popup, not the 3D face.

- [ ] Fail first (no Board tab), implement, pass, commit

---

### Task 3: FloorStack scenery + camera + game name

**Files:**
- Modify: `FloorStack.tsx`, `board-layout.ts`, `orbit-camera.ts`, `BoardOrbitCamera.tsx`, `BoardScene.tsx`, `FloorPreview.tsx`
- Test: `tests/view/board-layout.test.ts`, `tests/view/orbit-camera.test.ts` (create if needed), `tests/view/floor-stack.test.tsx`

Entities (cartesian floors): `{floorId}-surround`, `{floorId}-edge-n|e|s|w`, `{floorId}-board-quad`, `{floorId}-centre-mesh` when castle, `{cell.id}-rim` when a board texture is in use. **Never** name or texture from `cell.image`.

`BoardOrbitCamera` accepts optional `token` + `bias`. Test `BoardScene` passes the active token and `playCameraBias`. Design `FloorPreview` uses `look.cameraBias` (as in Test = token-side toward a stand-in south cell if no token).

Game name: DOM overlay `data-testid="surround-game-name"` on preview + Test (live title, not baked into the PNG).

- [ ] Fail first, implement, pass, commit

---

### Task 4: HUD popups (land + card back)

**Files:**
- Create: `components/hud/LandMediaPopup.tsx`, `lib/view/land-media.ts`
- Modify: `CardPanel.tsx`, `GameHud.tsx`
- Test: `tests/hud/land-media.test.ts`, `tests/hud/land-media-popup.test.tsx`, `tests/hud/card-panel.test.tsx`, `tests/hud/game-hud.test.tsx`

Land popup when the token **stops** on a cell with `image` and/or `video` (audio already plays). Dismiss with Close. `data-spout={mesh|surround|tile}`.

Card panel shows resolved back (`card.image ?? packBack`) as an `<img>` / placeholder named **Card back**. Not a 3D face.

- [ ] Fail first, implement, pass, commit

---

### Task 5: README

Board tab, one board image + UV, edge/surround/castle, HUD popups ≠ 3D faces, token-side Test camera.

- [ ] Update README, commit

---

## Verification

```bash
npm test
git push -u origin feat/designer-groups-8-9
git push github HEAD:main
```

Return github SHA if that push works, else origin SHA.
