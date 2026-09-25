import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ImportExportPanel } from '@/components/designer/ImportExportPanel';

describe('ImportExportPanel', () => {
  it('offers CSV card import plus JSON/zip game export and import', () => {
    const onImportCards = vi.fn();
    const onExportJson = vi.fn();
    const onExportZip = vi.fn();
    const onImportGame = vi.fn();
    render(
      <ImportExportPanel
        onImportCards={onImportCards}
        onExportJson={onExportJson}
        onExportZip={onExportZip}
        onImportGame={onImportGame}
      />,
    );
    expect(screen.getByTestId('imports-panel')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Import cards' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export zip' }));
    expect(onExportJson).toHaveBeenCalled();
    expect(onExportZip).toHaveBeenCalled();
    const file = new File(['{}'], 'game.json', { type: 'application/json' });
    fireEvent.change(screen.getByLabelText('Import game file'), { target: { files: [file] } });
    expect(onImportGame).toHaveBeenCalledWith(file);
    fireEvent.click(screen.getByRole('button', { name: 'Import cards' }));
    expect(screen.getByText('Upload a CSV with header row. Required columns: pack, title.')).toBeDefined();
  });
});
