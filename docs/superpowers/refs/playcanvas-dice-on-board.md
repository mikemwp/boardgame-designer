# PlayCanvas on-board dice — implementation blueprint

**Status:** reference for implementers, not the product spec.  
**Spec:** [Building board template design](/opt/cursor/projects/opt-cursor-worspace-projects-Users-mpenny-Library-Application-Support-Cursor-projects-tmp-project-store-a1c7c3c1d4c3c3c3c3c3c3c3c3c3c3c3/docs/superpowers/specs/2026-09-17-building-board-template-design.md)

This is the classic PlayCanvas ammo.js dice pattern: a cube with **RigidBody (dynamic)** + **Collision (box)**, an upward **impulse** plus **torque**, wait until linear/angular velocity is near zero, then read the **top face** with a world-up dot product.

It **will work** on our 3D board. We do **not** paste this into the spec. We **do** follow it in the PlayCanvas view, with the adaptations below.

## What to keep

- Cube (rounded box) mesh, box collider matching the mesh, dynamic rigid body
- `teleport` + zero velocities, then `applyImpulse` + `applyTorqueImpulse`
- Settle detection via velocity length thresholds
- Face map of local vectors → pip values; transform each into world space and pick the one closest to world up
- Static colliders on the **board floor**; optional invisible static walls around the floor so dice stay on the tiles (this is a board fence, not a felt overlay tray)
- After settle, notify the React/HUD layer so movement/cards can continue

## What to change for this project

| Blueprint as written | Our game |
|---|---|
| `pc.createScript('diceRoller')` in the PlayCanvas Editor | `@playcanvas/react` entities + rigidbody/collision components (same ammo API, React ownership) |
| Click/touch the die to roll | Game session triggers the roll (movement or a linked card) |
| Physics **decides** the number (`determineTopFace` is the result) | **Engine RNG picks the integer first**; physics is the show. After settle, remap/prepare the face (or a child mesh rotation) so the visible pip matches the engine value |
| `teleport(0, 5, 0)` | Spawn / teleport **near the active token** (or a designer roll point) a little above the current floor |
| `app.fire('dice:settled', result)` as source of truth | Fire a **visual settled** event; session already has the integer. HUD may display it; do not let physics overwrite the engine result |
| Tokens not mentioned | Tokens are **not** rigid bodies; filter collisions so dice do not knock tokens |

Historical Editor sandboxes (impulse on rigid bodies, not our stack): PlayCanvas Backgammon-era dice scripts and the old Dice Physics project overview. Use them as physics feel references only.

## Editor-script sketch (do not drop in as-is)

```javascript
import pc from "playcanvas";

const DiceRoller = pc.createScript("diceRoller");

DiceRoller.prototype.initialize = function () {
  this.faceVectors = [
    { value: 1, vector: new pc.Vec3(0, 0, 1) },
    { value: 6, vector: new pc.Vec3(0, 0, -1) },
    { value: 2, vector: new pc.Vec3(1, 0, 0) },
    { value: 5, vector: new pc.Vec3(-1, 0, 0) },
    { value: 3, vector: new pc.Vec3(0, 1, 0) },
    { value: 4, vector: new pc.Vec3(0, -1, 0) },
  ];
};

DiceRoller.prototype.roll = function () {
  this.entity.rigidbody.teleport(0, 5, 0);
  this.entity.rigidbody.linearVelocity = pc.Vec3.ZERO;
  this.entity.rigidbody.angularVelocity = pc.Vec3.ZERO;

  const upwardForce = 8 + Math.random() * 4;
  const horizontalForceX = (Math.random() - 0.5) * 5;
  const horizontalForceZ = (Math.random() - 0.5) * 5;
  const torqueX = (Math.random() - 0.5) * 20;
  const torqueY = (Math.random() - 0.5) * 20;
  const torqueZ = (Math.random() - 0.5) * 20;

  this.entity.rigidbody.applyImpulse(horizontalForceX, upwardForce, horizontalForceZ);
  this.entity.rigidbody.applyTorqueImpulse(torqueX, torqueY, torqueZ);
  this.isRolling = true;
};

DiceRoller.prototype.update = function (dt) {
  if (!this.isRolling) return;
  const lv = this.entity.rigidbody.linearVelocity.length();
  const av = this.entity.rigidbody.angularVelocity.length();
  if (lv < 0.01 && av < 0.01) {
    this.isRolling = false;
    const shownFace = this.determineTopFace();
    this.app.fire("dice:settled", shownFace);
  }
};

DiceRoller.prototype.determineTopFace = function () {
  const worldUp = pc.Vec3.UP;
  let highestDot = -1;
  let finalValue = 1;
  this.faceVectors.forEach((face) => {
    const transformedVector = new pc.Vec3();
    this.entity.getWorldTransform().transformVector(face.vector, transformedVector);
    const dot = transformedVector.dot(worldUp);
    if (dot > highestDot) {
      highestDot = dot;
      finalValue = face.value;
    }
  });
  return finalValue;
};
```

React overlay listens for visual settle (example only):

```tsx
useEffect(() => {
  if (!playcanvasApp) return;
  const onSettled = (shownFace: number) => {
    // Display only. Movement uses the engine-picked integer, not shownFace.
  };
  playcanvasApp.on("dice:settled", onSettled);
  return () => playcanvasApp.off("dice:settled", onSettled);
}, [playcanvasApp]);
```
