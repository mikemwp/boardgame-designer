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
- More than `maxFloors` (v1: **3**)

## Players and session

- **2–6 players**, pass-and-play, one screen. Player count is a template setting; v1 cap is 6 so crowded boards can be tested.
- Setup before play: name, token colour, optional **partner**, optional **cannot-spin** list, optional **group**.
- Current game persists in the **browser** (refresh/reopen restores it). No accounts.
- Later: same engine, each player on their own phone/laptop.

## Screen

All floors are **visible at once**. Nested 2D board, not “only the floor you’re on”:

- **Floor 1** is the outer ring of squares around the screen edge.
- **Stairs** on a floor sit on the **right** of that loop and lead **inward**.
- The **next floor’s corridor** is drawn **inside** the floor below, another ring, and so on.
- The **end square** is in the **geometric centre**, drawn **larger**, and is **always a room**.

Tokens **always** slide on their current ring (or onto the centre end room). Spinner, cards, clips, audio, and the timer are **overlays** (center HUD / popup) so they do not replace the nested board.

**First-person popup** is a template setting:

- room only
- room + stairs
- every spin

Second setting: **Allow skip first-person**. If on, Skip dismisses the popup.

Door/stair labels are **dynamic** for the current player: Enter Room / Room locked, Use Stairs / Stairs blocked.

v1 layout is desktop-first, usable on a tablet. Phone is best-effort; three nested rings plus six tokens must stay readable on a tablet.

## Building (template data)

- `maxFloors`: hard cap for this template. **v1 = 3**. A game’s `floorCount` must be `1…maxFloors`. Climb v1 uses **3 corridor floors**.
- Floors **1 … floorCount** are concentric **corridor loops**. Floor 1 is outermost (lowest for Climb). Each inner floor is a loop inside the one below. All of them are drawn at once.
- **End square:** always exists in addition to those loops, always the large centre square, **always a room**. It is not a corridor loop. Climb’s win space is this square. The innermost corridor’s inward stairs enter it.
- **Squares per floor:** the template offers **exactly three size options** (small / medium / large square counts). Each corridor floor picks one option. A higher (inner) floor may have the **same** count or **fewer** squares than the floor outside it — never more.
- **Stairs** sit on the **right** side of each corridor loop and connect **inward** (Climb: up). `stairDirection`: `up` | `down` | `either` (Climb: `up`). Using stairs places the token on the next inner floor’s stair square, or onto the end room from the innermost corridor.
- **Rooms** per corridor floor is a setting. Side rooms (not the end square) are either:
  - **card-only:** play the room pack, then snap back to its Enter Room square, or
  - **2–4 inner squares**, one of which is **Leave Room** (snap back to that corridor door). Inner squares may have packs or effects like corridor squares.
  Side rooms play in the popup / their inner squares; they are not extra concentric rings. The **end square** is the only room drawn as a large on-board space.
- `startFloor` / `startSquare` are settings (Climb: floor 1, a start square on the outer ring).
- **Win** is a setting. After every **stop**, check it. v1 Climb: first player whose token sits on the **end square** (the centre room), including arriving by stairs, wins — after that room has resolved. Later: named exit, hunt, etc.

## Squares

Resolve **only the square you stop on**, and only if it has something to resolve. Crossing a door or stair on the way never fires.

A corridor square is one of:

| Kind | Pack? | What happens on land |
|---|---|---|
| Empty | no | Turn ends. Next player. |
| Content | optional pack + optional **one** effect | Apply effect (if any), then draw from the pack (if any). |
| Door | **never** | Unlocked → enter that side room. Locked for this player → stay, next player. |
| Stair | **never** | Unlocked → move inward to the next floor’s stair square, or to the end room from the innermost floor. Blocked → stay, next player. |

The **end square** is always a room. Arriving there plays the end room (card-only or inner squares, as configured). If the end room is locked for that player, they stay on the innermost stair square.

**Effect** (at most one per square), v1 kinds:

- lock stairs for *n* of **this player’s** turns
- lock doors for *n* of **this player’s** turns
- lock a **named room** (including the end room) for *n* of **this player’s** turns
- same three as **everyone** locks for *n* full rounds

Locks do not draw cards. Door/stair squares never hold packs; packs live on content squares and inside rooms (including the end room).

## Turn loop

1. Current player spins (v1: spinner; range is template data, default 1–6).
2. Token slides that many squares along the **current ring** (or along inner room squares if they are in a side room).
3. Landing square resolves as above.
4. If a card or room sequence is in play, finish it (timer, pass, helper, together).
5. Next player, unless they remain in an inner-square room (they stay there until Leave Room). Occupying the end square after it has resolved ends Climb for that player (win).

## Cards and packs

Packs are data folders (JSON + media) **wired to squares or rooms**. v1 ships one bundled pack. More packs can be dropped in later; a store to **buy** them is out of scope.

**Kinds (v1):**

- Question
- Do / reveal something
- Image (alone to describe/talk about, or attached to another kind)
- Clip
- Audio

Any kind may:

- start a **timer** (countdown overlay). On zero, the **card** chooses: fail path, nudge only, or a specific listed result
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

1. **Engine (pure TypeScript, no UI)** — building graph (nested rings + centre end room), movement, locks, decks, eligibility, win check, save payload. This is the unit-tested core.
2. **Content** — template JSON, pack JSON, images/audio/video as static files.
3. **UI** — setup, nested frame board, overlays (spinner, card, timer), first-person popup, win screen.
4. **Persistence** — `localStorage` (or equivalent) after each completed turn and after setup.

First-person popup: CSS 3D corridor first. Add a small Three.js scene only if CSS looks too cheap. It is a presentation of discrete squares, not a character controller.

**Data flow:** load template + packs → setup (players, partners, excludes, groups) → validate relationship graph and floor/square-count rules → play loop → persist → win.

Invalid templates are **rejected at load/setup** with a clear message:

- `floorCount` greater than `maxFloors`
- inner corridor with more squares than the floor outside it
- square count not one of the three template options
- door or stair with a pack
- end square that is not a room
- side room with 1 inner square
- exclude-all without a partner

## UI states

- **Empty board / no save:** setup to start Climb.
- **Loading:** template/media fetch.
- **Error:** unreadable save, missing media (show placeholder + skip), invalid template.
- **Play:** all floors visible; whose turn; passes left; locks; dynamic door/stair labels.
- **Win:** named player resolved the centre end room; option to start a new game (clears save).

## Testing

Engine tests (no browser):

- Land-only resolve; pass-through door/stair does nothing
- Empty square ends the turn
- Door/stair lock vs enter/climb
- Inward stairs: outer ring → inner ring → end room
- Inner floor cannot exceed outer floor’s square count
- Card-only room snap-back vs inner squares + Leave Room
- End square is a room; Climb win after resolving it
- Together replaces solo when occupied
- Pack: top to bottom; shuffle after a full cycle
- Pass spends the correct player’s count and skips
- Helper spinner eligibility (excludes, closed pair, cannot exclude-all)
- Save round-trip

Manual: 2-player and 6-player pass-and-play on 3-floor Climb; confirm all rings and the centre room stay visible.

## Later slices (do not build in v1)

1. Visual editor + publish to Michael’s website
2. Buyable card packs
3. Dice as a movement option
4. Own-device multiplayer
5. Escape / hunt / whodunit win conditions and hidden groups
6. Native wrapper
7. `maxFloors` above 3

## Open defaults (change if you hate them)

- Spinner default **1–6**
- Loop direction **clockwise** on every ring
- Three square-count options: **16 / 12 / 8**. Climb v1 corridors: floor 1 (outer) **16**, floor 2 **12**, floor 3 (innermost ring) **8**, plus the centre end room.
- First player = **setup order**
- First-person default for Climb = **room + stairs**, skip **on**
- Passes **on**, **1** per player, for the bundled Climb pack
