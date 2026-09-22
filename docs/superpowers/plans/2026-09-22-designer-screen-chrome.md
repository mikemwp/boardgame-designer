# Designer screen chrome + levels + preview

Implement design screen amendments groups 1–2 (including resize key bug and top-down preview). More groups will follow; do not invent later work.

Base: `github/main` (`d840078` or newer). Branch `feat/designer-screen-chrome`. Cursor model only. TDD. Push `github HEAD:main` + origin.

## Group 1
- Header: larger title, no subtitle; library bar on that top row.
- Center game title (larger); no Saved stamp; `(draft)` / `(Published) vN`.
- Empty library: no “No game”, no “Create a game…”.
- Buttons right; Save same style; Save/Test/Delete disabled with no game; stronger hover.
- New Game: title+X; empty focused name; Start from Empty (default), saved games, Climb last; `(draft)` / `(Published)` on radios.
- Open Game: drop helper text; open draft or published.
- Version A: first publish `v1`; first edit after publish `(draft) v1.1`; each Save or Test while unpublished bumps minor; republish keeps that number.
- Metadata: last saved, version, published date, status.

## Group 2
- UI: floor → level; default **Level 1**; new **Level 2+**.
- Delete-level bug: first/leftmost level must not vanish; disable Delete when one level remains.
- Toolbar: shape + tile fields centered on the level/tool row.
- Square: **Tiles** = 3×3…12×12. Rectangle: length + width.
- **HUD tile** → **HUD**.
- Level name after Delete level; selected level; commit on blur.
- Inspector **Tile Actions** (same tile actions).
- Narrower canvas; more width for right panes; **fixed heights**; shorter preview.
- New/Open: dirty-save prompt.

## Bugs / preview
- Unique keys after resize (`floor-1-c21` collision).
- Preview camera **top-down** (board on XZ, camera +Y looking down); keep orbit/zoom.

## Out
- Polar board shapes stay hidden.
- Rooms, publish live UI, later amendment groups.
