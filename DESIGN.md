---
version: alpha
name: Miew Design System
description: Visual identity tokens, UI architecture, component conventions, and responsive guidelines for Miew 3D molecular visualization applications.
colors:
  primary: "#337ab7"
  secondary: "#6c757d"
  surface: "#404040"
  surface-canvas: "#202020"
  on-surface: "#eeeeee"
  on-primary: "#ffffff"
  text-primary: "#eeeeee"
  text-secondary: "#c0c0c0"
  text-muted: "#888888"
  border: "#555555"
  terminal-bg: "#202020"
  accent: "#5bc0de"
  success: "#5cb85c"
  warning: "#f0ad4e"
  danger: "#c9302c"
typography:
  headline-lg:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.2
  headline-md:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.3
  headline-sm:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
  body-md:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  label-code:
    fontFamily: "Menlo, Monaco, Consolas, Courier New, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
rounded:
  none: 0px
  sm: 2px
  md: 4px
  lg: 8px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  titlebar-height: 40px
  panel-row-height: 42px
components:
  viewport-canvas:
    backgroundColor: "{colors.surface-canvas}"
    textColor: "{colors.text-primary}"
  panel-glass:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 12px
  panel-muted:
    textColor: "{colors.text-muted}"
  panel-divider:
    backgroundColor: "{colors.border}"
  titlebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    height: 40px
  terminal:
    backgroundColor: "{colors.terminal-bg}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 8px
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: 8px
  badge-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface-canvas}"
    rounded: "{rounded.full}"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.surface-canvas}"
    rounded: "{rounded.full}"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.surface-canvas}"
    rounded: "{rounded.full}"
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
---

# Miew Design System

Design conventions, UI architecture, and styling rules for Miew frontend applications.

## Overview & Scope

- **`packages/miew-app`**: The primary modern React 19 application. It replaces the legacy demo (`packages/miew/demo/`) and is the active target for all UI enhancements.
- **`packages/miew-react`**: Thin, unstyled React wrapper component ensuring clean encapsulation of the WebGL canvas.
- **`packages/miew` (core)**: Minimal UI overlays (terminal, info toast, tooltip picking) styled via standalone SCSS in `packages/miew/src/Miew.scss`.

## Colors

The color palette is optimized for high-contrast viewing against dark 3D molecular visualization scenes:

- **Surface & Canvas**: The 3D viewport canvas uses a default deep background (`#202020`), with semi-transparent dark gray glass overlays (`#404040` at 75% alpha) for toolbars, drawers, and menus.
- **Primary & Actions**: A focused blue (`#337ab7`) designates primary user interactions, active modes, and selections.
- **Text & Contrast**: High-contrast light text (`#eeeeee`) on dark backgrounds meets WCAG AA readability for all labels and data readouts. Secondary information uses subdued silver (`#c0c0c0`).

## Typography

Typography prioritizes legibility on dense scientific control surfaces:

- **Headlines & Titles**: Set in clean sans-serif (`Helvetica Neue`, Arial, sans-serif) with bold weights (600–700) for structural hierarchy.
- **Body & Labels**: 14px sans-serif at normal weight (400) for control labels, dropdown items, and tooltips.
- **Monospace / Terminal**: Monospace font family for command-line inputs, residue sequence readouts, and raw PDB/mmCIF metadata inspection.

## Layout & Spacing

Layouts follow a fluid, responsive structure centered around the full-bleed WebGL viewport:

- **HUD Overlays**: Controls float above the 3D canvas in docked bars, drawers, and modal panels.
- **Touch-Friendly Heights**: Interactive toolbars and list rows maintain standard minimum touch targets (40px titlebar height, 42px list row height).
- **Spacing Scale**: Consistent multiples of 4px and 8px (`xs: 4px`, `sm: 8px`, `md: 16px`, `lg: 24px`, `xl: 32px`).

## Elevation & Depth

Visual depth is achieved through layered transparency rather than opaque shadows:

- **Glassmorphism Panels**: Floating HUD surfaces use semi-transparent dark backgrounds with subtle border lines (`#555555`) to maintain spatial awareness of the underlying 3D molecule.
- **Modal Dialogs**: Deep backdrop dimming focuses attention on structure loading and complex configuration dialogs.

## Shapes

- **Corner Radii**: Clean, technical corner rounding (`4px` default radius) for floating panels, buttons, toasts, and inputs.
- **Pills & Badges**: Fully rounded borders (`9999px`) for quick-filter chips and status badges.

## Components & UI Architecture (`miew-app`)

- **Component Library**: React-Bootstrap (Bootstrap 4 components) enhanced with custom SCSS modules.
- **Styling Architecture**: SCSS Modules (`<Component>.module.scss`) for component-specific styles to avoid global namespace collisions.
- **Icons**: `react-icons` for standard iconography (navigation, view modes, playback controls).

## Mobile & Responsive Principles (Mandatory)

1. **Touch Support**: All interactive viewer controls must respond gracefully to both touch gestures (pinch-to-zoom, two-finger pan, one-finger rotate) and mouse events.
2. **Responsive Layouts**: Controls, modals, toolbars, and menus must dynamically adjust to varying screen sizes, including tablets and mobile phones.
3. **Collapsible HUD**: On small viewports, secondary control panels and terminal windows should collapse or dock into compact drawers so the molecular visualization remains unobstructed.
4. **Performance on Mobile**: Keep DOM overlays lightweight to avoid layout thrashing that could drop WebGL framerates below 60 FPS.

## Do's and Don'ts

- **Do** keep floating UI panels semi-transparent to preserve 3D canvas visibility.
- **Do** provide touch-friendly tap targets (minimum 40px height) for mobile controls.
- **Do** use SCSS Modules for all new components in `packages/miew-app`.
- **Do** dispose and decouple Three.js resources cleanly when switching representations.
- **Don't** import React or application-level state into the core `packages/miew` library.
- **Don't** create opaque full-screen overlays that unnecessarily block the molecular view during interaction.
