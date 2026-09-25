import type { SpinnerTemplateId } from '@/lib/engine/types';

export interface SpinnerTemplate {
  id: SpinnerTemplateId;
  label: string;
  durationMs: number;
  easing: string;
}

export const SPINNER_TEMPLATES: SpinnerTemplate[] = [
  { id: 'classic', label: 'Classic', durationMs: 1400, easing: 'cubic-bezier(0.12, 0.7, 0.2, 1)' },
  { id: 'wood', label: 'Wood', durationMs: 1800, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  { id: 'neon', label: 'Neon', durationMs: 1100, easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' },
  { id: 'compass', label: 'Compass', durationMs: 1600, easing: 'cubic-bezier(0.15, 0.7, 0.25, 1)' },
];

export function spinnerTemplateOf(id?: SpinnerTemplateId): SpinnerTemplate {
  return SPINNER_TEMPLATES.find((entry) => entry.id === id) ?? SPINNER_TEMPLATES[0]!;
}
