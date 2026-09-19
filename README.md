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

## Feature flags

Toggle in the HUD sidebar:

- **Dice** — Engine integer rolls; optional 3D physics dice on the board when enabled.
- **Per-floor hold** — Require per-pack reveal quotas before leaving a hold floor.
- **Card actions** — `both`, `positive`, `pass`, or `neither`. Pass does not count as a reveal.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port 4318 |
| `npm test` | Run Vitest suite |
| `npm run build` | Production build |

## Sample

The bundled **Climb (sample)** game demonstrates multi-floor stairs, optional hold on Floor 1, and card actions.
