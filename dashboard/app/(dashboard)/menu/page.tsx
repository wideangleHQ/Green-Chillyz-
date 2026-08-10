'use client';

import React, { useState } from 'react';
import { Plus, Check, Clock, Search, Filter } from 'lucide-react';
import { useAdminMenuCategories, useAdminMenuItems, useCreateMenuItem, useUpdateMenuItem } from '@/hooks/useMenuAdmin';
import { DataTable, Column } from '@/components/ui/DataTable';
import { MenuEditor } from '@/components/menu/MenuEditor';
import { Dish, MenuCategory } from '@/types/menu';
import { FoodType, UpdateMenuItemDto } from '@/lib/api/menuAdminApi';
import { cn, normalizeDecimal } from '@/lib/utils';

export default function MenuManagementPage() {
  const [page, setPage] = useState(1);
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFoodType, setSelectedFoodType] = useState<FoodType | undefined>(undefined);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setPage(1); // reset to page 1 on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchValue]);

  const { data: categories = [], isLoading: isLoadingCategories } = useAdminMenuCategories();
  
  const { data: menuData, isLoading: isLoadingMenu } = useAdminMenuItems({
    page,
    pageSize: 20,
    category: selectedCategory || undefined,
    foodType: selectedFoodType,
    sort: 'nameAsc',
  });

  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();

  const handleEdit = (dish: Dish) => {
    setSelectedDish(dish);
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedDish(null);
    setIsEditorOpen(true);
  };

  const handleSave = (id: string | null, data: UpdateMenuItemDto) => {
    if (id) {
      updateMutation.mutate({ id, dto: data }, {
        onSuccess: () => setIsEditorOpen(false)
      });
    } else {
      createMutation.mutate(data as any, {
        onSuccess: () => setIsEditorOpen(false)
      });
    }
  };

  const handlePublish = (id: string | null, data: UpdateMenuItemDto) => {
    // A Publish action explicitly sets the status to ACTIVE
    if (id) {
      updateMutation.mutate({ id, dto: data }, {
        onSuccess: () => setIsEditorOpen(false)
      });
    } else {
      createMutation.mutate(data as any, {
        onSuccess: () => setIsEditorOpen(false)
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: Column<Dish>[] = [
    {
      key: 'name',
      label: 'Menu Item',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold">{row.name}</span>
          {row.sku && <span className="text-xs text-[var(--text-muted)] font-mono">{row.sku}</span>}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => {
        const cat = categories.find(c => c.id === row.categoryId);
        return cat ? cat.name : '-';
      }
    },
    {
      key: 'price',
      label: 'Price',
      align: 'right',
      sortable: true,
      render: (row) => {
        const price = normalizeDecimal(row.price);
        return <span className="font-semibold text-[var(--foreground)]">{price === null ? '—' : `₹${price.toFixed(2)}`}</span>;
      }
    },
    {
      key: 'foodType',
      label: 'Type',
      align: 'center',
      render: (row) => (
        <span className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold",
          row.foodType === 'VEG' 
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
        )}>
          {row.foodType === 'VEG' ? 'VEG' : 'NON-VEG'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center gap-1.5 justify-center">
          {row.status === 'ACTIVE' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Check className="w-3 h-3" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              <Clock className="w-3 h-3" />
              Draft
            </span>
          )}
        </div>
      )
    }
  ];

  const filteredData = (menuData?.items || []).filter(item => {
    if (!debouncedSearch) return true;
    return item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
           (item.sku && item.sku.toLowerCase().includes(debouncedSearch.toLowerCase()));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Menu Management</h1>
          <p className="text-sm text-[var(--text-muted)]">Create, edit, and publish your menu items.</p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-[var(--color-primary)]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] flex flex-col md:flex-row gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search menu items or SKU..."
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm transition-colors outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-3 py-1.5">
            <Filter className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-sm font-medium text-[var(--foreground)] focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.slug || c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[var(--input-bg)] border border-[var(--border)] rounded-md px-3 py-1.5">
            <select
              value={selectedFoodType || ''}
              onChange={(e) => setSelectedFoodType((e.target.value as FoodType) || undefined)}
              className="bg-transparent text-sm font-medium text-[var(--foreground)] focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="VEG">Veg</option>
              <option value="NON_VEG">Non-Veg</option>
            </select>
          </div>
        </div>

      </div>

      {/* Desktop Data Table */}
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoadingMenu || isLoadingCategories}
          actions={(row) => (
            <button
              onClick={() => handleEdit(row)}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              Edit
            </button>
          )}
          pagination={{
            currentPage: page,
            pageSize: 20,
            total: menuData?.total || 0,
            onPageChange: setPage,
          }}
          emptyMessage="No menu items found. Create a new one to get started."
        />
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-4">
        {isLoadingMenu || isLoadingCategories ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading menu items...</div>
        ) : filteredData.length === 0 ? (
          <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-center text-sm text-[var(--text-muted)]">
            No menu items found.
          </div>
        ) : (
          filteredData.map(item => {
            const cat = categories.find(c => c.id === item.categoryId);
            return (
              <div key={item.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-[var(--foreground)]">{item.name}</h3>
                    {item.sku && <p className="text-xs text-[var(--text-muted)] font-mono">{item.sku}</p>}
                  </div>
                  <span className="font-bold text-[var(--foreground)] shrink-0">
                    {(() => { const p = normalizeDecimal(item.price); return p === null ? '—' : `₹${p.toFixed(2)}`; })()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {cat && <span className="bg-[var(--surface-hover)] px-2 py-1 rounded text-[var(--text-muted)] font-medium">{cat.name}</span>}
                  
                  <span className={cn(
                    "px-2 py-1 rounded font-bold",
                    item.foodType === 'VEG' 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  )}>
                    {item.foodType === 'VEG' ? 'VEG' : 'NON-VEG'}
                  </span>

                  {item.status === 'ACTIVE' ? (
                    <span className="flex items-center gap-1 font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                      <Check className="w-3 h-3" /> Published
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-bold px-2 py-1 rounded bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" /> Draft
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--border)] mt-1 flex justify-end">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-sm font-semibold text-[var(--color-primary)] px-3 py-1.5 bg-[var(--color-primary)]/10 rounded-md hover:bg-[var(--color-primary)]/20 transition-colors"
                  >
                    Edit Item
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MenuEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        dish={selectedDish}
        categories={categories}
        onSave={handleSave}
        onPublish={handlePublish}
        isPending={isPending}
      />
    </div>
  );
}
