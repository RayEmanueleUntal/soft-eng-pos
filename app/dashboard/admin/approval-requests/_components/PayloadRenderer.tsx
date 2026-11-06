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
    return <span className="text-sm text-foreground break-words whitespace-pre-wrap">{String(data)}</span>;
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

  // Check if data is or contains paymentBreakdown at root
  const paymentBreakdown = data.paymentBreakdown || data.payment_breakdown;

  return (
    <div className={`space-y-2 ${level > 0 ? 'pl-2 border-l-2 border-primary/20 my-1' : ''}`}>
      {/* Explicit Payment Breakdown Card if present at top level */}
      {paymentBreakdown && level === 0 && (
        <div className="mb-4 rounded-md border border-amber-300/60 bg-amber-500/10 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-amber-500/20">
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400">
              Payment Breakdown
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-800 dark:text-amber-300">
              Pre-computed
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded bg-background/80 border border-border">
              <span className="text-[11px] text-muted-foreground block font-medium">Credit Debt Cancellation</span>
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                ₱{Number(paymentBreakdown.creditDebtCancellation ?? paymentBreakdown.credit_debt_cancellation ?? paymentBreakdown.credit ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2.5 rounded bg-background/80 border border-border">
              <span className="text-[11px] text-muted-foreground block font-medium">Cash Payout</span>
              <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                ₱{Number(paymentBreakdown.cashPayout ?? paymentBreakdown.cash_payout ?? paymentBreakdown.cash ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {(paymentBreakdown.totalRefund !== undefined || paymentBreakdown.total_refund !== undefined) && (
            <div className="flex justify-between items-center pt-1 border-t border-amber-500/20 text-xs">
              <span className="text-muted-foreground font-medium">Total Refund:</span>
              <span className="font-mono font-bold text-foreground tabular-nums">
                ₱{Number(paymentBreakdown.totalRefund ?? paymentBreakdown.total_refund ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}
      {entries.map(([key, value]) => {
        const isComplex = typeof value === 'object' && value !== null;

        return (
          <div
            key={key}
            className={
              isComplex
                ? 'col-span-full mt-2'
                : 'flex flex-col sm:flex-row sm:items-start justify-between gap-1 py-1 border-b border-border/40 last:border-0'
            }
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[130px] shrink-0 break-all pt-0.5">
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