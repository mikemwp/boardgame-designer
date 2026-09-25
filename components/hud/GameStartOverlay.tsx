'use client';

import { useState, type ReactNode } from 'react';
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
  backgroundSrc,
  playUrl,
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
  backgroundSrc?: string;
  playUrl?: string;
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
  const showBackground = Boolean(backgroundSrc) && (phase !== 'play' || start.stayThroughout !== false);
  const [copied, setCopied] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const copyLink = async () => {
    const path = playUrl ?? '/';
    const href = typeof window !== 'undefined' ? `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}` : path;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {showBackground ? (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          data-testid="viewport-background"
          style={{ backgroundImage: `url(${backgroundSrc})` }}
        />
      ) : null}
      <div className="relative z-10 flex h-full min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      {overlayHidden ? null : (
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950/40 p-6 text-center backdrop-blur-[2px]"
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
          <div
            className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-white/20 bg-slate-950/60 p-6 text-left backdrop-blur-md"
            data-testid="join-game-card"
          >
            <h2 className="text-center text-2xl font-semibold text-slate-50">Join Game</h2>
            <Button type="button" onClick={onPlay}>
              New game
            </Button>
            <Button type="button" disabled title="No saved game" onClick={onContinue}>
              Saved game
            </Button>
            <Button type="button" variant="outline" onClick={() => setTutorialOpen(true)}>
              Tutorial
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void copyLink()}>
                Copy link
              </Button>
              <Button type="button" variant="outline" onClick={onPlay}>
                Play on this device
              </Button>
            </div>
            {copied ? <p className="text-sm text-emerald-300">Copied!</p> : null}
          </div>
        ) : null}
        {tutorialOpen ? (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-6"
            data-testid="tutorial-overlay"
          >
            <div className="max-w-md rounded-xl border border-white/20 bg-slate-900/90 p-6 text-left">
              <h3 className="mb-2 text-lg font-semibold text-slate-50">How to play</h3>
              <p className="mb-4 text-sm text-slate-200">
                Roll to move around the loop. Land on a packed tile to draw a card. Stairs change level. Rooms offer
                Enter or Pass. Mute sits at the top right.
              </p>
              <Button type="button" onClick={() => setTutorialOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
}
