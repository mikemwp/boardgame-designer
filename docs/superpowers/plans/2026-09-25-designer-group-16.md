# Designer Group 16 — spin-wheel HUD + Spinners preview

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, no approval pauses). TDD per task. Commit after each task. Cursor models only. Do not implement the hosted studio website.

**Goal:** Replace the CSS `HudSpinner` wheel with CrazyTim **spin-wheel** (DOM canvas) so Test/Play animates to an engine-picked segment, and add an interactive Spinners-tab / designer-Preview spinner surface (flick + Spin, spinner switcher).

**Architecture:** `spin-wheel` is view-only. `SpinnerDef`, `sampleSegment` / `sampleSpinnerMove`, `lib/designer/spinners.ts`, templates, and tile/card `spinnerId` links stay as they are. A pure adapter maps a spinner (or numeric 1–6 / 1–12 wheel) to `Wheel` items + `spinToItem` args. `HudSpinner` hosts the canvas and the existing DOM pointer. Designer Preview reuses that wrapper: `isInteractive` on only there; Test/Play always `spinToItem` with flick off.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest, npm **`spin-wheel` 5.0.2** (MIT). Dev port **4318**.

**Spec:** store `docs/designer-screen-amendments.md` Group 16. Shortlist: store `docs/spinner-shortlist.md`.

**Base:** GitHub / origin `main` at `735e846` (Group 15).

## Global Constraints

- Cursor models only. No approval pauses.
- **Do not replace** `SpinnerDef`, `sampleSegment`, `sampleSpinnerMove`, `lib/designer/spinners.ts`, templates, or tile/card links.
- spin-wheel is the **view**. Engine picks the segment first, then `spinToItem`.
- Not PlayCanvas. Not hosted-site work. Do not start Group 17.
- Do not put prices, accounts, or listing text into game JSON.
- Polar shapes stay hidden. No PlayCanvas in engine / designer / library.
- GitHub: `mikemwp/boardgame-designer`. Push `github HEAD:main` after verify.

## Locked answers

### Test / Play HUD
- Replace the CSS conic wheel inside `HudSpinner` with a canvas container that constructs `new Wheel(el, props)`.
- Keep the existing DOM pointer overlay (`data-testid="spinner-pointer"`).
- Template `durationMs` + cubic-bezier easing still drive the spin.
- Face image: `Wheel.image` from `SpinnerDef.image.src` (HTMLImageElement).
- Tick / stop hooks: `onCurrentIndexChange` / `onRest` on the wrapper (GameHud may keep today’s start-of-spin cue).
- Play path: `spinnerSegmentIndex` (or `value - 1` on the numeric wheel) → `spinToItem(index, durationMs, true, 4, 1, easing)`.
- `isInteractive` **off** in Test/Play (override the library default `true`).

### Spinners tab Preview
- **Preview** button **top-right** of the Spinners tab.
- Disabled when no spinner is selected.
- Opens the **same designer Preview dialog** in **spinner mode**, showing the selected spinner via the HUD wrapper.
- Edits to the selected spinner (name, segments, template, image, audio) update the open preview.

### Designer spinner preview
- **Flick-to-spin:** `isInteractive` **on here only**.
- **Spin** button: `sampleSegment(spinner, Math.random)` then `spinToItem` on that index (engine-first even in the designer).
- When Preview is **on a spinner**, the in-preview **level / room** buttons **become spinner buttons** (one per designed spinner, same `preview-switcher` chrome: outline / secondary). Click a spinner button to show that spinner. Flick spins the current spinner, not the 3D board.

### Canvas Preview
- Tile-tool **Preview** still opens the 3D board + level/room switcher (`previewKind = 'board'`).
- Spinners-tab **Preview** opens the same dialog with `previewKind = 'spinner'`.

---

## File map

| Path | Change |
|------|--------|
| `package.json` | Add `spin-wheel` |
| `types/spin-wheel.d.ts` | Minimal `Wheel` typings if the package has none |
| `lib/view/spin-wheel-adapter.ts` | Items, props, easing, `spinToItem` args |
| `lib/view/hud-spinner.ts` | Keep landing math / `spinnerSegmentIndex` (adapter uses them) |
| `components/hud/HudSpinner.tsx` | Canvas wrapper + pointer; drop CSS pie |
| `app/globals.css` | Canvas host; keep pointer / template chrome |
| `components/designer/SpinnerPreview.tsx` | Interactive HUD + Spin button |
| `components/designer/SpinnerEditor.tsx` | Top-right Preview |
| `components/designer/LayoutDesigner.tsx` | Preview kind + spinner switcher |
| `README.md` | spin-wheel HUD + spinner preview |
| Store `docs/designer-screen-amendments.md` | Mark Group 16 implemented |
| Store `docs/spinner-shortlist.md` | One-line adopted note |
| Tests per task | Fail first |

**Out:** Hosted website. Group 17. Replacing the catalog / sample functions. Prices/accounts in JSON.

---

### Task 1: Adapter maps `SpinnerDef` → wheel items + `spinToItem` args (TDD)

**Files:**
- Create: `lib/view/spin-wheel-adapter.ts`
- Create: `types/spin-wheel.d.ts` (if needed)
- Test: `tests/view/spin-wheel-adapter.test.ts`
- Modify: `package.json` (`spin-wheel`)

**Interfaces:**
- Consumes: `SpinnerDef`, `spinnerWeights`, `spinnerSegmentIndex`, `spinnerTemplateOf`
- Produces:

```ts
export const SPIN_WHEEL_SLICE_COLORS = [
  '#334155', '#1e293b', '#475569', '#0f172a', '#64748b', '#1e3a5f',
];

export type SpinWheelItem = {
  label: string;
  backgroundColor: string;
  value: string | number;
  weight: number;
};

export type SpinToItemArgs = {
  itemIndex: number;
  duration: number;
  spinToCenter: true;
  numberOfRevolutions: 4;
  direction: 1;
  easingFunction: (n: number) => number;
};

export function wheelItemsFromSpinner(spinner: SpinnerDef): SpinWheelItem[];
export function wheelItemsFromMax(max: 6 | 12): SpinWheelItem[];
export function wheelProps(options: {
  items: SpinWheelItem[];
  isInteractive: boolean;
}): {
  items: SpinWheelItem[];
  isInteractive: boolean;
  pointerAngle: 0;
  itemBackgroundColors: string[];
  itemLabelColors: ['#e2e8f0'];
  itemLabelFont: string;
  borderWidth: number;
  lineWidth: number;
};
export function easingFromCss(easing: string): (n: number) => number;
export function spinToItemArgs(
  spinner: SpinnerDef | undefined,
  value: number,
  max: 6 | 12,
): SpinToItemArgs;
```

`wheelItemsFromSpinner`: one item per segment; `weight` from `spinnerWeights`; colors cycle `SPIN_WHEEL_SLICE_COLORS`; `value` is the segment id.

`easingFromCss`: parse `cubic-bezier(x1, y1, x2, y2)` to a unit easing `(n) => y`. Unknown string → ease-out sine.

`spinToItemArgs`: catalog → `spinnerSegmentIndex`; numeric → `value - 1`; duration from template (`classic` 1400 when no spinner).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import {
  wheelItemsFromSpinner,
  wheelItemsFromMax,
  wheelProps,
  spinToItemArgs,
  easingFromCss,
} from '@/lib/view/spin-wheel-adapter';
import { createSpinner, updateSpinner } from '@/lib/designer/spinners';

describe('spin-wheel adapter', () => {
  it('maps equal and percent segments to weighted items', () => {
    let list = createSpinner([], 'spinner-1');
    expect(wheelItemsFromSpinner(list[0]!)).toHaveLength(2);
    expect(wheelItemsFromSpinner(list[0]!)[0]).toMatchObject({
      label: 'Segment 1',
      weight: 1,
    });
    list = updateSpinner(list, 'spinner-1', {
      split: 'percent',
      segments: [
        { id: 'a', label: 'Me', percent: 10 },
        { id: 'b', label: 'Partner', percent: 90 },
      ],
    });
    expect(wheelItemsFromSpinner(list[0]!).map((item) => item.weight)).toEqual([10, 90]);
  });

  it('builds a numeric 1–12 wheel and engine-first spinToItem args', () => {
    expect(wheelItemsFromMax(12)).toHaveLength(12);
    expect(wheelItemsFromMax(12)[6]?.label).toBe('7');
    const numeric = spinToItemArgs(undefined, 7, 12);
    expect(numeric.itemIndex).toBe(6);
    expect(numeric.duration).toBe(1400);
    expect(numeric.spinToCenter).toBe(true);
    expect(numeric.numberOfRevolutions).toBe(4);
    const catalog = createSpinner([], 'spinner-1')[0]!;
    catalog.segments[1]!.label = '2';
    expect(spinToItemArgs(catalog, 2, 6).itemIndex).toBe(1);
    expect(spinToItemArgs(catalog, 2, 6).duration).toBe(1400);
  });

  it('forces isInteractive off unless the caller turns it on', () => {
    const off = wheelProps({ items: wheelItemsFromMax(6), isInteractive: false });
    expect(off.isInteractive).toBe(false);
    expect(off.pointerAngle).toBe(0);
    expect(wheelProps({ items: wheelItemsFromMax(6), isInteractive: true }).isInteractive).toBe(true);
  });

  it('maps template cubic-bezier to a unit easing', () => {
    const ease = easingFromCss('cubic-bezier(0.12, 0.7, 0.2, 1)');
    expect(ease(0)).toBeCloseTo(0);
    expect(ease(1)).toBeCloseTo(1);
    expect(ease(0.5)).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/view/spin-wheel-adapter.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`npm install spin-wheel@5.0.2`

Implement `lib/view/spin-wheel-adapter.ts` as specified. Cubic-bezier: standard unit-bezier solve (x from n, return y). `wheelProps` always sets `isInteractive` from the argument (never default-true).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/view/spin-wheel-adapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/view/spin-wheel-adapter.ts types/spin-wheel.d.ts tests/view/spin-wheel-adapter.test.ts
git commit -m "feat(view): map SpinnerDef to spin-wheel items"
```

---

### Task 2: `HudSpinner` canvas wrapper (TDD)

**Files:**
- Modify: `components/hud/HudSpinner.tsx`
- Modify: `app/globals.css` (`.hud-spinner-canvas` host; keep pointer + `--wood/--neon/--compass` chrome)
- Modify: `tests/hud/hud-spinner.test.tsx`
- Optional: `components/hud/MovementStage.tsx` (pass through `isInteractive` / tick-rest; keep tumble timeout)

**Interfaces:**
- Consumes: `wheelItemsFromSpinner`, `wheelItemsFromMax`, `wheelProps`, `spinToItemArgs`
- Produces:

```tsx
export function HudSpinner({
  value,
  max,
  spinning,
  rollId,
  spinner,
  isInteractive = false,
  onTick,
  onRest,
}: {
  value: number;
  max: 6 | 12;
  spinning: boolean;
  rollId: number;
  spinner?: SpinnerDef;
  isInteractive?: boolean;
  onTick?: (index: number) => void;
  onRest?: (index: number) => void;
}): JSX.Element;
```

Client-only: construct `new Wheel(container, props)` in `useEffect`. `wheel.remove()` on cleanup. When `spinning` becomes true or `rollId` changes while spinning, call `spinToItem(...)`. Do **not** call `spinToItem` when `isInteractive` is handling a flick (Test/Play never sets interactive).

Face image: if `spinner.image.src`, `new Image()`, set `img.src`, assign `wheel.image` on load.

Keep `data-testid="hud-spinner"`, `data-template`, `data-roll-id`, `role="img"`, aria-label, `data-testid="spinner-pointer"`. Add `data-testid="hud-spinner-canvas"` on the Wheel host. Add `data-interactive="true"|"false"`.

Mock in tests:

```ts
const spinToItem = vi.fn();
const remove = vi.fn();
vi.mock('spin-wheel', () => ({
  Wheel: class {
    image: unknown = null;
    constructor(public el: HTMLElement, public props: { isInteractive?: boolean }) {
      el.dataset.wheelMounted = 'true';
    }
    spinToItem(...args: unknown[]) { spinToItem(...args); }
    remove() { remove(); }
  },
}));
```

- [ ] **Step 1: Write the failing tests** (keep label / template / pointer cases; replace the CSS-spin class assertion)

```ts
it('mounts a canvas wheel with flick off and spins to the engine index', () => {
  render(<HudSpinner value={7} max={12} spinning rollId={3} />);
  expect(screen.getByTestId('hud-spinner').getAttribute('data-interactive')).toBe('false');
  expect(screen.getByTestId('hud-spinner-canvas')).toBeDefined();
  expect(screen.getByTestId('spinner-pointer')).toBeDefined();
  expect(spinToItem).toHaveBeenCalled();
  expect(spinToItem.mock.calls[0][0]).toBe(6);
});

it('keeps isInteractive off for a catalog spinner in Test/Play', () => {
  render(
    <HudSpinner
      value={2}
      max={6}
      spinning
      rollId={4}
      spinner={{
        id: 'spinner-1',
        name: 'Move',
        split: 'equal',
        template: 'wood',
        segments: [
          { id: 'a', label: '1' },
          { id: 'b', label: '2' },
        ],
      }}
    />,
  );
  expect(screen.getByTestId('hud-spinner').getAttribute('data-template')).toBe('wood');
  expect(screen.getByTestId('hud-spinner').getAttribute('data-interactive')).toBe('false');
  expect(spinToItem.mock.calls[0][0]).toBe(1);
});
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run tests/hud/hud-spinner.test.tsx`
- [ ] **Step 3: Implement canvas `HudSpinner`**
- [ ] **Step 4: Pass** — same command + `npx vitest run tests/hud/movement-stage.test.tsx`
- [ ] **Step 5: Commit** `feat(hud): spin-wheel canvas HudSpinner`

---

### Task 3: Spinners-tab Preview + designer Spin / flick (TDD)

**Files:**
- Create: `components/designer/SpinnerPreview.tsx`
- Modify: `components/designer/SpinnerEditor.tsx`
- Test: `tests/designer/spinner-editor.test.tsx`, `tests/designer/spinner-preview.test.tsx`

**Interfaces:**
- Consumes: `HudSpinner`, `sampleSegment` from `@/lib/designer/spinners` (re-export of engine)
- Produces:

```tsx
export function SpinnerPreview({
  spinner,
  isInteractive = true,
}: {
  spinner: SpinnerDef;
  isInteractive?: boolean;
}): JSX.Element;
```

`SpinnerPreview`:
- Renders `HudSpinner` with `isInteractive` (default true), `max={6}`, `value` from last sample (default 1), `spinning` around the Spin action, incrementing `rollId`.
- **Spin** button (`name="Spin"`): `const segment = sampleSegment(spinner, Math.random)`; map to index via `spinner.segments.findIndex`; set `value` to `segmentMoveValue` or `index + 1`; set `spinning` + new `rollId` so the wrapper `spinToItem`s.
- `data-testid="spinner-preview"`.

`SpinnerEditor` header:

```tsx
<div className="flex items-center justify-between gap-2">
  <p className="text-sm font-medium text-slate-100">Spinners</p>
  <Button type="button" variant="outline" disabled={!selected} onClick={() => onPreview?.()}>
    Preview
  </Button>
</div>
```

`onPreview?: () => void`. Disabled when `selectedId` is null / no selected spinner.

Mock `HudSpinner` in editor tests if needed; preview tests mock `spin-wheel` like Task 2.

- [ ] **Step 1: Failing tests**

```ts
// spinner-editor: Preview disabled with empty catalog; enabled after select; click calls onPreview
// spinner-preview: renders hud-spinner with data-interactive=true; Spin calls sample path (spinToItem)
```

- [ ] **Step 2: Fail** — `npx vitest run tests/designer/spinner-editor.test.tsx tests/designer/spinner-preview.test.tsx`
- [ ] **Step 3: Implement**
- [ ] **Step 4: Pass**
- [ ] **Step 5: Commit** `feat(designer): Spinners Preview with flick and Spin`

---

### Task 4: Designer Preview spinner mode + spinner switcher (TDD)

**Files:**
- Modify: `components/designer/LayoutDesigner.tsx`
- Modify: `tests/designer/layout-designer.test.tsx`

**State:**

```ts
const [previewKind, setPreviewKind] = useState<'board' | 'spinner'>('board');
const [previewSpinnerId, setPreviewSpinnerId] = useState<string | null>(null);
```

Tile-tool Preview:

```ts
setPreviewKind('board');
setPreviewFloorId(floor.id);
setPreviewRoomId(viewingRoom ? selectedRoom?.id ?? null : null);
setPreviewOpen(true);
```

Spinners-tab `onPreview`:

```ts
if (!selectedSpinnerId) return;
setPreviewKind('spinner');
setPreviewSpinnerId(selectedSpinnerId);
setPreviewOpen(true);
```

Dialog `preview-switcher`:
- If `previewKind === 'spinner'`: one `Button` per `spinnerList` entry, label = spinner name, `variant={previewSpinnerId === spinner.id ? 'secondary' : 'outline'}`, `onClick={() => setPreviewSpinnerId(spinner.id)}`. Also `setSelectedSpinnerId` so tab edits stay in sync.
- Else: existing level + multi-room buttons.

Dialog body:
- Spinner mode: `SpinnerPreview` for `spinnerList.find(s => s.id === previewSpinnerId)` (live object from catalog — edits update the open preview). Empty: “No spinner selected.”
- Board mode: existing `FloorPreview`.

When spinner mode, do **not** mount `FloorPreview` (flick must not hit the 3D board).

- [ ] **Step 1: Failing tests** in `tests/designer/layout-designer.test.tsx`

```ts
it('opens spinner Preview from the Spinners tab and switches spinner buttons', () => {
  // New spinner → Preview enabled → click Preview
  // preview-dialog open; no floor-preview; spinner-preview present
  // preview-switcher has a button named after the spinner
  // create a second spinner, rerender, click its switcher button
  // preview still open; selected spinner preview updates
});

it('disables Spinners Preview when none is selected', () => {
  // open Spinners tab with empty catalog
  expect(screen.getByRole('button', { name: 'Preview' })).toHaveProperty('disabled', true);
});

it('keeps board Preview on the tile-tool row with level buttons', () => {
  fireEvent.click(screen.getByRole('button', { name: 'Preview' })); // toolbar one
  expect(screen.getByTestId('floor-preview')).toBeDefined();
  expect(screen.getByTestId('preview-switcher').textContent).toMatch(/Level 1/);
});
```

Note: two **Preview** buttons exist (toolbar vs Spinners tab). Scope queries: toolbar `getByTestId('designer-toolbar')`; tab `getByTestId('spinner-editor')`.

- [ ] **Step 2: Fail** — `npx vitest run tests/designer/layout-designer.test.tsx`
- [ ] **Step 3: Implement**
- [ ] **Step 4: Pass**
- [ ] **Step 5: Commit** `feat(designer): spinner mode in Preview switcher`

---

### Task 5: Docs, amendments, verify, ship

- README §6: HUD uses CrazyTim spin-wheel (engine picks, then `spinToItem`). Spinners tab **Preview** (top-right) opens the designer popup in spinner mode: flick + Spin (`sampleSegment`), spinner buttons replace level buttons. Test/Play flick off.
- Store `docs/designer-screen-amendments.md`: mark Group 16 **Implemented** (same style as Group 15). Do not start Group 17. Do not rewrite the studio website spec.
- Store `docs/spinner-shortlist.md`: one-line adopted note under the first-pick heading (library is now the HUD view).
- Copy this plan into the repo at `docs/superpowers/plans/2026-09-25-designer-group-16.md` if not already.

```bash
npx vitest run
npm run build
```

Commit remaining docs. Push origin branch. `git push github HEAD:main` (retry with backoff). If GitHub credentials fail, still push the feature branch to `origin` and report the SHA.

---

## Self-review

| Spec item | Task |
|-----------|------|
| npm spin-wheel, DOM canvas, not PlayCanvas | 1–2 |
| Do not replace SpinnerDef / sample* / catalog / templates / links | all |
| Test/Play: canvas HudSpinner, pointer, duration/easing, Wheel.image, tick/stop hooks | 2 |
| Engine index then spinToItem; isInteractive off | 1–2 |
| Spinners tab Preview top-right; disabled if none selected | 3 |
| Open preview updates when selected spinner is edited | 3–4 |
| Designer: flick on + Spin via sampleSegment | 3 |
| Preview on a spinner → spinner buttons, same chrome | 4 |
| Flick spins current spinner, not 3D board | 4 |
| No prices/accounts; no Group 17; no hosted site | 5 |
