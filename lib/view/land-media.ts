import { popupSpoutAnchor } from '@/lib/designer/board-look';
import type { Cell, FloorLook, ImageRef, PopupSpout, VideoRef } from '@/lib/engine/types';

export function landMediaOf(cell?: Pick<Cell, 'image' | 'video'> | null): {
  image?: ImageRef;
  video?: VideoRef;
} | null {
  if (!cell) return null;
  if (!cell.image && !cell.video) return null;
  return {
    ...(cell.image ? { image: cell.image } : {}),
    ...(cell.video ? { video: cell.video } : {}),
  };
}

export function shouldShowLandMedia(input: {
  tokenSliding: boolean;
  awaitingRoom?: boolean;
  cell?: Pick<Cell, 'image' | 'video'> | null;
}): boolean {
  if (input.tokenSliding || input.awaitingRoom) return false;
  return landMediaOf(input.cell) !== null;
}

export function landPopupSpout(look?: FloorLook): PopupSpout {
  return popupSpoutAnchor(look?.popupSpout);
}
