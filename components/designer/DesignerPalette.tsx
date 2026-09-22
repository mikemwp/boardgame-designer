'use client';

import { Button } from '@/components/ui/button';

export type DesignerTool = 'select' | 'corridor' | 'stair' | 'hud' | 'erase';

const TOOLS: Array<{ id: DesignerTool; label: string }> = [
  { id: 'select', label: 'Select' },
  { id: 'corridor', label: 'Tile' },
  { id: 'hud', label: 'HUD' },
  { id: 'stair', label: 'Stair' },
  { id: 'erase', label: 'Erase' },
];

export function DesignerPalette({
  tool,
  onToolChange,
  className = '',
}: {
  tool: DesignerTool;
  onToolChange: (tool: DesignerTool) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()} data-testid="designer-palette">
      {TOOLS.map((item) => (
        <Button
          key={item.id}
          type="button"
          variant={tool === item.id ? 'secondary' : 'outline'}
          aria-pressed={tool === item.id}
          onClick={() => onToolChange(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
