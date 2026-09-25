# Designer Group 17 — Visual stair landing, roll-again, Final level

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, no approval pauses). TDD per task. Commit after each task. Cursor models only. Do not implement the hosted studio website.

**Goal:** Replace the stair landing **id list** with a visual pick on the destination level’s 2D canvas. Add **Roll again** on stairs (toggle + optional Roll-again card) and as a pack card type. Flag **Final** levels so Test/Publish do not require a closed tile loop. End tiles stay optional everywhere.

**Architecture:** Mutations stay in `lib/designer/*`. Play rules stay in `lib/engine/*`. Destination pick is designer UI state plus `Stair.toFloorId` (unlinked until a canvas click sets `toCellId` + `legal`). Roll-again is stored on `Stair`, not as a pack on the stair cell. `CardTypeId` already exists (Group 15) — add `roll-again` only.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, existing shadcn, Vitest. Dev port **4318**.

**Spec:** store `docs/designer-screen-amendments.md` Group 17 (locked).

**Base:** GitHub / origin `main` at `92f400a` (Group 16).

## Global Constraints

- Cursor models only. No approval pauses.
- Do **not** implement the hosted studio website, dashboard, accounts, or live `/play`.
- Do **not** start Group 18.
- Do not invent a second card-type system. Extend `CardTypeId`.
- Polar shapes stay hidden. No PlayCanvas in engine / designer / library.
- GitHub: `mikemwp/boardgame-designer`. Push `github HEAD:main` after verify.
- Do not require an End tile on Final levels or anywhere else.

## Locked answers

### Visual landing
- Destination **level** is chosen in the Tiles tab. That does **not** pick a landing tile and does **not** auto-link to `cells[0]`.
- After a destination level is chosen, the **2D canvas shows that level**. Designer **clicks a square** to set the one-way landing.
- Stay in **Stair mode** until that stair is linked (origin + landing). Landing-pick does **not** start until a destination level is chosen. No dest yet → stay on the current level and keep designing.
- **Landing click:** never a **Room**. **Empty / HUD / Board** → convert that square to a **Tile** (corridor) and set it as the landing. Existing **Tile** (corridor, including Start/End) can be the landing and **stays a Tile**. Existing **Stair** on the dest level may be the landing (return stair is painted separately). No snap-to-nearest-perimeter. Isolated landings allowed.
- Two-way up/down = stair on both levels, each linked.
- **Test** stays blocked while any stair is unlinked (`dangling-stair`). Choosing a dest level without a click leaves `legal: false`.

### Roll again (stair)
- Tiles tab on a stair: **Roll again** section — toggle + optional attached card that **must** be `cardType === 'roll-again'`.
- Play: land on that stair **and** the level has **Level hold** **and** hold is not released **and** the toggle is on → show that card (or a default roll/spin-again prompt) and the player must roll/spin again. Token stays on the stair. Stair does not teleport until hold is released.
- Roll-again stairs are **legal landings** during hold (today exit stairs are excluded from the dice). Other exit stairs stay excluded.

### Card type: Roll again
- Add `roll-again` to `CardTypeId` and the Packs type picker.
- Card shows **Roll again** or **Spin again** from `config.movementViz` (dice vs spinner). Pressing it clears the card hold so the player can move again.
- Type can live in packs (drawn like any card) or be attached to a stair.

### Final level
- Levels tab: **Final** flag on the selected level (`floor.final`). Search first — do not duplicate if already present (it is not).
- A Final level does **not** need a completed tile loop. Skip `non-loop` / `broken-spoke` for `floor.final`.
- Empty floors, missing start, missing HUD, dangling stairs, and room-door rules still apply.
- **End tile is never required** — not on Final, not anywhere. Keep that: do not add `missing-end`.

---

## File map

| Path | Change |
|------|--------|
| `lib/engine/types.ts` | `CardTypeId` += `roll-again`; `Stair.rollAgain` / `rollAgainCardId`; `Floor.final` |
| `lib/designer/mutate.ts` | `setStairDestinationFloor`, `setStairLandingAt`, `setStairRollAgain`, `setFloorFinal`, convert HUD/Board → Tile |
| `lib/designer/validate.ts` | Skip loop checks on Final; keep dangling-stair; no End requirement |
| `lib/engine/movement.ts` | Hold + `rollAgain` stairs are legal landings |
| `lib/engine/cards.ts` | `defaultRollAgainCard`, `showRollAgainCard` |
| `lib/engine/game.ts` | Held roll-again landing shows card / default; stay on stair |
| `lib/view/card-hold.ts` | `roll-again` holds Roll until the type button is pressed |
| `components/designer/CellInspector.tsx` | Dest level only; drop landing id list; Roll again section |
| `components/designer/LayoutDesigner.tsx` | Landing-pick canvas + Stair lock until linked |
| `components/designer/HoldEditor.tsx` | Final switch |
| `components/designer/PackEditor.tsx` | Roll again type option |
| `components/hud/CardPanel.tsx` | Roll again / Spin again button |
| `lib/designer/packs.ts` | Persist `cardType: 'roll-again'` (already generic) |
| `README.md` | Group 17 notes |
| Store `docs/designer-screen-amendments.md` | Mark Group 17 implemented |
| Tests per task | Fail first |

**Out:** Hosted website. Group 18. Snap-to-perimeter. Auto-convert landing to Stair. Requiring End tiles.

---

### Task 1: Landing mutations (TDD)

**Files:**
- Modify: `lib/designer/mutate.ts`
- Test: `tests/designer/mutate.test.ts`

**Steps:**
1. Write failing tests for:
   - `setStairDestinationFloor` sets `toFloorId`, clears `toCellId`, `legal: false` (does not pick `cells[0]`).
   - Empty dest clears the link.
   - `setStairLandingAt` on an existing corridor: links, dest **stays** `kind: 'corridor'`.
   - Empty square: places a corridor and links (isolated OK).
   - HUD / Board: convert to corridor, drop `hudWidget`, link.
   - Room: no-op (board unchanged, still unlinked).
   - Existing dest stair: may be the landing; stays a stair.
2. Implement `setStairDestinationFloor`, `convertLandingToTile`, `setStairLandingAt` (cartesian `col,row`). Polar: `setStairLandingOnSlot` if a slot id is clicked.
3. Run `npx vitest run tests/designer/mutate.test.ts`. Commit.

### Task 2: Final level + validation (TDD)

**Files:**
- Modify: `lib/engine/types.ts` (`Floor.final?`)
- Modify: `lib/designer/mutate.ts` (`setFloorFinal`)
- Modify: `lib/designer/validate.ts`
- Test: `tests/designer/validate.test.ts`, `tests/designer/mutate.test.ts`

**Steps:**
1. Failing tests:
   - Broken loop on a **Final** level is allowed (no `non-loop` / `broken-spoke`).
   - Same broken loop without Final still fails.
   - Dangling stair still blocks Test on Final and non-Final.
   - Start + HUD + linked stairs + one Final broken level → `canTestPlay` true.
   - Board with start and no end tile → valid (`missing-end` never appears).
2. Skip `validateFloorLoop` when `floor.final`. Do not add an End-tile check.
3. `setFloorFinal` sets/clears `floor.final`. Reset level already rebuilds a vanilla floor (flag drops).
4. Run the two test files. Commit.

### Task 3: Tiles tab dest + landing-pick canvas (TDD)

**Files:**
- Modify: `components/designer/CellInspector.tsx`
- Modify: `components/designer/LayoutDesigner.tsx`
- Test: `tests/designer/cell-inspector.test.tsx`, `tests/designer/layout-designer.test.tsx`

**Steps:**
1. CellInspector: dest **level** select calls `onChooseDestFloor(id)` only. Remove **Landing tile** id `<select>`. Unlinked + dest set: helper *Click a tile on this level to set the landing.*
2. LayoutDesigner:
   - `landingPick = { stairId, originFloorId, originCellId }` after dest is chosen.
   - Canvas floor = dest level while pick is active. Inspector stays bound to the **origin stair**.
   - Force `tool === 'stair'` until `legal`. Ignore other tools / room view during pick.
   - Canvas click → `setStairLandingAt`. On success, exit pick, restore origin floor + origin cell, keep Stair tool selected (user may change tools).
   - No dest yet: current level, normal design.
3. Tests:
   - Dest change does **not** call `onLinkStair` with `cells[0]`.
   - No *Landing tile* combobox.
   - Designer: choose dest → dest grid is shown (`slot-*` from dest). Click dest corridor → stair `legal` + `toCellId`. Click dest Room → still unlinked. Click empty/HUD/Board → dest cell becomes Tile and links.
4. Run the two test files. Commit.

### Task 4: Roll-again card type + stair fields (TDD)

**Files:**
- Modify: `lib/engine/types.ts` (`CardTypeId`, `Stair`)
- Modify: `lib/designer/mutate.ts` (`setStairRollAgain`)
- Modify: `lib/designer/packs.ts` (allow `cardType`)
- Modify: `components/designer/PackEditor.tsx`
- Modify: `components/designer/CellInspector.tsx`
- Test: `tests/designer/mutate.test.ts`, `tests/designer/pack-editor.test.tsx`, `tests/designer/cell-inspector.test.tsx`

**Steps:**
1. `CardTypeId` += `'roll-again'`. Packs picker option **Roll again**.
2. `Stair.rollAgain?: boolean`, `rollAgainCardId?: string`.
3. `setStairRollAgain`: toggle off clears `rollAgainCardId`. Attached id stored only if that card’s type is `roll-again`.
4. Tiles tab **Roll again** section: switch + card `<select>` filtered to roll-again cards. Empty option = default prompt.
5. Tests for toggle, reject non-roll-again card, Packs type option. Commit.

### Task 5: Play — hold + roll-again stair (TDD)

**Files:**
- Modify: `lib/engine/movement.ts`
- Modify: `lib/engine/cards.ts`
- Modify: `lib/engine/game.ts`
- Test: `tests/engine/movement.test.ts`, `tests/engine/game.test.ts`

**Steps:**
1. `isIllegalLanding`: exit stair during active hold is illegal **unless** `stair.rollAgain`.
2. `afterMove` on a held roll-again stair: do not teleport; show attached roll-again card or `defaultRollAgainCard(movementViz)` via `showRollAgainCard` (body visible, no pack-quota increment).
3. Hold stays active. Later rolls can land on the same stair again until `tryExitHold` clears hold; then the stair teleports as today.
4. Tests:
   - Allowed values include the roll-again stair while held.
   - Land → token stays; `currentCard.cardType === 'roll-again'`; `hold.active`.
   - No attached card → default card id `roll-again-default`.
   - Hold off → stair still teleports (no roll-again prompt).
5. Run engine tests. Commit.

### Task 6: HUD Roll again / Spin again (TDD)

**Files:**
- Modify: `lib/view/card-hold.ts`
- Modify: `components/hud/CardPanel.tsx`
- Test: `tests/view/card-hold.test.ts`, `tests/hud/card-panel.test.tsx`

**Steps:**
1. `cardNeedsHold` true for `cardType === 'roll-again'` (locks Roll until the type button).
2. CardPanel: when type is roll-again and body is visible, button **Roll again** or **Spin again** from `movementViz` prop (default `'dice'`). Click → `onExtra` (same unlock as timer).
3. Tests for both labels and hold. Commit.

### Task 7: Final switch on Levels tab (TDD)

**Files:**
- Modify: `components/designer/HoldEditor.tsx`
- Modify: `components/designer/LayoutDesigner.tsx`
- Test: `tests/designer/hold-editor.test.tsx`, `tests/designer/layout-designer.test.tsx`

**Steps:**
1. **Final** switch next to / under Level hold. `aria-label="Final"`. Calls `onChange({ final: true })` or a dedicated `onFinal` — wire `setFloorFinal`.
2. Do not add a second Final control.
3. Tests: toggle Final; Levels tab shows it. Commit.

### Task 8: README + amendments mark

**Files:**
- Modify: `README.md` (visual landing, Roll again, Final, End never required)
- Modify: store + repo `docs/designer-screen-amendments.md` — **Implemented** on Group 17; do not start Group 18

**Steps:**
1. Update copy. Commit.

### Task 9: Verify

```bash
npx vitest run tests/designer/mutate.test.ts tests/designer/validate.test.ts tests/designer/cell-inspector.test.tsx tests/designer/layout-designer.test.tsx tests/designer/pack-editor.test.tsx tests/designer/hold-editor.test.tsx tests/engine/movement.test.ts tests/engine/game.test.ts tests/view/card-hold.test.ts tests/hud/card-panel.test.tsx
npx vitest run
npx tsc --noEmit
```

Push `cursor/designer-group-17-2fb9`. Then `git push github HEAD:main` if credentials work.

---

## Self-review

- Spec coverage: visual landing, Stair-mode lock, landing click rules, Test blocked on unlink, Roll again stair + play, card type, Final loop exemption, End never required.
- No unused abstractions. No hosted site. No Group 18.
- Existing `linkStair` remains for tests and the click path after convert.
