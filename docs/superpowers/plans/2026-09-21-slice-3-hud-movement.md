# Slice 3 — HUD Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move dice throw/tumble into HUD space (1d6 or 2d6) and add a HUD number spinner (uniform 1–6 or 1–12), sequenced as roll viz → token slide → hide viz → card, with PlayCanvas remaining the board view only.

**Architecture:** Keep `lib/engine/*` integer-first and PlayCanvas-free. `ROLL_DICE` still samples an allowed integer, walks, and deals in one reducer step. The HUD owns presentation: CSS dice or CSS spinner animate to that integer, then `PlayerTokens` is allowed to slide, then the viz unmounts and the dealt card appears. Leftover `DiceActor` / `DiceRollLayer` / `dice-throw` stay unmounted on the play board. Designer spinner UI is out of this slice.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, shadcn/ui, Vitest, CSS 3D (HUD dice/spinner). PlayCanvas React stays on `components/board/*` only.

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md`  
**Slice 2 (done):** `docs/superpowers/plans/2026-09-21-slice-2-playable-climb-loop.md`  
**Harness today:** playable Climb loop; `lastRoll.faces` + `diceCount` 1|2; turn-loop locks Roll while sliding or awaiting Play/Pass; `BoardScene` does **not** mount `DiceRollLayer` but leftover 3D dice files still exist; Feature toggle **3D dice** is a no-op (`usePhysics` defaults false).

## Global Constraints

- Engine is a small set of repeating mechanics; **Game JSON + the designer** own the rules (Climb is only the first bundled example)
- **PlayCanvas React** (`playcanvas` + `@playcanvas/react`) is the **3D board view only**; engine has **zero** PlayCanvas imports; HUD dice/spinner are **DOM + CSS**, not PlayCanvas, not ammo.js, not PCUI
- HUD, cards, and setup stay **DOM + shadcn/ui** — not PCUI, not PlayCanvas Screen/Element, not `@playcanvas/web-components`
- **Engine integer first** — viz animates to the already-chosen face; physics/CSS never overwrite `lastRoll`
- **Pass** does **not** count as a pack reveal; **neither** (no buttons) **does** count on deal
- Movement **samples only values that would not land on an illegal stair**; if every possible roll would, movement is **0** (do not loop forever)
- Resolve **only the square you stop on**
- **1+ players**; **no** engine floor/player caps
- **Climb** is a **bundled sample only**
- Dev server stays on uncommon port **4318**
- **Spec override (this slice):** original spec placed dice on the 3D board. Preferences and this plan put throw/tumble in **HUD space**. Do not remount 3D board dice.

## Slice scope

**In this plan:** HUD dice (1d6 or 2d6 matching the existing count toggle); HUD spinner as alternative (uniform 1–6 or **1–12**, not 2d6); sequence roll viz → token move → hide viz → card/tile; Roll stays locked until Play/Pass (extend the existing turn-loop); leftover 3D board dice stay off the play board.

**Out of this plan:** game library New/Save/Open/Test/Publish; HTML layout designer; card/pack/spinner/item designer UIs; first-person cameras; rooms; timer cards; extra card buttons; publish live; WebGL zero-size canvas polish (unless a one-line fix appears while touching `PlayCanvasViewport` — do not go looking).

**Do not rename** the engine command `ROLL_DICE` (spinner still dispatches it).

---

## File Map

| Path | Slice 3 change |
|------|----------------|
| `lib/engine/types.ts` | Add `MovementViz = 'dice' \| 'spinner'`; `GameConfig.movementViz`; default `'dice'` |
| `lib/engine/dice.ts` | `movementRange(viz, count)`; `sampleMovement(...)`; keep `rollDiceMovement` for 2d6 |
| `lib/engine/game.ts` | `dispatch(ROLL_DICE)` uses `movementViz` for range + sampling |
| `lib/samples/climb.ts` | `movementViz: 'dice'` |
| `lib/view/hud-movement.ts` | **Create.** Phase machine: `idle` → `tumble` → `slide` → `idle` |
| `lib/view/hud-dice.ts` | **Create.** Tumble ms, d6 CSS rotations, display faces |
| `lib/view/hud-spinner.ts` | **Create.** Spin ms, 1–6 / 1–12 landing rotation |
| `lib/view/turn-loop.ts` | Lock + hide card while `movementVizActive` |
| `components/hud/HudDice.tsx` | **Create.** One or two CSS cubes in HUD space |
| `components/hud/HudSpinner.tsx` | **Create.** CSS wheel, not a designer widget |
| `components/hud/MovementStage.tsx` | **Create.** Picks dice vs spinner; tumble timer; visibility |
| `components/hud/LastRoll.tsx` | Spinner copy `Last spin: N (1–6\|1–12)` |
| `components/hud/FeatureToggles.tsx` | Replace **3D dice** with **HUD spinner**; two-dice label swaps to **Spinner 1–12** |
| `components/hud/GameHud.tsx` | Phase wiring; mount `MovementStage`; gate token slide; hide viz after slide |
| `components/board/BoardScene.tsx` | Pass `allowSlide`; never import `DiceActor` / `DiceRollLayer`; physics stays off |
| `components/board/PlayerTokens.tsx` | Do not start the waypoint slide until `allowSlide` |
| `app/globals.css` | CSS 3D die + spinner keyframes |
| `README.md` | HUD dice/spinner play instructions |
| Leftover `components/board/DiceActor.tsx`, `DiceRollLayer.tsx`, `lib/view/dice-throw.ts`, `lib/view/dice-lifetime.ts` | **Leave on disk. Do not import from the play board or HUD.** |
| `tests/engine/dice.test.ts`, `tests/engine/game.test.ts`, `tests/engine/types.test.ts` | Spinner vs 2d6 sampling |
| `tests/view/hud-movement.test.ts`, `tests/view/turn-loop.test.ts` | Phase + lock |
| `tests/hud/hud-dice.test.tsx`, `tests/hud/hud-spinner.test.tsx`, `tests/hud/feature-toggles.test.tsx`, `tests/hud/last-roll.test.tsx`, `tests/hud/game-hud.test.tsx` | HUD viz + sequence |
| `tests/view/board-scene.test.tsx` | No `entity-die` on the board |

Do not add designer routes, persistence, rooms, first-person, timer-card, or extra card-button files.

---

### Task 1: Engine movementViz — 2d6 vs uniform spinner

**Files:**
- Modify: `lib/engine/types.ts`
- Modify: `lib/engine/dice.ts`
- Modify: `lib/engine/game.ts`
- Modify: `lib/samples/climb.ts`
- Modify: `tests/engine/types.test.ts`
- Modify: `tests/engine/dice.test.ts`
- Modify: `tests/engine/game.test.ts`
- Test: `tests/engine/types.test.ts`, `tests/engine/dice.test.ts`, `tests/engine/game.test.ts`

**Interfaces:**
- Consumes: existing `DiceCount`, `rollDiceMovement`, `movementRangeForCount`, `allowedMoveValues`, `sampleMoveValue`
- Produces:
  - `export type MovementViz = 'dice' | 'spinner'`
  - `GameConfig.movementViz: MovementViz` (default `'dice'`)
  - `movementRange(viz: MovementViz, count: DiceCount): { min: number; max: number }`
    - dice + 1 → `{ min: 1, max: 6 }`
    - dice + 2 → `{ min: 2, max: 12 }` (2d6)
    - spinner + 1 → `{ min: 1, max: 6 }`
    - spinner + 2 → `{ min: 1, max: 12 }` (uniform, **not** 2d6)
  - `sampleMovement(viz, count, allowed, rng): DiceRollResult`
    - `'dice'` → `rollDiceMovement` (1d6 or two faces + 2d6 sum; illegal sum → `value: 0` keeping faces)
    - `'spinner'` → `sampleMoveValue(allowed, rng)`; `faces` is `[value]` if `value > 0` else `[]`; `sides` is `max` from `movementRange`
  - `dispatch({ type: 'ROLL_DICE' })` uses `movementRange(state.config.movementViz, state.config.diceCount)` for `allowedMoveValues` min/max, then `sampleMovement`

- [ ] **Step 1: Write the failing tests**

Append to `tests/engine/types.test.ts` inside the `GameConfig` describe:

```ts
it('defaults movementViz to dice', () => {
  const cfg: GameConfig = defaultGameConfig();
  expect(cfg.movementViz).toBe('dice');
  expect(cfg.diceCount).toBe(1);
});
```

Append to `tests/engine/dice.test.ts`:

```ts
import { movementRange, sampleMovement } from '@/lib/engine/dice';

describe('movementRange', () => {
  it('keeps 2d6 as 2-12 and spinner two-range as uniform 1-12', () => {
    expect(movementRange('dice', 1)).toEqual({ min: 1, max: 6 });
    expect(movementRange('dice', 2)).toEqual({ min: 2, max: 12 });
    expect(movementRange('spinner', 1)).toEqual({ min: 1, max: 6 });
    expect(movementRange('spinner', 2)).toEqual({ min: 1, max: 12 });
  });
});

describe('sampleMovement', () => {
  it('spinner two-range can land on 1 (dice 2d6 cannot)', () => {
    const spin = sampleMovement(
      'spinner',
      2,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      () => 0,
    );
    expect(spin.value).toBe(1);
    expect(spin.faces).toEqual([1]);
    expect(spin.sides).toBe(12);

    const dice = sampleMovement(
      'dice',
      2,
      [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      () => 0,
    );
    expect(dice.value).toBe(2);
    expect(dice.faces).toEqual([1, 1]);
  });

  it('spinner one-range samples uniformly from allowed 1-6', () => {
    const result = sampleMovement('spinner', 1, [1, 2, 3, 4, 5, 6], () => 0.999);
    expect(result.value).toBe(6);
    expect(result.faces).toEqual([6]);
    expect(result.sides).toBe(6);
  });
});
```

Keep the existing `rollDiceMovement` 2d6 tests.

Append to the `ROLL_DICE` describe in `tests/engine/game.test.ts`:

```ts
it('spinner two-range stores a uniform 1-12 lastRoll, not 2d6 faces', () => {
  const game = createGame(loopBootstrap(), {
    movementViz: 'spinner',
    diceCount: 2,
    rng: () => 0,
  });
  const next = dispatch(game, { type: 'ROLL_DICE' });
  expect(next.lastRoll?.sides).toBe(12);
  expect(next.lastRoll?.value).toBe(1);
  expect(next.lastRoll?.faces).toEqual([1]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/engine/types.test.ts tests/engine/dice.test.ts tests/engine/game.test.ts`

Expected: FAIL — `movementViz` missing on `GameConfig`; `movementRange` / `sampleMovement` not exported

- [ ] **Step 3: Implement types + sampling + dispatch**

In `lib/engine/types.ts`, add next to `DiceCount`:

```ts
export type MovementViz = 'dice' | 'spinner';
```

Add `movementViz: MovementViz` to `GameConfig`. In `defaultGameConfig()` set `movementViz: 'dice'`. Leave `diceEnabled` in the config (existing tests) but do not use it for HUD or board physics.

Replace `lib/engine/dice.ts` with:

```ts
import { sampleMoveValue } from './movement';
import type { DiceCount, MovementViz } from './types';

export type Rng = () => number;
export type { DiceCount };

export interface DiceRollResult {
  value: number;
  faces: number[];
  sides: number;
}

export function movementRangeForCount(count: DiceCount): { min: number; max: number } {
  return count === 2 ? { min: 2, max: 12 } : { min: 1, max: 6 };
}

export function movementRange(viz: MovementViz, count: DiceCount): { min: number; max: number } {
  if (viz === 'spinner') {
    return count === 2 ? { min: 1, max: 12 } : { min: 1, max: 6 };
  }
  return movementRangeForCount(count);
}

export function rollInteger(sides: number, rng: Rng = Math.random): number {
  if (sides < 1) throw new Error('sides must be >= 1');
  return Math.floor(rng() * sides) + 1;
}

export function rollDiceMovement(
  count: DiceCount,
  allowed: number[],
  rng: Rng = Math.random,
): DiceRollResult {
  if (count === 1) {
    const value = sampleMoveValue(allowed, rng);
    return { value, faces: value > 0 ? [value] : [], sides: 6 };
  }
  const d1 = rollInteger(6, rng);
  const d2 = rollInteger(6, rng);
  const sum = d1 + d2;
  const value = allowed.includes(sum) ? sum : 0;
  return { value, faces: [d1, d2], sides: 12 };
}

export function sampleMovement(
  viz: MovementViz,
  count: DiceCount,
  allowed: number[],
  rng: Rng = Math.random,
): DiceRollResult {
  if (viz === 'spinner') {
    const { max } = movementRange(viz, count);
    const value = sampleMoveValue(allowed, rng);
    return { value, faces: value > 0 ? [value] : [], sides: max };
  }
  return rollDiceMovement(count, allowed, rng);
}

export interface DiceRollEvent {
  type: 'DICE_ROLLED';
  value: number;
  sides: number;
}

export function createDiceRollEvent(value: number, sides: number): DiceRollEvent {
  return { type: 'DICE_ROLLED', value, sides };
}
```

In `lib/engine/game.ts`, change the `ROLL_DICE` branch to import `movementRange, sampleMovement` instead of `movementRangeForCount, rollDiceMovement`:

```ts
import { movementRange, sampleMovement, type Rng } from './dice';
```

Inside `case 'ROLL_DICE':` replace the range/sample lines with:

```ts
const { min, max } = movementRange(state.config.movementViz, state.config.diceCount);
const allowed = allowedMoveValues(
  state.board,
  player.token,
  max,
  state.hold,
  state.config.holdEnabled,
  min,
);
const { value, faces, sides } = sampleMovement(
  state.config.movementViz,
  state.config.diceCount,
  allowed,
  state.rng,
);
```

In `lib/samples/climb.ts` config add `movementViz: 'dice'` (keep `diceCount: 1`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/engine/types.test.ts tests/engine/dice.test.ts tests/engine/game.test.ts`

Expected: PASS (existing 2d6 dispatch tests still pass: `faces [1,1]` / `[6,6]`)

- [ ] **Step 5: Commit**

```bash
git add lib/engine/types.ts lib/engine/dice.ts lib/engine/game.ts lib/samples/climb.ts tests/engine/types.test.ts tests/engine/dice.test.ts tests/engine/game.test.ts
git commit -m "feat(engine): spinner 1-12 uniform vs 2d6 movement sampling"
```

---

### Task 2: HUD movement phase + turn-loop lock

**Files:**
- Create: `lib/view/hud-movement.ts`
- Create: `tests/view/hud-movement.test.ts`
- Modify: `lib/view/turn-loop.ts`
- Modify: `tests/view/turn-loop.test.ts`
- Test: `tests/view/hud-movement.test.ts`, `tests/view/turn-loop.test.ts`

**Interfaces:**
- Consumes: existing `isRollLocked` / `shouldShowDealtCard` (tokenSliding + awaitingAction)
- Produces:
  - `export type MovementPhase = 'idle' | 'tumble' | 'slide'`
  - `phaseAfterNewRoll(value: number): MovementPhase` — `value >= 1` → `'tumble'`, else `'idle'`
  - `phaseAfterTumble(phase: MovementPhase): MovementPhase` — `'tumble'` → `'slide'`, else unchanged
  - `phaseAfterSlide(phase: MovementPhase): MovementPhase` — `'slide'` → `'idle'`, else unchanged
  - `shouldShowMovementViz(phase: MovementPhase): boolean` — true for `'tumble'` and `'slide'`
  - `shouldAllowTokenSlide(phase: MovementPhase): boolean` — true only for `'slide'`
  - `isMovementVizActive(phase: MovementPhase): boolean` — `phase !== 'idle'`
  - `isRollLocked({ tokenSliding, awaitingAction, movementVizActive })` — true if any of the three
  - `shouldShowDealtCard({ tokenSliding, currentCard, movementVizActive })` — false when `movementVizActive` or `tokenSliding` or no card

- [ ] **Step 1: Write the failing tests**

Create `tests/view/hud-movement.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  isMovementVizActive,
  phaseAfterNewRoll,
  phaseAfterSlide,
  phaseAfterTumble,
  shouldAllowTokenSlide,
  shouldShowMovementViz,
} from '@/lib/view/hud-movement';

describe('hud movement phase', () => {
  it('starts a tumble for a positive roll and stays idle for held 0', () => {
    expect(phaseAfterNewRoll(4)).toBe('tumble');
    expect(phaseAfterNewRoll(0)).toBe('idle');
  });

  it('token may slide only after tumble, and viz hides after slide', () => {
    expect(phaseAfterTumble('tumble')).toBe('slide');
    expect(phaseAfterTumble('idle')).toBe('idle');
    expect(shouldAllowTokenSlide('tumble')).toBe(false);
    expect(shouldAllowTokenSlide('slide')).toBe(true);
    expect(shouldShowMovementViz('tumble')).toBe(true);
    expect(shouldShowMovementViz('slide')).toBe(true);
    expect(shouldShowMovementViz('idle')).toBe(false);
    expect(phaseAfterSlide('slide')).toBe('idle');
    expect(isMovementVizActive('tumble')).toBe(true);
    expect(isMovementVizActive('slide')).toBe(true);
    expect(isMovementVizActive('idle')).toBe(false);
  });
});
```

Replace the `isRollLocked` / `shouldShowDealtCard` describes in `tests/view/turn-loop.test.ts` with:

```ts
describe('isRollLocked', () => {
  it('locks while the token is sliding', () => {
    expect(isRollLocked({ tokenSliding: true, awaitingAction: false })).toBe(true);
  });

  it('locks while HUD dice or spinner is playing', () => {
    expect(isRollLocked({
      tokenSliding: false,
      awaitingAction: false,
      movementVizActive: true,
    })).toBe(true);
  });

  it('locks while awaiting Play or Pass', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: true })).toBe(true);
  });

  it('unlocks after Play even when the card body stays visible', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false })).toBe(false);
  });

  it('unlocks after Pass', () => {
    expect(isRollLocked({ tokenSliding: false, awaitingAction: false })).toBe(false);
  });
});

describe('shouldShowDealtCard', () => {
  it('hides the card while sliding', () => {
    expect(shouldShowDealtCard({ tokenSliding: true, currentCard: card })).toBe(false);
  });

  it('hides the card while HUD movement viz is playing', () => {
    expect(shouldShowDealtCard({
      tokenSliding: false,
      currentCard: card,
      movementVizActive: true,
    })).toBe(false);
  });

  it('shows the card after slide completes', () => {
    expect(shouldShowDealtCard({ tokenSliding: false, currentCard: card })).toBe(true);
  });

  it('is false with no card', () => {
    expect(shouldShowDealtCard({ tokenSliding: false, currentCard: null })).toBe(false);
  });
});
```

Keep the existing `hasResolvableCard` tests unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/view/hud-movement.test.ts tests/view/turn-loop.test.ts`

Expected: FAIL — `lib/view/hud-movement.ts` missing; `movementVizActive` unused so the new lock/hide cases fail

- [ ] **Step 3: Implement phase helpers and turn-loop**

Create `lib/view/hud-movement.ts`:

```ts
export type MovementPhase = 'idle' | 'tumble' | 'slide';

export function phaseAfterNewRoll(value: number): MovementPhase {
  return value >= 1 ? 'tumble' : 'idle';
}

export function phaseAfterTumble(phase: MovementPhase): MovementPhase {
  return phase === 'tumble' ? 'slide' : phase;
}

export function phaseAfterSlide(phase: MovementPhase): MovementPhase {
  return phase === 'slide' ? 'idle' : phase;
}

export function shouldShowMovementViz(phase: MovementPhase): boolean {
  return phase === 'tumble' || phase === 'slide';
}

export function shouldAllowTokenSlide(phase: MovementPhase): boolean {
  return phase === 'slide';
}

export function isMovementVizActive(phase: MovementPhase): boolean {
  return phase !== 'idle';
}
```

Replace `isRollLocked` and `shouldShowDealtCard` in `lib/view/turn-loop.ts` with:

```ts
export function isRollLocked(opts: {
  tokenSliding: boolean;
  awaitingAction: boolean;
  movementVizActive?: boolean;
}): boolean {
  if (opts.movementVizActive) return true;
  if (opts.tokenSliding) return true;
  return opts.awaitingAction;
}

export function shouldShowDealtCard(opts: {
  tokenSliding: boolean;
  currentCard: Card | null;
  movementVizActive?: boolean;
}): boolean {
  if (!opts.currentCard) return false;
  if (opts.movementVizActive) return false;
  return !opts.tokenSliding;
}
```

Leave `hasResolvableCard` unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/view/hud-movement.test.ts tests/view/turn-loop.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/view/hud-movement.ts lib/view/turn-loop.ts tests/view/hud-movement.test.ts tests/view/turn-loop.test.ts
git commit -m "feat(view): HUD movement phases lock roll until tumble and slide end"
```

---

### Task 3: HUD CSS dice (1d6 or 2d6)

**Files:**
- Create: `lib/view/hud-dice.ts`
- Create: `components/hud/HudDice.tsx`
- Create: `tests/hud/hud-dice.test.tsx`
- Modify: `app/globals.css` (append cube CSS)
- Test: `tests/hud/hud-dice.test.tsx`

**Interfaces:**
- Consumes: `LastRoll` (`value`, `faces`, `id`); `DiceCount`; Task 1 `diceCount` 1 vs 2
- Produces:
  - `HUD_DICE_TUMBLE_MS = 1200`
  - `hudDiceFaces(lastRoll, diceCount): number[]` — uses `lastRoll.faces` when length matches count; 1-die fallback `[value]`; 2-die fallback `[1, value - 1]` clamped to 1–6
  - `hudDieRotation(face: number): { rotateX: number; rotateY: number }` for faces 1–6
  - `HudDice` props: `{ faces: number[]; tumbling: boolean; rollId: number }`
  - Renders 1 or 2 cubes. Each cube `aria-label="Die showing {n}"`. Wrapper `data-testid="hud-dice"`. While `tumbling`, cubes have class `hud-die--tumble`. After tumble, inline transform matches `hudDieRotation`. **No** PlayCanvas, **no** import from `components/board/DiceActor.tsx` or `lib/view/dice-throw.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/hud/hud-dice.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudDice } from '@/components/hud/HudDice';
import { hudDiceFaces, hudDieRotation } from '@/lib/view/hud-dice';

describe('hudDiceFaces', () => {
  it('uses engine faces for one die and two dice', () => {
    expect(hudDiceFaces({ value: 4, sides: 6, id: 1, faces: [4] }, 1)).toEqual([4]);
    expect(hudDiceFaces({ value: 7, sides: 12, id: 2, faces: [3, 4] }, 2)).toEqual([3, 4]);
  });
});

describe('HudDice', () => {
  it('renders one labelled cube for 1d6', () => {
    render(<HudDice faces={[5]} tumbling={false} rollId={1} />);
    expect(screen.getByLabelText('Die showing 5')).toBeDefined();
    expect(screen.getAllByLabelText(/Die showing/)).toHaveLength(1);
  });

  it('renders two cubes for 2d6', () => {
    render(<HudDice faces={[3, 4]} tumbling={false} rollId={2} />);
    expect(screen.getByLabelText('Die showing 3')).toBeDefined();
    expect(screen.getByLabelText('Die showing 4')).toBeDefined();
  });

  it('marks cubes as tumbling', () => {
    const { container } = render(<HudDice faces={[2]} tumbling rollId={3} />);
    expect(container.querySelector('.hud-die--tumble')).not.toBeNull();
  });

  it('settles the cube to the engine face rotation', () => {
    const { container } = render(<HudDice faces={[6]} tumbling={false} rollId={4} />);
    const die = container.querySelector('.hud-die') as HTMLElement;
    const rot = hudDieRotation(6);
    expect(die.style.transform).toContain(`${rot.rotateX}deg`);
    expect(die.style.transform).toContain(`${rot.rotateY}deg`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/hud/hud-dice.test.tsx`

Expected: FAIL — `HudDice` / `hudDiceFaces` not found

- [ ] **Step 3: Implement HUD dice**

Create `lib/view/hud-dice.ts`:

```ts
import type { LastRoll } from '@/lib/engine/game';
import type { DiceCount } from '@/lib/engine/types';

export const HUD_DICE_TUMBLE_MS = 1200;

const FACE_ROTATION: Record<number, { rotateX: number; rotateY: number }> = {
  1: { rotateX: 0, rotateY: 0 },
  2: { rotateX: 0, rotateY: -90 },
  3: { rotateX: 90, rotateY: 0 },
  4: { rotateX: -90, rotateY: 0 },
  5: { rotateX: 0, rotateY: 90 },
  6: { rotateX: 0, rotateY: 180 },
};

export function hudDieRotation(face: number): { rotateX: number; rotateY: number } {
  const clamped = Math.min(6, Math.max(1, face));
  return FACE_ROTATION[clamped] ?? FACE_ROTATION[1]!;
}

export function hudDiceFaces(lastRoll: LastRoll, diceCount: DiceCount): number[] {
  if (lastRoll.faces.length === diceCount) return [...lastRoll.faces];
  if (diceCount === 1) return [Math.min(6, Math.max(1, lastRoll.value))];
  const second = Math.min(6, Math.max(1, lastRoll.value - 1));
  return [1, second];
}
```

Create `components/hud/HudDice.tsx`:

```tsx
'use client';

import { hudDieRotation } from '@/lib/view/hud-dice';

function DieCube({ face, tumbling }: { face: number; tumbling: boolean }) {
  const rot = hudDieRotation(face);
  return (
    <div className="hud-die-scene" aria-label={`Die showing ${face}`} role="img">
      <div
        className={tumbling ? 'hud-die hud-die--tumble' : 'hud-die'}
        style={tumbling ? undefined : { transform: `rotateX(${rot.rotateX}deg) rotateY(${rot.rotateY}deg)` }}
      >
        <span className="hud-die-face hud-die-face--1">1</span>
        <span className="hud-die-face hud-die-face--2">2</span>
        <span className="hud-die-face hud-die-face--3">3</span>
        <span className="hud-die-face hud-die-face--4">4</span>
        <span className="hud-die-face hud-die-face--5">5</span>
        <span className="hud-die-face hud-die-face--6">6</span>
      </div>
    </div>
  );
}

export function HudDice({
  faces,
  tumbling,
  rollId,
}: {
  faces: number[];
  tumbling: boolean;
  rollId: number;
}) {
  return (
    <div className="flex items-center justify-center gap-6 py-4" data-testid="hud-dice" data-roll-id={rollId}>
      {faces.map((face, index) => (
        <DieCube key={`${rollId}-${index}`} face={face} tumbling={tumbling} />
      ))}
    </div>
  );
}
```

Append to `app/globals.css`:

```css
.hud-die-scene {
  width: 72px;
  height: 72px;
  perspective: 400px;
}

.hud-die {
  width: 72px;
  height: 72px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 180ms ease-out;
}

.hud-die--tumble {
  animation: hud-die-tumble 1.2s linear;
}

@keyframes hud-die-tumble {
  0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
  100% { transform: rotateX(720deg) rotateY(540deg) rotateZ(360deg); }
}

.hud-die-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  background: #f8fafc;
  border: 2px solid #334155;
  backface-visibility: hidden;
}

.hud-die-face--1 { transform: rotateY(0deg) translateZ(36px); }
.hud-die-face--2 { transform: rotateY(90deg) translateZ(36px); }
.hud-die-face--3 { transform: rotateX(-90deg) translateZ(36px); }
.hud-die-face--4 { transform: rotateX(90deg) translateZ(36px); }
.hud-die-face--5 { transform: rotateY(-90deg) translateZ(36px); }
.hud-die-face--6 { transform: rotateY(180deg) translateZ(36px); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/hud/hud-dice.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/view/hud-dice.ts components/hud/HudDice.tsx tests/hud/hud-dice.test.tsx app/globals.css
git commit -m "feat(hud): CSS dice tumble in HUD space for 1d6 and 2d6"
```

---

### Task 4: HUD spinner (uniform 1–6 or 1–12)

**Files:**
- Create: `lib/view/hud-spinner.ts`
- Create: `components/hud/HudSpinner.tsx`
- Create: `tests/hud/hud-spinner.test.tsx`
- Modify: `app/globals.css` (append spinner CSS)
- Test: `tests/hud/hud-spinner.test.tsx`

**Interfaces:**
- Consumes: engine integer `value`, spinner max 6 or 12 from `lastRoll.sides` (6 or 12)
- Produces:
  - `HUD_SPINNER_MS = 1400`
  - `spinnerMax(sides: number): 6 | 12` — `sides >= 12` → 12, else 6
  - `spinnerLandingDegrees(value: number, max: 6 | 12, extraTurns = 4): number` — `extraTurns * 360 + (max - value) * (360 / max)` so a top pointer lands on `value`
  - `HudSpinner` props: `{ value: number; max: 6 | 12; spinning: boolean; rollId: number }`
  - Wheel `data-testid="hud-spinner"`, `aria-label="Spinner showing {value} of {max}"`
  - **Not** a designer outcome spinner. No slice labels, weights, or editor.

- [ ] **Step 1: Write the failing test**

Create `tests/hud/hud-spinner.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HudSpinner } from '@/components/hud/HudSpinner';
import { spinnerLandingDegrees, spinnerMax } from '@/lib/view/hud-spinner';

describe('spinner math', () => {
  it('treats sides 12 as a 1-12 wheel, not 2d6', () => {
    expect(spinnerMax(12)).toBe(12);
    expect(spinnerMax(6)).toBe(6);
    expect(spinnerLandingDegrees(1, 12, 0)).toBe(0);
    expect(spinnerLandingDegrees(12, 12, 0)).toBe(330);
    expect(spinnerLandingDegrees(1, 6, 0)).toBe(0);
    expect(spinnerLandingDegrees(6, 6, 0)).toBe(300);
  });
});

describe('HudSpinner', () => {
  it('labels a 1-12 result', () => {
    render(<HudSpinner value={7} max={12} spinning={false} rollId={1} />);
    expect(screen.getByLabelText('Spinner showing 7 of 12')).toBeDefined();
  });

  it('labels a 1-6 result', () => {
    render(<HudSpinner value={3} max={6} spinning={false} rollId={2} />);
    expect(screen.getByLabelText('Spinner showing 3 of 6')).toBeDefined();
  });

  it('applies spinning class while the wheel is moving', () => {
    const { container } = render(<HudSpinner value={4} max={6} spinning rollId={3} />);
    expect(container.querySelector('.hud-spinner-wheel--spin')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/hud/hud-spinner.test.tsx`

Expected: FAIL — `HudSpinner` missing

- [ ] **Step 3: Implement HUD spinner**

Create `lib/view/hud-spinner.ts`:

```ts
export const HUD_SPINNER_MS = 1400;

export function spinnerMax(sides: number): 6 | 12 {
  return sides >= 12 ? 12 : 6;
}

export function spinnerLandingDegrees(value: number, max: 6 | 12, extraTurns = 4): number {
  const clamped = Math.min(max, Math.max(1, value));
  const slice = 360 / max;
  return extraTurns * 360 + (max - clamped) * slice;
}
```

Create `components/hud/HudSpinner.tsx`:

```tsx
'use client';

import { spinnerLandingDegrees } from '@/lib/view/hud-spinner';

export function HudSpinner({
  value,
  max,
  spinning,
  rollId,
}: {
  value: number;
  max: 6 | 12;
  spinning: boolean;
  rollId: number;
}) {
  const degrees = spinnerLandingDegrees(value, max);
  const ticks = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div
      className="hud-spinner"
      data-testid="hud-spinner"
      data-roll-id={rollId}
      role="img"
      aria-label={`Spinner showing ${value} of ${max}`}
    >
      <div className="hud-spinner-pointer" />
      <div
        className={spinning ? 'hud-spinner-wheel hud-spinner-wheel--spin' : 'hud-spinner-wheel'}
        style={spinning ? undefined : { transform: `rotate(${degrees}deg)` }}
      >
        {ticks.map((n) => (
          <span
            key={n}
            className="hud-spinner-tick"
            style={{ transform: `rotate(${(n - 1) * (360 / max)}deg)` }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
```

Append to `app/globals.css`:

```css
.hud-spinner {
  position: relative;
  width: 180px;
  height: 180px;
  margin: 0 auto;
}

.hud-spinner-pointer {
  position: absolute;
  top: -4px;
  left: 50%;
  z-index: 2;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 16px solid #f8fafc;
  transform: translateX(-50%);
}

.hud-spinner-wheel {
  width: 180px;
  height: 180px;
  border-radius: 9999px;
  border: 4px solid #94a3b8;
  background: conic-gradient(from -15deg, #1e293b, #334155, #1e293b);
  position: relative;
  transition: transform 200ms ease-out;
}

.hud-spinner-wheel--spin {
  animation: hud-spinner-spin 1.4s cubic-bezier(0.12, 0.7, 0.2, 1);
}

@keyframes hud-spinner-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(1440deg); }
}

.hud-spinner-tick {
  position: absolute;
  top: 8px;
  left: 50%;
  width: 20px;
  margin-left: -10px;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #e2e8f0;
  transform-origin: 10px 82px;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/hud/hud-spinner.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/view/hud-spinner.ts components/hud/HudSpinner.tsx tests/hud/hud-spinner.test.tsx app/globals.css
git commit -m "feat(hud): CSS number spinner for uniform 1-6 and 1-12"
```

---

### Task 5: Sequence token slide after HUD viz; keep 3D board dice off

**Files:**
- Create: `components/hud/MovementStage.tsx`
- Modify: `components/board/PlayerTokens.tsx`
- Modify: `components/board/BoardScene.tsx`
- Modify: `tests/view/board-scene.test.tsx`
- Create: `tests/hud/movement-stage.test.tsx`
- Test: `tests/hud/movement-stage.test.tsx`, `tests/view/board-scene.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–4; `LastRoll`; `MovementViz`; `DiceCount`; existing `PlayerTokens` slide
- Produces:
  - `MovementStage` props:
    ```ts
    {
      viz: MovementViz;
      lastRoll: LastRoll | null;
      diceCount: DiceCount;
      phase: MovementPhase;
      onTumbleComplete: () => void;
    }
    ```
    If `!shouldShowMovementViz(phase)` or `!lastRoll` or `lastRoll.value < 1`, render `null`. Dice branch: `HudDice` with `hudDiceFaces` and `tumbling={phase === 'tumble'}`. Spinner branch: `HudSpinner` with `spinnerMax(lastRoll.sides)`, `spinning={phase === 'tumble'}`. `useEffect` keyed on `lastRoll.id` + `phase === 'tumble'`: timeout `HUD_DICE_TUMBLE_MS` or `HUD_SPINNER_MS`, then `onTumbleComplete()`.
  - `BoardScene` gains `allowSlide?: boolean` and passes it to `PlayerTokens`. Default `true` so existing tests still slide. **Do not** import `DiceRollLayer` or `DiceActor`. Keep `physicsEnabled = usePhysics ?? false` (play board physics off unless a test passes `usePhysics`).
  - `PlayerTokens` gains `allowSlide?: boolean` default `true`. If the token changed (or full-lap) and `allowSlide` is false, **do not** update `prevToken` and **do not** start `requestAnimationFrame`. When `allowSlide` becomes true, the existing effect re-runs and starts the slide. Add `allowSlide` to the effect deps.
  - Board scene test: `queryByTestId('entity-die')` is null (DiceActor uses `name="die"`).

- [ ] **Step 1: Write the failing tests**

Create `tests/hud/movement-stage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MovementStage } from '@/components/hud/MovementStage';
import { HUD_DICE_TUMBLE_MS } from '@/lib/view/hud-dice';
import { HUD_SPINNER_MS } from '@/lib/view/hud-spinner';

describe('MovementStage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing while idle or on a held zero', () => {
    const { rerender } = render(
      <MovementStage
        viz="dice"
        lastRoll={null}
        diceCount={1}
        phase="idle"
        onTumbleComplete={() => {}}
      />,
    );
    expect(screen.queryByTestId('hud-dice')).toBeNull();
    rerender(
      <MovementStage
        viz="dice"
        lastRoll={{ value: 0, sides: 6, id: 1, faces: [] }}
        diceCount={1}
        phase="idle"
        onTumbleComplete={() => {}}
      />,
    );
    expect(screen.queryByTestId('hud-dice')).toBeNull();
  });

  it('shows HUD dice during tumble and slide, then notifies when tumble ends', () => {
    const onTumbleComplete = vi.fn();
    const lastRoll = { value: 4, sides: 6, id: 2, faces: [4] };
    const { rerender } = render(
      <MovementStage
        viz="dice"
        lastRoll={lastRoll}
        diceCount={1}
        phase="tumble"
        onTumbleComplete={onTumbleComplete}
      />,
    );
    expect(screen.getByTestId('hud-dice')).toBeDefined();
    expect(onTumbleComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS);
    expect(onTumbleComplete).toHaveBeenCalledTimes(1);
    rerender(
      <MovementStage
        viz="dice"
        lastRoll={lastRoll}
        diceCount={1}
        phase="slide"
        onTumbleComplete={onTumbleComplete}
      />,
    );
    expect(screen.getByTestId('hud-dice')).toBeDefined();
  });

  it('shows the spinner for 1-12 mode and uses spinner duration', () => {
    const onTumbleComplete = vi.fn();
    render(
      <MovementStage
        viz="spinner"
        lastRoll={{ value: 7, sides: 12, id: 3, faces: [7] }}
        diceCount={2}
        phase="tumble"
        onTumbleComplete={onTumbleComplete}
      />,
    );
    expect(screen.getByTestId('hud-spinner')).toBeDefined();
    expect(screen.getByLabelText('Spinner showing 7 of 12')).toBeDefined();
    vi.advanceTimersByTime(HUD_SPINNER_MS);
    expect(onTumbleComplete).toHaveBeenCalledTimes(1);
  });
});
```

Append to `tests/view/board-scene.test.tsx`:

```ts
it('does not mount a 3D die on the play board', () => {
  const game = createGame(climbSample, { diceEnabled: true, movementViz: 'dice' });
  render(<BoardScene game={game} />);
  expect(screen.queryByTestId('entity-die')).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/hud/movement-stage.test.tsx tests/view/board-scene.test.tsx`

Expected: FAIL — `MovementStage` missing. Board-scene die assertion should already pass (die is not mounted); if it fails, `BoardScene` imported leftover dice — remove that import.

- [ ] **Step 3: Implement MovementStage, gate slides, keep board dice off**

Create `components/hud/MovementStage.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import type { LastRoll } from '@/lib/engine/game';
import type { DiceCount, MovementViz } from '@/lib/engine/types';
import { HudDice } from '@/components/hud/HudDice';
import { HudSpinner } from '@/components/hud/HudSpinner';
import { HUD_DICE_TUMBLE_MS, hudDiceFaces } from '@/lib/view/hud-dice';
import {
  type MovementPhase,
  shouldShowMovementViz,
} from '@/lib/view/hud-movement';
import { HUD_SPINNER_MS, spinnerMax } from '@/lib/view/hud-spinner';

export function MovementStage({
  viz,
  lastRoll,
  diceCount,
  phase,
  onTumbleComplete,
}: {
  viz: MovementViz;
  lastRoll: LastRoll | null;
  diceCount: DiceCount;
  phase: MovementPhase;
  onTumbleComplete: () => void;
}) {
  const visible = Boolean(
    shouldShowMovementViz(phase) && lastRoll && lastRoll.value >= 1,
  );

  useEffect(() => {
    if (!visible || phase !== 'tumble' || !lastRoll) return;
    const ms = viz === 'spinner' ? HUD_SPINNER_MS : HUD_DICE_TUMBLE_MS;
    const timer = window.setTimeout(() => onTumbleComplete(), ms);
    return () => window.clearTimeout(timer);
  }, [visible, phase, lastRoll?.id, viz, onTumbleComplete, lastRoll]);

  if (!visible || !lastRoll) return null;

  if (viz === 'spinner') {
    return (
      <HudSpinner
        value={lastRoll.value}
        max={spinnerMax(lastRoll.sides)}
        spinning={phase === 'tumble'}
        rollId={lastRoll.id}
      />
    );
  }

  return (
    <HudDice
      faces={hudDiceFaces(lastRoll, diceCount)}
      tumbling={phase === 'tumble'}
      rollId={lastRoll.id}
    />
  );
}
```

In `components/board/PlayerTokens.tsx`, add `allowSlide = true` to props. Inside the player loop, after computing `fullLap` / `sameCell` and **before** `const waypoints = ...`:

```ts
if (!allowSlide) {
  continue;
}
```

Add `allowSlide` to the `useEffect` dependency array `[board, players, lastRoll, allowSlide, onSlideStart, onSlideComplete]`.

Do **not** write `prevToken.current[player.id] = player.token` in the `!allowSlide` branch.

Replace `components/board/BoardScene.tsx` with:

```tsx
'use client';

import { Entity } from '@playcanvas/react';
import { Camera, Light } from '@playcanvas/react/components';
import type { GameState } from '@/lib/engine/game';
import { FloorStack } from './FloorStack';
import { PlayCanvasViewport } from './PlayCanvasViewport';
import { PlayerTokens } from './PlayerTokens';

export function BoardScene({
  game,
  usePhysics,
  allowSlide = true,
  onTokenSlideStart,
  onTokenSlideComplete,
}: {
  game: GameState;
  usePhysics?: boolean;
  allowSlide?: boolean;
  onTokenSlideStart?: () => void;
  onTokenSlideComplete?: () => void;
}) {
  const physicsEnabled = usePhysics ?? false;

  return (
    <div className="h-[480px] w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
      <PlayCanvasViewport usePhysics={physicsEnabled}>
        <Entity name="camera" position={[0, 7, 10]} rotation={[-32, 0, 0]}>
          <Camera clearColor="#0f172a" fov={50} nearClip={0.1} farClip={100} />
        </Entity>
        <Entity name="sun" rotation={[-55, 40, 0]}>
          <Light type="directional" intensity={1.5} />
        </Entity>
        <Entity name="fill" position={[2, 5, 3]}>
          <Light type="omni" intensity={0.8} />
        </Entity>
        <FloorStack board={game.board} usePhysics={physicsEnabled} />
        <PlayerTokens
          board={game.board}
          players={game.players.players}
          lastRoll={game.lastRoll}
          allowSlide={allowSlide}
          onSlideStart={onTokenSlideStart}
          onSlideComplete={onTokenSlideComplete}
        />
      </PlayCanvasViewport>
    </div>
  );
}
```

Do not import leftover dice modules. Do not set `usePhysics` from `game.config.diceEnabled`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test tests/hud/movement-stage.test.tsx tests/view/board-scene.test.tsx tests/view/token-actor.test.tsx tests/view/dice-layer.test.ts tests/view/dice-roll-layer.test.tsx`

Expected: PASS. Leftover board-dice unit tests may still pass; they cover unused files and must not be wired into `BoardScene`.

- [ ] **Step 5: Commit**

```bash
git add components/hud/MovementStage.tsx components/board/PlayerTokens.tsx components/board/BoardScene.tsx tests/hud/movement-stage.test.tsx tests/view/board-scene.test.tsx
git commit -m "feat(hud): sequence HUD tumble before token slide, keep 3D dice off board"
```

---

### Task 6: Wire GameHud, toggles, LastRoll, README

**Files:**
- Modify: `components/hud/GameHud.tsx`
- Modify: `components/hud/FeatureToggles.tsx`
- Modify: `components/hud/LastRoll.tsx`
- Modify: `README.md`
- Modify: `tests/hud/game-hud.test.tsx`
- Modify: `tests/hud/last-roll.test.tsx`
- Create: `tests/hud/feature-toggles.test.tsx`
- Test: `tests/hud/game-hud.test.tsx`, `tests/hud/last-roll.test.tsx`, `tests/hud/feature-toggles.test.tsx`, then `npm test`

**Interfaces:**
- Consumes: Tasks 1–5
- Produces:
  - `GameHud` holds `phase: MovementPhase` (default `'idle'`). On `game.lastRoll.id` change, `setPhase(phaseAfterNewRoll(value))`. `onTumbleComplete` → `phaseAfterTumble`. `onTokenSlideComplete` → `phaseAfterSlide` **and** `setTokenSliding(false)`.
  - `allowSlide={shouldAllowTokenSlide(phase)}`
  - `movementVizActive={isMovementVizActive(phase)}` fed to `isRollLocked` and `shouldShowDealtCard`
  - Centre HUD shows `MovementStage` above `LastRoll`
  - Roll button label: dice → **Roll dice**; spinner → **Spin** (accessible names exactly those strings)
  - `FeatureToggles`: remove **3D dice**. Add switch `id="spinner-toggle"` label **HUD spinner**. Checked when `movementViz === 'spinner'`. Two-dice switch label is **Spinner 1–12** when spinner, else **2 dice (2–12)**. Still writes `diceCount: 2 | 1`.
  - `LastRoll` accepts `movementViz?: MovementViz` default `'dice'`. Spinner positive: `Last spin: {value} (1–{sides})` where sides is 6 or 12. Dice copy unchanged. Held 0 still `Last roll: 0 — stairs held`.
  - README feature flags describe HUD dice / HUD spinner; no ammo.js-on-board copy.

- [ ] **Step 1: Write the failing tests**

Append to `tests/hud/last-roll.test.tsx`:

```tsx
it('shows spinner 1-12 copy, not 2d6 faces', () => {
  render(
    <LastRoll
      lastRoll={{ value: 7, sides: 12, id: 4, faces: [7] }}
      movementViz="spinner"
    />,
  );
  expect(screen.getByText('Last spin: 7 (1–12)')).toBeDefined();
  expect(screen.queryByText(/2d6/)).toBeNull();
});
```

Create `tests/hud/feature-toggles.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FeatureToggles } from '@/components/hud/FeatureToggles';
import { defaultGameConfig } from '@/lib/engine/types';

describe('FeatureToggles', () => {
  it('replaces 3D dice with a HUD spinner switch', () => {
    const onChange = vi.fn();
    render(<FeatureToggles config={defaultGameConfig()} onChange={onChange} />);
    expect(screen.queryByText('3D dice')).toBeNull();
    expect(screen.getByText('HUD spinner')).toBeDefined();
    expect(screen.getByText('2 dice (2–12)')).toBeDefined();
    fireEvent.click(screen.getByRole('switch', { name: 'HUD spinner' }));
    expect(onChange).toHaveBeenCalledWith({ movementViz: 'spinner' });
  });

  it('relabels the count toggle for spinner 1-12', () => {
    render(
      <FeatureToggles
        config={{ ...defaultGameConfig(), movementViz: 'spinner' }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Spinner 1–12')).toBeDefined();
  });
});
```

Replace `tests/hud/game-hud.test.tsx` with:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('@/components/board/BoardScene', () => ({
  BoardScene: ({
    allowSlide,
    onTokenSlideComplete,
  }: {
    allowSlide?: boolean;
    onTokenSlideComplete?: () => void;
  }) => (
    <div data-testid="board" data-allow-slide={allowSlide ? 'yes' : 'no'}>
      {allowSlide ? (
        <button type="button" onClick={() => onTokenSlideComplete?.()}>
          Finish slide
        </button>
      ) : null}
    </div>
  ),
}));

import { GameHud } from '@/components/hud/GameHud';
import { climbSample } from '@/lib/samples/climb';
import { HUD_DICE_TUMBLE_MS } from '@/lib/view/hud-dice';

describe('GameHud', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('has Roll dice and no Climb stair debug control', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Climb stair' })).toBeNull();
    expect(screen.getByText('No roll yet')).toBeDefined();
    expect(screen.getByText('No card drawn')).toBeDefined();
  });

  it('shows remaining passes for the active player', () => {
    render(<GameHud bootstrap={climbSample} />);
    expect(screen.getByText('Passes left: climb 1')).toBeDefined();
  });

  it('plays HUD dice, then token slide, then card, locking Roll until Play', () => {
    render(<GameHud bootstrap={{ ...climbSample, rng: () => 0 }} />);
    const roll = screen.getByRole('button', { name: 'Roll dice' });
    fireEvent.click(roll);
    expect(roll).toHaveProperty('disabled', true);
    expect(screen.getByTestId('hud-dice')).toBeDefined();
    expect(screen.getByTestId('board').getAttribute('data-allow-slide')).toBe('no');
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();

    vi.advanceTimersByTime(HUD_DICE_TUMBLE_MS);
    expect(screen.getByTestId('hud-dice')).toBeDefined();
    expect(screen.getByTestId('board').getAttribute('data-allow-slide')).toBe('yes');
    expect(screen.queryByRole('button', { name: 'Play' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Finish slide' }));
    expect(screen.queryByTestId('hud-dice')).toBeNull();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined();
    expect(roll).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(roll).toHaveProperty('disabled', false);
  });

  it('uses Spin and a 1-12 spinner when HUD spinner is on', () => {
    render(<GameHud bootstrap={{ ...climbSample, rng: () => 0 }} />);
    fireEvent.click(screen.getByRole('switch', { name: 'HUD spinner' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Spinner 1–12' }));
    const spin = screen.getByRole('button', { name: 'Spin' });
    fireEvent.click(spin);
    expect(screen.getByTestId('hud-spinner')).toBeDefined();
    expect(screen.getByLabelText(/Spinner showing/)).toBeDefined();
  });
});
```

Do not import `useEffect` in this test file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test tests/hud/last-roll.test.tsx tests/hud/feature-toggles.test.tsx tests/hud/game-hud.test.tsx`

Expected: FAIL — **3D dice** still present; no HUD dice after roll; Last spin copy missing

- [ ] **Step 3: Implement HUD wiring**

Replace `components/hud/LastRoll.tsx` with:

```tsx
'use client';

import type { LastRoll as LastRollValue } from '@/lib/engine/game';
import type { MovementViz } from '@/lib/engine/types';

export function LastRoll({
  lastRoll,
  movementViz = 'dice',
}: {
  lastRoll: LastRollValue | null;
  movementViz?: MovementViz;
}) {
  if (!lastRoll) {
    return <p className="text-slate-400">No roll yet</p>;
  }
  if (lastRoll.value === 0) {
    return <p>Last roll: 0 — stairs held</p>;
  }
  if (movementViz === 'spinner') {
    return <p>Last spin: {lastRoll.value} (1–{lastRoll.sides})</p>;
  }
  if (lastRoll.faces.length === 2) {
    return (
      <p>
        Last roll: {lastRoll.faces[0]} + {lastRoll.faces[1]} = {lastRoll.value} (2d6)
      </p>
    );
  }
  return <p>Last roll: {lastRoll.value} (d{lastRoll.sides})</p>;
}
```

Replace `components/hud/FeatureToggles.tsx` with:

```tsx
'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ActionMode, GameConfig } from '@/lib/engine/types';

const ACTION_MODES: ActionMode[] = ['both', 'positive', 'pass', 'neither'];

export function FeatureToggles({
  config,
  onChange,
}: {
  config: GameConfig;
  onChange: (patch: Partial<GameConfig>) => void;
}) {
  const spinner = config.movementViz === 'spinner';
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-800 p-4">
      <h2 className="text-sm font-medium text-slate-200">Features</h2>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="spinner-toggle">HUD spinner</Label>
        <Switch
          id="spinner-toggle"
          checked={spinner}
          onCheckedChange={(checked) => onChange({ movementViz: checked ? 'spinner' : 'dice' })}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="two-dice-toggle">{spinner ? 'Spinner 1–12' : '2 dice (2–12)'}</Label>
        <Switch
          id="two-dice-toggle"
          checked={config.diceCount === 2}
          onCheckedChange={(checked) => onChange({ diceCount: checked ? 2 : 1 })}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="hold-toggle">Per-floor hold</Label>
        <Switch
          id="hold-toggle"
          checked={config.holdEnabled}
          onCheckedChange={(checked) => onChange({ holdEnabled: checked })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="action-mode">Card actions</Label>
        <select
          id="action-mode"
          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
          value={config.actionMode}
          onChange={(e) => onChange({ actionMode: e.currentTarget.value as ActionMode })}
        >
          {ACTION_MODES.map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

Replace `components/hud/GameHud.tsx` with:

```tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardScene } from '@/components/board/BoardScene';
import { Button } from '@/components/ui/button';
import { CardPanel } from '@/components/hud/CardPanel';
import { FeatureToggles } from '@/components/hud/FeatureToggles';
import { HoldStatus } from '@/components/hud/HoldStatus';
import { PassStatus } from '@/components/hud/PassStatus';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';
import { LastRoll } from '@/components/hud/LastRoll';
import { MovementStage } from '@/components/hud/MovementStage';
import { PlayerBar } from '@/components/hud/PlayerBar';
import { useGameStore } from '@/hooks/use-game-store';
import type { GameBootstrap } from '@/lib/engine/game';
import {
  isMovementVizActive,
  phaseAfterNewRoll,
  phaseAfterSlide,
  phaseAfterTumble,
  shouldAllowTokenSlide,
  type MovementPhase,
} from '@/lib/view/hud-movement';
import { isRollLocked, shouldShowDealtCard } from '@/lib/view/turn-loop';

export function GameHud({ bootstrap }: { bootstrap: GameBootstrap }) {
  const { game, dispatch, updateConfig, importCards } = useGameStore(bootstrap);
  const [importOpen, setImportOpen] = useState(false);
  const [tokenSliding, setTokenSliding] = useState(false);
  const [phase, setPhase] = useState<MovementPhase>('idle');
  const seenRollId = useRef(0);
  const holdFloor = game.board.floors.find((f) => f.id === game.hold?.floorId);
  const activePlayer = game.players.players.find((p) => p.id === game.players.activePlayerId);
  const movementVizActive = isMovementVizActive(phase);

  useEffect(() => {
    const roll = game.lastRoll;
    if (!roll || roll.id === seenRollId.current) return;
    seenRollId.current = roll.id;
    setPhase(phaseAfterNewRoll(roll.value));
  }, [game.lastRoll]);

  const rollLocked = isRollLocked({
    tokenSliding,
    awaitingAction: game.cards.awaitingAction,
    movementVizActive,
  });
  const visibleCard = shouldShowDealtCard({
    tokenSliding,
    currentCard: game.cards.currentCard,
    movementVizActive,
  })
    ? game.cards.currentCard
    : null;

  const onTokenSlideStart = useCallback(() => setTokenSliding(true), []);
  const onTumbleComplete = useCallback(() => {
    setPhase((current) => phaseAfterTumble(current));
  }, []);
  const onTokenSlideComplete = useCallback(() => {
    setTokenSliding(false);
    setPhase((current) => phaseAfterSlide(current));
  }, []);

  const spinner = game.config.movementViz === 'spinner';

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        <BoardScene
          game={game}
          allowSlide={shouldAllowTokenSlide(phase)}
          onTokenSlideStart={onTokenSlideStart}
          onTokenSlideComplete={onTokenSlideComplete}
        />
        <PlayerBar
          players={game.players.players}
          activePlayerId={game.players.activePlayerId}
        />
        <MovementStage
          viz={game.config.movementViz}
          lastRoll={game.lastRoll}
          diceCount={game.config.diceCount}
          phase={phase}
          onTumbleComplete={onTumbleComplete}
        />
        <LastRoll lastRoll={game.lastRoll} movementViz={game.config.movementViz} />
        <HoldStatus hold={game.hold} floorLabel={holdFloor?.label ?? 'this floor'} />
        <PassStatus
          passesEnabled={game.config.passesEnabled}
          passesLeftByPack={activePlayer?.passesLeftByPack ?? {}}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => dispatch({ type: 'ROLL_DICE' })}
            disabled={rollLocked}
          >
            {spinner ? 'Spin' : 'Roll dice'}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import cards
          </Button>
        </div>
      </div>
      <aside className="flex flex-col gap-4">
        <FeatureToggles config={game.config} onChange={updateConfig} />
        <CardPanel
          actionMode={game.config.actionMode}
          currentCard={visibleCard}
          bodyVisible={game.cards.bodyVisible}
          awaitingAction={game.cards.awaitingAction}
          passesEnabled={game.config.passesEnabled}
          passesLeftByPack={activePlayer?.passesLeftByPack ?? {}}
          onDispatch={dispatch}
        />
      </aside>
      <ImportCardsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importCards}
      />
    </div>
  );
}
```

Empty-corridor / value-0 path: `phaseAfterNewRoll(0)` is `'idle'`, so Roll does not stay locked from viz. If `phase` is `'slide'` but `PlayerTokens` finds no waypoints, it must still call `onSlideComplete` (existing code already calls it when `!to`). If a positive roll produces waypoints, Finish-slide in tests / real `onSlideComplete` returns phase to idle.

README — replace **Play the Climb sample** step 2 and **Feature flags**:

```md
2. Click **Roll dice**. HUD dice tumble to the engine integer, **then** the token slides, **then** the dice disappear and a card deals only if you **stop** on a packed corridor cell. Toggle **HUD spinner** to spin a uniform 1–6 (or **Spinner 1–12**) instead of 1d6 / 2d6.

## Feature flags

- **HUD spinner** — number wheel instead of HUD dice. Spinner 1-die range is 1–6; **Spinner 1–12** is uniform 1–12, not 2d6. Dice mode keeps 1d6 or 2d6.
- **2 dice (2–12)** — in dice mode, two cubes and a 2d6 sum. In spinner mode the same switch is **Spinner 1–12**.
- **Per-floor hold** — per-pack reveal quotas before leaving a hold floor by stairs.
- **Card actions** — `both`, `positive`, `pass`, or `neither`. Pass does not count as a reveal. Neither counts on deal.

Dice never tumble on the 3D board. PlayCanvas is the board (floors + tokens) only.
```

- [ ] **Step 4: Run HUD tests + full suite**

Run: `npm test tests/hud/last-roll.test.tsx tests/hud/feature-toggles.test.tsx tests/hud/game-hud.test.tsx`

Expected: PASS

Run: `npm test`

Expected: all tests PASS. If leftover `tests/view/dice-lifetime.test.ts` still asserts linger-on-board, leave it — those helpers are unused by HUD. Do not remount board dice to make them “used”.

- [ ] **Step 5: Manual check (dev server)**

Run: `npm run dev`

Expected at http://127.0.0.1:4318:

1. **Roll dice** → CSS die appears in the HUD (not on the ring board) → token waits → die settles → token slides → die vanishes → card title + Play/Pass. Roll stays disabled until Play or Pass.
2. Toggle **2 dice (2–12)** → two HUD cubes, Last roll `a + b = s (2d6)`.
3. Toggle **HUD spinner** → button **Spin**, wheel 1–6; **Spinner 1–12** → wheel 1–12 (a 1 is legal). No designer slice editor.
4. Held 0: no HUD die, Last roll stairs-held, Roll not stuck.
5. No 3D cube bouncing on floor tiles.

- [ ] **Step 6: Commit**

```bash
git add components/hud/GameHud.tsx components/hud/FeatureToggles.tsx components/hud/LastRoll.tsx README.md tests/hud/game-hud.test.tsx tests/hud/last-roll.test.tsx tests/hud/feature-toggles.test.tsx
git commit -m "feat(hud): wire dice/spinner sequence, lock roll, keep board dice off"
```

---

## Self-Review

### Spec coverage (slice 3 only)

| Requirement | Task(s) |
|-------------|---------|
| Dice throw/tumble in HUD space, not 3D board | 3, 5, 6 |
| Then token moves; after token finishes, dice disappear; then card | 2, 5, 6 |
| Roll locked until resolve (extend existing turn-loop) | 2, 6 |
| Toggle 1 die (1–6) vs 2 dice (2d6 / 2–12); HUD dice match faces | 1, 3, 6 |
| HUD spinner alternative: uniform 1–6 or **1–12**, not 2d6 | 1, 4, 6 |
| Designer spinner UI out | no designer files |
| Engine integer-first | 1 (sample then viz) |
| PlayCanvas is the board view only | 5 (`BoardScene` has no `DiceActor`) |
| Leftover `DiceActor` / `DiceRollLayer` / `dice-throw` stay off the play board | 5 |
| Game library, layout designer, publish, FP, rooms, timer cards, extra buttons, card designer | **out** |
| WebGL zero-size polish | **out** (do not touch `PlayCanvasViewport` unless a one-liner appears) |

Original spec “dice live on the 3D board” is **overridden** by this slice and `docs/preferences.md`. Do not re-litigate by remounting ammo.js dice.

### Placeholder scan

No TBD / implement-later / similar-to-Task-N steps. New files have full contents. `PlayerTokens` change is the `allowSlide` gate, not a rewrite of waypoint math.

### Type consistency

`MovementViz` and `MovementPhase` names are stable across tasks. `sampleMovement` is what `dispatch` calls. `HUD_DICE_TUMBLE_MS` / `HUD_SPINNER_MS` are what `MovementStage` waits on. `shouldAllowTokenSlide` is the only slide gate. `LastRoll.faces` still carries 2d6 pips; spinner `faces` is a single integer.

### Known implementer pitfalls

- Do not start the token slide in the same React commit as `lastRoll` — `allowSlide` must stay false through `'tumble'`.
- Do not update `prevToken` while `allowSlide` is false, or the slide path is lost.
- Do not import leftover board dice into HUD “to reuse physics”. Copy face integers from `lastRoll.faces` only.
- Spinner count-2 **must** use `min: 1`. Reusing `movementRangeForCount` would make spinner 2–12 and hide 1.
- `onTumbleComplete` must be wrapped in `useCallback` so the tumble `useEffect` does not retrigger every render.
- Empty-corridor landings still tumble then slide then hide; there is just no Play button. Value `0` skips viz entirely.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-09-21-slice-3-hud-movement.md`.**

This slice is ready for implementation (Composer) after the plan exists on both paths. Do not implement in the planning pass.
