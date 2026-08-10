'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, UploadCloud } from 'lucide-react';
import { Dish, MenuCategory } from '@/types/menu';
import { FoodType, MenuStatus, SpiceLevel, UpdateMenuItemDto } from '@/lib/api/menuAdminApi';
import { normalizeDecimal } from '@/lib/utils';

interface MenuEditorProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  categories: MenuCategory[];
  onSave: (id: string | null, data: UpdateMenuItemDto) => void;
  onPublish: (id: string | null, data: UpdateMenuItemDto) => void;
  isPending: boolean;
}

export function MenuEditor({ isOpen, onClose, dish, categories, onSave, onPublish, isPending }: MenuEditorProps) {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const { register, handleSubmit, reset, formState: { isDirty, errors }, setValue, watch } = useForm<UpdateMenuItemDto>({
    defaultValues: {
      name: '',
      shortDescription: '',
      price: 0,
      foodType: 'VEG',
      spiceLevel: 'MILD',
      preparationTime: 15,
      status: 'DRAFT',
      categoryId: '',
    }
  });

  useEffect(() => {
    if (dish) {
      reset({
        name: dish.name,
        shortDescription: dish.shortDescription || '',
        price: normalizeDecimal(dish.price) ?? 0,
        foodType: dish.foodType as FoodType,
        spiceLevel: (dish.spiceLevel as SpiceLevel) || 'MILD',
        preparationTime: dish.preparationTime || 15,
        status: dish.status as MenuStatus,
        categoryId: dish.categoryId || '',
      });
    } else {
      reset({
        name: '',
        shortDescription: '',
        price: 0,
        foodType: 'VEG',
        spiceLevel: 'MILD',
        preparationTime: 15,
        status: 'DRAFT',
        categoryId: '',
      });
    }
  }, [dish, reset, isOpen]);

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  };

  const forceClose = () => {
    setShowUnsavedDialog(false);
    onClose();
  };

  const onSubmitSave = (data: UpdateMenuItemDto) => {
    onSave(dish?.id || null, data);
  };

  const onSubmitPublish = (data: UpdateMenuItemDto) => {
    onPublish(dish?.id || null, { ...data, status: 'ACTIVE' });
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={handleClose}
      />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-[var(--background)] shadow-2xl z-50 flex flex-col border-l border-[var(--border)] animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)]">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {dish ? 'Edit Menu Item' : 'Create Menu Item'}
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="menu-form" className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">Name</label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                placeholder="E.g. Chicken Tikka Masala"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">Short Description</label>
              <textarea
                {...register('shortDescription')}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)] h-20 resize-none"
                placeholder="Brief description for the menu..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--foreground)]">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('price', { required: true, valueAsNumber: true, min: 0 })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--foreground)]">Category</label>
                <select
                  {...register('categoryId')}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--foreground)]">Food Type</label>
                <select
                  {...register('foodType')}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="VEG">Vegetarian</option>
                  <option value="NON_VEG">Non-Vegetarian</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--foreground)]">Spice Level</label>
                <select
                  {...register('spiceLevel')}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="MILD">Mild</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HOT">Hot</option>
                  <option value="EXTRA_HOT">Extra Hot</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">Preparation Time (mins)</label>
              <input
                type="number"
                {...register('preparationTime', { valueAsNumber: true, min: 0 })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--input-bg)] text-sm focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            
            <div className="p-4 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
              <p className="text-sm font-semibold text-[var(--foreground)] mb-1">Current Status</p>
              <p className="text-xs text-[var(--text-muted)]">
                {watch('status') === 'ACTIVE' 
                  ? 'This item is published and visible to customers.' 
                  : 'This item is a draft and hidden from the public menu.'}
              </p>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSubmit(onSubmitSave)}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-hover)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>

          <button
            type="button"
            onClick={handleSubmit(onSubmitPublish)}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-[var(--background)] rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Unsaved Changes</h3>
              <p className="text-sm text-[var(--text-muted)]">
                You have unsaved changes. Are you sure you want to discard them?
              </p>
            </div>
            <div className="bg-[var(--surface)] p-4 flex gap-3 justify-end border-t border-[var(--border)]">
              <button
                onClick={() => setShowUnsavedDialog(false)}
                className="px-4 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Keep Editing
              </button>
              <button
                onClick={forceClose}
                className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
