# Building board template — design

**Date:** 2026-09-17  
**Status:** draft for review  
**v1 product:** a pass-and-play web app that runs one configured building game (Climb)

This is a **game template**, not a single story. The same engine can later be penthouse climb, escape, ghost hunt, or whodunit by changing data. v1 proves the engine with Climb.

## Goal

Players sit at one screen, spin, and move tokens around a building made of looping corridor floors, rooms, stairs, cards, and short media. Michael can ship different games from the same rules by editing template and pack data — without Unity.

## Non-goals (v1)

- Unity, Godot, Phaser, free movement, physics, or a full 3D engine
- Logins, payments, purchasable packs (pack **format** exists; buying is a later slice)
- Visual template editor (v1 authors data files)
- Each player on their own device
- Dice (setting exists later; v1 is spinner only)
- Native apps (web first; wrap later if stores matter)
- Hidden-traitor gameplay (the pair/exclude/group **graph** exists; the full social-deduction game does not)

## Players and session

- **2–6 players**, pass-and-play, one screen. Player count is a template setting; v1 cap is 6 so crowded boards can be tested.
- Setup before play: name, token colour, optional **partner**, optional **cannot-spin** list, optional **group**.
- Current game persists in the **browser** (refresh/reopen restores it). No accounts.
- Later: same engine, each player on their own phone/laptop.

## Screen

- **Frame board:** corridor squares around the screen edge. Tokens **always** slide on this frame.
- **Center:** spinner, active card/media, timer countdown, pack.
- **First-person popup** is a template setting:
  - room only
  - room + stairs
  - every spin
- Second setting: **Allow skip first-person**. If on, Skip dismisses the popup.
- Door/stair labels are **dynamic** for the current player: Enter Room / Room locked, Use Stairs / Stairs blocked.

v1 layout is desktop-first, usable on a tablet. Phone is best-effort; the frame must still be readable at 6 tokens.

## Building (template data)

- `floors`: count is a setting. Each floor is a **square loop**. Higher floors have **fewer squares**.
- **Stairs** sit on the **right** side of the loop. `stairDirection`: `up` | `down` | `either`. Using stairs places the token on that floor’s stair square.
- **Rooms** per floor is a setting. Each room is either:
  - **card-only:** play the room pack, then snap back to its Enter Room square, or
  - **2–4 inner squares**, one of which is **Leave Room** (snap back to that corridor door). Inner squares may have packs or effects like corridor squares.
- `startFloor` / `startSquare` are settings (Climb: bottom).
- **Win** is a setting. After every **stop**, check it. v1 Climb: first player whose token sits on **any square of the named top floor** (including arriving by stairs) wins. Later: named exit square, hunt, etc.

## Squares

Resolve **only the square you stop on**, and only if it has something to resolve. Crossing a door or stair on the way never fires.

A corridor square is one of:

| Kind | Pack? | What happens on land |
|---|---|---|
| Empty | no | Turn ends. Next player. |
| Content | optional pack + optional **one** effect | Apply effect (if any), then draw from the pack (if any). |
| Door | **never** | Unlocked → enter room. Locked for this player → stay, next player. |
| Stair | **never** | Unlocked → move to stair square on the next floor. Blocked → stay, next player. |

**Effect** (at most one per square), v1 kinds:

- lock stairs for *n* of **this player’s** turns
- lock doors for *n* of **this player’s** turns
- lock a **named room** for *n* of **this player’s** turns
- same three as **everyone** locks for *n* full rounds

Locks do not draw cards. Door/stair squares never hold packs; packs live on content squares and inside rooms.

## Turn loop

1. Current player spins (v1: spinner; range is template data, default 1–6).
2. Token slides that many squares along the current loop (or along inner room squares if they are in a room).
3. Landing square resolves as above.
4. If a card or room sequence is in play, finish it (timer, pass, helper, together).
5. Next player, unless they remain in an inner-square room (they stay there until Leave Room).

## Cards and packs

Packs are data folders (JSON + media) **wired to squares or rooms**. v1 ships one bundled pack. More packs can be dropped in later; a store to **buy** them is out of scope.

**Kinds (v1):**

- Question
- Do / reveal something
- Image (alone to describe/talk about, or attached to another kind)
- Clip
- Audio

Any kind may:

- start a **timer** (countdown in the screen center). On zero, the **card** chooses: fail path, nudge only, or a specific listed result
- allow **Pass** (if the game has passes on)

**Game passes:** optional. If on, each player has a max pass count. Passing a card: skip it, stay on the square, turn ends, spend one of **that player’s** passes.

**Together:** if another player is already on that square or in that room, draw the **together version of that pack’s card type**, not a global together deck. The together card **replaces** the solo card (do not play both). Each together card chooses: lander-only, or everyone on that square takes part (hand the device as the card says).

**Helper spinner:** a card may spin **another player** to help. The spinner only includes eligible players (see Relationships). That helper may Pass if passes are on and they have one left (spends **the helper’s** pass). If they pass, the lander continues without help, or the card’s fail path if it has one.

**Deck behaviour (per pack instance on a square/room):**

- Flip is animated.
- Draw from the top; after use, that card goes to the **bottom**.
- After every card in the pack has been seen once, the **next** landing on that pack **shuffles** (shuffle animation) then draws.

## Relationships (setup graph)

Used by partner cards, helper spinner, and later faction games.

- **Partner (optional):** a persistent couple for cards that ask the paired player for info or help. Tokens still move separately.
- **Cannot-spin:** people who must not appear on this player’s helper spinner.
- Constraint: a player **cannot exclude every other player**, unless they **have a partner**. A closed pair **may** exclude everyone else (spinner never leaves the pair).
- Unpaired players: partner-cards fall back to the helper spinner among eligible people.
- **Groups** (e.g. Faithfuls / Traitors): named template groups that apply default partners and excludes. v1 stores the graph; it does not implement hidden roles or win conditions for traitor games.

## Architecture

**Stack:** TypeScript web app (Next.js + Tailwind + shadcn/ui). No backend in v1.

**Split:**

1. **Engine (pure TypeScript, no UI)** — building graph, movement, locks, decks, eligibility, win check, save payload. This is the unit-tested core.
2. **Content** — template JSON, pack JSON, images/audio/video as static files.
3. **UI** — setup, frame board, spinner, card overlay, timer, first-person popup, win screen.
4. **Persistence** — `localStorage` (or equivalent) after each completed turn and after setup.

First-person popup: CSS 3D corridor first. Add a small Three.js scene only if CSS looks too cheap. It is a presentation of discrete squares, not a character controller.

**Data flow:** load template + packs → setup (players, partners, excludes, groups) → validate relationship graph → play loop → persist → win.

Invalid templates (door with a pack, room with 1 inner square, exclude-all without a partner) are **rejected at load/setup** with a clear message, not discovered mid-game.

## UI states

- **Empty board / no save:** setup to start Climb.
- **Loading:** template/media fetch.
- **Error:** unreadable save, missing media (show placeholder + skip), invalid template.
- **Play:** whose turn, passes left, locks, dynamic door/stair labels.
- **Win:** named player reached the top floor; option to start a new game (clears save).

## Testing

Engine tests (no browser):

- Land-only resolve; pass-through door/stair does nothing
- Empty square ends the turn
- Door/stair lock vs enter/climb
- Card-only room snap-back vs inner squares + Leave Room
- Together replaces solo when occupied
- Pack: top to bottom; shuffle after a full cycle
- Pass spends the correct player’s count and skips
- Helper spinner eligibility (excludes, closed pair, cannot exclude-all)
- Climb win on named top floor
- Save round-trip

Manual: 2-player and 6-player pass-and-play on Climb.

## Later slices (do not build in v1)

1. Visual editor + publish to Michael’s website
2. Buyable card packs
3. Dice as a movement option
4. Own-device multiplayer
5. Escape / hunt / whodunit win conditions and hidden groups
6. Native wrapper

## Open defaults (change if you hate them)

- Spinner default **1–6**
- Loop direction **clockwise**
- First player = **setup order**
- First-person default for Climb = **room + stairs**, skip **on**
- Passes **on**, **1** per player, for the bundled Climb pack
