export interface InventoryItem {
  id: string; // SKU
  name: string;
  category: 'Screws' | 'Bolts' | 'Nuts' | 'Washers' | 'Anchors';
  threadType: 'Coarse' | 'Fine' | 'Metric';
  material: 'Stainless Steel' | 'Zinc Plated' | 'Brass' | 'Nylon';
  size: string; // e.g., "M6-1.0 x 20mm", "1/4-20 x 1""
  currentQuantity: number;
  binLocation: {
    aisle: string;
    shelf: number;
  };
}

export const mockInventory: InventoryItem[] = [
  {
    id: 'SCR-SS-C-001',
    name: 'Phillips Head Screw',
    category: 'Screws',
    threadType: 'Coarse',
    material: 'Stainless Steel',
    size: '#8 x 1 1/4"',
    currentQuantity: 1500,
    binLocation: { aisle: 'A', shelf: 1 },
  },
  {
    id: 'BLT-ZP-F-002',
    name: 'Hex Bolt',
    category: 'Bolts',
    threadType: 'Fine',
    material: 'Zinc Plated',
    size: '1/2-20 x 2"',
    currentQuantity: 750,
    binLocation: { aisle: 'B', shelf: 3 },
  },
  {
    id: 'NUT-BR-M-003',
    name: 'Hex Nut',
    category: 'Nuts',
    threadType: 'Metric',
    material: 'Brass',
    size: 'M8-1.25',
    currentQuantity: 3000,
    binLocation: { aisle: 'C', shelf: 2 },
  },
  {
    id: 'WSH-NY-C-004',
    name: 'Flat Washer',
    category: 'Washers',
    threadType: 'Coarse',
    material: 'Nylon',
    size: '1/4"',
    currentQuantity: 5000,
    binLocation: { aisle: 'A', shelf: 4 },
  },
  {
    id: 'ANC-ZP-C-005',
    name: 'Wedge Anchor',
    category: 'Anchors',
    threadType: 'Coarse',
    material: 'Zinc Plated',
    size: '3/8" x 3"',
    currentQuantity: 400,
    binLocation: { aisle: 'D', shelf: 1 },
  },
  {
    id: 'SCR-BR-F-006',
    name: 'Slotted Set Screw',
    category: 'Screws',
    threadType: 'Fine',
    material: 'Brass',
    size: '10-32 x 1/2"',
    currentQuantity: 800,
    binLocation: { aisle: 'A', shelf: 2 },
  },
  {
    id: 'BLT-SS-M-007',
    name: 'Carriage Bolt',
    category: 'Bolts',
    threadType: 'Metric',
    material: 'Stainless Steel',
    size: 'M10-1.5 x 40mm',
    currentQuantity: 600,
    binLocation: { aisle: 'B', shelf: 1 },
  },
  {
    id: 'NUT-ZP-C-008',
    name: 'Wing Nut',
    category: 'Nuts',
    threadType: 'Coarse',
    material: 'Zinc Plated',
    size: '1/4-20',
    currentQuantity: 2500,
    binLocation: { aisle: 'C', shelf: 5 },
  },
  {
    id: 'WSH-SS-F-009',
    name: 'Lock Washer',
    category: 'Washers',
    threadType: 'Fine',
    material: 'Stainless Steel',
    size: '3/8"',
    currentQuantity: 4000,
    binLocation: { aisle: 'A', shelf: 5 },
  },
  {
    id: 'SCR-NY-M-010',
    name: 'Pan Head Machine Screw',
    category: 'Screws',
    threadType: 'Metric',
    material: 'Nylon',
    size: 'M4-0.7 x 12mm',
    currentQuantity: 1200,
    binLocation: { aisle: 'A', shelf: 3 },
  },
];
