# Building board template — design

**Date:** 2026-09-18  
**Status:** draft for review  
**Product:** a **game designer** (layout, cards, spinners, items, media) plus a **player** that runs whatever was designed. Climb is only the first bundled example, not the limit of the engine.

Think of this as a creator. The **engine is a small set of repeating mechanics** (stop on a square → optional background, media, spinner, card, item, move). The designer **links** squares, rooms, stairs, images, spinners, cutscenes, and cards. A published game might be a full 3D-ish climb, a mystery with items, or a **plain board game** with no cutscenes and no first-person.

Play and design share one **grid + HUD** model (same idea as Michael’s widget home screen: dropdown → drop → drag). Designer can be a route in this app or a sibling project that exports the same JSON.

## Goal

A web creator (no Unity) where you design **many games**: new project, save drafts, **test** play, then **publish live**. **Three.js** is the shared 3D layer (play + designer preview). The board stays **HTML for v1**; a Three.js **3D-plane board** is a planned later move.

## Non-goals (first implementation)

- Unity, Godot, Phaser, free movement, or physics
- Logins for **players** (designer publish can use a simple local/studio flow at first; public play stays no-account)
- Payments, purchasable packs (pack format exists; buying is later)
- Each player on their own device (later)
- Dice as a second movement toy (spinners cover number / player / outcome)
- Native apps
- Hidden-traitor *game* (the pair/exclude/group **graph** exists so a whodunit can be designed)
- Showing every floor at once on the play board

## Players and session

- Player count is **1 or more**. No engine cap. We will **test** 1 and 2–6; the UI must not assume 6 is max.
- **1 player:** interactive / cutscene-driven. No together cards (nobody else on the square). Player spinner with no eligible people uses the card’s **no-helper** path. Partner setup is skipped.
- **2+:** pass-and-play, one screen.
- Setup (2+; 1-player skips partner/exclude/group): **name**, **token colour**, optional **partner**, **cannot-partner** list (same exclude graph as player spinners: people you won’t couple with and who won’t be spun as “another player”), optional **group**, **starting items**.
- **Starting items** at setup:
  - The designer can give everyone a **kit**, or kits **by group** (Faithfuls get X, Traitors get Y).
  - If the game has a **pick pool**, each player also chooses up to N items from that pool (unique or shared, as the designer sets).
  - 1-player: kit plus optional pick, then play. Inventory is live before intro media.
- Session persists in the **browser**. No accounts.

## Game library (multiple games)

The designer is a **studio**, not a single document.

| Action | Behaviour |
|---|---|
| **New** | Create a named game (empty grid, default HUD). Does not overwrite other games. |
| **Save** | Persist the draft (layout, packs, items, spinners, media refs). Keep working. Invalid stairs/loops **block Test and Publish**, but **Save draft** is allowed so work isn’t lost. |
| **Open** | List drafts and live games; open one to edit. |
| **Test** | Play the **current draft** in player mode (including 1-player). Not public. Validation must pass. |
| **Publish live** | Freeze a version, give it a public slug/URL, and make **Play** on the site load that version. Publishing again replaces live for that game (keep previous version as history if cheap). Unpublish / revert later is allowed. |

Live play never silently uses an unsaved draft. Test always uses the draft in memory (after save).

Media for a game stays with that game (per-project folder). Copy-as-new-game duplicates a draft.

## First-person / 3D

**Three.js is locked** for 3D. One module, two shells:

- **Play:** first-person corridor, room/stair views, 3D cut-ins.
- **Creator:** HTML grid, dropdowns, drag-drop, forms (like the widget home screen). A **Three.js preview** of the floor being edited so Test/Publish match what you placed. Do not build the editor inside the 3D canvas.

HUD, cards, spinners, inventory stay **DOM**. Discrete squares, no free movement, no physics.

**v1 play board is HTML** (current-floor ring, tokens slide on the grid). **Later:** the same board as a **Three.js 3D plane** (tokens on a 3D floor, closer to the Three.js examples). Same JSON; swap the board renderer, don’t redesign the games.

## Play screen

Grid. On a turn you see **that player’s floor only**.

- **Centre HUD (reserved):** active spinner, cards, inventory, timer, whose turn, passes, player strip. Overlays for the current scenario. No board widgets here.
- **Corridor:** around the HUD. **Every floor must loop**, except a flagged **end floor**, which may be a path into the end room (or a single room).
- **Rooms:** outside or inside the corridor, not on the HUD. Resizable. One door square. Optional media.
- **Stairs:** inner edge of a corridor cell (cell **becomes** the stair). Label uses the **destination floor’s name** (`Up to Penthouse`, `Down to Cellar`).
- **Minimap** in the HUD: overlay of the whole building, everyone marked. Other floors’ tokens are not on the big ring.
- **First-person popup:** game setting: **none** | room only | room + stairs | every spin, plus allow skip. **None** = plain board game (no FP, cutscenes optional).
- **Board background:** the main play area can swap a **background image** when you stop on a square, enter a room, or use stairs (designer links the image). Card-only rooms typically switch to that room’s image while the room card is up.
- **Inventory** in the HUD for the current player (icons). 1-player still has inventory.

Door/stair labels are dynamic: Enter Room / Room locked, Use Stairs / Stairs blocked.

## Layout designer

Floor tabs: any number of **named** floors (Ground, Cellar, Roof, …). No max, no special floor types. HUD cannot receive drops.

**Palette:**

| Widget | Rules |
|---|---|
| Corridor square | Non-HUD cell. Adjacent cells form paths. **Loop required** except on a flagged **end floor**. Optional media. |
| Stair | Inner edge of a corridor cell only. That cell becomes a stair. Direction **up, down, or both**. **Must link to a destination** before Test or Publish: another floor’s landing cell, a **room-only** floor, or the end room. Several stairs may share a destination. Optional media. |
| Room | Outer or inner side of a corridor, or **fill a floor** as a single room. Resize. Pick door if a corridor exists. Optional background image. **Card-only** or **inner map** (any number of inner squares). Flag at most one **end room**. |

**Stairs must go somewhere** before Test or Publish. A stair may link to:

- another **named** floor’s landing cell (that floor’s corridor loop, with its own rooms and stairs), or
- a **room-only** floor (stairs dump into that room), or
- the **end room**.

A dangling stair is invalid for Test/Publish. Draft save is still allowed.

**Only the end floor** may use a **single-line corridor** that leads to the end room. Every other floor with a corridor **must loop**. Any floor may instead be room-only.

**Any tile** may have image and/or cutscene. Mark one cell as **start**; it can play media **at match start** (entrance) as well as on stop.

## Building (runtime)

- Floors are an ordered stack of **named** floors in designer order. Count is whatever the designer saved. Names are free text (Ground, Cellar, Roof, …) — not types.
- Movement along the current path, then door or stair.
- **End floor** (optional): **(A)** room-only end room, one or more stairs from below enter it, or **(B)** non-loop approach path to the end room. You win a “reach the end” game only if that win rule is selected **and** the end room has **resolved**.
- **Win** is designed, not assumed: e.g. reach end room, or **none** (cards/cutscenes/items declare win). Climb example uses reach end room.
- **Rooms** (same square rules as the rest of the game):
  - **Card-only:** landing on the **door** (corridor square) plays that room’s card(s). Optional: main-board **background** becomes the room image for that beat. Then snap back to the door (unless the card/spinner says otherwise).
  - **Inner map:** the room is its own path of **any number** of inner squares that **loop back to the door**. Enter via the door; leave by stopping on the door square again (or a marked Leave square that *is* the door). Inner squares are wired like any tile: packs, media, backgrounds, spinners, effects.
  - **Item squares** sit **beside** inner squares (same idea as a room beside a corridor). Landing on an item square plays that square’s card/pack — typically an item card. The designer makes room-specific packs and attaches them; there is no special item engine, only the same card link.
  - A **room card may itself be a spinner card**: each slice is whatever the designer labels (item, colour, direction, …) and each slice **links to a card**. That is the outcome spinner, not a new mechanic.
- Start floor/square are chosen in the designer.

## Tile media

Any tile: none, image, cutscene, or both.

- **Board background** (optional, per square / room / stair): when you stop or enter, the **main play area** can switch to that image. Clears when the designer says (leave room, next stop, etc.).
- **On stop** (default if media is set): HUD overlay and/or background, then the tile’s usual resolve.
- **On game start:** available on the start square (default on if it has media). Shared intro before the first spin.
- Skip if the game allows skip. Missing file: placeholder + continue. Media never replaces a pack/card; it plays first.

## Squares

Resolve **only the square you stop on**.

| Kind | Pack? | On land |
|---|---|---|
| Empty corridor | no | Media, then next player (or next beat in 1-player). |
| Content corridor | optional pack + optional one effect | Media, then effect, then pack. |
| Door | optional pack if **card-only room** | Media + optional background. Unlocked card-only → play room card (may be a spinner card). Unlocked inner-map → enter inner squares. Locked → stay. |
| Inner / item square | optional pack | Same as any content square: media, pack, spinner, item. Path **loops to the door**. |
| Stair | never | Media, then go to the **linked** destination if unlocked. |

Effects (at most one per corridor square) still include locks (stairs/doors/named room, self or everyone). Extra effect: **give / take / require item**.

Door squares hold a pack **only** when the room is card-only. Stair squares never hold packs.

## Spinners

Spinners are **named, reusable** designer objects — not a single hard-coded 1–6 wheel.

| Kind | Config | Use |
|---|---|---|
| Number | min, max, step, optional labels | Movement, or a card/scenario that needs a number |
| Player | eligibility from the **relationship graph** (partners, cannot-partner list, groups) | “Another player helps / is accused” |
| Outcome | Designer config: slice **count** (2 or more), **labels**, optional **weights** (equal split default), and per-slice effects. The designer chooses what each slice means. Each slice: label plus any of **image, cutscene, card, item, token move** | One random beat; a room “item spinner” is this, not a new type |

**Outcome slices** (each independently, all designer-set):

- Label (Up / Down, Yes / No, Left wing / Roof / Cellar, item names, …)
- Optional **overlay image**
- Optional **cutscene**
- Optional **card** (or pack draw) — e.g. each slice is an item that opens that item’s card
- Optional **item** give/take
- Optional **token movement**: move the current player **N** squares along the current path, **or** send them to a named tile/stair/room (designer picks). Movement still **stops and resolves** that landing square.

A game may use several outcome spinners. Cards, tiles, and rooms may **link** any spinner. After the wheel lands, play the slice’s media/card/move in that order (skip anything unset).

A game picks which **number** spinner is default **movement**. 1-player: number and outcome work; player spinner follows no-helper if the set is empty.

## Items and inventory

Items are designer objects (`id`, name, icon, stackable?, canShare, canLose).

- Each player has an **inventory** (HUD), seeded at setup from kit + picks, then changed in play.
- Cards, tile effects, and together/helper beats can **give**, **remove**, **require** (can’t proceed without it), **share** (to partner / chosen player), or **lose** (timer fail, pass, or card).
- Sharing uses the relationship graph when the card says “partner”; otherwise a player spinner (if eligible people exist).
- 1-player: share-to-other is skipped; lose/give/require still work (camera, magnifying glass for a solo mystery).

## Cards and packs (card designer)

A **pack** is a set: shared **back image**, list of cards, wired to squares/rooms.

**Front:** a **template image** for that pack (or per card) plus **slots** for the card’s properties (title, body, timer, buttons). Not a single fixed card layout for every game.

Each card may:

- Kind: question, do/reveal, image-talk, clip, audio, or a combination the template allows
- **Timer** with its **own duration** and zero result (fail, nudge, listed result, lose item, …)
- **Pass** allowed or not
- Linked **spinner** (number / player / outcome)
- Linked **overlay image** and/or **cutscene**
- Together version of the **same type** (ignored in 1-player)
- Item give/take/require/share/lose
- Win / no-helper / fail paths as needed

**Deck:** animated flip; used card to the bottom; after a full cycle, next draw **shuffles** (animation).

**Game passes:** optional max per player. Pass skips the card, stay, spend that actor’s pass (lander or helper).

## Relationships

Optional partner; **cannot-partner** / cannot-spin exclude list (cannot exclude everyone unless partnered; a closed pair may). Groups apply default links **and default kits**. 1-player: graph unused; kit still applies.

## Architecture

TypeScript web app (Next.js + Tailwind + shadcn/ui). No backend required at first.

1. **Engine** — grid, loops, stair links, movement, locks, decks, spinners, inventory, eligibility, win, save. Unit-tested.
2. **Game JSON** — named floors, cells, stairs, rooms, HUD, media, start/end, spinner defs, items, packs, win rule, slug, draft vs live version.
3. **Play UI** — HTML board + HUD for v1; **Three.js** first-person/room views (shared with designer preview).
4. **Designer UI** — game library (new/open/save/test/publish), layout grid, card/pack/spinner/item editors, validation.
5. **Persistence** — drafts in `localStorage` (and downloadable JSON); **live** games as versioned static bundles the public player loads by slug.

Invalid if: stair with no destination; non-loop corridor on a non-end floor; end-floor path that doesn’t reach the end room; exclude-all without a partner.

## UI states

**Library:** list of drafts and live games; New.  
**Designer:** floors, palette, editors, Save, Test, Publish (Publish disabled until valid).  
**Test play:** same player as live, marked as preview, not the public URL.  
**Live play:** public slug; intro media; turn; overlays; win as designed.  
**Errors:** missing media placeholder; named layout errors; publish blocked with a list of validation failures.

## Testing

- Loop required except flagged end floor; any floor may be room-only or a looping corridor
- Stair must link to a named destination (landing cell, room-only floor, or end room)
- Up/down/both stairs; dangling stair rejected
- End floor path vs room-only end; non-end non-loop rejected
- 1-player: no together; player spinner → no-helper path; inventory still works
- Number / player / outcome spinners (designer slice count and labels; slice can move, play media, draw a card, give an item)
- Room inner loops of any length; item squares; card-only door; board background per tile/room/stair
- First-person **none** (plain board) is valid
- Starting kit / group kit / setup pick pool seed inventory
- Card timer per card; pack back/front; shuffle cycle
- Tile media on stop + start intro
- New / save draft / test / publish live; test is not public; live is a slug
- Three.js first-person + designer preview; HTML board v1

Manual: 1-player cutscene beat; 2- and 6-player; designer: new game, save invalid draft, Test blocked until stairs link, Publish produces a playable slug.

## Build order (after approval)

1. Engine + JSON schema
2. Player (draft test + live slug) with Three.js first-person
3. Game library: New, Save, Open
4. Layout designer
5. Card / spinner / item designers
6. Publish live (versioned bundle)

## Later slices

1. **Three.js 3D-plane play board** (replace the HTML ring; same game JSON)
2. Buyable packs  
3. Own-device multiplayer  
4. Native wrapper  
5. Cloud accounts for the studio (if local drafts stop being enough)

## Example defaults (Climb sample only — not engine limits)

- Movement spinner 1–6  
- Three looping floors + room-only penthouse; up stairs only **in that sample**  
- Passes on, 1 each  
- First-person: room + stairs, skip on **in that sample** (other games may set **none**)  
- HUD centre rectangle set in the layout
