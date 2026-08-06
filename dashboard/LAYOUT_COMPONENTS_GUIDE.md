# Layout Components Usage Guide

Quick reference for using GreenChillyz Dashboard layout components.

---

## Overview

Phase 3 introduced 7 reusable layout components for consistent page structure across the dashboard.

### Components

1. **Sidebar** - Desktop collapsible navigation
2. **MobileSidebar** - Mobile drawer navigation
3. **Header** - Sticky header with tools
4. **Breadcrumb** - Path-based navigation
5. **Container** - Page content wrapper
6. **PageHeader** - Page title headers
7. **EmptyState** - Empty state messages

---

## Sidebar

Desktop navigation sidebar with collapse functionality.

### Import
```tsx
import { Sidebar, SidebarItem } from '@/components/layout';
```

### Usage
```tsx
const menuItems: SidebarItem[] = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: <LayoutDashboard className="w-4 h-4" /> 
  },
  { 
    name: 'Users', 
    href: '/users', 
    icon: <Users className="w-4 h-4" />,
    badge: 5 
  },
];

<Sidebar
  isCollapsed={isCollapsed}
  onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
  menuItems={menuItems}
  bottomItems={bottomMenuItems}
/>
```

### Features
- Auto-detect active route
- Collapse to icon-only (70px)
- Tooltips in collapsed state
- Badge support (numbers or text)
- Bottom section for secondary links

---

## MobileSidebar

Mobile drawer navigation with backdrop.

### Import
```tsx
import { MobileSidebar } from '@/components/layout';
```

### Usage
```tsx
<MobileSidebar
  isOpen={isMobileOpen}
  onClose={() => setIsMobileOpen(false)}
  menuItems={menuItems}
  bottomItems={bottomMenuItems}
/>
```

### Features
- Slide-in animation from left
- Backdrop with blur effect
- Auto-close on route change
- Touch-optimized spacing

---

## Header

Sticky header with breadcrumbs, search, notifications, and profile menu.

### Import
```tsx
import { Header } from '@/components/layout';
import { BreadcrumbItem } from '@/components/ui/Breadcrumb';
```

### Usage
```tsx
const breadcrumbs: BreadcrumbItem[] = [
  { name: 'Settings', href: '/settings' },
  { name: 'Profile', href: '/settings/profile' },
];

<Header
  onMenuClick={() => setIsMobileOpen(true)}
  onSearchClick={() => setSearchOpen(true)}
  breadcrumbs={breadcrumbs}
  store={{
    storeName: 'Main Store',
    role: 'Admin',
    city: 'Mumbai',
    state: 'Maharashtra'
  }}
  unreadCount={3}
  onLogout={() => logout()}
/>
```

### Features
- Sticky positioning
- Backdrop blur effect
- Breadcrumb navigation
- Search with ⌘K shortcut
- Notification bell with badge
- Store info (desktop)
- Profile dropdown menu

---

## Breadcrumb

Automatic breadcrumb navigation from pathname.

### Import
```tsx
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/Breadcrumb';
```

### Usage
```tsx
const items: BreadcrumbItem[] = [
  { name: 'Dashboard', href: '/' },
  { name: 'Settings', href: '/settings', icon: <Settings /> },
  { name: 'Profile', href: '/settings/profile' },
];

<Breadcrumb items={items} showHome={true} />
```

### Auto-Generation
```tsx
// Utility function to generate from pathname
const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  if (pathname === '/') return [{ name: 'Dashboard', href: '/' }];
  
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((part, index) => {
    const url = '/' + parts.slice(0, index + 1).join('/');
    const name = part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return { name, href: url };
  });
};
```

### Features
- Auto-generated from path
- Optional home icon
- Icon support per item
- Truncation for long names
- ChevronRight separators

---

## Container

Flexible page content wrapper with max-width control.

### Import
```tsx
import { Container } from '@/components/layout';
```

### Usage
```tsx
// Default (7xl, no padding)
<Container>
  <Content />
</Container>

// With padding
<Container padding="lg">
  <Content />
</Container>

// Custom width
<Container maxWidth="xl" padding="md">
  <Content />
</Container>
```

### Props
```tsx
maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
padding?: 'none' | 'sm' | 'md' | 'lg'
```

### Max-Width Values
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px
- 7xl: 1280px (default)
- full: 100%

---

## PageHeader

Consistent page title headers with optional actions.

### Import
```tsx
import { PageHeader } from '@/components/layout';
```

### Basic Usage
```tsx
<PageHeader
  title="Customers"
  description="View and manage your customers"
/>
```

### With Action Button
```tsx
<PageHeader
  title="Customers"
  description="View and manage your customers"
  action={{
    label: "Add Customer",
    onClick: () => setModalOpen(true),
    icon: <Plus className="w-4 h-4" />,
    variant: "primary"
  }}
/>
```

### With Custom Children
```tsx
<PageHeader title="Reports">
  <Button variant="outline">Export</Button>
  <Button variant="primary">Generate</Button>
</PageHeader>
```

### Features
- Large bold title (text-2xl)
- Optional description
- Action button support
- Custom children support
- Responsive (stacks on mobile)

---

## EmptyState

Centered empty state messages with CTAs.

### Import
```tsx
import { EmptyState } from '@/components/layout';
```

### Basic Usage
```tsx
<EmptyState
  title="No customers yet"
  description="Get started by adding your first customer"
/>
```

### With Icon and Action
```tsx
<EmptyState
  icon={<Users className="w-16 h-16" />}
  title="No customers yet"
  description="Get started by adding your first customer to the system"
  action={{
    label: "Add Customer",
    onClick: () => router.push('/customers/new'),
    variant: "primary"
  }}
/>
```

### Features
- Centered layout
- Icon support
- Title and description
- Optional CTA button
- Consistent styling

---

## Complete Page Example

### Dashboard Page with All Components
```tsx
'use client';

import { useState } from 'react';
import { PageHeader, Container, EmptyState } from '@/components/layout';
import { DataTable } from '@/components/ui/DataTable';
import { Users, Plus } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return (
      <>
        <PageHeader title="Customers" />
        <Container>
          <div className="animate-pulse">Loading...</div>
        </Container>
      </>
    );
  }

  if (customers.length === 0) {
    return (
      <>
        <PageHeader
          title="Customers"
          description="Manage your customer base"
        />
        <EmptyState
          icon={<Users className="w-16 h-16" />}
          title="No customers yet"
          description="Get started by adding your first customer to the system"
          action={{
            label: "Add Customer",
            onClick: () => router.push('/customers/new'),
            icon: <Plus className="w-4 h-4" />
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${customers.length} customers registered`}
        action={{
          label: "Add Customer",
          onClick: () => setModalOpen(true),
          icon: <Plus className="w-4 h-4" />
        }}
      />

      <Container>
        <DataTable
          columns={columns}
          data={customers}
          searchable
        />
      </Container>
    </>
  );
}
```

---

## Layout Patterns

### Standard Page
```tsx
<>
  <PageHeader title="Page Title" description="Description" />
  <Container>
    <Content />
  </Container>
</>
```

### Page with Sections
```tsx
<>
  <PageHeader title="Dashboard" />
  
  <Container>
    <StatGrid />
  </Container>

  <Container>
    <RecentActivity />
  </Container>
</>
```

### Split Layout
```tsx
<>
  <PageHeader title="Settings" />
  
  <Container className="grid grid-cols-4 gap-6">
    <aside className="col-span-1">
      <SettingsSidebar />
    </aside>
    <main className="col-span-3">
      <SettingsContent />
    </main>
  </Container>
</>
```

### Modal / Dialog Pages
```tsx
<>
  <PageHeader
    title="Edit Customer"
    description="Update customer information"
  >
    <Button variant="outline" onClick={onCancel}>
      Cancel
    </Button>
    <Button variant="primary" onClick={onSave}>
      Save Changes
    </Button>
  </PageHeader>

  <Container maxWidth="xl">
    <CustomerForm />
  </Container>
</>
```

---

## Best Practices

### 1. Always Use PageHeader
```tsx
// ❌ DON'T: Custom header
<div>
  <h1 className="text-2xl font-bold">Title</h1>
</div>

// ✅ DO: Use PageHeader
<PageHeader title="Title" />
```

### 2. Wrap Content in Container
```tsx
// ❌ DON'T: No wrapper
<div className="space-y-6">
  <Content />
</div>

// ✅ DO: Use Container
<Container>
  <div className="space-y-6">
    <Content />
  </div>
</Container>
```

### 3. Use EmptyState for No Data
```tsx
// ❌ DON'T: Custom empty state
{data.length === 0 && (
  <div className="text-center py-12">
    <p>No data</p>
  </div>
)}

// ✅ DO: Use EmptyState
{data.length === 0 && (
  <EmptyState
    title="No data"
    description="Get started by adding items"
  />
)}
```

### 4. Consistent Spacing
```tsx
// ✅ Standard gap between sections
<>
  <PageHeader title="Title" />
  <div className="space-y-6">
    <Section1 />
    <Section2 />
  </div>
</>
```

---

## Accessibility

All layout components are built with accessibility in mind:

- ✅ Semantic HTML (nav, header, main)
- ✅ ARIA labels and attributes
- ✅ Keyboard navigation support
- ✅ Focus-visible styles
- ✅ Screen reader announcements
- ✅ Proper heading hierarchy

---

## Responsive Behavior

### PageHeader
- Stacks title and action on mobile
- Side-by-side on desktop

### Container
- Full width on mobile
- Max-width constraint on desktop
- Responsive padding options

### EmptyState
- Centered on all screens
- Responsive icon sizes
- Readable text width

---

**Last Updated**: August 6, 2026  
**Phase**: 3 - Layout & Navigation Complete
