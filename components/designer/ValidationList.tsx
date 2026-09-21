'use client';

import type { LayoutIssue } from '@/lib/designer/validate';

export function ValidationList({ issues }: { issues: LayoutIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div
      className="rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-100"
      data-testid="layout-issues"
    >
      <p className="font-medium">Test is blocked</p>
      <ul className="mt-2 list-disc pl-5">
        {issues.map((issue, i) => (
          <li key={`${issue.code}-${issue.cellId ?? issue.floorId ?? i}`}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
