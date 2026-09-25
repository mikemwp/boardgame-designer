'use client';

import { MediaField } from '@/components/designer/AudioField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { defaultFloorLook } from '@/lib/designer/board-look';
import type { CameraBias, EdgeMaterial, FloorLook, ImageRef, PopupSpout } from '@/lib/engine/types';
import type { MediaStore } from '@/lib/library/media-store';

export function BoardEditor({
  look,
  gameTitle,
  gameId,
  media,
  onChange,
}: {
  look?: FloorLook;
  gameTitle: string;
  gameId?: string;
  media?: MediaStore;
  onChange: (patch: Partial<FloorLook>) => void;
}) {
  const current = {
    ...defaultFloorLook(),
    ...look,
    edge: { ...defaultFloorLook().edge!, ...look?.edge },
    surround: { ...defaultFloorLook().surround!, ...look?.surround },
    centreMesh: { ...defaultFloorLook().centreMesh!, ...look?.centreMesh },
  };

  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-slate-800 p-3" data-testid="board-editor">
      <p className="text-sm font-medium text-slate-100">Board</p>
      <p className="text-sm text-slate-300" data-testid="surround-game-name-preview">
        {gameTitle}
      </p>
      <MediaField
        kind="image"
        label="Board image"
        value={current.image}
        gameId={gameId ?? 'draft'}
        media={media}
        onChange={(image) => onChange({ image: image as ImageRef | undefined })}
        idPrefix="board-image"
      />
      <Label htmlFor="board-edge">Edge</Label>
      <select
        id="board-edge"
        aria-label="Edge"
        className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
        value={current.edge.material}
        onChange={(e) => onChange({ edge: { ...current.edge, material: e.target.value as EdgeMaterial } })}
      >
        <option value="wood">wood</option>
        <option value="metal">metal</option>
        <option value="plastic">plastic</option>
      </select>
      <Label htmlFor="edge-thickness">Edge thickness</Label>
      <Input
        id="edge-thickness"
        aria-label="Edge thickness"
        type="number"
        step="0.01"
        value={current.edge.thickness}
        onChange={(e) => onChange({ edge: { ...current.edge, thickness: Number(e.target.value) } })}
      />
      <Label htmlFor="edge-height">Edge height</Label>
      <Input
        id="edge-height"
        aria-label="Edge height"
        type="number"
        step="0.01"
        value={current.edge.height}
        onChange={(e) => onChange({ edge: { ...current.edge, height: Number(e.target.value) } })}
      />
      <Label htmlFor="surround-padding">Surround padding</Label>
      <Input
        id="surround-padding"
        aria-label="Surround padding"
        type="number"
        step="0.1"
        value={current.surround.padding}
        onChange={(e) => onChange({ surround: { ...current.surround, padding: Number(e.target.value) } })}
      />
      <Label htmlFor="surround-color">Surround color</Label>
      <Input
        id="surround-color"
        aria-label="Surround color"
        value={current.surround.color ?? '#166534'}
        onChange={(e) => onChange({ surround: { ...current.surround, color: e.target.value } })}
      />
      <MediaField
        kind="image"
        label="Surround image"
        value={current.surround.image}
        gameId={gameId ?? 'draft'}
        media={media}
        onChange={(image) => onChange({ surround: { ...current.surround, image: image as ImageRef | undefined } })}
        idPrefix="surround-image"
      />
      <Label htmlFor="centre-mesh">Centre mesh</Label>
      <select
        id="centre-mesh"
        aria-label="Centre mesh"
        className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
        value={current.centreMesh.kind}
        onChange={(e) => onChange({ centreMesh: { ...current.centreMesh, kind: e.target.value as 'none' | 'castle' } })}
      >
        <option value="none">None</option>
        <option value="castle">Castle</option>
      </select>
      <Label htmlFor="mesh-scale">Mesh scale</Label>
      <Input
        id="mesh-scale"
        aria-label="Mesh scale"
        type="number"
        step="0.1"
        value={current.centreMesh.scale}
        onChange={(e) => onChange({ centreMesh: { ...current.centreMesh, scale: Number(e.target.value) } })}
      />
      <Label htmlFor="mesh-offset-x">Mesh offset X</Label>
      <Input
        id="mesh-offset-x"
        aria-label="Mesh offset X"
        type="number"
        step="0.1"
        value={current.centreMesh.offsetX}
        onChange={(e) => onChange({ centreMesh: { ...current.centreMesh, offsetX: Number(e.target.value) } })}
      />
      <Label htmlFor="mesh-offset-z">Mesh offset Z</Label>
      <Input
        id="mesh-offset-z"
        aria-label="Mesh offset Z"
        type="number"
        step="0.1"
        value={current.centreMesh.offsetZ}
        onChange={(e) => onChange({ centreMesh: { ...current.centreMesh, offsetZ: Number(e.target.value) } })}
      />
      <Label htmlFor="mesh-yaw">Mesh yaw</Label>
      <Input
        id="mesh-yaw"
        aria-label="Mesh yaw"
        type="number"
        value={current.centreMesh.yaw}
        onChange={(e) => onChange({ centreMesh: { ...current.centreMesh, yaw: Number(e.target.value) } })}
      />
      <Label htmlFor="mesh-height">Mesh height</Label>
      <Input
        id="mesh-height"
        aria-label="Mesh height"
        type="number"
        step="0.1"
        value={current.centreMesh.height}
        onChange={(e) => onChange({ centreMesh: { ...current.centreMesh, height: Number(e.target.value) } })}
      />
      <Label htmlFor="popup-spout">Popup spout</Label>
      <select
        id="popup-spout"
        aria-label="Popup spout"
        className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
        value={current.popupSpout ?? 'tile'}
        onChange={(e) => onChange({ popupSpout: e.target.value as PopupSpout })}
      >
        <option value="mesh">mesh</option>
        <option value="surround">surround</option>
        <option value="tile">tile</option>
      </select>
      <Label htmlFor="camera-bias">Camera</Label>
      <select
        id="camera-bias"
        aria-label="Camera"
        className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-sm"
        value={current.cameraBias ?? 'top-down'}
        onChange={(e) => onChange({ cameraBias: e.target.value as CameraBias })}
      >
        <option value="top-down">top-down</option>
        <option value="token-side">as in Test</option>
      </select>
    </div>
  );
}
