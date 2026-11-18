// lib/sort-items.ts
import { SortKey } from "@/components/ui/sort-select";

export interface SortAccessors<T> {
  getName?: (item: T) => string;
  getStock?: (item: T) => number;
  getRetail?: (item: T) => number;
  getCost?: (item: T) => number;
  getDate?: (item: T) => string | number | Date;
  getId?: (item: T) => number;
}

export function sortItems<T>(
  items: readonly T[],
  sortKey: SortKey,
  accessors: SortAccessors<T>,
): T[] {
  if (sortKey === "DEFAULT") return [...items];

  const copy = [...items];

  copy.sort((a, b) => {
    switch (sortKey) {
      case "NAME_ASC":
        return (accessors.getName?.(a) ?? "").localeCompare(
          accessors.getName?.(b) ?? "",
          undefined,
          { sensitivity: "base" },
        );
      case "NAME_DESC":
        return (accessors.getName?.(b) ?? "").localeCompare(
          accessors.getName?.(a) ?? "",
          undefined,
          { sensitivity: "base" },
        );
      case "STOCK_ASC":
        return (accessors.getStock?.(a) ?? 0) - (accessors.getStock?.(b) ?? 0);
      case "STOCK_DESC":
        return (accessors.getStock?.(b) ?? 0) - (accessors.getStock?.(a) ?? 0);
      case "RETAIL_ASC":
        return (
          (accessors.getRetail?.(a) ?? 0) - (accessors.getRetail?.(b) ?? 0)
        );
      case "RETAIL_DESC":
        return (
          (accessors.getRetail?.(b) ?? 0) - (accessors.getRetail?.(a) ?? 0)
        );
      case "COST_ASC":
        return (accessors.getCost?.(a) ?? 0) - (accessors.getCost?.(b) ?? 0);
      case "COST_DESC":
        return (accessors.getCost?.(b) ?? 0) - (accessors.getCost?.(a) ?? 0);
      case "DATE_ASC":
        return (
          new Date(accessors.getDate?.(a) ?? 0).getTime() -
          new Date(accessors.getDate?.(b) ?? 0).getTime()
        );
      case "DATE_DESC":
        return (
          new Date(accessors.getDate?.(b) ?? 0).getTime() -
          new Date(accessors.getDate?.(a) ?? 0).getTime()
        );
      case "ID_ASC":
        return (accessors.getId?.(a) ?? 0) - (accessors.getId?.(b) ?? 0);
      case "ID_DESC":
        return (accessors.getId?.(b) ?? 0) - (accessors.getId?.(a) ?? 0);
      default:
        return 0;
    }
  });

  return copy;
}