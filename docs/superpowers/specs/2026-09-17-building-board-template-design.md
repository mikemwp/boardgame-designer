# Building board template — design

**Date:** 2026-09-18  
**Status:** draft for review  
**v1 product:** a pass-and-play web app that **plays** a configured building game (Climb) and a **layout designer** that authors those configurations

This is a **game template / creator**, not a single story. The same engine can later be penthouse climb, escape, ghost hunt, or whodunit by changing layout, packs, and rules. Climb is the first bundled game.

The designer follows the same idea as Michael’s widget home screen: pick a piece from a dropdown, drop it on a grid, drag to place. Play and design share one **grid + HUD** model. The designer can live in this repo as a second route, or in a sibling project that **exports the same JSON** this player loads.

## Goal

Players sit at one screen, spin, and move around a building made of corridor loops, rooms, stairs, cards, and short media — without Unity. Michael (and later other creators) **draw** each floor on a grid instead of picking a fixed square count.

## Non-goals (v1)

- Unity, Godot, Phaser, free movement, physics, or a full 3D engine
- Logins, payments, purchasable packs (pack **format** exists; buying is a later slice)
- Each player on their own device
- Dice (setting exists later; v1 is spinner only)
- Native apps (web first; wrap later if stores matter)
- Hidden-traitor gameplay (the pair/exclude/group **graph** exists; the full social-deduction game does not)
- Down stairs in Climb (the layout can store a down stair; Climb v1 only uses **up**)
- More than `maxFloors` (v1: **3**)
- Showing every floor at once on the play board (that crowded the screen)

## Players and session

- **2–6 players**, pass-and-play, one screen. Player count is a template setting; v1 cap is 6.
- Setup before play: name, token colour, optional **partner**, optional **cannot-spin** list, optional **group**.
- Current game persists in the **browser**. No accounts.
- Later: same engine, each player on their own phone/laptop.

## Play screen

The board is a **grid**. On your turn you see **your floor only**.

- **Centre HUD (reserved):** spinner, cards, clips, audio, timer, whose turn, passes, player strip (name + floor for everyone). No board pieces live here. Overlays stack on this HUD for the current scenario.
- **Corridor** occupies grid cells around the HUD. On a **normal floor**, it **must form a loop**. On the **end floor**, see End floor below. Tokens slide along that floor’s path.
- **Rooms** sit on the **outside** of the corridor (toward the screen edge) or the **inside** (toward the HUD), without entering the HUD reserved cells. A room is larger than one cell and can be resized. It spans several corridor cells; exactly **one** of those corridor cells is the **door**.
- **Stairs** are corridor cells on the **inner** side of the corridor (toward the HUD). Label is the destination, e.g. `Up to floor 2`. v1 Climb is up only. Later: `Down to basement`.
- **Minimap** control in the HUD opens an overlay of the **whole building** with every player marked on their square. Close it to return to the current-floor board. Tokens for other floors do **not** appear on the big ring — only in the player strip and on the minimap.
- **First-person popup** is a template setting: room only | room + stairs | every spin. Second setting: **Allow skip first-person**.

Door/stair labels are **dynamic** for the current player: Enter Room / Room locked, Use Stairs / Stairs blocked.

Entering a room or using stairs can show a HUD overlay: still image or cutscene linked on that room/stair (then the card / move continues).

v1 play layout is desktop-first, usable on a tablet.

## Layout designer

One **floor** at a time on the same grid. Floor tabs (1…`maxFloors`). HUD block is visible and **cannot** receive drops.

**Palette (dropdown, then drag onto the grid):**

| Widget | Rules |
|---|---|
| Corridor square | Drop on a non-HUD cell. Adjacent corridor cells form paths. On a **normal floor**, save is invalid until they form a **single loop**. On the **end floor**, a loop is **not** required — a path (or no corridor at all) is allowed. |
| Stair | Drop only on the **inner** edge of an existing corridor square. That cell **becomes** a stair square. Destination: next floor up (v1), **or the end room** if the floor above is room-only. **Several** stairs on the same floor may share that destination. Optional image/cutscene. |
| Room | Drop on the **outer or inner** side of a corridor (not on the HUD), **or** fill the end floor as a single room with no corridor. Resize freely. If the room sits on a corridor, pick **which corridor square is the door**. Optional image/cutscene. Optional pack. Flag **at most one room in the game** as the **end room** (Climb win). |

Cannot drop two widgets on the same corridor cell except converting corridor → stair.

**Validation (designer and play load):**

- Each **normal** floor has exactly one corridor **loop**
- **End floor** is one of: **(A)** a single end room and no corridor, or **(B)** a **non-loop** corridor path whose tiles lead to the end room (tiles that don’t reach the end room are invalid)
- HUD cells empty of board widgets
- Stairs only on inner corridor cells, with a valid destination
- **One or more** stairs on the floor below may target the end floor (same end room, or landing cells on the end-floor path)
- Each room that sits on a corridor has exactly one door square on that path
- Rooms do not overlap HUD or each other
- End room is a room (required for Climb)
- Room-only end floor: arriving by stairs places the token **in the end room** (no paired stair cell required there)
- `floorCount` ≤ `maxFloors`
- Relationship graph rules (see below)

Designer **exports** template JSON. Play **imports** it. Climb v1 ships a bundled layout that obeys these rules (as if it had been drawn in the designer).

There are **no** preset square counts per floor. A normal floor’s loop is whatever the creator drew. The end floor does not have to loop.

## Building (runtime)

- `maxFloors`: **3** in v1. Climb uses 3 floors.
- Movement is along the current floor’s path (loop on normal floors; open path or immediate room on the end floor), then through a door or stair.
- **End floor** (top for Climb) is flagged in the layout. Two legal shapes:
  - **Room-only:** the whole floor is the end room. **One or more** stair tiles on the floor below dump you straight into that room.
  - **Approach corridor:** a **non-loop** run of tiles that leads to the end room’s door. Stairs from below land on a chosen cell of that path (or on the door). You still have to stop on the end room to win.
- **End room:** the flagged win room (not the HUD). After it **resolves**, that player wins Climb.
- Side rooms are still either **card-only** (play pack, snap back to the door square) or **2–4 inner squares** with a Leave Room square (snap back to the door). Inner squares are play state, not extra designer widgets in v1 — v1 designer places the room **footprint**; inner-square maps can be a later designer toggle.
- `startFloor` / `startSquare` (Climb: floor 1, a chosen corridor cell).
- `stairDirection` on the template: Climb `up`. Down is stored for later games.

## Squares

Resolve **only the square you stop on**, and only if it has something to resolve. Crossing a door or stair on the way never fires.

| Kind | Pack? | What happens on land |
|---|---|---|
| Empty corridor | no | Turn ends. Next player. |
| Content corridor | optional pack + optional **one** effect | Apply effect (if any), then draw from the pack (if any). |
| Door | **never** | Unlocked → enter that room (optional room image/cutscene in HUD first). Locked → stay, next player. |
| Stair | **never** | Unlocked → optional stair image/cutscene, then move to the destination: paired cell on the floor above, **or** straight into the end room if that floor is room-only. Blocked → stay, next player. |

**Effect** (at most one per corridor square), v1 kinds:

- lock stairs for *n* of **this player’s** turns
- lock doors for *n* of **this player’s** turns
- lock a **named room** (including the end room) for *n* of **this player’s** turns
- same three as **everyone** locks for *n* full rounds

Door/stair squares never hold packs. Packs live on content squares and inside rooms.

## Turn loop

1. Play view switches to the current player’s floor.
2. They spin (v1: spinner; default 1–6).
3. Token slides that many squares along this floor’s path (loop, end-floor approach, or already in the end room). If they are inside a side room, along that room’s inner squares.
4. Landing square resolves.
5. Card / room / overlay finishes (timer, pass, helper, together).
6. Next player (unless they remain in an inner-square room until Leave Room). After the end room resolves, Climb ends for that player (win).

## Cards and packs

Unchanged in spirit. Packs are JSON + media wired to squares or rooms.

**Kinds (v1):** Question; Do / reveal; Image; Clip; Audio.

Any kind may start a **timer** (countdown in the HUD) with a per-card zero result (fail, nudge, or listed result), and may allow **Pass**.

**Game passes:** optional max per player. Pass = skip card, stay, turn ends, spend that player’s pass.

**Together:** occupied square/room uses the together version of **that** pack’s type; replaces the solo card. Per card: lander-only or everyone on the square.

**Helper spinner:** picks another **eligible** player. Helper may Pass (their pass). Else help, or card fail path.

**Deck:** animated flip; used card to bottom; after a full cycle, next landing **shuffles** (animation) then draws.

## Relationships (setup graph)

- Optional **partner**
- **Cannot-spin** list: cannot exclude everyone unless you have a partner (closed pair may exclude all others)
- Unpaired: partner-cards fall back to helper spinner
- **Groups** store default partners/excludes; no hidden-traitor game in v1

## Architecture

**Stack:** TypeScript web app (Next.js + Tailwind + shadcn/ui). No backend in v1.

**Split:**

1. **Engine (pure TypeScript)** — grid graph, loop check, movement, locks, decks, eligibility, win, save. Unit-tested.
2. **Layout JSON** — floors, cells, rooms, stairs, HUD rect, media refs, end-room id, start cell.
3. **Packs** — JSON + images/audio/video.
4. **Play UI** — current-floor grid, HUD, minimap overlay, first-person popup, win.
5. **Designer UI** — same grid, palette, drag/drop/resize, validation, export.
6. **Persistence** — play session in `localStorage`; designer can save layouts in the browser too (v1), files on disk as JSON in the repo for Climb.

First-person: CSS 3D corridor first; tiny Three.js only if CSS looks cheap. Discrete squares, not a character controller.

**Data flow:** designer (or bundled JSON) → validate layout → setup players/graph → play loop → persist → win.

## UI states

- **Designer:** empty grid / floor tabs / invalid loop warning / export
- **Play, no save:** setup, then Climb
- **Loading / error:** missing media placeholder + skip; invalid layout named clearly
- **Play:** current floor, HUD, player strip, minimap icon
- **Win:** named player resolved the end room; new game clears save

## Testing

Engine:

- Loop validation on normal floors (open path invalid; single loop valid)
- End floor: room-only **or** a connected non-loop path to the end room
- Multiple stairs on the floor below may share the end room as destination
- Stair only legal on inner corridor; destination floor or end room exists
- Room door must be on the loop; resize keeps a door
- HUD cells reject pieces
- Land-only resolve
- Door/stair lock vs enter/climb
- Room overlay media does not skip the room card
- End room win after resolve
- Together, pack cycle/shuffle, pass, helper eligibility, save round-trip

Manual: 2 and 6 players on Climb; turn change swaps the visible floor; minimap shows everyone; designer: draw a loop, add inner stair, add outer room, pick door, refuse HUD drop.

## Build order (after this spec is approved)

1. Engine + bundled Climb layout + play (proves rules)
2. Layout designer on the same grid (author the next game without hand-JSON)
3. Later: store, dice, own-device, down-stair games, native

## Later slices

1. Publish layouts to Michael’s website
2. Buyable card packs
3. Dice
4. Own-device multiplayer
5. Escape / hunt / whodunit + hidden groups
6. Native wrapper
7. `maxFloors` above 3
8. Designer toggle for inner-square room maps
9. Down-stair labels in a shipped game

## Open defaults

- Spinner **1–6**
- Loop walk **clockwise** unless the drawn loop implies otherwise
- First player = **setup order**
- First-person default for Climb = **room + stairs**, skip **on**
- Passes **on**, **1** per player
- Climb end floor = **room-only** penthouse; one inner stair on floor 2 is enough, more stairs are allowed
- HUD reserved as a centre rectangle (size set in the layout, not by dropping widgets)
