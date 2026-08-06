# Design Tokens Reference Guide

Quick reference for GreenChillyz Dashboard design system.

---

## Colors

### Primary
```css
--color-primary: #006b2a          /* Brand Green */
--color-primary-hover: #005a23    /* Darker on hover */
--color-primary-light: #e6f4ec    /* Light backgrounds */
```

### Neutrals
```css
--color-gray-50: #fafafa    /* Lightest */
--color-gray-100: #f5f5f5
--color-gray-200: #e5e5e5   /* Default border */
--color-gray-300: #d4d4d4
--color-gray-400: #a3a3a3
--color-gray-500: #737373   /* Muted text */
--color-gray-600: #525252   /* Secondary text */
--color-gray-700: #404040
--color-gray-800: #262626
--color-gray-900: #171717   /* Darkest text */
```

### Accent
```css
--color-beige: #f5f1e8        /* Brand panel backgrounds */
--color-error: #dc2626        /* Error/destructive actions */
--color-error-light: #fee2e2  /* Error backgrounds */
```

---

## Semantic Variables

### Backgrounds
```css
--background: #ffffff             /* Page background */
--background-secondary: #fafafa   /* Subtle contrast */
--surface: #ffffff                /* Card background */
--surface-hover: #f5f5f5         /* Hover states */
```

### Borders
```css
--border: #e5e5e5            /* Default borders */
--border-light: #f5f5f5      /* Subtle dividers */
--border-focus: #006b2a      /* Focus rings */
```

### Text
```css
--foreground: #171717        /* Primary text */
--text-secondary: #525252    /* Secondary text */
--text-muted: #737373        /* Muted/helper text */
```

### Forms
```css
--input-bg: #ffffff          /* Input background */
--input-border: #e5e5e5      /* Input border */
--input-focus: #006b2a       /* Focused input */
```

---

## Border Radius

```css
--radius-sm: 0.375rem;    /* 6px  - Inputs, small buttons */
--radius-DEFAULT: 0.5rem; /* 8px  - Cards, containers */
--radius-md: 0.625rem;    /* 10px - Dialogs, modals */
--radius-lg: 0.75rem;     /* 12px - Large panels */
```

**Usage Examples**:
- Button: `rounded-lg` (8px)
- Input: `rounded-md` (6px)
- Card: `rounded-lg` (8px)
- Modal: `rounded-xl` (10px)

---

## Shadows

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)
--shadow-DEFAULT: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)
```

**Usage**:
- Cards: `shadow-sm`
- Dropdowns: `shadow-md`
- Modals: `shadow-lg`
- Buttons: `shadow-xs` (optional)

---

## Typography

### Fonts
```css
--font-sans: Manrope     /* Body text */
--font-heading: Anton    /* Headings */
```

### Sizes (Tailwind)
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)

### Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

## Spacing Scale

```
1 = 0.25rem (4px)
2 = 0.5rem (8px)
3 = 0.75rem (12px)
4 = 1rem (16px)
6 = 1.5rem (24px)
8 = 2rem (32px)
```

**Common Patterns**:
- Button padding: `px-4 py-2` (16px x 8px)
- Card padding: `p-6` (24px)
- Section gaps: `gap-6` (24px)
- Page padding: `p-8` (32px desktop)

---

## Component Patterns

### Button
```tsx
<button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg shadow-sm hover:bg-[var(--color-primary-hover)] transition-colors">
  Click me
</button>
```

### Card
```tsx
<div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 shadow-sm">
  Card content
</div>
```

### Input
```tsx
<input 
  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md focus:border-[var(--input-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
  type="text"
/>
```

---

## Quick Copy-Paste

### Primary Button
```
bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors
```

### Secondary Button
```
bg-[var(--surface-hover)] text-[var(--foreground)] px-4 py-2 rounded-lg hover:bg-[var(--border)] transition-colors
```

### Card Container
```
bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 shadow-sm
```

### Section Container
```
max-w-7xl mx-auto p-8 flex flex-col gap-6
```

---

## Accessibility

### Focus Ring
```css
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

### Input Focus
```css
input:focus-visible {
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px rgba(0, 107, 42, 0.1);
}
```

---

## Animation

### Transitions
```css
/* Interactive elements */
transition-property: background-color, border-color, color, box-shadow;
transition-duration: 150ms;
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
```

### Utility Classes
```css
.animate-fade-in   /* 200ms fade in */
.animate-slide-in  /* 300ms slide from left */
```

---

## Responsive Breakpoints

```
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

---

**Last Updated**: August 6, 2026  
**Phase**: 1 - Foundation Complete
