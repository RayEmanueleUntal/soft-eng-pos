'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
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

export const PayloadRenderer: React.FC<PayloadRendererProps> = ({ data, level = 0 }) => {
  // Safety fallback for null / undefined
  if (data === null || data === undefined) {
    return <span className="text-muted-foreground italic text-xs">N/A</span>;
  }

  // Handle Primitives (Strings, Numbers, Booleans)
  if (typeof data !== 'object') {
    if (typeof data === 'boolean') {
      return (
        <Badge variant={data ? 'default' : 'outline'} className="text-xs">
          {data ? 'True' : 'False'}
        </Badge>
      );
    }
    if (typeof data === 'number') {
      return <span className="font-mono text-sm text-foreground">{data.toLocaleString()}</span>;
    }
    return <span className="text-sm text-foreground break-all">{String(data)}</span>;
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
        <div className="overflow-x-auto rounded-md border border-border mt-1">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-muted-foreground font-medium uppercase border-b border-border">
              <tr>
                {keys.map((k) => (
                  <th key={k} className="px-3 py-2">
                    {formatTitle(k)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                  {keys.map((k) => (
                    <td key={k} className="px-3 py-2 align-top">
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
          <Badge key={idx} variant="secondary" className="text-xs">
            {String(item)}
          </Badge>
        ))}
      </div>
    );
  }

  // Handle Objects
  const entries = Object.entries(data);
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
                : 'flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-border/40 last:border-0'
            }
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px]">
              {formatTitle(key)}:
            </span>
            <div className="flex-1">
              <PayloadRenderer data={value} level={level + 1} />
            </div>
          </div>
        );
      })}
    </div>
  );
};