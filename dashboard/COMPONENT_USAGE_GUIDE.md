# Component Usage Guide

Quick reference for using GreenChillyz Dashboard UI components.

---

## Button

Enterprise-grade button with 6 variants and 4 sizes.

### Import
```tsx
import { Button } from '@/components/ui/Button';
```

### Basic Usage
```tsx
<Button>Click me</Button>
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
```

### All Variants
```tsx
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outlined</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="link">Link Style</Button>
```

### Sizes
```tsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### States
```tsx
<Button disabled>Disabled</Button>
<Button isLoading>Loading...</Button>
<Button isSuccess>Success!</Button>
```

### Width Control
```tsx
<Button fullWidth>Full Width Button</Button>
<Button>Auto Width (default)</Button>
```

### Props Reference
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  fullWidth?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}
```

---

## Input

Floating label input with password toggle and error states.

### Import
```tsx
import { Input } from '@/components/ui/Input';
```

### Basic Usage
```tsx
<Input label="Email Address" type="email" />
<Input label="Username" placeholder="john_doe" />
```

### With Error
```tsx
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

### With React Hook Form
```tsx
<Input
  {...register('email')}
  label="Email"
  type="email"
  error={errors.email?.message}
/>
```

### Password Input
```tsx
<Input label="Password" type="password" />
// Automatic eye icon toggle
// Automatic Caps Lock detection
```

### Props Reference
```tsx
interface InputProps {
  label: string;
  type?: string;
  error?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  // + all standard input attributes
}
```

---

## StatCard

Statistics card with optional trend indicator and icon.

### Import
```tsx
import { StatCard } from '@/components/ui/StatCard';
```

### Basic Usage
```tsx
<StatCard title="Total Users" value="12,345" />
```

### With Icon
```tsx
<StatCard
  title="Revenue"
  value="$45,230"
  icon={<DollarSign className="h-5 w-5" />}
/>
```

### With Trend
```tsx
<StatCard
  title="Active Users"
  value="1,234"
  trend={{
    value: 12.5,
    direction: 'up',
    label: 'vs last month'
  }}
/>
```

### With Subtitle
```tsx
<StatCard
  title="New Orders"
  value="89"
  subtitle="Last updated 2 minutes ago"
/>
```

### Loading State
```tsx
<StatCard title="Revenue" value="" loading />
```

### Props Reference
```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  subtitle?: string;
  loading?: boolean;
  className?: string;
}
```

---

## DataTable

Enterprise data table with sorting, search, and pagination.

### Import
```tsx
import { DataTable, type Column } from '@/components/ui/DataTable';
```

### Basic Usage
```tsx
const columns: Column[] = [
  { key: 'name', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
];

<DataTable columns={columns} data={customers} />
```

### With Sorting
```tsx
const columns: Column[] = [
  { key: 'name', label: 'Customer', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
];

<DataTable
  columns={columns}
  data={data}
  onSort={handleSort}
  sortKey={sortKey}
  sortOrder={sortOrder}
/>
```

### With Custom Rendering
```tsx
const columns: Column<Customer>[] = [
  { key: 'name', label: 'Customer' },
  {
    key: 'amount',
    label: 'Amount',
    align: 'right',
    render: (row) => formatCurrency(row.amount)
  },
  {
    key: 'status',
    label: 'Status',
    align: 'center',
    render: (row) => <Badge>{row.status}</Badge>
  },
];
```

### With Search
```tsx
<DataTable
  columns={columns}
  data={data}
  searchable
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search customers..."
/>
```

### With Pagination
```tsx
<DataTable
  columns={columns}
  data={data}
  pagination={{
    currentPage: page,
    pageSize: 10,
    total: totalCount,
    onPageChange: setPage,
  }}
/>
```

### With Actions
```tsx
<DataTable
  columns={columns}
  data={data}
  actions={(row) => (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost">Edit</Button>
      <Button size="sm" variant="destructive">Delete</Button>
    </div>
  )}
/>
```

### With Loading & Error
```tsx
<DataTable
  columns={columns}
  data={data}
  isLoading={isLoading}
  error={error}
  emptyMessage="No customers found"
/>
```

### Column Props
```tsx
interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}
```

### Full Example
```tsx
<DataTable
  columns={[
    { key: 'name', label: 'Customer', sortable: true },
    { key: 'email', label: 'Email' },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
      render: (row) => formatCurrency(row.amount)
    },
  ]}
  data={customers}
  isLoading={isLoading}
  error={error}
  searchable
  searchValue={search}
  onSearchChange={setSearch}
  pagination={{
    currentPage: page,
    pageSize: 10,
    total: totalCount,
    onPageChange: setPage,
  }}
  onSort={(key, order) => setSorting({ key, order })}
  sortKey={sorting.key}
  sortOrder={sorting.order}
  actions={(row) => (
    <Button size="sm" variant="ghost">Edit</Button>
  )}
/>
```

---

## Tabs

Navigation tabs with active state detection.

### Import
```tsx
import { Tabs } from '@/components/ui/Tabs';
```

### Basic Usage
```tsx
<Tabs
  tabs={[
    { label: 'Overview', href: '/dashboard' },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Settings', href: '/dashboard/settings' },
  ]}
/>
```

### With Icons
```tsx
<Tabs
  tabs={[
    { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
    { label: 'Users', href: '/users', icon: <Users className="h-4 w-4" /> },
  ]}
/>
```

### With Counts
```tsx
<Tabs
  tabs={[
    { label: 'All', href: '/tasks', count: 42 },
    { label: 'Active', href: '/tasks/active', count: 12 },
    { label: 'Completed', href: '/tasks/completed', count: 30 },
  ]}
/>
```

### With Disabled State
```tsx
<Tabs
  tabs={[
    { label: 'Available', href: '/features' },
    { label: 'Beta', href: '/features/beta', disabled: true },
  ]}
/>
```

### Props Reference
```tsx
interface Tab {
  label: string;
  href: string;
  count?: number;
  icon?: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  className?: string;
}
```

---

## Utility Functions

### cn() - Class Name Merger

Intelligently merges Tailwind classes with proper precedence.

```tsx
import { cn } from '@/lib/utils';

// Basic usage
cn('px-4 py-2', 'bg-primary')
// → 'px-4 py-2 bg-primary'

// Conditional classes
cn('px-4', isActive && 'bg-primary', !isActive && 'bg-gray-100')
// → 'px-4 bg-primary' (when isActive)

// Overriding classes (later classes win)
cn('px-4 py-2', 'px-6')
// → 'px-6 py-2'

// Complex example
cn(
  'px-4 py-2 rounded-lg',
  variant === 'primary' && 'bg-primary text-white',
  variant === 'secondary' && 'border border-gray-200',
  isDisabled && 'opacity-50 cursor-not-allowed',
  className // User's custom classes
)
```

### formatCurrency()

```tsx
import { formatCurrency } from '@/lib/utils';

formatCurrency(1234.56)
// → '$1,234.56'

formatCurrency(1234.56, 'EUR')
// → '€1,234.56'
```

### formatDate()

```tsx
import { formatDate } from '@/lib/utils';

formatDate(new Date())
// → '8/6/2026'

formatDate(new Date(), { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})
// → 'August 6, 2026'
```

### formatNumber()

```tsx
import { formatNumber } from '@/lib/utils';

formatNumber(1234)
// → '1.2K'

formatNumber(1234567)
// → '1.2M'

formatNumber(123)
// → '123'
```

---

## Common Patterns

### Form with Submit Button
```tsx
<form onSubmit={handleSubmit}>
  <Input
    label="Email"
    type="email"
    error={errors.email}
  />
  <Input
    label="Password"
    type="password"
    error={errors.password}
  />
  <Button
    type="submit"
    fullWidth
    isLoading={isSubmitting}
  >
    Sign In
  </Button>
</form>
```

### Stats Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard title="Revenue" value="$45,230" trend={{ value: 12, direction: 'up' }} />
  <StatCard title="Orders" value="1,234" trend={{ value: 5, direction: 'up' }} />
  <StatCard title="Customers" value="567" trend={{ value: 3, direction: 'down' }} />
  <StatCard title="Products" value="89" />
</div>
```

### Tabbed Content
```tsx
<div>
  <Tabs tabs={tabs} />
  <div className="p-6">
    {/* Content based on active tab */}
  </div>
</div>
```

### Data Table Page
```tsx
<div className="p-8 space-y-6">
  <h1 className="text-2xl font-bold">Customers</h1>
  
  <DataTable
    columns={columns}
    data={customers}
    searchable
    searchValue={search}
    onSearchChange={setSearch}
    pagination={pagination}
    isLoading={isLoading}
  />
</div>
```

---

## Tips & Best Practices

1. **Button Variants**
   - Use `primary` for main actions
   - Use `secondary` for cancel/back
   - Use `destructive` for delete/remove
   - Use `ghost` in toolbars and compact UIs

2. **Input Validation**
   - Always provide clear error messages
   - Use floating labels (built-in)
   - Leverage browser validation (type="email", etc.)

3. **DataTable Performance**
   - Use pagination for large datasets
   - Implement server-side sorting when possible
   - Use virtualization for 1000+ rows

4. **StatCards**
   - Keep values concise (use formatNumber for large numbers)
   - Use trend indicators sparingly (only when meaningful)
   - Group related stats together

5. **Tabs**
   - Keep labels short (1-2 words)
   - Use icons sparingly
   - Don't exceed 6-7 tabs

6. **Accessibility**
   - All components have built-in ARIA attributes
   - Use semantic HTML
   - Test with keyboard navigation
   - Provide meaningful labels

---

**Last Updated**: August 6, 2026  
**Phase**: 2 - Core Components Complete
