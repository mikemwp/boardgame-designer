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

## Game library

Drafts live in this browser (`localStorage` key `building-board.library.v1`). There is no account and no public slug in this slice.

1. First visit seeds **Climb (sample)** and opens it in the HUD.
2. **New** creates another named draft from **Climb sample** or **Empty board**. It does not overwrite other drafts. The current draft is saved first.
3. **Save** writes the active draft (board, starting players, card deck including CSV imports, feature-toggle config) and keeps the current play session on screen.
4. **Open** lists local drafts only. Choosing one remounts play from that draft’s saved definition (token back at start, no card up). Live publish is not included.

Invalid stairs would still be savable later; this slice does not add Test or Publish buttons.

## Architecture

- **`lib/engine/*`** — Authoritative game rules and state (no PlayCanvas imports). Commands flow in; events flow out.
- **`lib/library/*`** — Local draft documents (New / Save / Open). No PlayCanvas, no backend.
- **`components/board/*`** — PlayCanvas React view layer: floor stack and sliding tokens.
- **`components/hud/*`** — DOM + shadcn HUD: cards, player bar, import dialog, feature toggles.
- **`components/library/*`** — Studio chrome over the existing HUD.
- **`hooks/use-game-store.ts`** — React bridge connecting engine `dispatch` to UI state.

The engine decides outcomes; the board view only renders and animates.

## Card import

Upload a CSV with a header row. Required columns:

| Column | Required | Notes |
|--------|----------|-------|
| `pack` | yes | Card pack id |
| `title` | yes | Card title |
| `body` | no | Card body text |
| `tags` | no | Pipe-separated tags |

A sample file ships at `public/samples/climb-cards.csv`.

## Play the Climb sample

1. `npm run dev` and open http://127.0.0.1:4318 — you should see **Climb (sample)** in the library bar.
2. Click **Roll dice**. HUD dice tumble to the engine integer, **then** the token slides, **then** the dice disappear and a card deals only if you **stop** on a packed corridor cell. Toggle **HUD spinner** to spin a uniform 1–6 (or **Spinner 1–12**) instead of 1d6 / 2d6.
3. **Play** counts as a pack reveal. **Pass** dismisses the card and does not.
4. Floor 1 hold (toggle **Per-floor hold**): you cannot land on that floor’s up stair until one climb card is revealed on that hold. If every face would hit that stair, last roll is **0 — stairs held**.
5. **New → Empty board** still shows **Roll dice** / HUD spinner on a 6-cell Ground loop with no climb cards.

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
