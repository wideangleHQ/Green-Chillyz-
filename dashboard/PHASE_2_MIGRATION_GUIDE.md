# Phase 2 Migration Guide

Guide for updating existing code to work with Phase 2 component changes.

---

## Breaking Changes Overview

Phase 2 introduces **2 breaking changes**:

1. ✅ Button default width changed from full-width to auto-width
2. ✅ ThemeSelector component removed

---

## 1. Button Width Changes

### What Changed

**Before Phase 2**: All buttons were full-width by default  
**After Phase 2**: Buttons are auto-width by default (use `fullWidth` prop for full-width)

### Why?

- More flexible button sizing
- Better alignment with enterprise UIs (Stripe, Linear, Vercel)
- Explicit control over button width
- Follows shadcn/ui conventions

### Migration Steps

#### Step 1: Find All Button Usages

Search your codebase for `<Button` components:

```bash
# Windows (CMD)
findstr /s /i "<Button" *.tsx *.jsx

# Or use your IDE's find feature
# Search for: <Button
```

#### Step 2: Update Buttons That Need Full Width

**Before**:
```tsx
<Button variant="primary">Submit Form</Button>
// Was full-width automatically
```

**After**:
```tsx
<Button variant="primary" fullWidth>Submit Form</Button>
// Explicitly full-width
```

#### Step 3: Common Patterns

**Form Submit Buttons** (usually full-width):
```tsx
// Before
<Button type="submit" variant="primary">
  Sign In
</Button>

// After
<Button type="submit" variant="primary" fullWidth>
  Sign In
</Button>
```

**Inline Action Buttons** (usually auto-width):
```tsx
// Before & After (no change needed)
<Button variant="secondary" size="sm">
  Cancel
</Button>
```

**Mobile Full-Width, Desktop Auto-Width**:
```tsx
// Use Tailwind responsive classes
<Button variant="primary" className="w-full md:w-auto">
  Save Changes
</Button>
```

### Testing

After migration:

1. ✅ Check all forms - submit buttons should be full-width
2. ✅ Check toolbars - action buttons should be auto-width
3. ✅ Check mobile views - buttons should adapt properly
4. ✅ Check button groups - buttons should align correctly

---

## 2. ThemeSelector Removal

### What Changed

**Before Phase 2**: ThemeSelector component existed for Light/Dark/System theme switching  
**After Phase 2**: ThemeSelector removed - dashboard is permanently Light Mode

### Why?

- Simplified codebase (removed next-themes dependency)
- Faster rendering (no theme detection overhead)
- Cleaner UI (no theme switcher cluttering interface)
- Dashboard is enterprise tool - Light Mode is standard

### Migration Steps

#### Step 1: Find ThemeSelector Usages

Search your codebase:

```bash
# Windows (CMD)
findstr /s /i "ThemeSelector" *.tsx *.jsx

# Or use your IDE's find feature
# Search for: ThemeSelector
```

#### Step 2: Remove Imports

**Before**:
```tsx
import { ThemeSelector } from '@/components/ui/ThemeSelector';
```

**After**:
```tsx
// Remove this import completely
```

#### Step 3: Remove JSX Usage

**Before (Login Page)**:
```tsx
<div className="absolute top-6 right-6 z-50">
  <ThemeSelector />
</div>
```

**After**:
```tsx
// Remove this entire div
```

**Before (Dashboard Header)**:
```tsx
<div className="flex items-center gap-4">
  <UserMenu />
  <ThemeSelector />
</div>
```

**After**:
```tsx
<div className="flex items-center gap-4">
  <UserMenu />
  {/* ThemeSelector removed */}
</div>
```

#### Step 4: Clean Up Layouts

If you have empty space where ThemeSelector was, adjust spacing:

```tsx
// Before
<header className="flex items-center justify-between px-6 py-4">
  <Logo />
  <div className="flex items-center gap-4">
    <Notifications />
    <ThemeSelector />
    <UserMenu />
  </div>
</header>

// After
<header className="flex items-center justify-between px-6 py-4">
  <Logo />
  <div className="flex items-center gap-4">
    <Notifications />
    <UserMenu />
  </div>
</header>
```

### Testing

After migration:

1. ✅ Check login page renders correctly
2. ✅ Check dashboard header has no empty space
3. ✅ Verify no console errors about missing ThemeSelector
4. ✅ Build succeeds without errors

---

## 3. Optional: Dark Mode Class Cleanup

### What Changed

Many components had dark mode classes like `dark:text-gray-400` that are no longer needed.

### Migration (Optional)

This is **optional** - the classes won't hurt anything, but cleaning them up makes code cleaner.

#### Find Dark Mode Classes

```bash
# Search for dark: classes
findstr /s "dark:" *.tsx *.jsx
```

#### Example Cleanups

**Before**:
```tsx
<p className="text-gray-600 dark:text-gray-400">
  Description text
</p>
```

**After**:
```tsx
<p className="text-[var(--text-muted)]">
  Description text
</p>
```

**Before**:
```tsx
<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
```

**After**:
```tsx
<div className="bg-[var(--surface)] border border-[var(--border)]">
```

---

## 4. TypeScript Updates

### What Changed

Button component now uses CVA (class-variance-authority) for type-safe variants.

### Migration

If you were using `ButtonProps` type:

**Before**:
```tsx
interface MyFormProps {
  buttonVariant?: 'primary' | 'secondary';
}
```

**After** (more variants available):
```tsx
import { type ButtonProps } from '@/components/ui/Button';

interface MyFormProps {
  buttonVariant?: ButtonProps['variant'];
  // Now includes: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
}
```

---

## Automated Migration Script

### Button Width Migration

Create a temporary script to help find buttons that might need `fullWidth`:

```bash
# Windows PowerShell
Get-ChildItem -Path . -Filter *.tsx -Recurse | Select-String -Pattern "<Button[^>]*>" | Where-Object { $_.Line -notmatch "fullWidth" -and $_.Line -notmatch "size=\"icon\"" }
```

This finds all `<Button` tags that don't have `fullWidth` or `size="icon"` - review these manually.

---

## Step-by-Step Migration Checklist

### Pre-Migration

- [ ] Create a backup branch
- [ ] Commit all current changes
- [ ] Run tests to establish baseline

### Migration

- [ ] Search for all `<Button` usages
- [ ] Add `fullWidth` to form submit buttons
- [ ] Add `fullWidth` to mobile-first buttons
- [ ] Search for `ThemeSelector` usages
- [ ] Remove all `ThemeSelector` imports
- [ ] Remove all `<ThemeSelector />` JSX
- [ ] Clean up empty divs/spacing
- [ ] (Optional) Clean up `dark:` classes

### Post-Migration

- [ ] Run `npm run build` - verify no errors
- [ ] Run `npx tsc --noEmit` - verify no type errors
- [ ] Test login page
- [ ] Test all forms
- [ ] Test mobile views
- [ ] Test button groups and toolbars
- [ ] Visual QA - check spacing and alignment

---

## Common Issues & Solutions

### Issue: Button Too Narrow

**Problem**: Button text is too narrow after migration

**Solution**: Add `fullWidth` prop or use `px-6` for more padding

```tsx
<Button fullWidth>Submit</Button>
// or
<Button className="px-6">Submit</Button>
```

### Issue: ThemeSelector Error

**Problem**: `Cannot find module '@/components/ui/ThemeSelector'`

**Solution**: Remove the import line completely

```tsx
// Remove this:
import { ThemeSelector } from '@/components/ui/ThemeSelector';
```

### Issue: Buttons Not Aligned

**Problem**: Multiple buttons in a row aren't aligned properly

**Solution**: Wrap in flex container with gap

```tsx
<div className="flex items-center gap-2">
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary">Save</Button>
</div>
```

### Issue: Mobile Button Too Small

**Problem**: Auto-width button too small on mobile

**Solution**: Use responsive width classes

```tsx
<Button className="w-full sm:w-auto">
  Action
</Button>
```

---

## Examples: Before & After

### Example 1: Auth Form

**Before**:
```tsx
<form onSubmit={handleSubmit}>
  <Input label="Email" type="email" />
  <Input label="Password" type="password" />
  <Button type="submit" variant="primary">
    Sign In
  </Button>
</form>
```

**After**:
```tsx
<form onSubmit={handleSubmit}>
  <Input label="Email" type="email" />
  <Input label="Password" type="password" />
  <Button type="submit" variant="primary" fullWidth>
    Sign In
  </Button>
</form>
```

### Example 2: Data Table Actions

**Before**:
```tsx
<div className="flex gap-2">
  <Button variant="secondary" size="sm">Edit</Button>
  <Button variant="destructive" size="sm">Delete</Button>
</div>
```

**After** (no change needed):
```tsx
<div className="flex gap-2">
  <Button variant="secondary" size="sm">Edit</Button>
  <Button variant="destructive" size="sm">Delete</Button>
</div>
```

### Example 3: Login Page Header

**Before**:
```tsx
<div className="relative">
  <div className="absolute top-6 right-6 z-50">
    <ThemeSelector />
  </div>
  <AuthCard />
</div>
```

**After**:
```tsx
<div className="relative">
  <AuthCard />
</div>
```

### Example 4: Dashboard Header

**Before**:
```tsx
<header className="flex items-center justify-between">
  <Logo />
  <div className="flex items-center gap-4">
    <Search />
    <Notifications />
    <ThemeSelector />
    <UserMenu />
  </div>
</header>
```

**After**:
```tsx
<header className="flex items-center justify-between">
  <Logo />
  <div className="flex items-center gap-4">
    <Search />
    <Notifications />
    <UserMenu />
  </div>
</header>
```

---

## Estimated Migration Time

- **Small Project** (<20 pages): 15-30 minutes
- **Medium Project** (20-50 pages): 30-60 minutes
- **Large Project** (50+ pages): 1-2 hours

Most time is spent reviewing button placements visually.

---

## Need Help?

1. Check `COMPONENT_USAGE_GUIDE.md` for component examples
2. Check `PHASE_2_COMPLETE.md` for detailed changes
3. Review the component files directly for TypeScript hints
4. Test incrementally - migrate one page at a time

---

**Migration Guide Version**: 1.0  
**Last Updated**: August 6, 2026  
**Phase**: 2 - Core Components
