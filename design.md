---
name: Industrial Hardware POS
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#414751'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#727783'
  outline-variant: '#c1c6d3'
  surface-tint: '#005fb0'
  primary: '#004888'
  on-primary: '#ffffff'
  primary-container: '#0060b2'
  on-primary-container: '#c8dcff'
  inverse-primary: '#a6c8ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#674000'
  on-tertiary: '#ffffff'
  tertiary-container: '#875500'
  on-tertiary-container: '#ffd4a2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a6c8ff'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#004786'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 30px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-tabular:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-badge:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  label-shortcut:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.375rem
  space-md: 0.625rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is tailored for fast-paced, high-throughput industrial hardware supply, trade counter, and POS terminal environments. The user base consists of trade counter staff, warehouse dispatchers, and cashiers managing massive SKU catalogs—bolts, fasteners, nuts, threaded rods, and industrial consumables—under high pressure. 

The aesthetic is precision-engineered, utilitarian, and unapologetically robust. It borrows structural clarity from industrial equipment panels and technical blueprints: crisp 1px mechanical dividers, monospaced tabular alignments, dense keyboard-driven workflows, and authoritative contrast. Every millisecond counts; the system prioritizes scan speed, tactile feedback, and instantaneous transaction flow over decorative whitespace.

## Colors

The palette establishes an industrial, high-visibility hierarchy:
- **Primary (`#0060B2`)**: Direct match to the brand's cobalt blue. Used for high-priority operational buttons, active invoice selections, focus rings, key transaction indicators, and header status strips.
- **Secondary (`#0F172A`)**: High-contrast dark slate. Serves as the primary typography color and structural frame color for technical headers, ensuring immediate optical scan-rates under fluorescent warehouse lighting.
- **Tertiary (`#F59E0B`)**: Industrial warning amber. Reserved for stock alerts, pending approvals, credit holds, and system notifications.
- **Surfaces & Borders**: Backgrounds rely on muted slates (`#F8FAFC`, `#F1F5F9`) with crisp white (`#FFFFFF`) card containers and data grids. Structural divisions use exact 1px borders in light slate (`#E2E8F0` and `#CBD5E1`), establishing clear mechanical boundaries without muddying the visual field.

## Typography

Typography is split by utilitarian function:
- **Headlines (`Space Grotesk`)**: Technical, squared geometric curves mirroring machined fasteners and the brand logo mark. Headings convey weight and structural certainty.
- **Body (`Inter`)**: Maximum legibility at small sizes (12px–14px), neutral proportions, and high x-height for clear reading of item descriptions (e.g., `HEX BOLT M12 x 1.75 x 50 ZP 8.8`).
- **Data & Badges (`JetBrains Mono`)**: Applied to all SKU codes, barcodes, quantities, prices, total calculations, and keyboard shortcut tokens (`[F1]`, `[ENTER]`). Numbers remain strictly tabular to avoid layout shifting across fast real-time tally changes.

## Layout & Spacing

This layout uses a high-density, fixed-pane workspace model optimized for standard 1080p and touch POS displays (e.g., 1920x1080 and 1366x768 screens). 

- **Grid Architecture**: Split screen with a fixed 3-zone split: 
  - Left panel (60% width): Rapid item search, barcode input, catalog drill-down, and quick-pick fastener grids.
  - Right panel (40% width): Live cart ledger, running order breakdown, discount modifiers, and payment tender trigger.
  - Bottom command bar: 48px fixed bar displaying global function keys (`[F2] Search`, `[F8] Hold`, `[F12] Checkout`).
- **Density Density**: Dense vertical cadence (28px to 36px table row heights) ensures up to 18 order lines are visible simultaneously without vertical scrolling.
- **Gaps & Margins**: Minimal gaps (0.25rem to 0.625rem) preserve optical unity, preventing fragmented layouts.

## Elevation & Depth

Visual hierarchy is maintained almost entirely through **low-contrast outlines, high-contrast borders, and tonal zoning** rather than drop shadows:
- **Zero/Flat Elevation (Level 0)**: Canvas panels, table headers, and layout panes sit flush on `#F8FAFC` and `#FFFFFF`, divided by clean `1px solid #E2E8F0` seams.
- **Focused & Interactive Elevation (Level 1)**: Modals, quick-search dropdowns, and tender overlays use sharp 1px borders (`#0F172A`) paired with a tight industrial shadow: `0px 4px 0px rgba(15, 23, 42, 0.08)`.
- **Keyboard Focus**: A vibrant, high-contrast 2px double outline in `#0060B2` highlights active table rows or input fields instantly without blurring edges.

## Shapes

The shape system is strictly **Soft/Industrial (Level 1)**. 
- Elements default to `2px` or `4px` corner radii (`0.25rem`), reflecting machined steel edges, stamped metal tags, and blueprint drafting blocks.
- Pills and heavy rounding are avoided to preserve grid compactness and ensure maximum clickable/tappable surface area on POS touchscreens.
- Key shortcut badges and status tags feature sharp 2px chamfer-style corners.

## Components

### Buttons
- **Primary (Tender/Pay)**: Solid `#0060B2` background, crisp `#FFFFFF` text, `4px` radius, bold uppercase font, with an embedded monospaced shortcut tag (`[F12]`) on the right edge.
- **Secondary (Actions/Hold)**: `#F1F5F9` surface with `#0F172A` text and a `1px solid #CBD5E1` border.
- **Destructive (Void/Cancel)**: Tinted light red surface (`#FEF2F2`), `#DC2626` text, with a `1px solid #F87171` outline.

### Data Tables (Line Item Register)
- Header in `#F1F5F9` with uppercase 11px `JetBrains Mono` text in `#475569`.
- Row height: Fixed `32px` for ultra-dense data scanning. Alternating rows use subtle `#F8FAFC` striping.
- Active row: `#E0F2FE` background with a prominent `2px solid #0060B2` left border accent.
- Numeric columns (Qty, Unit Price, Total) aligned strictly right in tabular numbers.

### Input Fields (SKU & Barcode Entry)
- Compact `32px` to `36px` height, `#FFFFFF` fill, `1px solid #CBD5E1` border, `4px` radius.
- Leading icon or visual cue (e.g., barcode scan icon), trailing keyboard hotkey indicator badge (`Enter ↵`).
- High-contrast focus state: `1px solid #0060B2` with a `2px` soft blue outer ring.

### Keyboard Shortcut Badges
- Small inline tags with a light slate fill (`#E2E8F0`), `#0F172A` monospaced text, `2px` border radius, and a `1px solid #CBD5E1` border to mimic physical keyboard caps.

### Cards & Summary Panels
- Background `#FFFFFF`, bordered with `1px solid #E2E8F0`.
- Split into a dense header section (`#F8FAFC`, bordered bottom) and total calculation summary with large tabular amounts in `#0060B2`.