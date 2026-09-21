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

## Architecture

- **`lib/engine/*`** — Authoritative game rules and state (no PlayCanvas imports). Commands flow in; events flow out.
- **`components/board/*`** — PlayCanvas React view layer: floor stack, sliding tokens, optional ammo.js dice visualization.
- **`components/hud/*`** — DOM + shadcn HUD: cards, player bar, import dialog, feature toggles.
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

1. `npm run dev` and open http://127.0.0.1:4318
2. Click **Roll dice**. The engine picks a 1–6 that would not land on a locked exit stair, the token slides that many squares, and a card deals only if you **stop** on a packed corridor cell.
3. **Play** counts as a pack reveal. **Pass** dismisses the card and does not.
4. Floor 1 hold (toggle **Per-floor hold**): you cannot land on that floor’s up stair until one climb card is revealed on that hold. If every face would hit that stair, last roll is **0 — stairs held**.
5. There is no debug stair button. Climb is a bundled sample, not the engine’s limit.

## Feature flags

- **3D dice** — ammo.js tumble on the board. Movement still uses the engine integer when this is off.
- **Per-floor hold** — per-pack reveal quotas before leaving a hold floor by stairs.
- **Card actions** — `both`, `positive`, `pass`, or `neither`. Pass does not count as a reveal. Neither counts on deal.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 4318 |
| `npm test` | Run Vitest suite |
| `npm run build` | Production build |
