# Designer Group 10 — Start background, Join Game, Copy link

> **For agentic workers:** TDD per task. Commit after each task. No approval pauses. Cursor models only. Implement **after** Group 11 on the same branch.

**Goal:** Start tab authors a **viewport background** (separate from Group 9 board-face). Splash sits **on** that photo. After the last splash, **Join Game** is a frosted card: **New game** / **Saved game** / **Tutorial**, plus **Copy link** and **Play on this device**. Levels may override the photo; unset inherits Start. Single-device now — seats stay local. No Django / WebSocket.

**Architecture:** `GameStart.background` + `GameStart.stayThroughout`. `Floor.background` is the optional viewport override (not `Floor.look.image`). Runtime: cover photo behind the 3D board; splash and Join Game overlay it. Join **A**: copy the published `/play/{slug}` URL; play is local.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest. No new packages.

**Spec:** `/cursor/stores/self/docs/superpowers/specs/2026-09-25-start-join-backgrounds.md` and Group 10 in the living list.

**Base:** Group 11 committed on `feat/designer-groups-10-11`. Push `github HEAD:main` + origin after this plan validates.

## Global Constraints

- Stay Next.js / current designer
- Do **not** adopt zhongyi-tong/monopoly code, Django, Channels, login, or WebSocket rooms
- Group 9 board face / surround / edge stay a different layer
- Continue persistence stays later — **Saved game** stays disabled with “No saved game”
- Tutorial is a Join option; ship a **simple dismissible overlay**, not chrome callouts
- Seats stay **local** until a later online slice
- Polar / first-person — out
- Dev port **4318**

## Locked answers

| Topic | Lock |
|-------|------|
| Join | **A** — single-device now; Copy link UI present; seats stay local |
| Splash | Sits **on** the background (photo visible during splash and under Join Game) |
| Tutorial | Join → Tutorial option; simple overlay now |
| Per-level background | Use the level image if set, else the game Start background (on stair / enter-room / Test) |

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `GameStart.background`, `stayThroughout`; `Floor.background` |
| `lib/engine/audio.ts` | `isGameStartEmpty` includes background |
| `lib/designer/game-start.ts` | `setStartBackground`, `setStayThroughout` |
| `lib/designer/level-size.ts` | `Floor.background` counts as configured |
| `lib/view/game-start.ts` | Join after splash; background-only → menu; `viewportBackground` |
| `components/designer/StartEditor.tsx` | Background attach; stay-throughout; drop free-form menu editor (Join trio is fixed) |
| `components/designer/HoldEditor.tsx` / Levels | Optional level background attach |
| `components/hud/GameStartOverlay.tsx` | Frosted Join Game card; Copy link; Play on this device; Tutorial |
| `components/hud/GameHud.tsx` | Cover photo layer; resolve per-level override; playUrl |
| `components/library/StudioShell.tsx` / `PlayPublishedGame.tsx` | Pass `playUrl` (`/play/{slug}` when published) |
| `README.md` | Start background, Join Game, Copy link |
| Tests per task | Fail first |

**Out:** live lobby, accounts, Continue persistence, Monopoly tutorial callouts, Group 9 art.

---

## Model

```ts
export interface GameStart {
  audio?: AudioRef
  splashes: SplashScreen[]
  menu: { items: StartMenuItem[] } // kept in data; runtime uses the fixed Join trio
  background?: ImageRef
  stayThroughout?: boolean // default true
}

export interface Floor {
  // ...
  background?: ImageRef // viewport override; unset → Start.background
}

export function viewportBackground(
  start: GameStart | undefined,
  floor?: Floor,
): ImageRef | undefined
```

`viewportBackground` = `floor?.background ?? start?.background`.

---

### Task 1: Background fields + empty/phase helpers

**Files:**
- Modify: `lib/engine/types.ts`, `lib/engine/audio.ts`, `lib/designer/game-start.ts`, `lib/view/game-start.ts`, `lib/designer/level-size.ts`
- Test: `tests/designer/game-start.test.ts`, `tests/view/game-start.test.ts`, `tests/designer/level-size.test.ts`

```ts
export function setStartBackground(start: GameStart, background?: ImageRef): GameStart
export function setStayThroughout(start: GameStart, stay: boolean): GameStart
export function setFloorBackground(board: Board, floorId: string, background?: ImageRef): Board
export function viewportBackground(start?: GameStart, floor?: Floor): ImageRef | undefined
```

- `isGameStartEmpty` is false when a background is set.
- `initialStartPhase`: background-only or audio-only → `'menu'` (Join Game). Empty → `'skip'`.
- `afterSplashes` / `nextSplashIndex`: after the last splash always `'menu'` when start is non-empty (Join Game), including splash-only (no authored menu items).
- Setting `Floor.background` makes `isVanillaFloor` false.

- [ ] Fail, implement, pass
- [ ] Commit `feat(start): viewport background fields and join phase`

---

### Task 2: Start tab + Levels override UI

**Files:**
- Modify: `StartEditor.tsx`, `HoldEditor.tsx` (or a thin `LevelBackgroundField` on Levels)
- Test: `tests/designer/start-editor.test.tsx`, `tests/designer/hold-editor.test.tsx`

Start tab: keep splash list + game-start audio. Add **Background image** (same file-or-URL control as splash). **Stay throughout the game** checkbox (default on). Remove the free-form Start menu editor; replace with copy that Test/Play opens **Join Game** (New game / Saved game / Tutorial) plus Copy link / Play on this device.

Levels tab: optional **Level background** attach under Level hold. Empty helper: “Uses the Start background.”

Pass `playUrl` into StartEditor only if useful as a preview; Copy link lives on the Join card at runtime.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): Start and level background attach`

---

### Task 3: Join Game overlay + cover photo

**Files:**
- Modify: `GameStartOverlay.tsx`, `GameHud.tsx`, `StudioShell.tsx`, `PlayPublishedGame.tsx`
- Test: `tests/hud/game-start-overlay.test.tsx`, `tests/view/game-start.test.ts`

Join Game (phase `'menu'`):

- Frosted card (`bg-slate-950/60 backdrop-blur`) titled **Join Game**
- **New game** → today’s Play (`onPlay`)
- **Saved game** disabled, title `No saved game`
- **Tutorial** → simple overlay (“How to play” + dismiss). No chrome arrows this group.
- **Copy link** copies `playUrl` (`{origin}/play/{slug}` when published; otherwise current origin + `/`). Toast **Copied!**
- **Play on this device** → same as New game (local seat, no lobby wait)

Splash overlay is **not** a solid sheet: background photo remains visible underneath (splash content centered on the photo).

`GameHud`:

1. Full-bleed `background-size: cover` layer from `viewportBackground(start, currentFloor)`
2. 3D board
3. Splash / Join / HUD

If `stayThroughout === false`, hide the cover after phase is `play`. When the token changes level, swap to that level’s override or keep Start.

Pass `playUrl` from Studio (published slug) and PlayPublishedGame (`/play/{slug}`).

- [ ] Fail, implement, pass
- [ ] Commit `feat(hud): Join Game modal and viewport cover photo`

---

### Task 4: README

Document Start background vs Board image, Join trio, Copy link (local), Tutorial overlay, per-level inherit.

- [ ] Commit `docs: Group 10 start background and Join Game`
