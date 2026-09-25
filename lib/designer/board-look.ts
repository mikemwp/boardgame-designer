import { createBoard, type Board } from '@/lib/engine/board';
import type { CameraBias, Cell, FloorLook, ImageRef, PopupSpout } from '@/lib/engine/types';

export function defaultFloorLook(): FloorLook {
  return {
    edge: { material: 'wood', thickness: 0.12, height: 0.08 },
    surround: { padding: 0.8, color: '#166534' },
    centreMesh: { kind: 'none', scale: 1, offsetX: 0, offsetZ: 0, yaw: 0, height: 0 },
    popupSpout: 'tile',
    cameraBias: 'top-down',
  };
}

export function boardImageUv(
  col: number,
  row: number,
  columns: number,
  rows: number,
): { u0: number; v0: number; u1: number; v1: number } {
  const width = Math.max(1, columns);
  const height = Math.max(1, rows);
  return {
    u0: col / width,
    v0: row / height,
    u1: (col + 1) / width,
    v1: (row + 1) / height,
  };
}

export function tileFaceRef(cell: Pick<Cell, 'face' | 'image'>, look?: FloorLook): ImageRef | undefined {
  return cell.face ?? look?.image;
}

export function usesBoardTexture(cell: Pick<Cell, 'face' | 'image'>, look?: FloorLook): boolean {
  return Boolean(tileFaceRef(cell, look));
}

export function playCameraBias(look?: FloorLook): CameraBias {
  if (look?.centreMesh?.kind === 'castle') return 'token-side';
  return look?.cameraBias ?? 'top-down';
}

export function tokenSideYaw(token: { x: number; z: number }, pivot: { x: number; z: number }): number {
  const dx = token.x - pivot.x;
  const dz = token.z - pivot.z;
  return Math.round((Math.atan2(dx, dz) * 180) / Math.PI);
}

export function popupSpoutAnchor(spout: PopupSpout | undefined): PopupSpout {
  return spout ?? 'tile';
}

export function setFloorLook(board: Board, floorId: string, patch: Partial<FloorLook>): Board {
  if (!board.floors.some((floor) => floor.id === floorId)) return board;
  return createBoard(
    board.floors.map((floor) => {
      if (floor.id !== floorId) return floor;
      const current = floor.look ?? defaultFloorLook();
      const next: FloorLook = {
        ...current,
        ...patch,
        edge: patch.edge ? { ...current.edge, ...patch.edge } : current.edge,
        surround: patch.surround ? { ...current.surround, ...patch.surround } : current.surround,
        centreMesh: patch.centreMesh ? { ...current.centreMesh, ...patch.centreMesh } : current.centreMesh,
      };
      return { ...floor, look: next };
    }),
    board.stairs,
    board.rooms,
  );
}

export function setCellFace(
  board: Board,
  floorId: string,
  cellId: string,
  face: ImageRef | undefined,
): Board {
  return createBoard(
    board.floors.map((floor) => {
      if (floor.id !== floorId) return floor;
      return {
        ...floor,
        cells: floor.cells.map((cell) => {
          if (cell.id !== cellId) return cell;
          if (!face) {
            const { face: _drop, ...rest } = cell;
            return rest;
          }
          return { ...cell, face };
        }),
      };
    }),
    board.stairs,
    board.rooms,
  );
}
