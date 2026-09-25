import { describe, it, expect } from 'vitest';
import { toStoredBootstrap } from '@/lib/library/bootstrap';
import { createDocument, publishDocument, saveDraft } from '@/lib/library/state';
import { emptyBootstrap } from '@/lib/samples/empty';
import {
  bumpMinorVersion,
  formatDesignerChromeTitle,
  formatGameTitle,
  LIBRARY_SAVE_LOCATION,
  markEditedAfterPublish,
} from '@/lib/library/version';
import type { GameDocument, LibraryState } from '@/lib/library/types';

const stored = () => toStoredBootstrap(emptyBootstrap());

function doc(overrides: Partial<GameDocument> = {}): GameDocument {
  return {
    ...createDocument({
      id: 'g1',
      name: 'Sandbox',
      source: 'empty',
      bootstrap: stored(),
      now: '2026-09-22T12:00:00.000Z',
    }),
    ...overrides,
  };
}

describe('formatGameTitle', () => {
  it('shows never-published games as name (draft)', () => {
    expect(formatGameTitle(doc())).toBe('Sandbox (draft)');
  });

  it('shows a published unchanged game as (Published) vN', () => {
    expect(
      formatGameTitle(
        doc({ status: 'published', published: true, version: '1', publishedAt: '2026-09-22T13:00:00.000Z' }),
      ),
    ).toBe('Sandbox (Published) v1');
  });

  it('shows a published-then-edited game as (draft) v1.1', () => {
    expect(formatGameTitle(doc({ status: 'draft', version: '1.1' }))).toBe('Sandbox (draft) v1.1');
  });

  it('returns an empty title when there is no game', () => {
    expect(formatGameTitle(undefined)).toBe('');
  });
});

describe('formatDesignerChromeTitle', () => {
  it('shows the game name and current level without draft or Published', () => {
    expect(formatDesignerChromeTitle('Climb (sample)', 'Lobby')).toBe('Climb (sample) · Lobby');
    expect(formatDesignerChromeTitle('Climb (sample)', 'Lobby', 'Room 1')).toBe(
      'Climb (sample) · Room 1',
    );
    expect(formatDesignerChromeTitle('Sandbox')).toBe('Sandbox');
    expect(formatDesignerChromeTitle(undefined)).toBe('');
    expect(formatDesignerChromeTitle('Climb (sample)', 'Lobby')).not.toMatch(/draft|Published/i);
  });

  it('names the browser localStorage key as the save location', () => {
    expect(LIBRARY_SAVE_LOCATION).toBe('Browser localStorage (building-board.library.v1)');
  });
});

describe('version A', () => {
  it('bumps 1 to 1.1 and 1.1 to 1.2', () => {
    expect(bumpMinorVersion('1')).toBe('1.1');
    expect(bumpMinorVersion('1.1')).toBe('1.2');
    expect(bumpMinorVersion('1.3')).toBe('1.4');
  });

  it('first publish is v1', () => {
    const published = publishDocument(doc(), '2026-09-22T13:00:00.000Z');
    expect(published.status).toBe('published');
    expect(published.published).toBe(true);
    expect(published.version).toBe('1');
    expect(published.publishedAt).toBe('2026-09-22T13:00:00.000Z');
    expect(formatGameTitle(published)).toBe('Sandbox (Published) v1');
  });

  it('first change after publish becomes draft v1.1', () => {
    const published = publishDocument(doc(), '2026-09-22T13:00:00.000Z');
    const edited = markEditedAfterPublish(published);
    expect(edited.status).toBe('draft');
    expect(edited.published).toBe(false);
    expect(edited.version).toBe('1.1');
    expect(formatGameTitle(edited)).toBe('Sandbox (draft) v1.1');
  });

  it('Save or Test while unpublished bumps the minor version', () => {
    const published = publishDocument(doc(), '2026-09-22T13:00:00.000Z');
    const edited = markEditedAfterPublish(published);
    const state: LibraryState = { version: 1, activeId: edited.id, drafts: [edited] };
    const afterSave = saveDraft(state, edited.id, stored(), '2026-09-22T14:00:00.000Z', {
      touchUpdatedAt: true,
      bump: 'save',
    });
    expect(afterSave.drafts[0]?.version).toBe('1.2');
    expect(afterSave.drafts[0]?.status).toBe('draft');
    const afterTest = saveDraft(afterSave, edited.id, stored(), '2026-09-22T15:00:00.000Z', {
      touchUpdatedAt: true,
      bump: 'save',
    });
    expect(afterTest.drafts[0]?.version).toBe('1.3');
    expect(formatGameTitle(afterTest.drafts[0]!)).toBe('Sandbox (draft) v1.3');
  });

  it('next publish keeps the landed version', () => {
    const published = publishDocument(doc({ version: '1.3', status: 'draft' }), '2026-09-22T16:00:00.000Z');
    expect(published.version).toBe('1.3');
    expect(published.status).toBe('published');
    expect(formatGameTitle(published)).toBe('Sandbox (Published) v1.3');
  });

  it('does not bump never-published drafts on save', () => {
    const state: LibraryState = { version: 1, activeId: 'g1', drafts: [doc()] };
    const saved = saveDraft(state, 'g1', stored(), '2026-09-22T14:00:00.000Z', {
      touchUpdatedAt: true,
      bump: 'save',
    });
    expect(saved.drafts[0]?.version).toBeNull();
    expect(saved.drafts[0]?.status).toBe('draft');
    expect(saved.drafts[0]?.lastSaved).toBe('2026-09-22T14:00:00.000Z');
  });
});
