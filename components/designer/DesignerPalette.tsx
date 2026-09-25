'use client';

import { Button } from '@/components/ui/button';

export type DesignerTool = 'select' | 'corridor' | 'room' | 'stair' | 'hud' | 'board' | 'door' | 'erase';

const TOOLS: Array<{ id: DesignerTool; label: string }> = [
  { id: 'select', label: 'Select' },
  { id: 'corridor', label: 'Tile' },
  { id: 'hud', label: 'HUD' },
  { id: 'board', label: 'Board' },
  { id: 'stair', label: 'Stair' },
  { id: 'room', label: 'Room' },
  { id: 'door', label: 'Door' },
];

export function DesignerPalette({
  tool,
  onToolChange,
  viewingRoom = false,
  onFill,
  onClear,
  clearDisabled = false,
  className = '',
  onSetStart,
  onSetEnd,
  isStart = false,
  isEnd = false,
  startDisabled = true,
  endDisabled = true,
}: {
  tool: DesignerTool;
  onToolChange: (tool: DesignerTool) => void;
  viewingRoom?: boolean;
  onFill?: () => void;
  onClear?: () => void;
  clearDisabled?: boolean;
  className?: string;
  onSetStart?: () => void;
  onSetEnd?: () => void;
  isStart?: boolean;
  isEnd?: boolean;
  startDisabled?: boolean;
  endDisabled?: boolean;
}) {
  const disabled = (id: DesignerTool) => {
    if (id === 'stair' || id === 'room') return viewingRoom;
    if (id === 'door') return !viewingRoom;
    return false;
  };

  return (
    <div className={`flex flex-nowrap gap-2 ${className}`.trim()} data-testid="designer-palette">
      {TOOLS.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={tool === item.id ? 'secondary' : 'outline'}
          aria-pressed={tool === item.id}
          disabled={disabled(item.id)}
          onClick={() => onToolChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
      <Button
        type="button"
        variant={isStart ? 'secondary' : 'outline'}
        disabled={startDisabled}
        onClick={() => onSetStart?.()}
      >
        Start tile
      </Button>
      <Button
        type="button"
        variant={isEnd ? 'secondary' : 'outline'}
        disabled={endDisabled}
        onClick={() => onSetEnd?.()}
      >
        End tile
      </Button>
      <Button type="button" variant="outline" onClick={() => onFill?.()}>
        Fill
      </Button>
      <Button
        type="button"
        variant={tool === 'erase' ? 'secondary' : 'outline'}
        aria-pressed={tool === 'erase'}
        onClick={() => onToolChange('erase')}
      >
        Erase
      </Button>
      <Button type="button" variant="outline" disabled={clearDisabled} onClick={() => onClear?.()}>
        Clear
      </Button>
    </div>
  );
}
