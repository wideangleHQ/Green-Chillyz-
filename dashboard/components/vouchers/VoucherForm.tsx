'use client';

import React, { useState } from 'react';
import { useCreateStoreVoucher, useUpdateStoreVoucher } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { StoreVoucher, StoreVoucherType, StoreVoucherStatus } from '@/lib/api/opsApi';
import { X, Save, ArrowLeft, Sparkles } from 'lucide-react';

interface VoucherFormProps {
  initialData?: StoreVoucher | null;
  onClose: () => void;
  onSuccess: () => void;
}

const VOUCHER_TYPES: { value: StoreVoucherType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Percentage Discount' },
  { value: 'FLAT_DISCOUNT', label: 'Flat Discount' },
  { value: 'FREE_ITEM', label: 'Free Item' },
  { value: 'COMBO', label: 'Combo Offer' },
  { value: 'FREE_BEVERAGE', label: 'Free Beverage' },
  { value: 'GIFT', label: 'Gift / Reward' },
  { value: 'COIN_VOUCHER', label: 'Coin Voucher' },
];

// Simple input component without floating labels
interface SimpleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const SimpleInput = React.forwardRef<HTMLInputElement, SimpleInputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <>
        <input
          ref={ref}
          aria-invalid={!!error}
          className={`w-full px-3 py-2 text-sm text-[var(--foreground)] bg-[var(--input-bg)] border border-[var(--border)] rounded-lg transition-colors outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary)]/10 ${
            error ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/10' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs text-[var(--color-error)] font-medium mt-1.5">
            {error}
          </p>
        )}
      </>
    );
  }
);

SimpleInput.displayName = 'SimpleInput';

export function VoucherForm({ initialData, onClose, onSuccess }: VoucherFormProps) {
  const isEditing = !!initialData;
  const createMutation = useCreateStoreVoucher();
  const updateMutation = useUpdateStoreVoucher();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<StoreVoucher>>({
    name: '',
    shortTitle: '',
    description: '',
    offerTag: '',
    discountBadge: '',
    offerImage: '',
    couponCode: '',
    voucherType: 'FLAT_DISCOUNT',
    minimumOrderValue: 0,
    voucherValue: 0,
    maximumDiscount: 0,
    itemsIncluded: '',
    redeemVenue: 'In-Store',
    totalLimit: 100,
    remainingCount: 100,
    status: 'DRAFT',
    isFeatured: false,
    priority: 0,
    ...initialData,
  });

  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [showQuantityAdjustment, setShowQuantityAdjustment] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, couponCode: `GC-${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Voucher name is required';
    if (!formData.couponCode?.trim()) newErrors.couponCode = 'Coupon code is required';
    if (formData.voucherValue === undefined || formData.voucherValue === null || formData.voucherValue < 0) newErrors.voucherValue = 'Voucher value must be 0 or greater';
    
    if (showQuantityAdjustment && !adjustmentReason.trim()) {
      newErrors.adjustmentReason = 'Adjustment reason is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Please fix the errors before submitting', 'error');
      return;
    }
    
    try {
      if (isEditing) {
        const payload: Record<string, unknown> = {
          name: formData.name,
          shortTitle: formData.shortTitle,
          description: formData.description,
          offerTag: formData.offerTag,
          discountBadge: formData.discountBadge,
          offerImage: formData.offerImage,
          bannerImage: formData.bannerImage,
          voucherType: formData.voucherType,
          minimumOrderValue: formData.minimumOrderValue ?? null,
          maximumDiscount: formData.maximumDiscount ?? null,
          voucherValue: formData.voucherValue ?? null,
          itemsIncluded: formData.itemsIncluded,
          redeemVenue: formData.redeemVenue,
          validDays: formData.validDays,
          startDate: formData.startDate,
          endDate: formData.endDate,
          validTime: formData.validTime,
          totalLimit: formData.totalLimit,
          isFeatured: formData.isFeatured,
          priority: formData.priority,
          sortOrder: formData.sortOrder,
          terms: formData.terms,
          metadata: formData.metadata,
        };
        if (showQuantityAdjustment) {
          payload.adjustmentReason = adjustmentReason;
        }
        await updateMutation.mutateAsync({ id: initialData!.id, dto: payload });
        showToast('Voucher updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(formData);
        showToast('Voucher created successfully', 'success');
      }
      onSuccess();
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || 'An error occurred';
      showToast(message, 'error');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--foreground)]"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {isEditing ? 'Edit Voucher' : 'Create New Voucher'}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {isEditing ? 'Update voucher details and settings' : 'Configure promotional voucher for your store'}
            </p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--foreground)]"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto bg-[var(--background-secondary)]">
        <form id="voucher-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          
          {/* Voucher Information */}
          <Card>
            <CardHeader>
              <CardTitle>Voucher Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" required>Voucher Name</Label>
                  <SimpleInput 
                    id="name"
                    name="name" 
                    value={formData.name || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., Anniversary Special Meal" 
                    error={errors.name}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shortTitle">Short Title</Label>
                  <SimpleInput 
                    id="shortTitle"
                    name="shortTitle" 
                    value={formData.shortTitle || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., Free Meal" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  name="description" 
                  value={formData.description || ''} 
                  onChange={handleChange} 
                  placeholder="Describe what this voucher offers..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Coupon Code & Type */}
          <Card>
            <CardHeader>
              <CardTitle>Coupon Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="couponCode" required>Coupon Code</Label>
                  <div className="flex gap-2">
                    <SimpleInput 
                      id="couponCode"
                      name="couponCode" 
                      value={formData.couponCode || ''} 
                      onChange={handleChange} 
                      placeholder="GC-XXXXX"
                      className="font-mono uppercase tracking-wider"
                      disabled={isEditing}
                      error={errors.couponCode}
                    />
                    {!isEditing && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={generateCode} 
                        className="shrink-0 gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </Button>
                    )}
                  </div>
                  {isEditing && (
                    <p className="text-xs text-[var(--text-muted)]">Coupon code cannot be changed after creation</p>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="voucherType" required>Voucher Type</Label>
                  <Select 
                    id="voucherType"
                    name="voucherType" 
                    value={formData.voucherType} 
                    onChange={handleChange}
                  >
                    {VOUCHER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Value & Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Value & Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="voucherValue" required>
                    {formData.voucherType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                  </Label>
                  <SimpleInput 
                    id="voucherValue"
                    type="number" 
                    name="voucherValue" 
                    value={formData.voucherValue ?? ''} 
                    onChange={handleChange} 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00"
                    error={errors.voucherValue}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="minimumOrderValue">Minimum Order Value (₹)</Label>
                  <SimpleInput 
                    id="minimumOrderValue"
                    type="number" 
                    name="minimumOrderValue" 
                    value={formData.minimumOrderValue ?? ''} 
                    onChange={handleChange} 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maximumDiscount">Maximum Discount Cap (₹)</Label>
                  <SimpleInput 
                    id="maximumDiscount"
                    type="number" 
                    name="maximumDiscount" 
                    value={formData.maximumDiscount ?? ''} 
                    onChange={handleChange} 
                    min="0" 
                    step="0.01" 
                    placeholder="No limit"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="totalLimit" required>Total Voucher Limit</Label>
                  <SimpleInput 
                    id="totalLimit"
                    type="number" 
                    name="totalLimit" 
                    value={formData.totalLimit ?? 100} 
                    onChange={handleChange} 
                    min="1" 
                    disabled={isEditing}
                    placeholder="100"
                  />
                  {isEditing && (
                    <p className="text-xs text-[var(--text-muted)]">Total limit cannot be changed after creation</p>
                  )}
                </div>
                

              </div>

              {/* Quantity Adjustment for Editing */}
              {isEditing && (
                <div className="mt-4 p-4 bg-[var(--surface-hover)] rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--foreground)]">Inventory Adjustment</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        Current remaining: <span className="font-bold text-[var(--foreground)]">{formData.remainingCount}</span>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowQuantityAdjustment(!showQuantityAdjustment)}
                    >
                      {showQuantityAdjustment ? 'Cancel' : 'Adjust Quantity'}
                    </Button>
                  </div>
                  
                  {showQuantityAdjustment && (
                    <>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="remainingCount" required>New Remaining Quantity</Label>
                          <SimpleInput 
                            id="remainingCount"
                            type="number" 
                            name="remainingCount" 
                            value={formData.remainingCount ?? 0} 
                            onChange={handleChange} 
                            min="0"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="adjustmentReason" required>Reason for Adjustment</Label>
                          <SimpleInput 
                            id="adjustmentReason"
                            value={adjustmentReason} 
                            onChange={e => {
                              setAdjustmentReason(e.target.value);
                              if (errors.adjustmentReason) {
                                setErrors(prev => {
                                  const next = { ...prev };
                                  delete next.adjustmentReason;
                                  return next;
                                });
                              }
                            }} 
                            placeholder="e.g., Promotional giveaway"
                            error={errors.adjustmentReason}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="offerTag">Offer Tag / Badge</Label>
                  <SimpleInput 
                    id="offerTag"
                    name="offerTag" 
                    value={formData.offerTag || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., 50% OFF" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="redeemVenue">Redeem Venue</Label>
                  <SimpleInput 
                    id="redeemVenue"
                    name="redeemVenue" 
                    value={formData.redeemVenue || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., In-Store Only" 
                  />
                </div>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    name="isFeatured" 
                    checked={formData.isFeatured} 
                    onChange={handleChange} 
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 cursor-pointer" 
                  />
                  <span className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                    Featured Voucher
                  </span>
                </label>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="status" className="mb-0">Status</Label>
                  {isEditing ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide bg-[var(--surface-hover)] text-[var(--foreground)] border border-[var(--border)]">
                      {formData.status}
                    </span>
                  ) : (
                    <Select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-auto min-w-[120px]"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Footer Actions */}
      <div className="px-4 sm:px-6 py-4 border-t border-[var(--border)] flex items-center justify-between gap-3 shrink-0 bg-[var(--surface)]">
        <Button 
          variant="ghost" 
          onClick={onClose} 
          disabled={isPending}
          className="text-[var(--text-muted)]"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          form="voucher-form" 
          disabled={isPending}
          isLoading={isPending}
          className="gap-2 min-w-[140px]"
        >
          {!isPending && <Save className="w-4 h-4" />}
          {isEditing ? 'Save Changes' : 'Create Voucher'}
        </Button>
      </div>
    </div>
  );
}
