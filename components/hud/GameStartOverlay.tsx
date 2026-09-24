'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { GameStart, SplashScreen } from '@/lib/engine/types';
import type { StartPhase } from '@/lib/view/game-start';
import { isSplashRenderable } from '@/lib/view/game-start';

function remainingSkippable(start: GameStart, splashIndex: number): boolean {
  return start.splashes.slice(splashIndex).every((splash) => splash.skippable !== false);
}

export function GameStartOverlay({
  phase,
  start,
  splashIndex = 0,
  splashImageSrc,
  tapToStart = false,
  missingSound = false,
  muted = false,
  onNext,
  onSkipAll,
  onPlay,
  onContinue,
  onTapToStart,
  onToggleMute,
  children,
}: {
  phase: StartPhase;
  start: GameStart;
  splashIndex?: number;
  splashImageSrc?: string;
  tapToStart?: boolean;
  missingSound?: boolean;
  muted?: boolean;
  onNext?: () => void;
  onSkipAll?: () => void;
  onPlay?: () => void;
  onContinue?: () => void;
  onTapToStart?: () => void;
  onToggleMute?: () => void;
  children: ReactNode;
}) {
  const splash: SplashScreen | undefined = start.splashes[splashIndex];
  const overlayHidden = phase === 'skip' || phase === 'play';
  const showSplash = phase === 'splash' && splash && isSplashRenderable(splash);
  const menuItems =
    start.menu.items.length > 0
      ? start.menu.items
      : [{ id: 'implicit-play', label: 'Play', action: 'play' as const }];

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {children}
      {overlayHidden ? null : (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/90 p-6 text-center"
        data-testid="game-start-overlay"
      >
        <div className="absolute right-3 top-3">
          <Button type="button" variant="outline" onClick={onToggleMute}>
            {muted ? 'Unmute' : 'Mute'}
          </Button>
        </div>
        {missingSound ? (
          <p className="text-sm text-slate-300">Sound is missing. You can still play.</p>
        ) : null}
        {tapToStart ? (
          <Button type="button" data-testid="tap-to-start" onClick={onTapToStart}>
            Tap to start
          </Button>
        ) : null}
        {showSplash ? (
          <>
            {splashImageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={splashImageSrc} alt="" className="max-h-64 max-w-full rounded-md" />
            ) : null}
            {splash.caption ? <p className="text-lg text-slate-50">{splash.caption}</p> : null}
            {splash.skippable !== false ? (
              <Button type="button" onClick={onNext}>
                Next
              </Button>
            ) : null}
            {remainingSkippable(start, splashIndex) ? (
              <Button type="button" variant="outline" onClick={onSkipAll}>
                Skip all
              </Button>
            ) : null}
          </>
        ) : null}
        {phase === 'menu' ? (
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const disabled = item.action === 'continue';
              return (
                <Button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  title={disabled ? 'No saved game' : undefined}
                  onClick={() => {
                    if (item.action === 'play') onPlay?.();
                    else onContinue?.();
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
}
