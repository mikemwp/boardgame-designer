'use client';

import { Button } from '@/components/ui/button';
import type { ImageRef, PopupSpout, VideoRef } from '@/lib/engine/types';

export function LandMediaPopup({
  image,
  video,
  spout = 'tile',
  onClose,
}: {
  image?: ImageRef;
  video?: VideoRef;
  spout?: PopupSpout;
  onClose: () => void;
}) {
  if (!image && !video) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4"
      data-testid="land-media-popup"
      data-spout={spout}
    >
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4">
        {image?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={image.name} src={image.src} className="max-h-72 w-full object-contain" />
        ) : image ? (
          <p className="text-sm text-slate-300">{image.name}</p>
        ) : null}
        {video?.src ? (
          <video src={video.src} controls className="max-h-72 w-full" />
        ) : video ? (
          <p className="text-sm text-slate-300">{video.name}</p>
        ) : null}
        <Button type="button" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
