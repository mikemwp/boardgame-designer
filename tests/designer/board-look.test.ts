import { describe, it, expect } from 'vitest';
import { createBoard } from '@/lib/engine/board';
import { createLoopedFloor } from '@/lib/engine/layout';
import { clearCell } from '@/lib/designer/mutate';
import { isVanillaFloor } from '@/lib/designer/level-size';
import {
  boardImageUv,
  defaultFloorLook,
  playCameraBias,
  popupSpoutAnchor,
  setCellFace,
  setFloorLook,
  tileFaceRef,
  tokenSideYaw,
  usesBoardTexture,
} from '@/lib/designer/board-look';
import type { ImageRef } from '@/lib/engine/types';

const image: ImageRef = { id: 'board-1', name: 'board.png', source: 'url', src: 'https://ex/board.png' };
const face: ImageRef = { id: 'face-1', name: 'face.png', source: 'url', src: 'https://ex/face.png' };

describe('boardImageUv', () => {
  it('gives neighbours a shared edge and puts 0,0 at the north-west', () => {
    const a = boardImageUv(0, 0, 8, 8);
    const b = boardImageUv(1, 0, 8, 8);
    expect(a).toEqual({ u0: 0, v0: 0, u1: 0.125, v1: 0.125 });
    expect(b.u0).toBe(a.u1);
    expect(b.v0).toBe(a.v0);
  });
});

describe('tile face vs land image', () => {
  it('prefers cell.face and never treats cell.image as a 3D face', () => {
    const look = { ...defaultFloorLook(), image };
    const cell = { id: 'c1', index: 0, image, face };
    expect(tileFaceRef(cell, look)).toEqual(face);
    expect(tileFaceRef({ id: 'c2', index: 1, image }, look)).toEqual(image);
    expect(usesBoardTexture({ id: 'c2', index: 1, image }, look)).toBe(true);
    expect(usesBoardTexture({ id: 'c3', index: 2 }, undefined)).toBe(false);
  });
});

describe('playCameraBias and tokenSideYaw', () => {
  it('uses token-side when a castle is on the level', () => {
    expect(playCameraBias(defaultFloorLook())).toBe('top-down');
    expect(playCameraBias({ cameraBias: 'token-side' })).toBe('token-side');
    expect(playCameraBias({ centreMesh: { kind: 'castle', scale: 1, offsetX: 0, offsetZ: 0, yaw: 0, height: 0 } })).toBe(
      'token-side',
    );
  });

  it('yaws so the token side of the loop faces the camera', () => {
    expect(tokenSideYaw({ x: 0, z: 4 }, { x: 0, z: 0 })).toBe(0);
    expect(tokenSideYaw({ x: 4, z: 0 }, { x: 0, z: 0 })).toBe(90);
  });
});

describe('setFloorLook and setCellFace', () => {
  it('stores look fields and locks vanilla; clearCell drops face; image is not a face', () => {
    const board = createBoard([createLoopedFloor('ground', 'Level 1', 0)], []);
    expect(isVanillaFloor(board.floors[0]!)).toBe(true);
    const withLook = setFloorLook(board, 'ground', { image });
    expect(withLook.floors[0]?.look?.image).toEqual(image);
    expect(isVanillaFloor(withLook.floors[0]!)).toBe(false);
    const withFace = setCellFace(board, 'ground', 'ground-c1', face);
    expect(withFace.floors[0]?.cells.find((cell) => cell.id === 'ground-c1')?.face).toEqual(face);
    expect(isVanillaFloor(withFace.floors[0]!)).toBe(false);
    const cleared = clearCell(withFace, 'ground', 'ground-c1');
    expect(cleared.floors[0]?.cells.find((cell) => cell.id === 'ground-c1')?.face).toBeUndefined();
    expect(popupSpoutAnchor('surround')).toBe('surround');
  });
});
