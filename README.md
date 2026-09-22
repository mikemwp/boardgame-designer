# Building Board Template

Next.js building-board game template with a pure TypeScript engine, PlayCanvas React 3D board, DOM shadcn HUD, spreadsheet card import, and a bundled Climb sample.

## Requirements

- **Node.js 20.19+** or **22 LTS** (Vitest 3 / Vite 7 need a recent Node). Node 20.3 will fail on `npm test`.
- Use `.nvmrc` (`nvm use` / `fnm use`) if you manage Node versions.

## Getting Started

```bash
npm ci
npm test
npm run dev
```

Open [http://127.0.0.1:4318](http://127.0.0.1:4318) with your browser.

## Layout designer

The studio opens in **Design**. The product title and library bar share one top row. Design and Test fit one viewport (no horizontal scrollbar). The designer canvas is **3/5** of the row; Tile Actions + preview take **2/5**. The 3D preview fills from the bottom of Tile Actions to the bottom of the screen. The level/shape/tool row stays on one line (horizontal scroll if needed). A PlayCanvas preview shows **the level being edited**, top-down on the XZ board (orbit and zoom still work). HUD slots refuse drops.

1. **Board shape** sits in the center of the level/tool row. **Square** uses a **Tiles** picker (3×3…12×12, default 8×8). **Rectangle** has separate length and width selectors (default 8×6, sides cannot be equal). Polar shapes stay hidden. New empty drafts are square 8×8 (28 perimeter cells, first tab **Level 1**). Climb stays square 3. Changing size rebuilds the perimeter loop with unique cell ids (no leftover `floor-1-c24` collisions).
2. Level tabs (**Add level** / **Delete level**) plus the selected **Level name** sit on the toolbar. New levels are **Level 2**, **Level 3**, … Delete removes only the selected level and is disabled when one remains. Adding a level copies the selected level’s shape.
3. Palette: **Select**, **Tile**, **Room**, **Door**, **HUD**, **Stair**, **Erase**. Click empty slots to place; pointer-down on a tile and pointer-up on an empty slot to move. Erase of any tile leaves a free square you can place on again. **Room** goes on an inner/free square (not on the corridor loop). **Door** converts a corridor tile that touches a room so the room is enterable. Stair converts a corridor cell and must link a destination level + landing square before **Test**.
4. Right pane tabs: **Tile Actions** (HUD type, Level hold + pack quotas, pack, start, end, stairs) and **Packs** (create / rename / delete packs and cards). Preview stays below. Level name is not in that pane. Select a HUD cell to set its type: empty slot, dice, spinner, last roll, or player bar.
5. **Packs** can exist with zero cards — no CSV required. Tile Actions can attach that pack to a corridor tile or a **room**. Landing on the room’s **door** deals that room pack; the token stays on the door. **New card** edits title, body, **Timer seconds**, and **Extra button**. Mark **End room** on a room with the existing End control. **Level hold** on the selected floor turns on per-pack reveal quotas before that floor’s stairs open.
6. **Save** writes the working layout (including HUD widget types and Level hold quotas), pack catalog, and card deck (including timer and extra-button fields) even if stairs or loops are invalid. **Test** is blocked with a named list until the layout is valid, then remounts the play HUD. **Publish** uses the same layout gate as Test: it stays disabled until the board is valid, then freezes the current snapshot as published.

A room without a door, or a door that does not touch both a corridor and a room, blocks **Test** and **Publish**. Inner maps, first-person, polar shape UI, cloud accounts, and buyable packs are not in this slice.

## Game library

Drafts and published games live in this browser (`localStorage` key `building-board.library.v1`). There is no account. A published game gets a local slug so `/play/{slug}` can load it on this device.

1. First visit seeds **Climb (sample)** and shows **Climb (sample) (draft)** in the centered title. An empty library shows no “No game” placeholder.
2. **New** asks for a name (empty and focused) and starts from **Empty board** (default), any saved game (`(draft)` / `(Published)`), or **Climb sample** last. Unsaved changes prompt before New or Open.
3. **Save** writes the active draft (board including HUD types and Level hold quotas, starting players, pack catalog, card deck including Design timer/extra fields and CSV imports, feature-toggle config). Save, Test, Publish, and Delete are disabled when no game is loaded. Save matches the other outline buttons.
4. **Open** lists draft and published games. Choosing one remounts play from that game’s saved definition (token back at start, no card up).
5. **Delete** removes the active draft after confirm. Published games cannot be deleted. After an edit the game is a draft again and Delete may enable. After delete, another game is selected, or the studio stays empty.
6. **Publish** is enabled when a game is loaded and the layout would pass Test. First publish is **(Published) v1** and assigns a local slug. Later publish keeps the landed version and the same slug. Open lists `/play/{slug}` on published rows. `/play/{slug}` plays that published snapshot from this browser (missing or unpublished slugs show an empty state).
7. Version A: first publish is **v1**; the first edit after publish becomes **(draft) v1.1**; each later Save or Test while unpublished bumps the minor; the next publish keeps that number. Documents record last saved, version, published date, status, and slug.

**Test** plays the current draft after layout validation. **Publish** freezes the current valid snapshot. Polar UI, first-person, cloud accounts, and buyable packs are still out.

## Architecture

- **`lib/engine/*`** — Authoritative game rules and state (no PlayCanvas imports). Commands flow in; events flow out.
- **`lib/engine/layout.ts`** — Grid occupancy, corridor loops, start square. No PlayCanvas.
- **`lib/designer/*`** — Board mutations and Test validation. No PlayCanvas.
- **`lib/library/*`** — Local draft documents (New / Save / Open). No PlayCanvas, no backend.
- **`components/board/*`** — PlayCanvas React view layer: floor stack and sliding tokens.
- **`components/board/FloorPreview.tsx`** — PlayCanvas preview of the floor being edited.
- **`components/designer/*`** — HTML layout grid over the library draft.
- **`components/hud/*`** — DOM + shadcn HUD: cards, player bar, import dialog, feature toggles.
- **`components/library/*`** — Studio chrome over the existing HUD.
- **`hooks/use-game-store.ts`** — React bridge connecting engine `dispatch` to UI state.

The engine decides outcomes; the board view only renders and animates.

## Cards and packs

In **Design**, open the **Packs** tab to add a pack and optional cards. Empty packs still appear in Tile Actions. Import stays in **Test**:

Upload a CSV with a header row. Required columns:

| Column | Required | Notes |
|--------|----------|-------|
| `pack` | yes | Card pack id |
| `title` | yes | Card title |
| `body` | no | Card body text |
| `tags` | no | Pipe-separated tags |

In Design, **Packs → New card** also sets **Timer seconds** and **Extra button**. Those persist on **Save**. A timer or extra button locks **Test** Roll until the timer elapses or the extra button is pressed. Pass dismisses the card and does not start the hold.

A sample file ships at `public/samples/climb-cards.csv`.

## Play the Climb sample

1. `npm run dev` and open http://127.0.0.1:4318 — the title row shows **Climb (sample) (draft)** in **Design**. Click **Test**, then **Roll dice**. HUD dice tumble to the engine integer, **then** the token slides, **then** the dice disappear and a card deals only if you **stop** on a packed corridor cell. Toggle **HUD spinner** to spin a uniform 1–6 (or **Spinner 1–12**) instead of 1d6 / 2d6. A designed **spinner** HUD type starts Test in spin mode; a designed **dice** HUD type starts Test in dice mode.
2. **Play** counts as a pack reveal. **Pass** dismisses the card and does not. If the dealt card has a timer or extra button, Roll stays locked until the timer hits zero or that button is pressed.
3. Floor 1 hold (toggle **Per-floor hold**, or **Level hold** in Design): you cannot land on that floor’s up stair until one climb card is revealed on that hold. If every face would hit that stair, last roll is **0 — stairs held**.
4. **New → Empty board** still shows **Roll dice** / HUD spinner on a 28-cell square 8×8 **Level 1** loop with no climb cards. Empty HUD slots keep the default player bar and last-roll strip; designing other HUD types hides those unless you place **player-bar** or **last-roll**.
5. **Design** on Climb: Lobby / Floor 1 / Floor 2 tabs, top-down 3D preview of the selected level, pack `climb` on content squares, up stairs already linked. **New → Empty board** is a Level 1 loop you can edit, Save, then Test. **Publish** on Climb becomes **Climb (sample) (Published) v1** at `/play/climb-sample` on this device. Polar shapes, first-person, cloud accounts, and inner maps are still out.

## Feature flags

- **HUD spinner** — number wheel instead of HUD dice. Spinner 1-die range is 1–6; **Spinner 1–12** is uniform 1–12, not 2d6. Dice mode keeps 1d6 or 2d6.
- **2 dice (2–12)** — in dice mode, two cubes and a 2d6 sum. In spinner mode the same switch is **Spinner 1–12**.
- **Per-floor hold** — per-pack reveal quotas before leaving a hold floor by stairs.
- **Card actions** — `both`, `positive`, `pass`, or `neither`. Pass does not count as a reveal. Neither counts on deal.

Dice never tumble on the 3D board. PlayCanvas is the board (floors + tokens) only.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 4318 |
| `npm test` | Run Vitest suite |
| `npm run build` | Production build |
