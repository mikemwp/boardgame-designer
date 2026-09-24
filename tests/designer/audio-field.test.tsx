import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AudioField } from '@/components/designer/AudioField';
import { memoryMediaStore } from '@/lib/library/media-store';

describe('AudioField', () => {
  it('shows empty copy and commits a URL on blur', () => {
    const onChange = vi.fn();
    render(
      <AudioField
        gameId="g1"
        media={memoryMediaStore()}
        onChange={onChange}
        idPrefix="tile-audio"
      />,
    );
    expect(screen.getByText('Audio')).toBeDefined();
    expect(screen.getByText('No audio. Paste a URL or choose a file.')).toBeDefined();
    const url = screen.getByPlaceholderText('https://…');
    fireEvent.change(url, { target: { value: 'https://example.com/land.mp3' } });
    fireEvent.blur(url);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'url',
        src: 'https://example.com/land.mp3',
        name: 'example.com/land.mp3',
      }),
    );
  });

  it('rejects a non-audio file mime', async () => {
    const onChange = vi.fn();
    render(
      <AudioField
        gameId="g1"
        media={memoryMediaStore()}
        onChange={onChange}
        idPrefix="tile-audio"
      />,
    );
    const file = new File(['x'], 'notes.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Choose file'), { target: { files: [file] } });
    expect(await screen.findByText('Use an MP3, WAV, OGG, M4A, or WEBM file.')).toBeDefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows Play and Clear when a clip is set', () => {
    render(
      <AudioField
        value={{ id: 'a1', name: 'land.mp3', source: 'url', src: 'https://ex/land.mp3' }}
        gameId="g1"
        media={memoryMediaStore()}
        onChange={() => {}}
        idPrefix="tile-audio"
      />,
    );
    expect(screen.getByText('land.mp3')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDefined();
    expect(screen.getByTestId('audio-preview')).toBeDefined();
  });
});
