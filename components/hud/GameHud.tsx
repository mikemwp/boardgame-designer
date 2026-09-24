'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardScene } from '@/components/board/BoardScene';
import { Button } from '@/components/ui/button';
import { CardPanel } from '@/components/hud/CardPanel';
import { FeatureToggles } from '@/components/hud/FeatureToggles';
import { GameStartOverlay } from '@/components/hud/GameStartOverlay';
import { HoldStatus } from '@/components/hud/HoldStatus';
import { PassStatus } from '@/components/hud/PassStatus';
import { ImportCardsDialog } from '@/components/hud/ImportCardsDialog';
import { LastRoll } from '@/components/hud/LastRoll';
import { MovementStage } from '@/components/hud/MovementStage';
import { PlayerBar } from '@/components/hud/PlayerBar';
import { useGameStore } from '@/hooks/use-game-store';
import { listHudWidgets } from '@/lib/designer/hud';
import type { AudioCue } from '@/lib/engine/audio';
import type { GameBootstrap, GameState } from '@/lib/engine/game';
import type { GameStart } from '@/lib/engine/types';
import { memoryMediaStore, type MediaStore } from '@/lib/library/media-store';
import {
  createAudioPlayer,
  readMute,
  resolveRef,
  writeMute,
} from '@/lib/view/audio-player';
import {
  firstRenderableSplashIndex,
  initialStartPhase,
  nextSplashIndex,
  splashDurationMs,
  type StartPhase,
} from '@/lib/view/game-start';
import {
  isMovementVizActive,
  phaseAfterNewRoll,
  phaseAfterSlide,
  phaseAfterTumble,
  shouldAllowTokenSlide,
  type MovementPhase,
} from '@/lib/view/hud-movement';
import { formatCardTimer, isCardHoldActive } from '@/lib/view/card-hold';
import { isRollLocked, shouldShowDealtCard } from '@/lib/view/turn-loop';

export function GameHud({
  bootstrap,
  onStateChange,
  gameStart,
  gameId,
  media,
}: {
  bootstrap: GameBootstrap;
  onStateChange?: (game: GameState) => void;
  gameStart?: GameStart;
  gameId?: string;
  media?: MediaStore;
}) {
  const { game, dispatch, updateConfig, importCards } = useGameStore(bootstrap);
  const [importOpen, setImportOpen] = useState(false);
  const fallbackMedia = useRef(memoryMediaStore()).current;
  const mediaStore = media ?? fallbackMedia;
  const resolvedGameId = gameId ?? 'draft';
  const playerRef = useRef(createAudioPlayer());
  const [startPhase, setStartPhase] = useState<StartPhase>(() => initialStartPhase(gameStart));
  const [splashIndex, setSplashIndex] = useState(() =>
    gameStart ? Math.max(0, firstRenderableSplashIndex(gameStart)) : 0,
  );
  const [tapToStart, setTapToStart] = useState(false);
  const [missingSound, setMissingSound] = useState(false);
  const [muted, setMuted] = useState(() => readMute());
  const [splashImageSrc, setSplashImageSrc] = useState<string | undefined>();
  const lastCueId = useRef(0);
  const pendingCardCues = useRef<AudioCue[]>([]);

  useEffect(() => {
    playerRef.current.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    onStateChange?.(game);
  }, [game, onStateChange]);
  const [tokenSliding, setTokenSliding] = useState(false);
  const [phase, setPhase] = useState<MovementPhase>('idle');
  const [cardHoldReleased, setCardHoldReleased] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
  const seenRollId = useRef(0);
  const holdFloor = game.board.floors.find((f) => f.id === game.hold?.floorId);
  const activePlayer = game.players.players.find((p) => p.id === game.players.activePlayerId);
  const movementVizActive = isMovementVizActive(phase);

  useEffect(() => {
    const roll = game.lastRoll;
    if (!roll || roll.id === seenRollId.current) return;
    seenRollId.current = roll.id;
    setPhase(phaseAfterNewRoll(roll.value));
  }, [game.lastRoll]);

  const visibleCard = shouldShowDealtCard({
    tokenSliding,
    currentCard: game.cards.currentCard,
    movementVizActive,
  })
    ? game.cards.currentCard
    : null;

  useEffect(() => {
    setCardHoldReleased(false);
  }, [game.cards.currentCard?.id]);

  const cardHoldActive = isCardHoldActive({
    currentCard: visibleCard,
    bodyVisible: game.cards.bodyVisible,
    released: cardHoldReleased,
  });
  const overlayLocksRoll = startPhase !== 'play' && startPhase !== 'skip';
  const rollLocked =
    overlayLocksRoll ||
    isRollLocked({
      tokenSliding,
      awaitingAction: game.cards.awaitingAction,
      movementVizActive,
      cardHoldActive,
    });

  const playCue = useCallback(
    async (cue: AudioCue) => {
      const url = await resolveRef(cue.audio, mediaStore, resolvedGameId);
      if (!url) {
        setMissingSound(true);
        return;
      }
      const result = await playerRef.current.playSfx(url);
      if (result === 'missing') setMissingSound(true);
    },
    [mediaStore, resolvedGameId],
  );

  useEffect(() => {
    if (game.audioCueId === lastCueId.current) return;
    lastCueId.current = game.audioCueId;
    const land = game.lastAudioCues.filter((cue) => cue.target !== 'card');
    pendingCardCues.current = game.lastAudioCues.filter((cue) => cue.target === 'card');
    for (const cue of land) void playCue(cue);
  }, [game.audioCueId, game.lastAudioCues, playCue]);

  useEffect(() => {
    if (!visibleCard) return;
    const cards = pendingCardCues.current.filter((cue) => cue.ownerId === visibleCard.id);
    pendingCardCues.current = pendingCardCues.current.filter((cue) => cue.ownerId !== visibleCard.id);
    for (const cue of cards) void playCue(cue);
  }, [visibleCard, playCue]);

  const startMusic = useCallback(async () => {
    if (!gameStart?.audio) return;
    const url = await resolveRef(gameStart.audio, mediaStore, resolvedGameId);
    if (!url) {
      setMissingSound(true);
      return;
    }
    const result = await playerRef.current.playMusic(url);
    if (result === 'blocked') setTapToStart(true);
    if (result === 'missing') setMissingSound(true);
    if (result === 'played') setTapToStart(false);
  }, [gameStart?.audio, mediaStore, resolvedGameId]);

  useEffect(() => {
    if (startPhase === 'skip' || startPhase === 'play') return;
    void startMusic();
  }, [startPhase, startMusic]);

  useEffect(() => {
    const splash = gameStart?.splashes[splashIndex];
    if (startPhase !== 'splash' || !splash?.image) {
      setSplashImageSrc(undefined);
      return;
    }
    if (splash.image.source === 'url') {
      setSplashImageSrc(splash.image.src);
      return;
    }
    let cancelled = false;
    void mediaStore.get(resolvedGameId, splash.image.id).then((blob) => {
      if (cancelled) return;
      setSplashImageSrc(blob ? URL.createObjectURL(blob) : undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [gameStart, splashIndex, startPhase, mediaStore, resolvedGameId]);

  const goToAfterSplash = useCallback(
    (mode: 'timeout' | 'skip') => {
      if (!gameStart) return;
      const next = nextSplashIndex(gameStart, splashIndex, mode);
      if (next === 'menu' || next === 'play') {
        setStartPhase(next);
        return;
      }
      setSplashIndex(next);
    },
    [gameStart, splashIndex],
  );

  useEffect(() => {
    if (startPhase !== 'splash' || !gameStart) return;
    const ms = splashDurationMs(gameStart.splashes[splashIndex]);
    if (ms === 0) return;
    const timer = window.setTimeout(() => goToAfterSplash('timeout'), ms);
    return () => window.clearTimeout(timer);
  }, [startPhase, splashIndex, gameStart, goToAfterSplash]);

  const onPlayStart = () => {
    playerRef.current.stopMusic();
    setStartPhase('play');
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    writeMute(next);
    playerRef.current.setMuted(next);
  };

  const timerSeconds = visibleCard?.timerSeconds ?? 0;
  const timerRunning = timerSeconds > 0 && game.cards.bodyVisible && !cardHoldReleased;

  useEffect(() => {
    if (!timerRunning) {
      setTimerRemaining(null);
      return;
    }
    setTimerRemaining(timerSeconds);
    const timeout = setTimeout(() => setCardHoldReleased(true), timerSeconds * 1000);
    const interval = setInterval(() => {
      setTimerRemaining((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  const onTokenSlideStart = useCallback(() => setTokenSliding(true), []);
  const onTumbleComplete = useCallback(() => {
    setPhase((current) => phaseAfterTumble(current));
  }, []);
  const onTokenSlideComplete = useCallback(() => {
    setTokenSliding(false);
    setPhase((current) => phaseAfterSlide(current));
  }, []);

  const spinner = game.config.movementViz === 'spinner';
  const widgets = listHudWidgets(game.board);
  const designedHud = widgets.some((widget) => widget !== 'empty');
  const showPlayerBar = !designedHud || widgets.includes('player-bar');
  const showLastRoll = !designedHud || widgets.includes('last-roll');

  return (
    <GameStartOverlay
      phase={startPhase}
      start={gameStart ?? { splashes: [], menu: { items: [] } }}
      splashIndex={splashIndex}
      splashImageSrc={splashImageSrc}
      tapToStart={tapToStart}
      missingSound={missingSound}
      muted={muted}
      onNext={() => goToAfterSplash('timeout')}
      onSkipAll={() => goToAfterSplash('skip')}
      onPlay={onPlayStart}
      onTapToStart={() => void startMusic()}
      onToggleMute={toggleMute}
    >
    <div
      className="grid h-full min-h-0 min-w-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,max-content)_minmax(0,16rem)]"
      data-testid="test-hud"
    >
      <div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
        <BoardScene
          game={game}
          allowSlide={shouldAllowTokenSlide(phase)}
          onTokenSlideStart={onTokenSlideStart}
          onTokenSlideComplete={onTokenSlideComplete}
        />
        {showPlayerBar ? (
          <PlayerBar
            players={game.players.players}
            activePlayerId={game.players.activePlayerId}
          />
        ) : null}
        <MovementStage
          viz={game.config.movementViz}
          lastRoll={game.lastRoll}
          diceCount={game.config.diceCount}
          phase={phase}
          onTumbleComplete={onTumbleComplete}
        />
        {showLastRoll ? (
          <LastRoll lastRoll={game.lastRoll} movementViz={game.config.movementViz} />
        ) : null}
        <HoldStatus hold={game.hold} floorLabel={holdFloor?.label ?? 'this floor'} />
        <PassStatus
          passesEnabled={game.config.passesEnabled}
          passesLeftByPack={activePlayer?.passesLeftByPack ?? {}}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => dispatch({ type: 'ROLL_DICE' })}
            disabled={rollLocked}
          >
            {spinner ? 'Spin' : 'Roll dice'}
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import cards
          </Button>
          <Button type="button" variant="outline" onClick={toggleMute}>
            {muted ? 'Unmute' : 'Mute'}
          </Button>
        </div>
      </div>
      <aside className="flex min-h-0 min-w-0 flex-col gap-2 overflow-y-auto">
        <FeatureToggles config={game.config} onChange={updateConfig} />
        <CardPanel
          actionMode={game.config.actionMode}
          currentCard={visibleCard}
          bodyVisible={game.cards.bodyVisible}
          awaitingAction={game.cards.awaitingAction}
          passesEnabled={game.config.passesEnabled}
          passesLeftByPack={activePlayer?.passesLeftByPack ?? {}}
          timerLabel={timerRemaining != null ? formatCardTimer(timerRemaining) : undefined}
          onExtra={() => setCardHoldReleased(true)}
          onDispatch={dispatch}
        />
      </aside>
      <ImportCardsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={importCards}
      />
    </div>
    </GameStartOverlay>
  );
}
