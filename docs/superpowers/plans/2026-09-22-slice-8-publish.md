# Slice 8 — Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per task. Commit after each task. Cursor models only. No approval pauses.

**Goal:** Add a **Publish** button that freezes the current valid game as `(Published) v1` (or the landed Version A number), keeps Delete disabled while published, and lets Open list that live game. A local `/play/[slug]` route plays the published snapshot from this browser — no cloud accounts.

**Architecture:** `publishDocument` + `publishActive` already exist. This slice wires the chrome and the same Test validation gate (`validateLayout` / `canTestPlay`). First publish assigns `version: '1'` when the document has never been versioned; later publishes keep the current version. Edit after publish still goes through `markEditedAfterPublish` → `(draft) v1.1`. A local slug is stored on the document so `/play/[slug]` can load the **published** snapshot from `localStorage`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind, existing shadcn/ui, Vitest, existing engine + library + HUD + designer. No new npm packages. No PlayCanvas imports in engine / designer / library.

**Spec:** `docs/superpowers/specs/2026-09-17-building-board-template-design.md` (Game library — Publish live)  
**Amendments:** Group 1 versioning (locked — A) in `docs/designer-screen-amendments.md`  
**Slice 9 (done, GitHub / origin `main` `d62a117`):** HUD widgets, hold quotas, card timer / extra button. This plan **starts Publish**.

**Base branch:** Implement from **origin/main** (`d62a117` or newer). Branch **`feat/slice-8-publish`**. Isolated worktree. Do **not** start polar UI, first-person, cloud accounts, or buyable packs.

## Global Constraints

- Engine is a small set of repeating mechanics; **Game JSON + the designer** own the rules
- **PlayCanvas React** is the **3D board view only**; engine, library, and designer mutations have **zero** PlayCanvas imports
- HUD, cards, setup, library, and designer chrome stay **DOM + shadcn/ui**
- **Save draft** is allowed even if stairs/loops/rooms are invalid for Test / Publish
- **Test** always uses the **current draft**
- **Publish** uses the same layout gate as Test (`validateLayout` / `canTestPlay`). Test does not separately validate cards; Publish does not invent a new card gate
- Version A (already in `lib/library/version.ts` + `publishDocument`): first publish is **v1**; first edit after publish is **(draft) v1.1**; later Save/Test bump the minor; next publish **keeps** that number
- Polar board-shape UI stays **hidden**
- Dev server stays on uncommon port **4318**
- Do **not** rename `ROLL_DICE`. Do **not** remount leftover `DiceActor` / `DiceRollLayer`
- Session / drafts persist in the **browser**; no accounts; slug is local-only

## Slice scope

**In this plan:** Publish button in the library bar; enable when a game is loaded **and** `canTestPlay(workingBoard)` (same issues Test would show); first publish → `(Published) v1`; later publish keeps the current version; Delete stays disabled while `isPublished`; Open already lists published games; local slug + `/play/[slug]` plays the published snapshot from this device.

**Out of this plan:** polar UI, first-person, inner maps, cloud accounts, buyable packs, unpublish/revert UI, version history list, public hosting beyond this browser’s `localStorage`.

**Locked publish rule:** Clicking Publish persists the working board/cards/packs **without** a Save bump, then `publishDocument`. Invalid layout shows the same issue list as Test and does not publish.

---

## File Map

| Path | Slice 8 change |
|------|----------------|
| `lib/designer/validate.ts` | Export `canPublishPlay` as alias of `canTestPlay` |
| `lib/library/types.ts` | Optional `slug?: string` on `GameDocument` |
| `lib/library/state.ts` | Persist slug in `createDocument` / `parseDocument`; `uniquePublishedSlug`; `findPublishedBySlug`; `publishDocument` keeps/assigns slug |
| `hooks/use-library.ts` | `publishActive` assigns a unique slug on first publish |
| `components/library/LibraryBar.tsx` | **Publish** button after Test; `canPublish` + `onPublish` |
| `components/library/StudioShell.tsx` | Wire Publish; persist then `publishActive`; `canPublish` from `canTestPlay` |
| `components/library/OpenGameDialog.tsx` | Show `/play/{slug}` on published rows when present |
| `components/library/PlayPublishedGame.tsx` | **Create.** Load published game by slug; empty / missing / play states |
| `app/play/[slug]/page.tsx` | **Create.** Thin client page around `PlayPublishedGame` |
| `README.md` | Publish + local play URL; polar / FP / cloud / packs still out |
| `tests/designer/validate.test.ts` | `canPublishPlay` matches `canTestPlay` |
| `tests/library/state.test.ts` | Slug assign / uniqueness / find published |
| `tests/library/library-bar.test.tsx` | Publish enabled/disabled + click |
| `tests/hooks/use-library.test.tsx` | `publishActive` → published v1 + slug |
| `tests/library/studio-shell.test.tsx` | First publish, delete disabled, edit → draft v1.1, republish keeps version, invalid blocked |
| `tests/library/open-game-dialog.test.tsx` | Published row shows `/play/…` |
| `tests/library/play-published-game.test.tsx` | **Create.** Found / missing / unpublished-after-edit |

Do not add polar shape pickers, first-person cameras, inner-map cells, auth, or pack storefronts.

---

### Task 1: Publish gate + slug helpers

**Files:**
- Modify: `lib/designer/validate.ts`, `lib/library/types.ts`, `lib/library/state.ts`
- Test: `tests/designer/validate.test.ts`, `tests/library/state.test.ts`

**Interfaces:**

```ts
export function canPublishPlay(board: Board): boolean {
  return canTestPlay(board);
}

export function slugifyName(name: string): string;
export function uniquePublishedSlug(state: LibraryState, name: string, keepId?: string): string;
export function findPublishedBySlug(state: LibraryState, slug: string): GameDocument | undefined;
```

`slugifyName('Climb (sample)')` → `'climb-sample'`. Empty / punctuation-only names → `'game'`. `uniquePublishedSlug` keeps an existing unused base, else suffixes `-2`, `-3`, … among **all** documents that already have a `slug` (so a draft that kept its slug after edit still owns the URL until republish).

`publishDocument` already sets `status: 'published'`, `published: true`, `version: doc.version ?? '1'`. Add optional `slug` argument; keep `doc.slug` when present; otherwise use the provided slug or `slugifyName(doc.name)`.

`createDocument` / `parseDocument` keep a non-empty string `slug`.

- [ ] **Step 1: Write the failing tests**

```ts
it('canPublishPlay matches canTestPlay', () => {
  expect(canPublishPlay(climbSample.board)).toBe(canTestPlay(climbSample.board));
  expect(canPublishPlay(emptyBootstrap().board)).toBe(false);
});

it('first publish assigns v1 and a unique slug', () => {
  const published = publishDocument(doc(), '2026-09-22T13:00:00.000Z', 'sandbox');
  expect(published.version).toBe('1');
  expect(published.slug).toBe('sandbox');
  expect(published.status).toBe('published');
});

it('later publish keeps the landed version and existing slug', () => {
  const published = publishDocument(
    doc({ version: '1.3', status: 'draft', slug: 'sandbox' }),
    '2026-09-22T16:00:00.000Z',
  );
  expect(published.version).toBe('1.3');
  expect(published.slug).toBe('sandbox');
});

it('uniquePublishedSlug suffixes when the base is taken', () => {
  const a = publishDocument(doc({ id: 'a', name: 'Sandbox' }), 't', 'sandbox');
  const state: LibraryState = { version: 1, activeId: 'a', drafts: [a] };
  expect(uniquePublishedSlug(state, 'Sandbox')).toBe('sandbox-2');
  expect(uniquePublishedSlug(state, 'Sandbox', 'a')).toBe('sandbox');
});

it('findPublishedBySlug ignores drafts that still hold the slug', () => {
  const live = publishDocument(doc({ id: 'a', name: 'Sandbox' }), 't', 'sandbox');
  const draft = { ...live, id: 'b', status: 'draft' as const, published: false };
  const state: LibraryState = { version: 1, activeId: 'b', drafts: [live, draft] };
  expect(findPublishedBySlug(state, 'sandbox')?.id).toBe('a');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/designer/validate.test.ts tests/library/state.test.ts tests/library/version.test.ts`
Expected: FAIL — `canPublishPlay` / slug helpers missing.

- [ ] **Step 3: Write minimal implementation**

Export `canPublishPlay`. Add `slug?: string` to `GameDocument`. Thread slug through `createDocument`, `parseDocument`, `publishDocument`. Add `slugifyName`, `uniquePublishedSlug`, `findPublishedBySlug`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/designer/validate.test.ts tests/library/state.test.ts tests/library/version.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/designer/validate.ts lib/library/types.ts lib/library/state.ts tests/designer/validate.test.ts tests/library/state.test.ts
git commit -m "feat: add publish slug helpers and canPublishPlay"
```

---

### Task 2: Publish button in LibraryBar

**Files:**
- Modify: `components/library/LibraryBar.tsx`
- Test: `tests/library/library-bar.test.tsx`

**Interfaces:**

```ts
export function LibraryBar({
  // existing props
  canPublish,
  onPublish,
}: {
  canPublish: boolean;
  onPublish: () => void;
});
```

Place **Publish** after **Test**, same outline + hover class. Disabled when `!canPublish`. Existing tests must pass `canPublish` / `onPublish` (default `canPublish = false` and `onPublish = () => {}` so older calls still typecheck only if you add defaults).

- [ ] **Step 1: Write the failing tests**

```ts
it('fires Publish when enabled', () => {
  const onPublish = vi.fn();
  render(<LibraryBar /* … */ canPublish onPublish={onPublish} />);
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
  expect(onPublish).toHaveBeenCalledTimes(1);
});

it('disables Publish when canPublish is false', () => {
  render(<LibraryBar /* … empty game … */ canPublish={false} onPublish={() => {}} />);
  expect(screen.getByRole('button', { name: 'Publish' })).toHaveProperty('disabled', true);
});
```

Update the existing “disables Save, Test, and Delete” case to also expect Publish disabled.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/library/library-bar.test.tsx`
Expected: FAIL — no Publish button.

- [ ] **Step 3: Write minimal implementation**

Add the button. Do not change Delete rules.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/library/library-bar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/library/LibraryBar.tsx tests/library/library-bar.test.tsx
git commit -m "feat: add Publish button to the library bar"
```

---

### Task 3: Wire publishActive + StudioShell

**Files:**
- Modify: `hooks/use-library.ts`, `components/library/StudioShell.tsx`
- Test: `tests/hooks/use-library.test.tsx`, `tests/library/studio-shell.test.tsx`

**Behavior:**

1. `publishActive` uses `uniquePublishedSlug` on first publish and keeps `doc.slug` on later publishes.
2. StudioShell `canPublish = Boolean(active && workingBoard && canPublishPlay(workingBoard))`.
3. `onPublish`:
   - if no working board, return
   - `const nextIssues = validateLayout(workingBoard); setIssues(nextIssues)`
   - if any issues, stay in Design (same as Test)
   - else `persistWorking({ touchUpdatedAt: true, bump: 'none' })` then `publishActive()`
4. Stay in Design after a successful publish. Title becomes `formatGameTitle` (`(Published) v1` on first publish).
5. Delete stays disabled while `isPublished(active)`.
6. Editing the board still calls `markActiveEdited` → `(draft) v1.1`; Delete re-enables because it is a draft again.

- [ ] **Step 1: Write the failing tests**

`tests/hooks/use-library.test.tsx`:

```ts
it('publishActive freezes the active game as published v1 with a slug', () => {
  // seed Climb, publishActive
  expect(result.current.active?.status).toBe('published');
  expect(result.current.active?.version).toBe('1');
  expect(result.current.active?.slug).toBe('climb-sample');
  expect(formatGameTitle(result.current.active!)).toBe('Climb (sample) (Published) v1');
});
```

`tests/library/studio-shell.test.tsx`:

```ts
it('Publish on Climb becomes (Published) v1 and disables Delete', () => {
  renderStudio();
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
  expect(screen.getByText('Climb (sample) (Published) v1')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Delete' })).toHaveProperty('disabled', true);
});

it('blocks Publish on an invalid empty board the same way as Test', () => {
  // New → Empty board → Publish
  expect(screen.getByTestId('layout-issues').textContent).toContain('Mark a start tile');
  expect(screen.getByText('Sandbox (draft)')).toBeDefined();
});

it('edit after publish flips to (draft) v1.1; next publish keeps v1.1', () => {
  renderStudio();
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
  fireEvent.click(screen.getByTestId('slot-0-0'));
  fireEvent.click(screen.getByRole('button', { name: 'Start tile' }));
  expect(screen.getByText('Climb (sample) (draft) v1.1')).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
  expect(screen.getByText('Climb (sample) (Published) v1.1')).toBeDefined();
});
```

Also extend the empty-library case: Publish is disabled with Save / Test / Delete.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/hooks/use-library.test.tsx tests/library/studio-shell.test.tsx`
Expected: FAIL — StudioShell does not pass `onPublish`.

- [ ] **Step 3: Write minimal implementation**

Destructure `publishActive` from `useLibrary`. Assign slug in the hook. Wire `canPublish` / `onPublish` in `StudioShell`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/hooks/use-library.test.tsx tests/library/studio-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add hooks/use-library.ts components/library/StudioShell.tsx tests/hooks/use-library.test.tsx tests/library/studio-shell.test.tsx
git commit -m "feat: publish the loaded game when layout validates"
```

---

### Task 4: Local `/play/[slug]` + Open list hint

**Files:**
- Create: `components/library/PlayPublishedGame.tsx`, `app/play/[slug]/page.tsx`
- Modify: `components/library/OpenGameDialog.tsx`, `README.md`
- Test: `tests/library/play-published-game.test.tsx`, `tests/library/open-game-dialog.test.tsx`

**Interfaces:**

```ts
export function PlayPublishedGame({
  slug,
  storage,
}: {
  slug: string;
  storage?: LibraryStorage;
});
```

States:

- **Loading** — `Loading published game…` until the client reads storage
- **Missing** — `No published game at /play/{slug} on this device.` plus a **Design** link to `/`
- **Play** — heading `{name} (Published) v{version}`; `GameHud` from `fromStoredBootstrap`; **Design** link back to `/`

Only a document with `documentStatus === 'published'` and matching `slug` plays. A draft that still holds the slug after edit must **not** load (same as `findPublishedBySlug`).

`app/play/[slug]/page.tsx` is a client page that `use()`s `params` and renders `PlayPublishedGame`. Mock `BoardScene` / PlayCanvas lifecycle in the play-page test the same way as `studio-shell.test.tsx`.

Open dialog: published rows with a slug also show `/play/{slug}` (small muted text). Drafts do not.

README updates:

- Library bar now has **Publish**
- First publish is `(Published) v1`; later publish keeps the landed version
- Delete stays disabled while published
- Edit after publish → `(draft) v1.1`
- Local play URL `/play/{slug}` reads this browser’s library (no accounts)
- Polar UI, first-person, cloud accounts, buyable packs still out

- [ ] **Step 1: Write the failing tests**

```ts
it('plays a published game from storage by slug', async () => {
  // seed + publish Climb into memoryStorage; render PlayPublishedGame slug="climb-sample"
  await flushTestViewport();
  expect(screen.getByText('Climb (sample) (Published) v1')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Roll dice' })).toBeDefined();
});

it('shows a missing state when the slug is unpublished or unknown', () => {
  render(<PlayPublishedGame slug="missing" storage={memoryStorage()} />);
  expect(screen.getByText(/No published game at \/play\/missing/)).toBeDefined();
});
```

Open dialog: published Live climb with `slug: 'live-climb'` shows `/play/live-climb`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/library/play-published-game.test.tsx tests/library/open-game-dialog.test.tsx`
Expected: FAIL — component / route missing.

- [ ] **Step 3: Write minimal implementation**

Add `PlayPublishedGame`, the play route, Open hint, README.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/library/play-published-game.test.tsx tests/library/open-game-dialog.test.tsx && npx vitest run`
Expected: PASS (full suite green)

- [ ] **Step 5: Commit**

```bash
git add components/library/PlayPublishedGame.tsx app/play components/library/OpenGameDialog.tsx README.md tests/library/play-published-game.test.tsx tests/library/open-game-dialog.test.tsx docs/superpowers/plans/2026-09-22-slice-8-publish.md
git commit -m "feat: play published games at a local slug URL"
```

---

## Self-review

1. **Spec coverage:** Publish button + validation gate → Tasks 2–3. Version A (`v1` / keep landed number / edit → draft v1.1) → already in data model, asserted in Tasks 1 + 3. Delete disabled while published → Task 3. Local slug / `/play/[slug]` → Task 4. Polar / first-person / cloud / buyable packs excluded.
2. **Placeholder scan:** No TBD / “implement later” steps. Unpublish / version history / public hosting left out on purpose.
3. **Type consistency:** `canPublishPlay`, `slugifyName`, `uniquePublishedSlug`, `findPublishedBySlug`, `PlayPublishedGame`. Button label **Publish**. Missing copy **No published game at /play/{slug} on this device.**

### Known implementer pitfalls

- Implement from **origin/main `d62a117`+**. Branch `feat/slice-8-publish`.
- Persist with `bump: 'none'` before publish or Version A will skip a number on the publish click.
- Do not strip `slug` in `markEditedAfterPublish` — the draft keeps the URL; `findPublishedBySlug` only returns published docs, so `/play/{slug}` goes missing until republish (correct).
- Do not enable Delete on a published document. After edit it is a draft again — Delete may enable (existing `isPublished` rule).
- `canPublish` is live (`canTestPlay(workingBoard)`), not “any loaded game.” Invalid empty boards keep Publish disabled.
- After this slice is on `origin/main` (and `github HEAD:main` if that remote exists), **STOP**. Do not start polar UI, first-person, cloud accounts, or buyable packs.

---

## Execution

1. Worktree / branch `feat/slice-8-publish` from origin/main (`d62a117`+).
2. TDD each task; commit as you go. Cursor models only. No approval pauses.
3. Push `origin` (`feat/slice-8-publish` and update `main`) and `git push github HEAD:main`.
4. Return SHA + this plan path. Do not start polar / first-person / cloud / packs.
