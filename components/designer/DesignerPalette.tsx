'use client';

import { Button } from '@/components/ui/button';

export type DesignerTool = 'select' | 'corridor' | 'stair' | 'erase';

const TOOLS: Array<{ id: DesignerTool; label: string }> = [
  { id: 'select', label: 'Select' },
  { id: 'corridor', label: 'Corridor square' },
  { id: 'stair', label: 'Stair' },
  { id: 'erase', label: 'Erase' },
];

export function DesignerPalette({
  tool,
  onToolChange,
}: {
  tool: DesignerTool;
  onToolChange: (tool: DesignerTool) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="designer-palette">
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
