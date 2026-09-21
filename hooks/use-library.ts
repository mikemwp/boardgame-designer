'use client';

import { useCallback, useEffect, useState } from 'react';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  addDraft,
  createDocument,
  getActive,
  listDrafts,
  saveDraft,
  setActive,
} from '@/lib/library/state';
import {
  browserStorage,
  loadLibrary,
  writeLibrary,
  type LibraryStorage,
} from '@/lib/library/storage';
import type {
  GameDocument,
  LibraryState,
  NewGameSource,
  StoredBootstrap,
} from '@/lib/library/types';
import { climbSample } from '@/lib/samples/climb';
import { emptyBootstrap } from '@/lib/samples/empty';

export interface UseLibraryOptions {
  storage?: LibraryStorage;
  initialState?: LibraryState;
  now?: () => string;
  createId?: () => string;
}

export function useLibrary(options: UseLibraryOptions = {}) {
  const storage = options.storage ?? browserStorage();
  const now = options.now ?? (() => new Date().toISOString());
  const createId = options.createId ?? (() => crypto.randomUUID());
  const [state, setState] = useState<LibraryState | null>(
    options.initialState ?? null,
  );

  useEffect(() => {
    if (options.initialState) return;
    setState(
      loadLibrary(storage, {
        now: now(),
        id: createId(),
      }),
    );
    // Intentionally once on mount; tests pass initialState and skip this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = useCallback(
    (next: LibraryState) => {
      writeLibrary(storage, next);
      setState(next);
    },
    [storage],
  );

  const newGame = useCallback(
    (input: { name: string; source: NewGameSource }) => {
      setState((current) => {
        if (!current) return current;
        const bootstrap =
          input.source === 'empty'
            ? toStoredBootstrap(emptyBootstrap())
            : toStoredBootstrap(climbSample);
        const doc = createDocument({
          id: createId(),
          name: input.name.trim(),
          source: input.source,
          bootstrap,
          now: now(),
        });
        const next = addDraft(current, doc);
        writeLibrary(storage, next);
        return next;
      });
    },
    [createId, now, storage],
  );

  const openGame = useCallback(
    (id: string) => {
      setState((current) => {
        if (!current) return current;
        const next = setActive(current, id);
        writeLibrary(storage, next);
        return next;
      });
    },
    [storage],
  );

  const saveActive = useCallback(
    (bootstrap: StoredBootstrap) => {
      setState((current) => {
        if (!current?.activeId) return current;
        const next = saveDraft(current, current.activeId, bootstrap, now());
        writeLibrary(storage, next);
        return next;
      });
    },
    [now, storage],
  );

  return {
    ready: state !== null,
    drafts: state ? listDrafts(state) : ([] as GameDocument[]),
    activeId: state?.activeId ?? null,
    active: state ? getActive(state) : undefined,
    newGame,
    openGame,
    saveActive,
    persist,
  };
}
