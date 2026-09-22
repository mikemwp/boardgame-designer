'use client';

import { useCallback, useEffect, useState } from 'react';
import { cloneJson, toStoredBootstrap } from '@/lib/library/bootstrap';
import {
  addDraft,
  createDocument,
  deleteDraft,
  getActive,
  listDrafts,
  publishDocument,
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
  NewGameInput,
  StoredBootstrap,
} from '@/lib/library/types';
import { markEditedAfterPublish } from '@/lib/library/version';
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
  const [state, setState] = useState<LibraryState | null>(() => options.initialState ?? null);

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
    (input: NewGameInput) => {
      setState((current) => {
        if (!current) return current;
        let source: GameDocument['source'] = 'empty';
        let bootstrap = toStoredBootstrap(emptyBootstrap());
        if (input.source === 'climb') {
          source = 'climb';
          bootstrap = toStoredBootstrap(climbSample);
        } else if (typeof input.source === 'object') {
          const origin = current.drafts.find((d) => d.id === input.source.copyFrom);
          source = 'copy';
          bootstrap = origin ? cloneJson(origin.bootstrap) : bootstrap;
        }
        const doc = createDocument({
          id: createId(),
          name: input.name.trim(),
          source,
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
    (bootstrap: StoredBootstrap, options?: { touchUpdatedAt?: boolean; bump?: 'none' | 'save' }) => {
      setState((current) => {
        if (!current?.activeId) return current;
        const next = saveDraft(current, current.activeId, bootstrap, now(), {
          touchUpdatedAt: options?.touchUpdatedAt ?? true,
          bump: options?.bump ?? 'none',
        });
        writeLibrary(storage, next);
        return next;
      });
    },
    [now, storage],
  );

  const markActiveEdited = useCallback(() => {
    setState((current) => {
      if (!current?.activeId) return current;
      const active = getActive(current);
      if (!active) return current;
      const edited = markEditedAfterPublish(active);
      if (edited === active) return current;
      const next = {
        ...current,
        drafts: current.drafts.map((d) => (d.id === active.id ? edited : d)),
      };
      writeLibrary(storage, next);
      return next;
    });
  }, [storage]);

  const publishActive = useCallback(() => {
    setState((current) => {
      if (!current?.activeId) return current;
      const active = getActive(current);
      if (!active) return current;
      const published = publishDocument(active, now());
      const next = {
        ...current,
        drafts: current.drafts.map((d) => (d.id === active.id ? published : d)),
      };
      writeLibrary(storage, next);
      return next;
    });
  }, [now, storage]);

  const deleteActive = useCallback(() => {
    setState((current) => {
      if (!current?.activeId) return current;
      const next = deleteDraft(current, current.activeId);
      writeLibrary(storage, next);
      return next;
    });
  }, [storage]);

  return {
    ready: state !== null,
    drafts: state ? listDrafts(state) : ([] as GameDocument[]),
    activeId: state?.activeId ?? null,
    active: state ? getActive(state) : undefined,
    newGame,
    openGame,
    saveActive,
    markActiveEdited,
    publishActive,
    deleteActive,
    persist,
  };
}
