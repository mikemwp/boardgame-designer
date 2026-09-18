# Building board template — design

**Date:** 2026-09-18  
**Status:** draft for review (reopened: PlayCanvas React 3D board v1)  
**Product:** a **game designer** (layout, cards, spinners, items, media) plus a **player** that runs whatever was designed. Climb is only the first bundled example, not the limit of the engine.

Think of this as a creator. The **engine is a small set of repeating mechanics** (stop on a square → optional background, media, spinner, card, item, move). The designer **links** squares, rooms, stairs, images, audio, spinners, cutscenes, and cards. A published game might be a full 3D-ish climb, a mystery with items, or a **plain board game** with no cutscenes and no first-person.

Play and design share one **grid + HUD** model (same idea as Michael’s widget home screen: dropdown → drop → drag). Designer can be a route in this app or a sibling project that exports the same JSON.

## Goal

A web creator (no Unity) where you design **many games**: new project, save drafts, **test** play, then **publish live**. **Game JSON + the designer** own the rules. **PlayCanvas React** (`playcanvas` + `@playcanvas/react`) is the **3D view**: play board, first-person rooms/stairs, and designer floor preview. The **v1 play board is 3D**.

## Non-goals (first implementation)

- Unity, Godot, Phaser, Three.js, or free movement. **Tokens** do not use physics. **Dice** may use PlayCanvas (ammo.js) physics **on the 3D board only**, then despawn. The integer is chosen first; the roll is made to show that face.
- The **PlayCanvas Editor** as the designer (our HTML grid + forms author games)
- `@playcanvas/web-components` (second 3D authoring surface; we use the React wrapper only)
- **PCUI** for HUD, player setup, or designer chrome (shadcn/ui only)
- Logins for **players** (designer publish can use a simple local/studio flow at first; public play stays no-account)
- Payments, purchasable packs (pack format exists; buying is later)
- Each player on their own device (later)
- Native apps
- Hidden-traitor *game* (the pair/exclude/group **graph** exists so a whodunit can be designed)
- Showing every floor at once on the play board

## Players and session

- Player count is **1 or more**. No engine cap. We will **test** 1 and 2–6; the UI must not assume 6 is max.
- **1 player:** interactive / cutscene-driven. No together cards (nobody else on the square). Player spinner with no eligible people uses the card’s **no-helper** path. Partner setup is skipped.
- **2+:** pass-and-play, one screen.
- Setup (2+; 1-player skips partner/exclude/group): **name**, **token colour**, optional **partner**, **cannot-partner** list (same exclude graph as player spinners: people you won’t couple with and who won’t be spun as “another player”), optional **group** (from the designer’s named list), **starting items**.
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

## 3D view (PlayCanvas React)

**PlayCanvas is locked** as the 3D engine. **`@playcanvas/react`** is the only wrapper. One PlayCanvas application module, three shells:

- **Play board:** current floor as a **3D plane** (corridor, rooms, stairs, **3D tokens**). Game JSON maps to `<Entity>` tiles. Discrete squares; tokens **slide** square-to-square along the path. No physics, no free walk.
- **Play first-person:** same app, camera into a corridor/room/stair when the game setting allows.
- **Creator preview:** HTML grid, dropdowns, drag-drop, forms (like the widget home screen). A **PlayCanvas preview** of the floor being edited so Test/Publish match what you placed. Do not build the editor inside the 3D canvas.

HUD, cards, spinners, inventory, and **player setup** stay **DOM + shadcn/ui** over the canvas. Do not use PlayCanvas Screen/Element UI, **PCUI**, or canvas-drawn HUD for those.

**Do not use** `@playcanvas/web-components`. That is another way to declare the same engine; we already picked React.

**Agent skills:** [playcanvas/skills](https://github.com/playcanvas/skills) apply **only** to the 3D module (React surface, scene assembly, lighting, GLB inspect, pixel checks). They must not own game rules, Game JSON, the designer, HUD, or setup. `build-hud` / `manage-game-state` in that pack are not our HUD or session reducer.

## Play screen

On a turn you see **that player’s floor only**, as a **3D board**. The HUD is a DOM overlay (not a hole punched in the mesh).

- **Centre HUD (reserved in the designer grid):** active spinner or dice, cards, inventory, timer, whose turn, passes, player strip. Overlays for the current scenario. No board widgets here.
- **Corridor:** looping path on the 3D floor. **Every floor must loop**, except a flagged **end floor**, which may be a path into the end room (or a single room).
- **Rooms:** beside the corridor, not under the HUD overlay. Resizable. One door square. Optional media (image, cutscene, **audio**).
- **Stairs:** inner edge of a corridor cell (cell **becomes** the stair). Label uses the **destination floor’s name** (`Up to Penthouse`, `Down to Cellar`). Optional media including **audio**.
- **Minimap** in the HUD: overlay of the whole building, everyone marked. Other floors’ tokens are not on the 3D floor.
- **First-person:** game setting: **none** | room only | room + stairs | every spin, plus allow skip. **None** = 3D board camera only (no FP, cutscenes optional).
- **Board background / materials:** stopping on a square, entering a room, or using stairs can swap floor/room imagery (designer links). Card-only rooms typically switch that room’s image while the room card is up.
- **Inventory** in the HUD for the current player (icons). 1-player still has inventory.

Door/stair labels are dynamic: Enter Room / Room locked, Use Stairs / Stairs blocked.

## Tokens

Tokens are **3D entities** on the PlayCanvas board, one per player.

- Sit on the **centre of the current square**. On a move they **slide** along the path (lerp tile-to-tile), then **stop**. Resolve only the landing square.
- Default mesh is a pawn/token; the designer may link a **GLB** (or keep the default). Setup **token colour** tints the mesh.
- Other players on this floor are visible on the board; other floors only on the minimap.
- Tokens never use physics. Sliding is animation on the grid.

## Layout designer

Floor tabs: any number of **named** floors (Ground, Cellar, Roof, …). No max, no special floor types. HUD cannot receive drops.

**Palette:**

| Widget | Rules |
|---|---|
| Corridor square | Non-HUD cell. Adjacent cells form paths. **Loop required** except on a flagged **end floor**. Optional media (image, cutscene, **audio**). |
| Stair | Inner edge of a corridor cell only. That cell becomes a stair. Direction **up, down, or both**. **Must link to a destination** before Test or Publish: another floor’s landing cell, a **room-only** floor, or the end room. Several stairs may share a destination. Optional media (image, cutscene, **audio**). |
| Room | Outer or inner side of a corridor, or **fill a floor** as a single room. Resize. Pick door if a corridor exists. Optional background image, cutscene, and/or **audio**. **Card-only** or **inner map** (any number of inner squares). Flag at most one **end room**. |

**Stairs must go somewhere** before Test or Publish. A stair may link to:

- another **named** floor’s landing cell (that floor’s corridor loop, with its own rooms and stairs), or
- a **room-only** floor (stairs dump into that room), or
- the **end room**.

A dangling stair is invalid for Test/Publish. Draft save is still allowed.

**Only the end floor** may use a **single-line corridor** that leads to the end room. Every other floor with a corridor **must loop**. Any floor may instead be room-only.

**Any tile** may have image, cutscene, and/or **audio** (any mix). Mark one cell as **start**; it can play media **at match start** (entrance) as well as on stop.

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

Any square, room, or stair: none, **image**, **cutscene**, **audio**, or any mix. Each is a designer **link** (file/ref), independent of the others.

- **Board background** (optional, per square / room / stair): when you stop or enter, the **main play area** can switch to that image. Clears when the designer says (leave room, next stop, etc.).
- **Audio** (optional, same places): plays on stop/enter. Does not replace image or cutscene.
- **On stop** (default if media is set): HUD overlay and/or background and/or audio, then the tile’s usual resolve.
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

## Spinners and dice

Spinners and dice are **named, reusable** designer objects. Any of them may also link **audio** that plays when used.

| Kind | Config | Use |
|---|---|---|
| Number spinner | min, max, step, optional labels, optional **audio** | Movement, or a card/scenario that needs a number |
| Dice | **count** (1 or more), **sides** (4 / 6 / 8 / 10 / 12 / 20, or designer N), optional mesh, optional **audio** | Same as a number spinner: an integer result. Movement, or a card that needs a number |
| Player | eligibility from the **relationship graph** (partners, cannot-partner list, groups), optional **audio** | “Another player helps / is accused” |
| Outcome | Designer config: slice **count** (2 or more), **labels**, optional **weights** (equal split default), optional spinner **audio**, and per-slice effects. The designer chooses what each slice means. Each slice: label plus any of **image, cutscene, audio, card, item, token move** | One random beat; a room “item spinner” is this, not a new type |

**Dice** live **on the 3D board** (same PlayCanvas scene as tiles and tokens). We build this ourselves with PlayCanvas rigid bodies — no Three.js dice libraries, no felt-tray overlay.

- Spawn near the active token (or a designer roll point). They **tumble across the floor tiles**, collide with the board, settle, then despawn or idle until the next roll.
- Floor tiles (and optionally low walls) are **static colliders** for dice only. Tokens stay animated slides; they are not rigid bodies and dice must not knock them around (collision-filtered out).
- The **engine picks the integer first** (same RNG as a number spinner). Physics is the show: impulse plus face remap/prepare so the settled die matches that number. Test and Publish stay deterministic.

A game may use several outcome spinners and more than one number/dice def. Cards, tiles, and rooms may **link** any spinner or dice. After the wheel/dice lands, play the slice’s media (image, cutscene, audio) / card / move in that order (skip anything unset).

A game picks default **movement**: a **number spinner** or **dice**. 1-player: number, dice, and outcome work; player spinner follows no-helper if the set is empty.

**Outcome slices** (each independently, all designer-set):

- Label (Up / Down, Yes / No, Left wing / Roof / Cellar, item names, …)
- Optional **overlay image**
- Optional **cutscene**
- Optional **audio**
- Optional **card** (or pack draw) — e.g. each slice is an item that opens that item’s card
- Optional **item** give/take
- Optional **token movement**: move the current player **N** squares along the current path, **or** send them to a named tile/stair/room (designer picks). Movement still **stops and resolves** that landing square.

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
- Linked **spinner or dice** (number spinner / dice / player / outcome)
- Linked **overlay image**, **cutscene**, and/or **audio**
- Together version of the **same type** (ignored in 1-player)
- **No-show groups:** one or more designer groups that must not see this card
- Item give/take/require/share/lose
- Win / no-helper / fail paths as needed

**Deck:** animated flip. On a draw, walk the pile from the top for the **drawing player**. Cards flagged **no-show** for that player’s group are **left in place** (not flipped, not sent to the bottom). The first card that is allowed is dealt. After it is used, **that** card goes to the bottom. After a full cycle of *drawn* cards, the next draw **shuffles** (animation).

Skipped no-show cards stay in their order for the next player who is allowed them. A player with no group sees every card. If no allowed card remains in the pile, the draw is empty (continue; do not burn the hidden cards).

**Game passes:** optional max per player. Pass skips the card, stay, spend that actor’s pass (lander or helper).

## Relationships

Optional partner; **cannot-partner** / cannot-spin exclude list (cannot exclude everyone unless partnered; a closed pair may). The designer names **groups** freely (Faithfuls, Traitors, or any label). Groups apply default links, **default kits**, and **card no-show**. 1-player: graph unused; kit still applies; no-show does not apply.

## Architecture

TypeScript web app (Next.js + Tailwind + shadcn/ui). No backend required at first.

1. **Engine** — grid, loops, stair links, movement, locks, decks, spinners, inventory, eligibility, win, save. Unit-tested. **Not** PlayCanvas.
2. **Game JSON** — named floors, cells, stairs, rooms, HUD, media, start/end, spinner and dice defs, items, packs, named groups, card no-show, win rule, slug, draft vs live version. PlayCanvas entities are **derived** from this.
3. **Play UI** — PlayCanvas React **3D board** + DOM HUD; first-person/room cameras in the same app (shared with designer preview).
4. **Designer UI** — game library (new/open/save/test/publish), HTML layout grid, card/pack/spinner/item editors, validation, PlayCanvas floor preview.
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
- Number / player / outcome spinners and **dice** (engine integer first; PlayCanvas physics roll on the 3D floor)
- Room inner loops of any length; item squares; card-only door; board background per tile/room/stair
- Audio links on squares, rooms, stairs, spinners (and slices), and cards; missing audio placeholder + continue
- First-person **none** (3D board camera only) is valid
- Starting kit / group kit / setup pick pool seed inventory
- Card timer per card; pack back/front; shuffle cycle; group **no-show** skips in place, drawn card to bottom
- Tile media on stop + start intro (image, cutscene, audio)
- New / save draft / test / publish live; test is not public; live is a slug
- PlayCanvas React 3D board + first-person + designer preview; HUD/setup are DOM + shadcn
- 3D tokens slide tile-to-tile; dice tumble on the 3D board and show the pre-rolled integer

Manual: 1-player cutscene beat; 2- and 6-player; designer: new game, save invalid draft, Test blocked until stairs link, Publish produces a playable slug.

## Build order (after approval)

1. Engine + JSON schema
2. Player (draft test + live slug) with PlayCanvas React 3D board + first-person
3. Game library: New, Save, Open
4. Layout designer (HTML grid + PlayCanvas preview)
5. Card / spinner / dice / item designers
6. Publish live (versioned bundle)

## Later slices

1. Buyable packs  
2. Own-device multiplayer  
3. Native wrapper  
4. Cloud accounts for the studio (if local drafts stop being enough)

## Example defaults (Climb sample only — not engine limits)

- Movement spinner 1–6 **in that sample** (other games may use **dice**)  
- Three looping floors + room-only penthouse; up stairs only **in that sample**  
- Passes on, 1 each  
- First-person: room + stairs, skip on **in that sample** (other games may set **none**)  
- HUD centre rectangle set in the layout
