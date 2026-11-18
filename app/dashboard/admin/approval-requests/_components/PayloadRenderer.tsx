// Recursive viewer that renders any approval request payload as labelled fields, lists and tables.
// Used inside the collapsible "All details" section of the approval details dialog.
// Stacks label above value so it fits the ~500px popup without horizontal scrolling.
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface PayloadRendererProps {
  data: any;
  level?: number;
}

// Convert camelCase or snake_case to clean Title Case
function formatTitle(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function formatDisplayString(value: string): string {
  const trimmed = value.trim();
  if (trimmed === 'GCASH') return 'INSTAPAY';
  if (trimmed.toLowerCase() === 'gcash') return 'InstaPay';
  return value;
}

function tryParseJson(value: string) {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export const PayloadRenderer: React.FC<PayloadRendererProps> = ({ data, level = 0 }) => {
  // Safety fallback for null / undefined
  if (data === null || data === undefined) {
    return <span className="text-muted-foreground italic text-xs">N/A</span>;
  }

  // Parse stringified JSON if passed as string
  if (typeof data === 'string') {
    const parsed = tryParseJson(data);
    if (parsed !== null) {
      return <PayloadRenderer data={parsed} level={level} />;
    }
  }

  // Handle Primitives (Strings, Numbers, Booleans)
  if (typeof data !== 'object') {
    if (typeof data === 'boolean') {
      return (
        <Badge variant={data ? 'default' : 'outline'} className="text-xs shrink-0">
          {data ? 'True' : 'False'}
        </Badge>
      );
    }
    if (typeof data === 'number') {
      return <span className="font-mono text-sm text-foreground whitespace-nowrap">{data.toLocaleString()}</span>;
    }
    return (
      <span className="text-sm text-foreground break-words whitespace-pre-wrap">
        {formatDisplayString(String(data))}
      </span>
    );
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-muted-foreground italic text-xs">Empty List</span>;
    }

    // Check if array items are primitive or object
    const isListOfObjects = typeof data[0] === 'object' && data[0] !== null;

    if (isListOfObjects) {
      const keys = Array.from(new Set(data.flatMap((item) => Object.keys(item || {}))));

      return (
        <div className="overflow-x-auto rounded-md border border-border mt-1 max-w-full">
          <table className="w-full text-xs text-left min-w-[300px]">
            <thead className="bg-muted text-muted-foreground font-medium uppercase border-b border-border">
              <tr>
                {keys.map((k) => (
                  <th key={k} className="px-3 py-2 whitespace-nowrap">
                    {formatTitle(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-2 align-top break-words max-w-[200px]">
                      <PayloadRenderer data={row[k]} level={level + 1} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Simple primitive array
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {data.map((item, idx) => (
          <Badge key={idx} variant="secondary" className="text-xs break-all">
            {formatDisplayString(String(item))}
          </Badge>
        ))}
      </div>
    );
  }

  // Handle Objects
  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== '',
  );
  if (entries.length === 0) {
    return <span className="text-muted-foreground italic text-xs">Empty Object</span>;
  }

  return (
    <div className={`space-y-2 ${level > 0 ? 'pl-2 border-l-2 border-primary/20 my-1' : ''}`}>
      {entries.map(([key, value]) => {
        const isComplex = typeof value === 'object' && value !== null;

        return (
          <div
            key={key}
            className={
              isComplex
                ? 'col-span-full mt-2'
                : 'flex flex-col gap-0.5 py-1 border-b border-border/40 last:border-0'
            }
          >
            <span className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-wider break-words">
              {formatTitle(key)}:
            </span>
            <div className="flex-1 min-w-0 break-words">
              <PayloadRenderer data={value} level={level + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PayloadRenderer;