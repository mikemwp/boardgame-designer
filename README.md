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

The studio opens in **Design**. The product title and library bar share one top row. The centered title is **game name · current level** (or the room name while the 2D canvas shows a room) — not `(draft)` / `(Published)`. Design and Test fit one viewport (no horizontal scrollbar). The designer canvas is **2/3** of the row; the right inspector takes **1/3** and stretches top to bottom. A three-row pane under the 2D board holds level tools, room buttons in the middle row, and game metadata (last saved left, **status** centered, save location `building-board.library.v1` on the right). **Preview** sits on the **tile-tool row**, right-justified, and opens a PlayCanvas popup of **the level or room being edited**, with a switcher inside the popup. New tiles and the selection highlight stay in world/board space from `col/row`, not the camera yaw. HUD may be placed on any free square, including the inner ring. Tokens walk **clockwise** on the top-down board (first step from the top-left tile is right along the top).

1. The **tile-tool row** sits on the canvas top, center-justified: **Select**, **Tile**, **HUD**, **Board**, **Stair**, **Room**, **Door**, **Start tile**, **End tile**, **Fill**, **Erase**, **Clear**, then **Preview** on the right. **Start tile** / **End tile** stay outline unless the selected tile is already start or end (then secondary/white). They are disabled when no playable tile is selected. Polar shapes stay hidden. New empty drafts are square 8×8 (28 perimeter cells, first tab **Level 1**). Climb stays square 3. A vanilla resize always rebuilds the perimeter loop, one inner free ring all the way around, and HUD in the remaining centre — HUD never touches the perimeter. **Reset level** (confirm) wipes the active level back to a vanilla loop at the current size and unlocks Shape.
2. Level tabs (**Add level** / **Delete level** / **Reset level**) and the selected level name field sit on the **top row of the bottom pane**. **Shape** + **Tiles** (or length/width) sit **right-justified** on that same row and size the active **level**. **Square** uses a **Tiles** picker (3×3…12×12, default 8×8). **Rectangle** has separate length and width selectors (default 8×6, sides cannot be equal). Shape and size stay editable only while the level is a vanilla loop (no Start/Stair/Room/Door/Board/extra tile/HUD change/pack/media). Square ↔ rectangle while still vanilla stays unlocked. New levels are **Level 2**, **Level 3**, … Delete (confirm) removes only the selected level and is disabled when one remains. Adding a level copies the selected level’s shape.
3. Palette tools live on the canvas top (see 1). Click empty slots to place; pointer-down on a tile and pointer-up on an empty slot to move. Erase of any tile leaves a free square you can place on again. **HUD** may grow onto the inner free ring. **Board** is blank scenery (not playable, not HUD). **Fill** paints remaining free squares with Board. Canvas **Clear** (after Erase) turns a highlighted HUD or Tile into a free square, or a Stair/Room/Door into a standard Tile; it does not change Board. **Room** converts a corridor tile the same way **Stair** does — the host stays on the loop. Stair converts a corridor cell. Choose a **destination level** in Tiles, then **click a square** on that level’s 2D canvas to set the one-way landing (Empty / HUD / Board become a Tile; an existing Tile stays a Tile; never a Room). Stay in Stair mode until that stair is linked. Isolated landings are allowed. Stairs must be linked before **Test**. **Door** is enabled only while the 2D canvas shows a room (Stair and Room are disabled there). Door is the room start; Tiles tab **Door type** is **Leave / Stay** or **Auto-leave**. Leave returns the token to the level’s room tile. Multi-tile rooms need a Door before **Test**. Room and Stair (and Door/Board) show a distinct fill plus a label on the 2D board. A start tile keeps the green border and shows white **Start** text. The 3D preview uses the same kind colors and no text. Multi-tile rooms get **Room 1**, **Room 2**, … buttons in the middle bottom row plus a Room name field; **Room shape** / **Room tiles** sit right-justified on that row and size the **room** grid (square 4×4 and rectangle 5×4 caps). Selecting a room shows its interior on the 2D canvas, and a level button restores the level canvas. Room interiors fill the entire centre with HUD (no free ring). Room Shape/Tiles lock after the first interior paint.
4. Right pane tabs: **Levels** (the selected level’s name, Level hold + **Final** + pack quotas + optional **Level background**), **Tiles** (Tile Actions + the selected kind, pack, **Draw / Card** deal mode, stairs, stair **Roll again**, HUD type, outcome **Spinner**, optional **Item**, **Audio / Image / Video** as land HUD popups, **Tile face** as the optional 3D override, single-tile / multi-tile on a room), **Packs**, **Board**, **Spinners**, **Items**, **Players**, **Start**, and **Imports**. A **Final** level does not need a closed tile loop. An **End tile is never required**. Click a level button to open **Levels**; click a tile to open **Tiles**. Tabs wrap. There is no unused Title field. Preview is a popup, not an inline pane. Start/End live on the canvas tool row, not Tile Actions. **Clear** (confirm: *Clear this tile?*) is hidden on HUD. Make/Convert type buttons are gone — the palette still places Stair/Room. **Board** is how the table looks: one **board image** for the level (tiles sample a UV patch; empty centre is a full-board quad), optional per-square **Tile face**, wood/metal/plastic **edge**, **surround** (live game name on the collar), **centre mesh** (built-in castle — not a HUD widget), **popup spout**, and designer **camera** (top-down or as in Test). Test yaws to the token’s side of the loop when a castle would hide the far ring. Square/card Image/Video/Audio never paint the 3D face. End, Pack, and Card tiles use distinct 2D/3D colors; Pack/Card labels show on the 2D board only.
5. **Packs** stay on this tab (there is no Cards tab). **New pack** creates an empty pack with a unique name in this game. **Copy pack** deep-copies from another game (`game name` + `pack name`) or a **floating** pack (name only). Each pack row has **Remove** (pack leaves this game and becomes a floating pack; tile/room/hold refs drop) and **Delete** (destroys this copy’s cards). Selected pack: name field + **Rename pack** (refused if the name is taken) and **Back of pack** image (default card back). **New card** / **Copy card** sit under the selected pack. Card rows have Remove (float) and Delete. Card image is an optional back override; no Delete in the card detail. Floating packs/cards live in this device’s library and appear only in Copy pickers. Tile Actions can attach a pack to a corridor or **room**, then choose **Draw** (deal from the pack) or **Card** (show the attached card). Landing on a room offers **Enter** or **Pass**. Pass stays on the corridor. Enter on a single-tile room shows that tile’s media; Enter on a multi-tile room walks the interior until **Leave** on the entrance. **New card** sets title, body, a **card type** (Miss a turn, Change direction, Change direction choice, Go back, Timer, **Roll again**), type fields (steps, button labels, **Start timer**), **Audio**, and an optional outcome **Spinner**. A Roll again card shows **Roll again** or **Spin again** from the game’s movement (dice vs spinner). Stair **Roll again** (Tiles) plus an optional Roll-again card: land on that stair while Level hold is still active and the player must roll/spin again; the stair stays locked until hold is released. There is no Extra button field. Mark **End room** on a room with the existing End control. **Level hold** on the selected floor turns on per-pack reveal quotas before that floor’s stairs open.
6. **Spinners** are named outcome wheels (equal or percent segments; percent need not total 100 to Save). Pick a built-in **template** (Classic, Wood, Neon, Compass), optional image and sound, and the segment count. Attach one to a corridor/room tile or a card, never to a HUD tile. The HUD **spinner** widget stays the movement wheel: CrazyTim **spin-wheel** (MIT) draws the canvas; the engine still picks the segment (`sampleSegment` / `sampleSpinnerMove`) and the view calls `spinToItem`. Test/Play keeps flick **off**. The Spinners tab has **Preview** top-right (disabled until a spinner is selected). That opens the designer Preview popup in **spinner** mode: flick-to-spin plus a **Spin** button (sample then animate). In-preview level buttons become **spinner** buttons (same chrome). Landing a tile spinner or **Spin outcome** on a card records **Last spin: {label} ({name})**. Effects (consume a lock pick, turn a corridor) are labels only. **Start** chooses token movement: **Dice** (1 or 2) or a catalog **Spinner**.
7. **Items** is the catalog: title, description, usage notes, uses remaining, and image/video/audio. Link an item to a tile or card. When uses remaining hits 0, Test destroys that item. **Players** no longer has **New item** — it only assigns **starting** items and choose/random. Test assign mode is **choose** (after the start overlay, pick the starting pool, then Confirm — same kit for every player; Roll stays locked until confirmed) or **random** (every player gets all starting items). The Test HUD always shows **Inventory** and **Last spin** (`No outcome spin yet` before the first outcome).
8. **Imports** moves CSV card import off the Test HUD. **Export JSON** / **Export zip** write **one game** (`format: building-board.game`, `schemaVersion: 1`) plus `media/<assetId>` files. File media stay `{ id, name, source, src?, mime? }` — no base64 in the JSON. Re-export keeps the same game id; a New → copy mints a new one. The local slug travels as a suggestion only. Version stays the Version A string (`1`, `1.1`, …). The bundle has no prices, accounts, or listing text. **Import game** creates or replaces a local **draft** by id (prompt if that id is the dirty active game) and does not hosted-publish.
9. **Save** writes the working layout (including HUD widget types, Level hold quotas, audio refs, Start, spinner and item catalogs, tile/card `spinnerId` and pack/card deal mode), pack catalog, and card deck (including card type, timer, and audio fields) even if stairs, loops, splash screens, or percent totals are invalid. **Test** is blocked with a named list until the layout is valid, then remounts the play HUD. **Publish** stays local: same layout gate as Test, then freezes the current snapshot as published on this device.

A multi-tile room with no walkable interior blocks **Test** and **Publish**. Dangling stairs still block Test; empty rooms and dangling stairs still Save. First-person, polar room shapes, cloud accounts, and buyable packs are not in this slice.

## Audio

Attach one optional clip per surface: a **URL** or a **local file** (IndexedDB on this device; refs only in the game JSON).

- **Tile Actions Audio / Image / Video:** corridor, stair, and room may hold any combination (independent rows). Those attachments are **HUD popups** when you stop (or reveal a card), not the 3D tile face. Room sound plays on **Enter** for a single-tile room, or when you stop on an interior tile. Crossing a tile or stair without stopping does not play. HUD cells do not hold attachments. **Tile face** and the Board tab image are the 3D channel.
- **Packs:** card audio plays when the card is dealt and shown. Pass and Play do not replay it.
- **Start:** splash screens sit **on** the viewport **Background image** (a cover photo behind the table — not the Board tab face). After the last splash, **Join Game** is a frosted card: **New game**, **Saved game** (disabled until sessions persist), **Tutorial** (a simple overlay), **Copy link** (published `/play/{slug}` or `/`; seats stay local), and **Play on this device**. Empty Start skips the overlay. Game-start audio begins on the splash (or Join Game if there are no splashes). If the browser blocks autoplay, **Tap to start** plays it without skipping the screen. **Stay throughout the game** keeps the photo behind the 3D board. A level may override that photo; unset inherits Start.
- One **Mute** / **Unmute** control on the start overlay and the play HUD. Missing sound shows a placeholder and does not block Test or Publish.

## Game library

Drafts and published games live in this browser (`localStorage` key `building-board.library.v1`). There is no account. A published game gets a local slug so `/play/{slug}` can load it on this device.

1. First visit seeds **Climb (sample)** and shows **Climb (sample) · Lobby** in the centered title. Status (`draft` / `Published`) lives in the metadata row. An empty library shows no “No game” placeholder.
2. **New** asks for a name (empty and focused) and starts from **Empty board** (default), any saved game (`(draft)` / `(Published)`), or **Climb sample** last. Unsaved changes prompt before New or Open.
3. **Save** writes the active draft (board including HUD types, Level hold quotas, audio refs, tile spinner ids, and pack/card deal mode, starting players, pack catalog, card deck including card type/timer/audio/spinner fields and CSV imports, spinner and item catalogs, Start designer, feature-toggle config). Save, Test, Publish, and Delete are disabled when no game is loaded. Save matches the other outline buttons. Percent segments that do not total 100 still Save.
4. **Open** lists draft and published games. Choosing one remounts play from that game’s saved definition (token back at start, no card up).
5. **Delete** removes the active draft after confirm. Published games cannot be deleted. After an edit the game is a draft again and Delete may enable. After delete, another game is selected, or the studio stays empty.
6. **Publish** is enabled when a game is loaded and the layout would pass Test. First publish is **(Published) v1** and assigns a local slug. Later publish keeps the landed version and the same slug. Open lists `/play/{slug}` on published rows. `/play/{slug}` plays that published snapshot from this browser (missing or unpublished slugs show an empty state).
7. Version A: first publish is **v1**; the first edit after publish becomes **(draft) v1.1**; each later Save or Test while unpublished bumps the minor; the next publish keeps that number. Documents record last saved, version, published date, status, and slug.

**Test** plays the current draft after layout validation. **Publish** freezes the current valid snapshot. Polar UI, first-person, cloud accounts, and buyable packs are still out.

## Architecture

- **`lib/engine/*`** — Authoritative game rules and state (no PlayCanvas imports). Commands flow in; events flow out.
- **`lib/engine/layout.ts`** — Grid occupancy, corridor loops, start square. No PlayCanvas.
- **`lib/designer/*`** — Board mutations and Test validation. No PlayCanvas.
- **`lib/library/*`** — Local draft documents (New / Save / Open / one-game JSON+zip bundle). IndexedDB media store for local audio/splash files. No PlayCanvas, no backend.
- **`lib/engine/audio.ts`** / **`lib/view/audio-player.ts`** — Land/deal cues and DOM `<audio>` playback (no PlayCanvas).
- **`components/board/*`** — PlayCanvas React view layer: floor stack and sliding tokens.
- **`components/board/FloorPreview.tsx`** — PlayCanvas preview of the floor being edited.
- **`components/designer/*`** — HTML layout grid over the library draft.
- **`components/hud/*`** — DOM + shadcn HUD: cards, player bar, import dialog, feature toggles.
- **`components/library/*`** — Studio chrome over the existing HUD.
- **`hooks/use-game-store.ts`** — React bridge connecting engine `dispatch` to UI state.

The engine decides outcomes; the board view only renders and animates.

## Cards and packs

In **Design**, open the **Packs** tab to add or copy a pack and its cards. Empty packs still appear in Tile Actions. **Imports** is where CSV cards and game JSON/zip live:

Upload a CSV with a header row. Required columns:

| Column | Required | Notes |
|--------|----------|-------|
| `pack` | yes | Card pack id |
| `title` | yes | Card title |
| `body` | no | Card body text |
| `tags` | no | Pipe-separated tags |

In Design, **Packs → New card** also sets a **card type**. Timer type adds **Start timer** (designer label) and locks **Test** Roll until the timer elapses or that button is pressed. Pass dismisses the card and does not start the hold.

A game export is one document (`schemaVersion` 1) plus `media/` files. Hosted upload later is an importer of that same bundle. There is no hosted site in this app.

A sample file ships at `public/samples/climb-cards.csv`.

## Play the Climb sample

1. `npm run dev` and open http://127.0.0.1:4318 — the title row shows **Climb (sample) · Lobby** in **Design**. Click **Test**, then **Roll dice**. Test is a majority PlayCanvas canvas with a right HUD pane only as wide as its controls (not the Design 2/3 split). The board is top-down on XZ like the Design preview (orbit and zoom still work). Movement is visual clockwise. HUD dice tumble to the engine integer, **then** the token slides, **then** the dice disappear and a card deals only if you **stop** on a packed corridor cell. Toggle **HUD spinner** to spin a uniform 1–6 (or **Spinner 1–12**) instead of 1d6 / 2d6 — that control is still the movement wheel, not a Design outcome spinner. A designed **spinner** HUD type starts Test in spin mode; a designed **dice** HUD type starts Test in dice mode. Inventory and last outcome spin stay on the HUD. If starting items are **choose**, confirm them after any start overlay before Roll unlocks.
2. **Play** counts as a pack reveal. **Pass** dismisses the card and does not. If the dealt card is a timer type (or still has timer seconds), Roll stays locked until the timer hits zero or **Start timer** is pressed.
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
