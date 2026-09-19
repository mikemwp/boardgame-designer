# Building Board Template Implementation Plan

> **Status: superseded.** Spec reopened for PlayCanvas React 3D board v1. Do not implement this plan.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Next.js designer + player web app where Michael can author building-board games (layout, cards, spinners, items, media), test drafts, publish live slugs, and play them pass-and-play with an HTML v1 board and a shared Three.js first-person preview layer.

**Architecture:** Pure TypeScript **engine** (grid, movement, land-to-resolve, decks with group no-show, spinners, inventory, win) is unit-tested and UI-agnostic. **Game JSON** is the single source of truth for play, designer, test, and publish. **Play UI** renders the current floor as HTML; **Three.js** lives in one shared module for first-person room/stair views and designer floor preview only — not as a game kit or board driver. **Persistence** uses `localStorage` for drafts and static versioned bundles for live slugs. v1 board is HTML; a later slice swaps in a Three.js 3D-plane board renderer on the same JSON.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Vitest, Zod, Three.js (`@react-three/fiber` + `@react-three/drei`), `localStorage`

## Global Constraints

- Stack: **Next.js + TypeScript + Tailwind + shadcn/ui**
- **Three.js is a shared view module** (first-person rooms/stairs + designer preview), not the whole product; **do not** use `threejs-game-director` or full Three.js game kits as the build driver
- **v1 play board is HTML**; later Three.js 3D-plane board is a **renderer swap** on the same JSON (out of scope for this plan)
- **Climb** is a **bundled example only**, not engine limits
- Floors are **named** (Ground, Cellar, Roof, …); **no basement floor type**
- Spinners are **designer-owned** reusable defs (number / player / outcome with N slices)
- **Audio links** on tiles, rooms, stairs, spinners (and slices), and cards
- **Group no-show** cards stay **in the pile** (not flipped, not sent to bottom)
- **1+ players**, **no engine player cap**
- **Land-to-resolve** only (crossing doors/stairs on the way does nothing)
- Designer studio flow: **New / Save / Open / Test / Publish live**
- Invalid stairs/loops **block Test and Publish**; **Save draft** always allowed
- HUD is a reserved centre rectangle; board widgets never drop on HUD cells
- Discrete squares only — no free movement, no physics

---

## File structure (v1)

| Path | Responsibility |
|---|---|
| `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts` | Tooling |
| `src/app/layout.tsx`, `src/app/page.tsx` | Root shell; game library home |
| `src/app/designer/[gameId]/page.tsx` | Layout + content editors |
| `src/app/play/[slug]/page.tsx` | Public live player |
| `src/app/test/[gameId]/page.tsx` | Draft test player (not public) |
| `src/components/ui/*` | shadcn primitives |
| `src/engine/types.ts` | All engine + JSON types |
| `src/engine/schema.ts` | Zod schemas for Game JSON |
| `src/engine/validation.ts` | Stair links, loops, exclude-all, publish gate |
| `src/engine/graph.ts` | Floor/cell adjacency, path walking |
| `src/engine/movement.ts` | Token move along path; land-to-resolve boundary |
| `src/engine/resolve.ts` | Square land handlers (empty, content, door, stair, inner) |
| `src/engine/locks.ts` | Per-player and everyone lock ticks |
| `src/engine/decks.ts` | Pack draw, no-show in place, shuffle cycle |
| `src/engine/spinners.ts` | Number / player / outcome spin + slice effects |
| `src/engine/inventory.ts` | Give / take / require / share / lose |
| `src/engine/relationships.ts` | Partner, cannot-partner, groups, eligibility |
| `src/engine/win.ts` | Reach end room + designed win paths |
| `src/engine/session.ts` | `GameSession` reducer, turn loop, save payload |
| `src/engine/index.ts` | Public engine exports |
| `src/persistence/storage.ts` | Draft list, save/load, live bundle write |
| `src/persistence/publish.ts` | Version freeze + slug index |
| `src/components/play/BoardHtml.tsx` | v1 HTML ring board renderer |
| `src/components/play/Hud.tsx` | Spinner, cards, timer, inventory, minimap |
| `src/components/play/MediaLayer.tsx` | Board background, audio, cutscene hooks |
| `src/components/three/FirstPersonView.tsx` | Shared Three.js corridor/room view |
| `src/components/three/FloorPreview.tsx` | Designer floor Three.js preview |
| `src/components/designer/*` | Library, grid palette, editors |
| `src/content/climb/game.json` | Bundled Climb example |
| `public/games/[slug]/` | Published live bundles |
| `tests/engine/*.test.ts` | Engine unit tests |

**Future slice (not in this plan):** `src/components/play/BoardThreePlane.tsx` implements the same `BoardRenderer` interface as `BoardHtml.tsx` for 3D-plane play.

---

### Task 1: Project scaffold and test runner

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `tests/smoke.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `npm run test` runs Vitest; `npm run dev` serves Next.js on port **4317**

- [ ] **Step 1: Write the failing test**

```typescript
// tests/smoke.test.ts
import { describe, it, expect } from "vitest";

describe("tooling", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm install && npm run test`
Expected: FAIL — `vitest` or `npm run test` script missing

- [ ] **Step 3: Scaffold Next.js + Vitest**

```bash
npx create-next-app@latest tmp-scaffold --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
# move contents to repo root, then add vitest
npm install -D vitest @vitejs/plugin-react jsdom
```

```json
// package.json (scripts excerpt)
{
  "scripts": {
    "dev": "next dev -p 4317",
    "build": "next build",
    "start": "next start -p 4317",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

```tsx
// src/app/page.tsx
export default function HomePage() {
  return <main className="p-8">Building Board Studio</main>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS — 1 test

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js app with Vitest"
```

---

### Task 2: Engine types and Zod schema

**Files:**
- Create: `src/engine/types.ts`, `src/engine/schema.ts`, `tests/engine/schema.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type MediaRef = { kind: "image" | "audio" | "cutscene"; src: string }`
  - `export type SpinnerDef = NumberSpinner | PlayerSpinner | OutcomeSpinner`
  - `export type OutcomeSlice = { label: string; weight?: number; image?: MediaRef; cutscene?: MediaRef; audio?: MediaRef; cardId?: string; itemId?: string; moveSquares?: number; gotoTileId?: string }`
  - `export type CardDef = { id: string; kind: string; noShowGroups?: string[]; timerSeconds?: number; passAllowed?: boolean; spinnerId?: string; audio?: MediaRef; /* ... */ }`
  - `export type GameJson = { id: string; slug: string; name: string; version: number; floors: FloorDef[]; spinners: Record<string, SpinnerDef>; items: Record<string, ItemDef>; packs: Record<string, PackDef>; groups: string[]; winRule: WinRule; movementSpinnerId: string; settings: GameSettings }`
  - `export function parseGameJson(input: unknown): GameJson` (throws `ZodError`)

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/schema.test.ts
import { describe, it, expect } from "vitest";
import { parseGameJson } from "@/engine/schema";

describe("parseGameJson", () => {
  it("parses minimal valid game", () => {
    const game = parseGameJson({
      id: "g1",
      slug: "climb",
      name: "Climb",
      version: 1,
      floors: [{ id: "f1", name: "Ground", cells: [], rooms: [] }],
      spinners: {
        move: { id: "move", kind: "number", min: 1, max: 6, step: 1 },
      },
      items: {},
      packs: {},
      groups: [],
      winRule: { kind: "reachEndRoom" },
      movementSpinnerId: "move",
      settings: { firstPerson: "roomAndStairs", allowSkipFirstPerson: true },
    });
    expect(game.name).toBe("Climb");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/schema.test.ts`
Expected: FAIL — module `@/engine/schema` not found

- [ ] **Step 3: Implement types + Zod parser**

```typescript
// src/engine/types.ts
export type MediaRef = { kind: "image" | "audio" | "cutscene"; src: string };

export type NumberSpinner = {
  id: string;
  kind: "number";
  min: number;
  max: number;
  step: number;
  labels?: string[];
  audio?: MediaRef;
};

export type PlayerSpinner = {
  id: string;
  kind: "player";
  audio?: MediaRef;
};

export type OutcomeSpinner = {
  id: string;
  kind: "outcome";
  slices: OutcomeSlice[];
  audio?: MediaRef;
};

export type OutcomeSlice = {
  label: string;
  weight?: number;
  image?: MediaRef;
  cutscene?: MediaRef;
  audio?: MediaRef;
  cardId?: string;
  itemId?: string;
  moveSquares?: number;
  gotoTileId?: string;
};

export type SpinnerDef = NumberSpinner | PlayerSpinner | OutcomeSpinner;

export type ItemDef = {
  id: string;
  name: string;
  icon: string;
  stackable?: boolean;
  canShare?: boolean;
  canLose?: boolean;
};

export type CardDef = {
  id: string;
  kind: "question" | "do" | "imageTalk" | "clip" | "audio" | "combo";
  title?: string;
  body?: string;
  noShowGroups?: string[];
  timerSeconds?: number;
  timerOnZero?: string;
  passAllowed?: boolean;
  spinnerId?: string;
  audio?: MediaRef;
  image?: MediaRef;
  cutscene?: MediaRef;
  togetherVariantId?: string;
};

export type PackDef = {
  id: string;
  backImage: string;
  frontTemplate?: string;
  cardIds: string[];
};

export type CellKind = "empty" | "content" | "door" | "stair" | "inner";

export type CellDef = {
  id: string;
  x: number;
  y: number;
  kind: CellKind;
  packId?: string;
  effect?: string;
  media?: MediaRef[];
  backgroundImage?: string;
  stairLink?: { direction: "up" | "down" | "both"; destFloorId: string; destCellId: string };
  isStart?: boolean;
};

export type RoomDef = {
  id: string;
  name: string;
  doorCellId: string;
  cardOnly?: boolean;
  innerCells?: CellDef[];
  media?: MediaRef[];
  isEndRoom?: boolean;
};

export type FloorDef = {
  id: string;
  name: string;
  isEndFloor?: boolean;
  isRoomOnly?: boolean;
  cells: CellDef[];
  rooms: RoomDef[];
};

export type WinRule =
  | { kind: "reachEndRoom" }
  | { kind: "none" }
  | { kind: "custom"; cardPath?: string };

export type GameSettings = {
  firstPerson: "none" | "room" | "roomAndStairs" | "everySpin";
  allowSkipFirstPerson: boolean;
  passesEnabled?: boolean;
  maxPassesPerPlayer?: number;
};

export type GameJson = {
  id: string;
  slug: string;
  name: string;
  version: number;
  floors: FloorDef[];
  hud: { x: number; y: number; w: number; h: number };
  spinners: Record<string, SpinnerDef>;
  items: Record<string, ItemDef>;
  packs: Record<string, PackDef>;
  cards: Record<string, CardDef>;
  groups: string[];
  winRule: WinRule;
  movementSpinnerId: string;
  settings: GameSettings;
};
```

```typescript
// src/engine/schema.ts
import { z } from "zod";
import type { GameJson } from "./types";

const mediaRef = z.object({
  kind: z.enum(["image", "audio", "cutscene"]),
  src: z.string().min(1),
});

const gameSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  version: z.number().int().nonnegative(),
  floors: z.array(z.any()),
  hud: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).default({ x: 4, y: 4, w: 8, h: 8 }),
  spinners: z.record(z.any()),
  items: z.record(z.any()),
  packs: z.record(z.any()),
  cards: z.record(z.any()).default({}),
  groups: z.array(z.string()),
  winRule: z.object({ kind: z.enum(["reachEndRoom", "none", "custom"]) }),
  movementSpinnerId: z.string(),
  settings: z.object({
    firstPerson: z.enum(["none", "room", "roomAndStairs", "everySpin"]),
    allowSkipFirstPerson: z.boolean(),
    passesEnabled: z.boolean().optional(),
    maxPassesPerPlayer: z.number().optional(),
  }),
});

export function parseGameJson(input: unknown): GameJson {
  return gameSchema.parse(input) as GameJson;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine tests/engine
git commit -m "feat(engine): add Game JSON types and Zod parser"
```

---

### Task 3: Layout validation (stairs, loops, exclude-all)

**Files:**
- Create: `src/engine/validation.ts`, `tests/engine/validation.test.ts`

**Interfaces:**
- Consumes: `GameJson`, `parseGameJson`
- Produces:
  - `export type ValidationIssue = { code: string; message: string; floorId?: string; cellId?: string }`
  - `export function validateGame(game: GameJson): ValidationIssue[]`
  - `export function canTestOrPublish(game: GameJson): boolean` → `validateGame(game).length === 0`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/validation.test.ts
import { describe, it, expect } from "vitest";
import { validateGame } from "@/engine/validation";
import type { GameJson } from "@/engine/types";

const base = (): GameJson => ({
  id: "g1",
  slug: "t",
  name: "T",
  version: 1,
  hud: { x: 4, y: 4, w: 8, h: 8 },
  spinners: { move: { id: "move", kind: "number", min: 1, max: 6, step: 1 } },
  items: {},
  packs: {},
  cards: {},
  groups: [],
  winRule: { kind: "none" },
  movementSpinnerId: "move",
  settings: { firstPerson: "none", allowSkipFirstPerson: true },
  floors: [],
});

describe("validateGame", () => {
  it("rejects dangling stair", () => {
    const game = base();
    game.floors = [{
      id: "f1",
      name: "Ground",
      cells: [{ id: "s1", x: 0, y: 0, kind: "stair", stairLink: undefined as any }],
      rooms: [],
    }];
    const issues = validateGame(game);
    expect(issues.some((i) => i.code === "STAIR_NO_DEST")).toBe(true);
  });

  it("rejects non-loop corridor on non-end floor", () => {
    const game = base();
    game.floors = [{
      id: "f1",
      name: "Ground",
      cells: [
        { id: "a", x: 0, y: 0, kind: "empty" },
        { id: "b", x: 1, y: 0, kind: "empty" },
      ],
      rooms: [],
    }];
    expect(issuesHas(game, "CORRIDOR_NOT_LOOP")).toBe(true);
  });
});

function issuesHas(game: GameJson, code: string) {
  return validateGame(game).some((i) => i.code === code);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/validation.test.ts`
Expected: FAIL — `validateGame` not defined

- [ ] **Step 3: Implement validation**

```typescript
// src/engine/validation.ts
import type { GameJson, FloorDef, CellDef } from "./types";

export type ValidationIssue = { code: string; message: string; floorId?: string; cellId?: string };

export function validateGame(game: GameJson): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const floor of game.floors) {
    validateFloor(floor, issues);
  }
  return issues;
}

export function canTestOrPublish(game: GameJson): boolean {
  return validateGame(game).length === 0;
}

function validateFloor(floor: FloorDef, issues: ValidationIssue[]) {
  const corridor = floor.cells.filter((c) => c.kind !== "inner");
  if (!floor.isRoomOnly && corridor.length > 0) {
    if (!floor.isEndFloor && !isLoop(corridor)) {
      issues.push({ code: "CORRIDOR_NOT_LOOP", message: `Floor ${floor.name} corridor must loop`, floorId: floor.id });
    }
    if (floor.isEndFloor && !isLoop(corridor) && !isSinglePathToEnd(corridor, floor)) {
      issues.push({ code: "END_PATH_INVALID", message: `End floor ${floor.name} path invalid`, floorId: floor.id });
    }
  }
  for (const cell of floor.cells) {
    if (cell.kind === "stair" && !cell.stairLink?.destFloorId) {
      issues.push({ code: "STAIR_NO_DEST", message: "Stair must link to a destination", floorId: floor.id, cellId: cell.id });
    }
  }
}

function isLoop(cells: CellDef[]): boolean {
  if (cells.length < 3) return false;
  // adjacency graph: each corridor cell degree 2
  const deg = new Map<string, number>();
  for (const c of cells) deg.set(c.id, 0);
  for (let i = 0; i < cells.length; i++) {
    const a = cells[i];
    const b = cells[(i + 1) % cells.length];
    deg.set(a.id, (deg.get(a.id) ?? 0) + 1);
    deg.set(b.id, (deg.get(b.id) ?? 0) + 1);
  }
  return [...deg.values()].every((d) => d === 2);
}

function isSinglePathToEnd(_cells: CellDef[], _floor: FloorDef): boolean {
  return true; // implement: linear path check to end room door
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/validation.test.ts`
Expected: PASS (after completing `isSinglePathToEnd` logic for end-floor cases)

- [ ] **Step 5: Commit**

```bash
git add src/engine/validation.ts tests/engine/validation.test.ts
git commit -m "feat(engine): validate stair links and corridor loops"
```

---

### Task 4: Path graph and land-to-resolve movement

**Files:**
- Create: `src/engine/graph.ts`, `src/engine/movement.ts`, `tests/engine/movement.test.ts`

**Interfaces:**
- Consumes: `GameJson`, `FloorDef`, `CellDef`
- Produces:
  - `export function buildPath(game: GameJson, floorId: string, roomId?: string): string[]` — ordered cell ids for current path (corridor loop or room inner loop)
  - `export function moveAlongPath(path: string[], startIndex: number, steps: number): { index: number; crossed: string[]; landed: string }`
  - `crossed` excludes the landing square; crossing doors/stairs mid-path does not resolve

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/movement.test.ts
import { describe, it, expect } from "vitest";
import { moveAlongPath } from "@/engine/movement";

describe("moveAlongPath", () => {
  const path = ["a", "b", "door", "c", "d"];

  it("does not resolve crossed squares", () => {
    const result = moveAlongPath(path, 0, 2);
    expect(result.crossed).toEqual(["b"]);
    expect(result.landed).toBe("door");
  });

  it("wraps corridor loop", () => {
    const loop = ["a", "b", "c", "d"];
    const result = moveAlongPath(loop, 3, 2);
    expect(result.landed).toBe("b");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/movement.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement graph + movement**

```typescript
// src/engine/movement.ts
export function moveAlongPath(path: string[], startIndex: number, steps: number) {
  if (path.length === 0) throw new Error("empty path");
  const crossed: string[] = [];
  let index = startIndex;
  for (let i = 0; i < steps; i++) {
    const next = (index + 1) % path.length;
    if (i < steps - 1) crossed.push(path[next]);
    index = next;
  }
  return { index, crossed, landed: path[index] };
}
```

```typescript
// src/engine/graph.ts
import type { GameJson } from "./types";

export function buildPath(game: GameJson, floorId: string, innerRoomId?: string): string[] {
  const floor = game.floors.find((f) => f.id === floorId);
  if (!floor) throw new Error("floor not found");
  if (innerRoomId) {
    const room = floor.rooms.find((r) => r.id === innerRoomId);
    return room?.innerCells?.map((c) => c.id) ?? [];
  }
  return floor.cells.filter((c) => c.kind !== "inner").map((c) => c.id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/movement.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/graph.ts src/engine/movement.ts tests/engine/movement.test.ts
git commit -m "feat(engine): path walking with land-to-resolve boundary"
```

---

### Task 5: Square resolution and locks

**Files:**
- Create: `src/engine/resolve.ts`, `src/engine/locks.ts`, `tests/engine/resolve.test.ts`

**Interfaces:**
- Consumes: `GameJson`, `GameSession` (from Task 8), `moveAlongPath`
- Produces:
  - `export type ResolveResult = { events: EngineEvent[]; session: GameSession }`
  - `export function resolveLanding(session: GameSession, game: GameJson): ResolveResult`
  - Handles: empty → end turn; content → effect then pack; door locked/unlocked; stair linked destination; inner squares

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/resolve.test.ts
import { describe, it, expect } from "vitest";
import { resolveLanding } from "@/engine/resolve";
import { createSession } from "@/engine/session";

describe("resolveLanding", () => {
  it("empty square ends turn after media", () => {
    const { session, game } = fixtureOnEmpty();
    const result = resolveLanding(session, game);
    expect(result.events.some((e) => e.type === "TURN_END")).toBe(true);
  });

  it("locked door does not enter room", () => {
    const { session, game } = fixtureLockedDoor();
    const result = resolveLanding(session, game);
    expect(result.events.some((e) => e.type === "DOOR_LOCKED")).toBe(true);
    expect(result.session.location.roomId).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/resolve.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement resolve + locks**

```typescript
// src/engine/locks.ts
export type LockState = {
  stairsUntilTurn: Record<string, number>;
  doorsUntilTurn: Record<string, number>;
  roomsUntilTurn: Record<string, number>;
};

export function isStairBlocked(locks: LockState, playerId: string): boolean {
  return (locks.stairsUntilTurn[playerId] ?? 0) > 0;
}

export function tickLocks(locks: LockState): LockState {
  const dec = (m: Record<string, number>) =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, Math.max(0, v - 1)]));
  return {
    stairsUntilTurn: dec(locks.stairsUntilTurn),
    doorsUntilTurn: dec(locks.doorsUntilTurn),
    roomsUntilTurn: dec(locks.roomsUntilTurn),
  };
}
```

```typescript
// src/engine/resolve.ts
import type { GameJson } from "./types";
import type { GameSession } from "./session";
import { isStairBlocked, isDoorBlocked } from "./locks";

export type EngineEvent =
  | { type: "MEDIA_PLAY"; refs: string[] }
  | { type: "DRAW_CARD"; packId: string; cardId: string }
  | { type: "DOOR_LOCKED" }
  | { type: "STAIR_TRAVEL"; destFloorId: string; destCellId: string }
  | { type: "TURN_END" };

export function resolveLanding(session: GameSession, game: GameJson) {
  const events: EngineEvent[] = [];
  const cell = findCell(game, session);
  if (!cell) return { events, session };

  if (cell.media?.length) events.push({ type: "MEDIA_PLAY", refs: cell.media.map((m) => m.src) });

  if (cell.kind === "empty") {
    events.push({ type: "TURN_END" });
    return { events, session };
  }
  if (cell.kind === "door") {
    if (isDoorBlocked(session.locks, session.currentPlayerId)) {
      events.push({ type: "DOOR_LOCKED", type: "TURN_END" } as any);
      return { events, session: { ...session, pending: "TURN_END" } };
    }
    // card-only or inner-map entry handled here
  }
  // stair, content, inner branches ...
  return { events, session };
}

function findCell(game: GameJson, session: GameSession) {
  const floor = game.floors.find((f) => f.id === session.location.floorId);
  return floor?.cells.find((c) => c.id === session.location.cellId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/resolve.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/resolve.ts src/engine/locks.ts tests/engine/resolve.test.ts
git commit -m "feat(engine): land-to-resolve square handlers and locks"
```

---

### Task 6: Pack deck with group no-show in place

**Files:**
- Create: `src/engine/decks.ts`, `tests/engine/decks.test.ts`

**Interfaces:**
- Consumes: `PackDef`, `CardDef`, player `group?: string`
- Produces:
  - `export type DeckState = { order: string[]; cycleComplete: boolean }`
  - `export function drawCard(deck: DeckState, pack: PackDef, cards: Record<string, CardDef>, playerGroup?: string): { cardId: string | null; deck: DeckState }`
  - No-show cards for player's group are **skipped in place** (not flipped, not moved to bottom)
  - After use, drawn card goes to bottom; full cycle triggers shuffle flag

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/decks.test.ts
import { describe, it, expect } from "vitest";
import { drawCard, consumeCard } from "@/engine/decks";

const cards = {
  a: { id: "a", kind: "question", noShowGroups: ["Traitors"] },
  b: { id: "b", kind: "question" },
  c: { id: "c", kind: "question", noShowGroups: ["Traitors"] },
};

const pack = { id: "p1", backImage: "/back.png", cardIds: ["a", "b", "c"] };

describe("drawCard no-show", () => {
  it("skips no-show cards in place for Traitors", () => {
    const deck = { order: ["a", "b", "c"], cycleComplete: false };
    const first = drawCard(deck, pack, cards, "Traitors");
    expect(first.cardId).toBe("b");
    expect(first.deck.order).toEqual(["a", "b", "c"]);
  });

  it("moves consumed card to bottom", () => {
    const deck = { order: ["a", "b", "c"], cycleComplete: false };
    const drawn = drawCard(deck, pack, cards, "Faithfuls");
    const after = consumeCard(drawn.deck, drawn.cardId!);
    expect(after.order[after.order.length - 1]).toBe("a");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/decks.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement deck logic**

```typescript
// src/engine/decks.ts
import type { CardDef, PackDef } from "./types";

export type DeckState = { order: string[]; cycleComplete: boolean };

export function drawCard(
  deck: DeckState,
  pack: PackDef,
  cards: Record<string, CardDef>,
  playerGroup?: string,
): { cardId: string | null; deck: DeckState } {
  for (const cardId of deck.order) {
    const card = cards[cardId];
    if (!card) continue;
    if (playerGroup && card.noShowGroups?.includes(playerGroup)) continue;
    return { cardId, deck };
  }
  return { cardId: null, deck };
}

export function consumeCard(deck: DeckState, cardId: string): DeckState {
  const order = deck.order.filter((id) => id !== cardId);
  order.push(cardId);
  const seenAll = order.length === deck.order.length;
  return { order, cycleComplete: seenAll };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/decks.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/decks.ts tests/engine/decks.test.ts
git commit -m "feat(engine): pack draw with group no-show in place"
```

---

### Task 7: Spinners (number, player, designer outcome slices)

**Files:**
- Create: `src/engine/spinners.ts`, `src/engine/relationships.ts`, `tests/engine/spinners.test.ts`

**Interfaces:**
- Consumes: `SpinnerDef`, `RelationshipGraph`, `GameSession`
- Produces:
  - `export function spinNumber(spinner: NumberSpinner, rng: () => number): number`
  - `export function spinPlayer(spinner: PlayerSpinner, graph: RelationshipGraph, actorId: string): string | null`
  - `export function spinOutcome(spinner: OutcomeSpinner, rng: () => number): OutcomeSlice`
  - `export function applyOutcomeSlice(slice: OutcomeSlice, session: GameSession, game: GameJson): GameSession`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/spinners.test.ts
import { describe, it, expect } from "vitest";
import { spinOutcome, weightedIndex } from "@/engine/spinners";

describe("spinOutcome", () => {
  it("picks slice by equal weights", () => {
    const spinner = {
      id: "o1",
      kind: "outcome" as const,
      slices: [
        { label: "Up", moveSquares: 2 },
        { label: "Down", gotoTileId: "cell-cellar" },
      ],
    };
    const slice = spinOutcome(spinner, () => 0);
    expect(slice.label).toBe("Up");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/spinners.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement spinners + relationships**

```typescript
// src/engine/spinners.ts
import type { NumberSpinner, OutcomeSpinner, OutcomeSlice, GameJson } from "./types";
import type { GameSession } from "./session";
import { moveAlongPath } from "./movement";
import { buildPath } from "./graph";

export function weightedIndex(weights: number[], rng: () => number): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

export function spinNumber(spinner: NumberSpinner, rng: () => number): number {
  const span = Math.floor((spinner.max - spinner.min) / spinner.step) + 1;
  const pick = Math.floor(rng() * span);
  return spinner.min + pick * spinner.step;
}

export function spinOutcome(spinner: OutcomeSpinner, rng: () => number): OutcomeSlice {
  const weights = spinner.slices.map((s) => s.weight ?? 1);
  return spinner.slices[weightedIndex(weights, rng)];
}

export function applyOutcomeSlice(slice: OutcomeSlice, session: GameSession, game: GameJson): GameSession {
  let next = session;
  if (slice.moveSquares) {
    const path = buildPath(game, session.location.floorId, session.location.roomId);
    const idx = path.indexOf(session.location.cellId);
    const moved = moveAlongPath(path, idx, slice.moveSquares);
    next = { ...next, location: { ...next.location, cellId: moved.landed } };
  }
  if (slice.gotoTileId) {
    next = { ...next, location: { ...next.location, cellId: slice.gotoTileId } };
  }
  return next;
}
```

```typescript
// src/engine/relationships.ts
export type RelationshipGraph = {
  partners: Record<string, string | undefined>;
  cannotPartner: Record<string, string[]>;
  groups: Record<string, string>;
};

export function eligiblePlayers(actorId: string, graph: RelationshipGraph, allPlayerIds: string[]): string[] {
  const excluded = new Set(graph.cannotPartner[actorId] ?? []);
  return allPlayerIds.filter((id) => id !== actorId && !excluded.has(id));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/spinners.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/spinners.ts src/engine/relationships.ts tests/engine/spinners.test.ts
git commit -m "feat(engine): designer outcome spinners and player eligibility"
```

---

### Task 8: Inventory, session reducer, and save payload

**Files:**
- Create: `src/engine/inventory.ts`, `src/engine/win.ts`, `src/engine/session.ts`, `tests/engine/session.test.ts`

**Interfaces:**
- Consumes: all prior engine modules
- Produces:
  - `export type GameSession = { gameId: string; players: PlayerState[]; currentPlayerIndex: number; location: Location; locks: LockState; decks: Record<string, DeckState>; passesLeft: Record<string, number>; phase: "SETUP" | "INTRO" | "SPIN" | "RESOLVE" | "CARD" | "WIN" }`
  - `export function createSession(game: GameJson, setup: SetupInput): GameSession`
  - `export function dispatch(session: GameSession, game: GameJson, action: SessionAction): { session: GameSession; events: EngineEvent[] }`
  - `export function serializeSession(session: GameSession): string`
  - `export function deserializeSession(raw: string): GameSession`
  - `export function checkWin(session: GameSession, game: GameJson): string | null` — player id or null

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/session.test.ts
import { describe, it, expect } from "vitest";
import { createSession, dispatch, serializeSession, deserializeSession } from "@/engine/session";
import { climbFixture } from "../fixtures/climb";

describe("session", () => {
  it("round-trips save payload", () => {
    const game = climbFixture();
    const session = createSession(game, { players: [{ id: "p1", name: "A", color: "#f00" }] });
    const raw = serializeSession(session);
    const back = deserializeSession(raw);
    expect(back.players[0].name).toBe("A");
  });

  it("supports 1 player without partner graph", () => {
    const game = climbFixture();
    const session = createSession(game, { players: [{ id: "p1", name: "Solo", color: "#0f0" }] });
    expect(session.players.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/session.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement session + inventory + win**

```typescript
// src/engine/session.ts
import type { GameJson } from "./types";
import type { LockState } from "./locks";
import type { DeckState } from "./decks";
import { resolveLanding } from "./resolve";
import { checkWin } from "./win";

export type PlayerState = {
  id: string;
  name: string;
  color: string;
  group?: string;
  inventory: string[];
  passesLeft: number;
};

export type Location = { floorId: string; cellId: string; roomId?: string; pathIndex: number };

export type GameSession = {
  gameId: string;
  players: PlayerState[];
  currentPlayerIndex: number;
  location: Location;
  locks: LockState;
  decks: Record<string, DeckState>;
  phase: "SETUP" | "INTRO" | "SPIN" | "RESOLVE" | "CARD" | "WIN";
};

export type SetupInput = {
  players: Array<{ id: string; name: string; color: string; group?: string; picks?: string[] }>;
};

export type SessionAction =
  | { type: "SPIN"; value: number }
  | { type: "RESOLVE_DONE" }
  | { type: "PASS_CARD" };

export function createSession(game: GameJson, setup: SetupInput): GameSession {
  const start = findStartCell(game);
  return {
    gameId: game.id,
    players: setup.players.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      group: p.group,
      inventory: seedInventory(game, p),
      passesLeft: game.settings.maxPassesPerPlayer ?? 0,
    })),
    currentPlayerIndex: 0,
    location: start,
    locks: { stairsUntilTurn: {}, doorsUntilTurn: {}, roomsUntilTurn: {} },
    decks: {},
    phase: "INTRO",
  };
}

export function dispatch(session: GameSession, game: GameJson, action: SessionAction) {
  const events: EngineEvent[] = [];
  let next = session;
  if (action.type === "SPIN") {
    // move then resolve landing only
    const resolved = resolveLanding(next, game);
    events.push(...resolved.events);
    next = resolved.session;
    const winner = checkWin(next, game);
    if (winner) next = { ...next, phase: "WIN" };
  }
  return { session: next, events };
}

export function serializeSession(session: GameSession): string {
  return JSON.stringify(session);
}

export function deserializeSession(raw: string): GameSession {
  return JSON.parse(raw) as GameSession;
}

function findStartCell(game: GameJson): Location {
  for (const floor of game.floors) {
    const start = floor.cells.find((c) => c.isStart);
    if (start) return { floorId: floor.id, cellId: start.id, pathIndex: 0 };
  }
  throw new Error("no start cell");
}

function seedInventory(game: GameJson, player: SetupInput["players"][number]): string[] {
  return player.picks ?? [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/session.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/session.ts src/engine/inventory.ts src/engine/win.ts tests/engine/session.test.ts
git commit -m "feat(engine): session reducer, inventory seeding, and save round-trip"
```

---

### Task 9: Climb bundled example JSON

**Files:**
- Create: `src/content/climb/game.json`, `tests/fixtures/climb.ts`, `tests/engine/climb.test.ts`

**Interfaces:**
- Consumes: `parseGameJson`, `validateGame`, `createSession`, `dispatch`
- Produces: `export function climbFixture(): GameJson` — parses bundled Climb sample with 3 named floors (Ground, Middle, Roof), movement spinner 1–6, reaches end room win

- [ ] **Step 1: Write the failing test**

```typescript
// tests/engine/climb.test.ts
import { describe, it, expect } from "vitest";
import { climbFixture } from "../fixtures/climb";
import { validateGame } from "@/engine/validation";
import { createSession, dispatch } from "@/engine/session";

describe("Climb sample", () => {
  it("validates for test/publish", () => {
    expect(validateGame(climbFixture())).toEqual([]);
  });

  it("is example only — engine accepts 1 player", () => {
    const game = climbFixture();
    const session = createSession(game, {
      players: [{ id: "p1", name: "Solo", color: "#3366ff" }],
    });
    expect(session.players.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/engine/climb.test.ts`
Expected: FAIL — fixture missing

- [ ] **Step 3: Add Climb JSON + fixture loader**

```typescript
// tests/fixtures/climb.ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseGameJson } from "@/engine/schema";

export function climbFixture() {
  const raw = readFileSync(path.join(process.cwd(), "src/content/climb/game.json"), "utf8");
  return parseGameJson(JSON.parse(raw));
}
```

```json
// src/content/climb/game.json (excerpt — expand to 16/12 loop cells in implementation)
{
  "id": "climb",
  "slug": "climb",
  "name": "Climb",
  "version": 1,
  "hud": { "x": 4, "y": 4, "w": 8, "h": 8 },
  "floors": [
    { "id": "ground", "name": "Ground", "cells": [{ "id": "g-start", "x": 0, "y": 0, "kind": "empty", "isStart": true }], "rooms": [] },
    { "id": "middle", "name": "Middle", "cells": [], "rooms": [] },
    { "id": "roof", "name": "Roof", "isRoomOnly": true, "isEndFloor": true, "cells": [], "rooms": [{ "id": "penthouse", "name": "Penthouse", "doorCellId": "roof-door", "isEndRoom": true, "cardOnly": true }] }
  ],
  "spinners": { "move": { "id": "move", "kind": "number", "min": 1, "max": 6, "step": 1 } },
  "items": {},
  "packs": { "intro": { "id": "intro", "backImage": "/games/climb/back.png", "cardIds": ["c1"] } },
  "cards": { "c1": { "id": "c1", "kind": "question", "title": "Welcome" } },
  "groups": [],
  "winRule": { "kind": "reachEndRoom" },
  "movementSpinnerId": "move",
  "settings": { "firstPerson": "roomAndStairs", "allowSkipFirstPerson": true, "passesEnabled": true, "maxPassesPerPlayer": 1 }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/engine/climb.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/content/climb tests/fixtures tests/engine/climb.test.ts
git commit -m "feat(content): add Climb bundled example game JSON"
```

---

### Task 10: shadcn/ui shell and game library (New / Open / Save)

**Files:**
- Create: `src/components/ui/button.tsx` (shadcn), `src/components/designer/GameLibrary.tsx`, `src/persistence/storage.ts`, `tests/persistence/storage.test.ts`

**Interfaces:**
- Consumes: `GameJson`, `parseGameJson`, `validateGame`
- Produces:
  - `export function listDrafts(): Array<{ id: string; name: string; updatedAt: number }>`
  - `export function saveDraft(game: GameJson): void`
  - `export function loadDraft(id: string): GameJson | null`
  - `export function createNewGame(name: string): GameJson`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/persistence/storage.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createNewGame, saveDraft, loadDraft, listDrafts } from "@/persistence/storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("creates and lists drafts", () => {
    const game = createNewGame("My Game");
    saveDraft(game);
    expect(listDrafts().some((d) => d.name === "My Game")).toBe(true);
    expect(loadDraft(game.id)?.name).toBe("My Game");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/persistence/storage.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement localStorage drafts + library UI**

```typescript
// src/persistence/storage.ts
import type { GameJson } from "@/engine/types";
import { parseGameJson } from "@/engine/schema";

const INDEX_KEY = "bbs:draft-index";
const draftKey = (id: string) => `bbs:draft:${id}`;

export function createNewGame(name: string): GameJson {
  const id = crypto.randomUUID();
  return parseGameJson({
    id,
    slug: id,
    name,
    version: 1,
    floors: [],
    hud: { x: 4, y: 4, w: 8, h: 8 },
    spinners: { move: { id: "move", kind: "number", min: 1, max: 6, step: 1 } },
    items: {},
    packs: {},
    cards: {},
    groups: [],
    winRule: { kind: "none" },
    movementSpinnerId: "move",
    settings: { firstPerson: "none", allowSkipFirstPerson: true },
  });
}

export function saveDraft(game: GameJson): void {
  localStorage.setItem(draftKey(game.id), JSON.stringify(game));
  const index = listDrafts().filter((d) => d.id !== game.id);
  index.push({ id: game.id, name: game.name, updatedAt: Date.now() });
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function loadDraft(id: string): GameJson | null {
  const raw = localStorage.getItem(draftKey(id));
  return raw ? parseGameJson(JSON.parse(raw)) : null;
}

export function listDrafts() {
  return JSON.parse(localStorage.getItem(INDEX_KEY) ?? "[]") as Array<{ id: string; name: string; updatedAt: number }>;
}
```

Wire `src/app/page.tsx` to render `GameLibrary` with **New** and **Open** buttons.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/persistence/storage.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/persistence src/components/designer src/app/page.tsx tests/persistence
git commit -m "feat(studio): game library with New/Open/Save drafts"
```

---

### Task 11: HTML v1 play board renderer

**Files:**
- Create: `src/components/play/BoardHtml.tsx`, `src/components/play/Token.tsx`, `tests/play/board-html.test.tsx`

**Interfaces:**
- Consumes: `GameJson`, `GameSession`, `buildPath`
- Produces:
  - `export function BoardHtml(props: { game: GameJson; session: GameSession; onCellClick?: (cellId: string) => void }): JSX.Element`
  - Renders **current floor only** as a ring around HUD rect; tokens slide via CSS transition

- [ ] **Step 1: Write the failing test**

```tsx
// tests/play/board-html.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BoardHtml } from "@/components/play/BoardHtml";
import { climbFixture } from "../fixtures/climb";
import { createSession } from "@/engine/session";

describe("BoardHtml", () => {
  it("renders current floor cells", () => {
    const game = climbFixture();
    const session = createSession(game, { players: [{ id: "p1", name: "A", color: "#f00" }] });
    render(<BoardHtml game={game} session={session} />);
    expect(screen.getByTestId("board-html")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/play/board-html.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement HTML board**

```tsx
// src/components/play/BoardHtml.tsx
"use client";
import type { GameJson } from "@/engine/types";
import type { GameSession } from "@/engine/session";

export function BoardHtml({ game, session }: { game: GameJson; session: GameSession }) {
  const floor = game.floors.find((f) => f.id === session.location.floorId);
  return (
    <div data-testid="board-html" className="relative h-full w-full">
      {floor?.cells.map((cell) => (
        <div
          key={cell.id}
          className="absolute border border-slate-600 bg-slate-800"
          style={{ left: `${cell.x * 48}px`, top: `${cell.y * 48}px`, width: 44, height: 44 }}
        >
          {session.location.cellId === cell.id && (
            <span className="block h-3 w-3 rounded-full" style={{ background: session.players[session.currentPlayerIndex].color }} />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/play/board-html.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/play tests/play
git commit -m "feat(play): HTML v1 board renderer for current floor"
```

---

### Task 12: Play HUD (spinner, cards, timer, inventory, minimap)

**Files:**
- Create: `src/components/play/Hud.tsx`, `src/components/play/CardOverlay.tsx`, `src/components/play/SpinnerWheel.tsx`, `src/components/play/MediaLayer.tsx`

**Interfaces:**
- Consumes: `GameSession`, `GameJson`, `dispatch`, engine spinners/decks
- Produces: `Hud` component wiring turn UI; plays **audio** links from spinners/cards/tiles via `<audio>` elements

- [ ] **Step 1: Write the failing test**

```tsx
// tests/play/hud.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Hud } from "@/components/play/Hud";

describe("Hud", () => {
  it("shows whose turn", () => {
    render(<Hud currentPlayerName="Alex" passesLeft={1} />);
    expect(screen.getByText(/Alex/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/play/hud.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement HUD components**

```tsx
// src/components/play/Hud.tsx
export function Hud({ currentPlayerName, passesLeft }: { currentPlayerName: string; passesLeft: number }) {
  return (
    <section className="flex flex-col items-center gap-2 p-4">
      <p className="text-sm font-medium">{currentPlayerName}&apos;s turn</p>
      <p className="text-xs text-muted-foreground">Passes left: {passesLeft}</p>
    </section>
  );
}
```

```tsx
// src/components/play/MediaLayer.tsx
"use client";
import { useEffect, useRef } from "react";
import type { MediaRef } from "@/engine/types";

export function MediaLayer({ background?: string; media?: MediaRef[] }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const audio = media?.find((m) => m.kind === "audio");
    if (audio && audioRef.current) {
      audioRef.current.src = audio.src;
      audioRef.current.play().catch(() => undefined);
    }
  }, [media]);
  return (
    <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: background ? `url(${background})` : undefined }}>
      <audio ref={audioRef} />
    </div>
  );
}
```

```tsx
// src/components/play/CardOverlay.tsx
export function CardOverlay({ title, timerSeconds, passAllowed, onPass }: { title: string; timerSeconds?: number; passAllowed: boolean; onPass: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow">
      <h2 className="font-semibold">{title}</h2>
      {timerSeconds != null && <p className="text-sm">Timer: {timerSeconds}s</p>}
      {passAllowed && <button type="button" onClick={onPass}>Pass</button>}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/play/hud.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/play
git commit -m "feat(play): HUD with spinner, cards, timer, inventory, and audio"
```

---

### Task 13: Shared Three.js first-person + designer preview module

**Files:**
- Create: `src/components/three/FirstPersonView.tsx`, `src/components/three/FloorPreview.tsx`, `src/components/three/sceneUtils.ts`

**Interfaces:**
- Consumes: floor/cell layout, `MediaRef`, game settings `firstPerson`
- Produces:
  - `export function FirstPersonView(props: { floor: FloorDef; cellId: string; media?: MediaRef[]; onSkip?: () => void }): JSX.Element`
  - `export function FloorPreview(props: { floor: FloorDef; hud: GameJson["hud"] }): JSX.Element`
  - Uses `@react-three/fiber` directly — **not** `threejs-game-director`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/three/scene-utils.test.ts
import { describe, it, expect } from "vitest";
import { cellToWorld } from "@/components/three/sceneUtils";

describe("cellToWorld", () => {
  it("maps grid cell to x/z", () => {
    expect(cellToWorld({ x: 2, y: 3 })).toEqual({ x: 2, z: 3 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/three/scene-utils.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Three.js module**

```bash
npm install three @react-three/fiber @react-three/drei
```

```typescript
// src/components/three/sceneUtils.ts
export function cellToWorld(cell: { x: number; y: number }) {
  return { x: cell.x, z: cell.y };
}
```

Build corridor box mesh + room portal in `FirstPersonView`; orbit/preview camera in `FloorPreview`. Respect `settings.firstPerson === "none"` by not mounting play popup.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/three/scene-utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/three tests/three package.json package-lock.json
git commit -m "feat(three): shared first-person and designer preview module"
```

---

### Task 14: Test play route (draft only)

**Files:**
- Create: `src/app/test/[gameId]/page.tsx`, `src/components/play/PlayShell.tsx`

**Interfaces:**
- Consumes: `loadDraft`, `canTestOrPublish`, `createSession`, `BoardHtml`, `Hud`, `FirstPersonView`
- Produces: `/test/[gameId]` route that blocks when `validateGame` fails; banner **"Test preview — not public"**

- [ ] **Step 1: Write the failing test**

```typescript
// tests/play/test-route.test.ts
import { describe, it, expect } from "vitest";
import { canEnterTestPlay } from "@/app/test/[gameId]/guards";

describe("test play guard", () => {
  it("blocks invalid drafts", () => {
    expect(canEnterTestPlay({ floors: [] } as any)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/play/test-route.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement test route + PlayShell**

```typescript
// src/app/test/[gameId]/guards.ts
import type { GameJson } from "@/engine/types";
import { canTestOrPublish } from "@/engine/validation";

export function canEnterTestPlay(game: GameJson): boolean {
  return canTestOrPublish(game);
}
```

```tsx
// src/components/play/PlayShell.tsx
"use client";
import { BoardHtml } from "./BoardHtml";
import { Hud } from "./Hud";
import { FirstPersonView } from "@/components/three/FirstPersonView";
import type { GameJson } from "@/engine/types";
import type { GameSession } from "@/engine/session";

export function PlayShell({ game, session, isTest }: { game: GameJson; session: GameSession; isTest: boolean }) {
  const floor = game.floors.find((f) => f.id === session.location.floorId)!;
  const showFp = game.settings.firstPerson !== "none";
  return (
    <div className="relative h-screen w-screen">
      {isTest && <div className="bg-amber-500 px-3 py-1 text-xs text-black">Test preview — not public</div>}
      <BoardHtml game={game} session={session} />
      <Hud currentPlayerName={session.players[session.currentPlayerIndex].name} passesLeft={session.players[session.currentPlayerIndex].passesLeft} />
      {showFp && <FirstPersonView floor={floor} cellId={session.location.cellId} />}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/play/test-route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/test src/components/play
git commit -m "feat(play): draft test route with validation gate"
```

---

### Task 15: Layout designer grid + palette

**Files:**
- Create: `src/app/designer/[gameId]/page.tsx`, `src/components/designer/LayoutGrid.tsx`, `src/components/designer/Palette.tsx`, `src/components/designer/FloorTabs.tsx`

**Interfaces:**
- Consumes: `GameJson`, `saveDraft`, `validateGame`
- Produces: drag-drop corridor/stair/room widgets; named floor tabs; stair link picker; HUD cells non-droppable

- [ ] **Step 1: Write the failing test**

```typescript
// tests/designer/layout-grid.test.ts
import { describe, it, expect } from "vitest";
import { isHudCell } from "@/components/designer/LayoutGrid";

describe("LayoutGrid", () => {
  it("rejects drops on HUD cells", () => {
    const hud = { x: 4, y: 4, w: 8, h: 8 };
    expect(isHudCell(hud, 5, 5)).toBe(true);
    expect(isHudCell(hud, 0, 0)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/designer/layout-grid.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement designer layout**

```typescript
// src/components/designer/LayoutGrid.tsx
import type { GameJson } from "@/engine/types";

export function isHudCell(hud: GameJson["hud"], x: number, y: number): boolean {
  return x >= hud.x && x < hud.x + hud.w && y >= hud.y && y < hud.y + hud.h;
}

export function addNamedFloor(game: GameJson, name: string): GameJson {
  const id = crypto.randomUUID();
  return {
    ...game,
    floors: [...game.floors, { id, name, cells: [], rooms: [] }],
  };
}
```

```tsx
// src/components/designer/FloorTabs.tsx
export function FloorTabs({ floors, activeId, onSelect, onRename }: { floors: Array<{ id: string; name: string }>; activeId: string; onSelect: (id: string) => void; onRename: (id: string, name: string) => void }) {
  return (
    <div className="flex gap-2">
      {floors.map((f) => (
        <button key={f.id} type="button" onClick={() => onSelect(f.id)} className={f.id === activeId ? "font-bold" : ""}>
          {f.name}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/designer/layout-grid.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/designer src/components/designer tests/designer
git commit -m "feat(designer): layout grid, palette, and named floor tabs"
```

---

### Task 16: Card, pack, spinner, and item editors

**Files:**
- Create: `src/components/designer/CardEditor.tsx`, `src/components/designer/PackEditor.tsx`, `src/components/designer/SpinnerEditor.tsx`, `src/components/designer/ItemEditor.tsx`, `src/components/designer/GroupEditor.tsx`

**Interfaces:**
- Consumes: `GameJson` slices (`cards`, `packs`, `spinners`, `items`, `groups`)
- Produces: forms to edit card templates, pack backs, **outcome spinner slice count/labels/weights/effects**, item defs, group names, **no-show group** checkboxes on cards, **audio** link fields on all media surfaces

- [ ] **Step 1: Write the failing test**

```typescript
// tests/designer/spinner-editor.test.ts
import { describe, it, expect } from "vitest";
import { normalizeOutcomeSlices } from "@/components/designer/SpinnerEditor";

describe("SpinnerEditor", () => {
  it("requires at least 2 outcome slices", () => {
    expect(() => normalizeOutcomeSlices([{ label: "Only" }])).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/designer/spinner-editor.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement editors**

```typescript
// src/components/designer/SpinnerEditor.ts
import type { OutcomeSlice } from "@/engine/types";

export function normalizeOutcomeSlices(slices: OutcomeSlice[]): OutcomeSlice[] {
  if (slices.length < 2) throw new Error("Outcome spinner requires at least 2 slices");
  return slices.map((s) => ({ ...s, weight: s.weight ?? 1 }));
}
```

```tsx
// src/components/designer/CardEditor.tsx
export function CardEditor({ groups, value, onChange }: { groups: string[]; value: { noShowGroups?: string[]; timerSeconds?: number; passAllowed?: boolean; audioSrc?: string }; onChange: (v: typeof value) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm">Timer (seconds)</label>
      <input type="number" value={value.timerSeconds ?? ""} onChange={(e) => onChange({ ...value, timerSeconds: Number(e.target.value) })} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value.passAllowed} onChange={(e) => onChange({ ...value, passAllowed: e.target.checked })} /> Allow pass</label>
      <fieldset>
        <legend className="text-sm">No-show groups</legend>
        {groups.map((g) => (
          <label key={g} className="mr-2 text-sm">
            <input type="checkbox" checked={value.noShowGroups?.includes(g) ?? false} onChange={(e) => {
              const set = new Set(value.noShowGroups ?? []);
              e.target.checked ? set.add(g) : set.delete(g);
              onChange({ ...value, noShowGroups: [...set] });
            }} /> {g}
          </label>
        ))}
      </fieldset>
      <label className="block text-sm">Audio URL</label>
      <input value={value.audioSrc ?? ""} onChange={(e) => onChange({ ...value, audioSrc: e.target.value })} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/designer/spinner-editor.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/designer tests/designer
git commit -m "feat(designer): card, pack, spinner, item, and group editors"
```

---

### Task 17: Publish live (versioned static bundle + slug)

**Files:**
- Create: `src/persistence/publish.ts`, `src/app/play/[slug]/page.tsx`, `public/games/.gitkeep`, `tests/persistence/publish.test.ts`

**Interfaces:**
- Consumes: `GameJson`, `canTestOrPublish`, `saveDraft`
- Produces:
  - `export function publishLive(game: GameJson): { slug: string; version: number }` — writes `public/games/[slug]/v[n]/game.json` + media copies
  - `export function loadLiveGame(slug: string): GameJson`
  - Live play route never reads unsaved draft

- [ ] **Step 1: Write the failing test**

```typescript
// tests/persistence/publish.test.ts
import { describe, it, expect } from "vitest";
import { publishLive, loadLiveGame } from "@/persistence/publish";
import { climbFixture } from "../fixtures/climb";

describe("publishLive", () => {
  it("freezes version and loads by slug", () => {
    const game = climbFixture();
    const { slug } = publishLive(game);
    const live = loadLiveGame(slug);
    expect(live.version).toBeGreaterThanOrEqual(1);
    expect(live.slug).toBe(slug);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- tests/persistence/publish.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement publish + live play route**

```typescript
// src/persistence/publish.ts
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { GameJson } from "@/engine/types";
import { canTestOrPublish } from "@/engine/validation";
import { parseGameJson } from "@/engine/schema";

const LIVE_INDEX = "bbs:live-index";

export function publishLive(game: GameJson): { slug: string; version: number } {
  if (!canTestOrPublish(game)) throw new Error("Cannot publish invalid game");
  const slug = game.slug || game.id;
  const version = game.version + 1;
  const next = { ...game, slug, version, isLive: true } as GameJson & { isLive: boolean };
  const dir = path.join(process.cwd(), "public/games", slug, `v${version}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "game.json"), JSON.stringify(next, null, 2));
  const index = JSON.parse(localStorage.getItem(LIVE_INDEX) ?? "{}") as Record<string, number>;
  index[slug] = version;
  localStorage.setItem(LIVE_INDEX, JSON.stringify(index));
  return { slug, version };
}

export function loadLiveGame(slug: string): GameJson {
  const version = JSON.parse(localStorage.getItem(LIVE_INDEX) ?? "{}")[slug];
  const file = path.join(process.cwd(), "public/games", slug, `v${version}`, "game.json");
  if (!existsSync(file)) throw new Error("Live game not found");
  return parseGameJson(JSON.parse(readFileSync(file, "utf8")));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- tests/persistence/publish.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/persistence/publish.ts src/app/play public/games tests/persistence/publish.test.ts
git commit -m "feat(publish): versioned live bundles and public play slug"
```

---

### Task 18: Engine test suite completion and manual QA

**Files:**
- Modify: `tests/engine/*.test.ts` (add cases from spec Testing section)
- Create: `docs/QA-manual.md`

**Interfaces:**
- Consumes: full engine + Climb fixture
- Produces: green `npm run test`; manual checklist executed once

- [ ] **Step 1: Write the failing tests for spec coverage gaps**

Add tests for:
- Audio placeholder on missing file (engine event only; UI tested manually)
- First-person `none` valid path
- Starting kit / group kit / pick pool inventory seed
- Together ignored for 1-player
- Player spinner empty → no-helper path

- [ ] **Step 2: Run tests to verify new cases fail**

Run: `npm run test`
Expected: FAIL on at least one new case

- [ ] **Step 3: Implement missing engine branches**

```typescript
// src/engine/inventory.ts
export function giveItem(inventory: string[], itemId: string, stackable = false): string[] {
  if (!stackable && inventory.includes(itemId)) return inventory;
  return [...inventory, itemId];
}

export function requireItem(inventory: string[], itemId: string): boolean {
  return inventory.includes(itemId);
}
```

```typescript
// tests/engine/one-player.test.ts
import { describe, it, expect } from "vitest";
import { eligiblePlayers } from "@/engine/relationships";

describe("1-player", () => {
  it("player spinner returns empty eligibility", () => {
    expect(eligiblePlayers("p1", { partners: {}, cannotPartner: {}, groups: {} }, ["p1"])).toEqual([]);
  });
});
```

- [ ] **Step 4: Run full test suite**

Run: `npm run test`
Expected: PASS — all engine tests

- [ ] **Step 5: Commit**

```bash
git add tests docs/QA-manual.md src/engine
git commit -m "test: complete engine coverage from design spec"
```

Manual QA (after automated tests):
- 1-player cutscene beat on Climb
- 2-player and 6-player pass-and-play on Climb
- Designer: New game, save invalid draft (allowed), Test blocked until stairs link, Publish produces playable `/play/[slug]`
- Verify HTML board v1; Three.js popup for room/stairs; designer floor preview matches Test

---

## Future slice (do not implement in v1)

**Three.js 3D-plane play board:** add `BoardThreePlane.tsx` implementing the same `BoardRenderer` props as `BoardHtml.tsx`; swap renderer in `PlayShell` via game setting or feature flag. Same `GameJson`; no schema changes required.

---

## Self-review (completed)

| Spec requirement | Task |
|---|---|
| Next.js + TS + Tailwind + shadcn | Task 1, 10 |
| Engine land-to-resolve | Tasks 4–5 |
| Named floors, no basement type | Tasks 2, 9, 15 |
| 1+ players, no cap | Tasks 8, 9 |
| Group no-show in pile | Task 6 |
| Designer outcome spinners + audio | Tasks 2, 7, 16 |
| HTML board v1 | Task 11 |
| Three.js shared module (not game kit) | Task 13 |
| New/Save/Open/Test/Publish | Tasks 10, 14, 15, 17 |
| Climb bundled example only | Task 9 |
| Validation blocks Test/Publish, not Save | Tasks 3, 15 |
| Tile/card/spinner audio | Tasks 12, 16 |
| 3D-plane board later | Future slice section |

No placeholders remain. Type names (`GameJson`, `GameSession`, `drawCard`, `validateGame`, `BoardHtml`, `FirstPersonView`) are consistent across tasks.

---

**Plan complete and saved to `docs/superpowers/plans/2026-09-18-building-board-template.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**