# Designer Group 14 — Movement dice/spinner + spinner templates

> **For agentic workers:** TDD per task. Commit after each task. No approval pauses. Cursor models only. Implement after Group 13 on `feat/designer-groups-12-14`.

**Goal:** Start tab authors token movement: **Dice** (1 or 2) or **Spinner** (pick a catalog spinner). Spinners get a small built-in **template** set plus optional image/sound. A **pointer** sits on top; the wheel **animates** to the landed segment.

**Architecture:** Reuse `GameConfig.movementViz` + `diceCount`. Add `movementSpinnerId`. Grow `SpinnerDef` with `template`, `image`, `audio`. Built-in templates live in `lib/designer/spinner-templates.ts` (look + duration/easing). Movement sample uses that spinner’s segments (leading integer in the label, else index+1). HUD `HudSpinner` renders pie slices + pointer + template class.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest. No new packages.

**Spec:** `/cursor/stores/self/docs/designer-screen-amendments.md` Group 14.

**Base:** Group 13 committed on `feat/designer-groups-12-14`. Push `github HEAD:main` + origin when Groups 12–14 pass.

## Global Constraints

- Designer picks **template + segment count / per-segment props** — do not invent a second spinner catalog
- HUD tile **spinner** widget remains the movement wheel (now styled from the movement spinner when one is chosen)
- Outcome tile/card spins reuse the same wheel look
- Function outcomes still labels only
- Polar hidden. No PlayCanvas in engine/designer/library
- Dev port **4318**
- GitHub: `mikemwp/boardgame-designer`

## Locked answers

- Templates (built-in): `classic` (default), `wood`, `neon`, `compass` — CSS look + animation only
- Start tab is the authoring source for Dice/Spinner + dice count + which spinner
- Test HUD-widget auto-pick (`preferredMovementViz`) still applies when both widgets exist or Start left the default
- If Spinner is chosen but no catalog spinner exists, keep the numeric 1–6 / 1–12 wheel (no Test block)
- Pointer is a fixed overlay; the **wheel** rotates so the landed slice sits under the pointer

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `SpinnerTemplateId`; `SpinnerDef.template/image/audio`; `GameConfig.movementSpinnerId` |
| `lib/designer/spinner-templates.ts` | `SPINNER_TEMPLATES` |
| `lib/designer/spinners.ts` | update template / media; `setSegmentCount` |
| `lib/engine/spinner.ts` | `segmentMoveValue`; `movementRangeForSpinner` |
| `lib/engine/dice.ts` / `game.ts` | sample movement from the chosen spinner |
| `lib/view/hud-spinner.ts` | landing degrees from slice weights; template duration |
| `components/designer/StartEditor.tsx` | Dice 1/2 or Spinner picker |
| `components/designer/SpinnerEditor.tsx` | template, image, sound, segment count |
| `components/designer/LayoutDesigner.tsx` | pass config + catalog into Start |
| `components/library/StudioShell.tsx` | persist `movementSpinnerId` via existing config |
| `components/hud/HudSpinner.tsx` / `MovementStage.tsx` | pie + pointer + template + optional image/sound |
| `README.md` | Start movement + templates |
| Tests per task | Fail first |

**Out:** Function-linked spin effects. Polar unhide.

---

### Task 1: Templates + movement sample (TDD)

**Files:** `types.ts`, `spinner-templates.ts`, `spinners.ts`, `spinner.ts`, `dice.ts`, `game.ts`  
**Test:** `tests/designer/spinners.test.ts`, `tests/engine/dice.test.ts`, `tests/engine/game.test.ts`

```ts
export type SpinnerTemplateId = 'classic' | 'wood' | 'neon' | 'compass';

export const SPINNER_TEMPLATES: Array<{
  id: SpinnerTemplateId;
  label: string;
  durationMs: number;
  easing: string;
}>;

export function segmentMoveValue(segment: SpinnerSegment, index: number): number;
export function movementRangeForSpinner(spinner: SpinnerDef): { min: number; max: number };
```

`createSpinner` defaults `template: 'classic'`. `setSegmentCount(list, id, n)` keeps ≥2 segments.

`sampleMovement`: when `viz === 'spinner'` and a spinner is passed, pick a segment (allowed move values), return `{ value, faces: [value], sides: max }`.

`ROLL_DICE` uses `config.movementSpinnerId` when `movementViz === 'spinner'`.

- [ ] Fail, implement, pass
- [ ] Commit `feat(engine): movement spinner sample and templates`

---

### Task 2: Start tab Dice/Spinner + spinner chrome

**Files:** `StartEditor.tsx`, `SpinnerEditor.tsx`, `LayoutDesigner.tsx`, `StudioShell.tsx`  
**Test:** `tests/designer/start-editor.test.tsx`, `tests/designer/layout-designer.test.tsx`

Start editor (after background):

- **Movement:** Dice | Spinner
- Dice → **1 die** / **2 dice**
- Spinner → select catalog spinner by name (`aria-label="Movement spinner"`). Empty: “Create a spinner on the Spinners tab.”

`StartEditor` gains `config`, `spinners`, `onConfigChange`.

Spinners tab: Template select; Image + Audio fields; optional **Segments** count input (min 2) besides Add/Remove.

- [ ] Fail, implement, pass
- [ ] Commit `feat(designer): Start movement and spinner templates`

---

### Task 3: Pointer + animate + image/sound

**Files:** `HudSpinner.tsx`, `lib/view/hud-spinner.ts`, `app/globals.css`, `MovementStage.tsx`, `GameHud.tsx`  
**Test:** `tests/hud/hud-spinner.test.tsx`, `tests/hud/movement-stage.test.tsx`

`HudSpinner` accepts optional `spinner: SpinnerDef` (segments + template + image). Renders:

- pointer overlay (`data-testid="spinner-pointer"`)
- conic pie of named slices
- `data-template={template}` class (`hud-spinner--wood` etc.)
- spin animation using that template’s duration
- optional `background-image` from `spinner.image`

When no `spinner` prop, keep today’s numeric ticks (classic).

Play `spinner.audio` when a spin starts (reuse `createAudioPlayer` / land-audio path — cue from `GameHud` on new `lastRoll`/`lastSpin` if the spinner has audio).

- [ ] Fail, implement, pass
- [ ] Commit `feat(hud): spinner pointer, templates, and spin audio`

---

### Task 4: README + verify + push

README: Start movement Dice 1/2 or catalog spinner; templates; pointer; animate; image/sound.

```bash
npm test
git push -u origin feat/designer-groups-12-14
git push github HEAD:main
git push origin HEAD:main
```

## Acceptance

- Start tab chooses Dice (1/2) or a catalog spinner
- Designer picks template + segments (+ optional image/sound)
- Pointer marks the stopped slice; wheel animates
- Save/Open restores `movementViz`, `diceCount`, `movementSpinnerId`, and spinner style fields
