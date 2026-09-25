'use client';

import { Fragment } from 'react';
import { Entity } from '@playcanvas/react';
import { Collision, Render, RigidBody } from '@playcanvas/react/components';
import { useMaterial } from '@playcanvas/react/hooks';
import { defaultFloorLook, usesBoardTexture } from '@/lib/designer/board-look';
import { PREVIEW_TILE_COLORS, previewTileColor } from '@/lib/designer/tile-chrome';
import type { Board } from '@/lib/engine/board';
import { inferShape } from '@/lib/engine/shape';
import type { Floor } from '@/lib/engine/types';
import { cellToWorld, gridToWorld, slotPolygon } from '@/lib/view/board-layout';
import { tileSeamEdges, tileSeamEdgesFromPolygon } from '@/lib/view/tile-seams';
import { PolygonTile } from './PolygonTile';

function isPolarFloor(floor: Board['floors'][0]): boolean {
  const kind = floor.shape?.kind ?? inferShape(floor).kind;
  return kind !== 'square' && kind !== 'rectangle';
}

const EDGE_COLORS = {
  wood: { diffuse: '#8B5A2B', emissive: '#5c3b1d' },
  metal: { diffuse: '#94a3b8', emissive: '#475569' },
  plastic: { diffuse: '#1e293b', emissive: '#0f172a' },
} as const;

function playRect(floor: Floor) {
  const columns = Math.max(1, floor.columns ?? 8);
  const rows = Math.max(1, floor.rows ?? 8);
  const a = gridToWorld(floor.index, 0, 0, floor.hud);
  const b = gridToWorld(floor.index, columns - 1, rows - 1, floor.hud);
  const minX = Math.min(a.x, b.x) - 0.5;
  const maxX = Math.max(a.x, b.x) + 0.5;
  const minZ = Math.min(a.z, b.z) - 0.5;
  const maxZ = Math.max(a.z, b.z) + 0.5;
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    y: a.y,
    cx: (minX + maxX) / 2,
    cz: (minZ + maxZ) / 2,
    w: maxX - minX,
    d: maxZ - minZ,
  };
}

function CartesianTable({ floor }: { floor: Floor }) {
  const look = { ...defaultFloorLook(), ...floor.look, edge: { ...defaultFloorLook().edge!, ...floor.look?.edge }, surround: { ...defaultFloorLook().surround!, ...floor.look?.surround }, centreMesh: { ...defaultFloorLook().centreMesh!, ...floor.look?.centreMesh } };
  const rect = playRect(floor);
  const pad = look.surround.padding;
  const thick = look.edge.thickness;
  const surroundMat = useMaterial({
    diffuse: look.surround.color ?? '#166534',
    emissive: look.surround.color ?? '#166534',
    emissiveIntensity: 0.2,
  });
  const edgeMat = useMaterial({ ...EDGE_COLORS[look.edge.material], emissiveIntensity: 0.4 });
  const boardMat = useMaterial({ diffuse: '#d6c4a8', emissive: '#b45309', emissiveIntensity: 0.15 });
  const castleMat = useMaterial({ diffuse: '#78716c', emissive: '#44403c', emissiveIntensity: 0.35 });
  const surroundW = rect.w + (pad + thick) * 2;
  const surroundD = rect.d + (pad + thick) * 2;
  return (
    <>
      <Entity
        name={`${floor.id}-surround`}
        position={[rect.cx, rect.y - 0.08, rect.cz]}
        scale={[surroundW, 0.04, surroundD]}
      >
        <Render type="box" material={surroundMat} />
      </Entity>
      <Entity
        name={`${floor.id}-edge-n`}
        position={[rect.cx, rect.y + look.edge.height / 2, rect.minZ - thick / 2]}
        scale={[rect.w + thick * 2, look.edge.height, thick]}
      >
        <Render type="box" material={edgeMat} />
      </Entity>
      <Entity
        name={`${floor.id}-edge-s`}
        position={[rect.cx, rect.y + look.edge.height / 2, rect.maxZ + thick / 2]}
        scale={[rect.w + thick * 2, look.edge.height, thick]}
      >
        <Render type="box" material={edgeMat} />
      </Entity>
      <Entity
        name={`${floor.id}-edge-w`}
        position={[rect.minX - thick / 2, rect.y + look.edge.height / 2, rect.cz]}
        scale={[thick, look.edge.height, rect.d]}
      >
        <Render type="box" material={edgeMat} />
      </Entity>
      <Entity
        name={`${floor.id}-edge-e`}
        position={[rect.maxX + thick / 2, rect.y + look.edge.height / 2, rect.cz]}
        scale={[thick, look.edge.height, rect.d]}
      >
        <Render type="box" material={edgeMat} />
      </Entity>
      <Entity
        name={`${floor.id}-board-quad`}
        position={[rect.cx, rect.y - 0.04, rect.cz]}
        scale={[rect.w, 0.02, rect.d]}
      >
        <Render type="box" material={boardMat} />
      </Entity>
      {look.centreMesh.kind === 'castle' ? (
        <Entity
          name={`${floor.id}-centre-mesh`}
          position={[
            look.centreMesh.offsetX,
            rect.y + 0.35 + look.centreMesh.height,
            look.centreMesh.offsetZ,
          ]}
          rotation={[0, look.centreMesh.yaw, 0]}
          scale={[look.centreMesh.scale, look.centreMesh.scale, look.centreMesh.scale]}
        >
          <Entity name={`${floor.id}-castle-keep`} position={[0, 0.35, 0]} scale={[1.1, 0.9, 1.1]}>
            <Render type="box" material={castleMat} />
          </Entity>
          <Entity name={`${floor.id}-castle-tower`} position={[0, 0.95, 0]} scale={[0.55, 0.7, 0.55]}>
            <Render type="box" material={castleMat} />
          </Entity>
        </Entity>
      ) : null}
    </>
  );
}

export function FloorStack({
  board,
  usePhysics = false,
  selectedCellId,
}: {
  board: Board;
  usePhysics?: boolean;
  selectedCellId?: string;
}) {
  const corridorMat = useMaterial({ ...PREVIEW_TILE_COLORS.corridor, emissiveIntensity: 0.9 });
  const stairMat = useMaterial({ ...PREVIEW_TILE_COLORS.stair, emissiveIntensity: 0.8 });
  const roomMat = useMaterial({ ...PREVIEW_TILE_COLORS.room, emissiveIntensity: 0.8 });
  const hudMat = useMaterial({ ...PREVIEW_TILE_COLORS.hud, emissiveIntensity: 0.8 });
  const startMat = useMaterial({ ...PREVIEW_TILE_COLORS.start, emissiveIntensity: 0.85 });
  const selectedMat = useMaterial({ ...PREVIEW_TILE_COLORS.selected, emissiveIntensity: 0.9 });
  const seamMat = useMaterial({ diffuse: '#1e293b', emissive: '#0f172a', emissiveIntensity: 1.2 });
  const faceMat = useMaterial({ diffuse: '#e7d3b0', emissive: '#a16207', emissiveIntensity: 0.2 });
  const floors = board.floors ?? [];

  return (
    <>
      {floors.map((floor) => (isPolarFloor(floor) ? null : <CartesianTable key={`${floor.id}-table`} floor={floor} />))}
      {floors.flatMap((floor) => {
        const polar = isPolarFloor(floor);
        const look = floor.look;
        return floor.cells.map((cell, cellIndex) => {
          const pos = cellToWorld(floor.index, cell, floor.hud, floor);
          const selected = cell.id === selectedCellId;
          const textured = !polar && usesBoardTexture(cell, look);
          const color = selected ? PREVIEW_TILE_COLORS.selected : previewTileColor(cell);
          const material = textured
            ? faceMat
            : color === PREVIEW_TILE_COLORS.selected
              ? selectedMat
              : color === PREVIEW_TILE_COLORS.start
                ? startMat
                : color === PREVIEW_TILE_COLORS.hud
                  ? hudMat
                  : color === PREVIEW_TILE_COLORS.stair
                    ? stairMat
                    : color === PREVIEW_TILE_COLORS.room
                      ? roomMat
                      : corridorMat;
          const polygon = polar ? slotPolygon(floor, cell) : [];
          const seams = polar && polygon.length > 0
            ? tileSeamEdgesFromPolygon(pos.y, polygon)
            : tileSeamEdges(pos);
          const rimMat =
            color === PREVIEW_TILE_COLORS.selected
              ? selectedMat
              : color === PREVIEW_TILE_COLORS.start
                ? startMat
                : color === PREVIEW_TILE_COLORS.hud
                  ? hudMat
                  : color === PREVIEW_TILE_COLORS.stair
                    ? stairMat
                    : color === PREVIEW_TILE_COLORS.room
                      ? roomMat
                      : corridorMat;
          return (
            <Fragment key={`${floor.id}:${cellIndex}:${cell.id}`}>
              {polar && polygon.length > 0 ? (
                <PolygonTile
                  id={cell.id}
                  polygon={polygon}
                  y={pos.y}
                  material={material}
                  position={[pos.x, pos.y, pos.z]}
                />
              ) : (
                <Entity
                  name={cell.id}
                  position={[pos.x, pos.y, pos.z]}
                  scale={[1, 0.2, 1]}
                >
                  <Render type="box" material={material} />
                  {usePhysics && (
                    <>
                      <Collision type="box" halfExtents={[0.5, 0.05, 0.5]} />
                      <RigidBody type="static" />
                    </>
                  )}
                </Entity>
              )}
              {textured ? (
                <Entity
                  name={`${cell.id}-rim`}
                  position={[pos.x, pos.y + 0.12, pos.z]}
                  scale={[1.02, 0.04, 1.02]}
                >
                  <Render type="box" material={rimMat} />
                </Entity>
              ) : null}
              {seams.map((seam, edgeIndex) => (
                <Entity
                  key={`${cell.id}-seam-${edgeIndex}`}
                  name={`${cell.id}-seam-${edgeIndex}`}
                  position={seam.position}
                  scale={seam.scale}
                >
                  <Render type="box" material={seamMat} />
                </Entity>
              ))}
            </Fragment>
          );
        });
      })}
    </>
  );
}
