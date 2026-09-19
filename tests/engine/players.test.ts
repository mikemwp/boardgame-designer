import { describe, it, expect } from 'vitest';
import { createPlayerState, addPlayer, requireMinPlayers } from '@/lib/engine/players';

describe('players', () => {
  it('allows a single player', () => {
    const s = addPlayer(createPlayerState(), { id: 'p1', name: 'A', token: { floorId: 'f0', cellId: 'c0' } });
    expect(requireMinPlayers(s, 1)).toBe(true);
  });

  it('allows many players without engine cap', () => {
    let s = createPlayerState();
    for (let i = 0; i < 12; i++) {
      s = addPlayer(s, { id: `p${i}`, name: `P${i}`, token: { floorId: 'f0', cellId: 'c0' } });
    }
    expect(s.players).toHaveLength(12);
  });
});
