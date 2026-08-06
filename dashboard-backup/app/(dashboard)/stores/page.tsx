'use client';

import React, { useState } from 'react';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useStoreProfile, useStoreHolidays, useStoreManagers, useStoreFacilities, useStoreGallery, useAddStoreHoliday } from '@/hooks/useDashboardOps';
import { useToast } from '@/components/providers/ToastProvider';
import { Store, Clock, Calendar, Shield, Phone, Mail, Image as ImageIcon, Heart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function StoreManagement() {
  const { store } = useDashboardAuth();
  const { showToast } = useToast();

  const storeId = store?.storeId || '';

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'holidays' | 'managers'>('profile');

  // Queries
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useStoreProfile();
  const { data: holidays, isLoading: holidaysLoading, refetch: refetchHolidays } = useStoreHolidays(storeId);
  const { data: managers, isLoading: managersLoading } = useStoreManagers(storeId);
  const { data: facilities } = useStoreFacilities(storeId);
  const { data: gallery } = useStoreGallery(storeId);

  // Form State for Holidays
  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayClosed, setHolidayClosed] = useState(true);
  const addHolidayMutation = useAddStoreHoliday();

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName || !holidayDate) {
      showToast('Please fill out name and date fields', 'warning');
      return;
    }

    try {
      await addHolidayMutation.mutateAsync({
        storeId,
        dto: { name: holidayName, date: holidayDate, isClosed: holidayClosed },
      });
      showToast(`Holiday "${holidayName}" registered successfully!`, 'success');
      setHolidayName('');
      setHolidayDate('');
      setHolidayClosed(true);
    } catch {
      showToast('Failed to add holiday entry', 'error');
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="flex flex-col gap-6 select-none text-xs">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1 border-b border-[var(--border)]/10 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Store Operations Management</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Manage timings, register upcoming holidays, audit team staff roles, and view facility items.
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-[var(--border)]/10 pb-1">
        {[
          { id: 'profile', label: 'Store Profile', icon: <Store className="w-4 h-4 shrink-0" /> },
          { id: 'hours', label: 'Operating Hours', icon: <Clock className="w-4 h-4 shrink-0" /> },
          { id: 'holidays', label: 'Holidays Calendar', icon: <Calendar className="w-4 h-4 shrink-0" /> },
          { id: 'managers', label: 'Team Managers', icon: <Shield className="w-4 h-4 shrink-0" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold cursor-pointer transition-all ${
              activeTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="min-h-[400px]">
        {profileLoading && <div className="py-20 text-center text-[var(--text-muted)] animate-pulse">Loading profiles...</div>}

        {/* TAB 1: PROFILE OVERVIEW */}
        {activeTab === 'profile' && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
            <div className="flex flex-col gap-6">
              
              {/* Profile Details Card */}
              <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2 border-b border-[var(--border)]/10 pb-2">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>General Information</span>
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Branch Name</span>
                    <span className="font-bold text-[var(--foreground)] mt-0.5 block">{profile.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Branch Code</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block font-mono">{profile.code}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Physical Address</span>
                    <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                      {profile.address || 'No registered street address'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">City</span>
                    <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{profile.city}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">State</span>
                    <span className="font-semibold text-[var(--foreground)] mt-0.5 block">{profile.state}</span>
                  </div>
                </div>

                <div className="border-t border-[var(--border)]/10 pt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block">Phone Contact</span>
                      <span className="font-semibold text-[var(--foreground)]">{profile.phone || 'None'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                    <div>
                      <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-wider block">Email Contact</span>
                      <span className="font-semibold text-[var(--foreground)]">{profile.email || 'None'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Panel */}
              <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2 border-b border-[var(--border)]/10 pb-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Store Gallery</span>
                </h3>

                {gallery && gallery.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {gallery.map((img: any) => (
                      <div key={img.id} className="relative rounded-xl border border-[var(--border)]/10 overflow-hidden h-24 bg-zinc-50 dark:bg-zinc-900">
                        <img src={img.imageUrl} alt={img.caption || 'Store image'} className="w-full h-full object-cover" />
                        {img.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white p-1 text-[8px] truncate">
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-xl">
                    No images in store gallery.
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE PANEL: FACILITIES */}
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2 border-b border-[var(--border)]/10 pb-2">
                  <Heart className="w-4 h-4 text-emerald-600" />
                  <span>Available Facilities</span>
                </h3>

                {facilities && facilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {facilities.map((fac: any) => (
                      <span
                        key={fac.id}
                        className="px-3 py-1.5 border border-[var(--border)]/10 bg-[var(--background)] rounded-full text-[10px] font-semibold text-[var(--foreground)]"
                      >
                        {fac.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-xl">
                    No facilities registered for this store.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OPERATING HOURS */}
        {activeTab === 'hours' && profile && (
          <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4 max-w-2xl mx-auto">
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2 border-b border-[var(--border)]/10 pb-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Weekly Timings Configuration</span>
            </h3>

            {profile.timings && profile.timings.length > 0 ? (
              <div className="divide-y divide-[var(--border)]/5">
                {profile.timings.map((t: any) => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--foreground)] w-28">{daysOfWeek[t.dayOfWeek]}</span>
                    {t.isClosed ? (
                      <span className="text-red-500 font-bold tracking-wide uppercase text-[10px]">Closed</span>
                    ) : (
                      <div className="flex items-center gap-2 font-medium text-[var(--foreground)]">
                        <span>{t.openTime}</span>
                        <span className="text-[var(--text-muted)]">to</span>
                        <span>{t.closeTime}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">No timing schedules configured.</div>
            )}
          </div>
        )}

        {/* TAB 3: HOLIDAYS */}
        {activeTab === 'holidays' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
            
            {/* Calendar list */}
            <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[var(--border)]/10 pb-2">
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Scheduled Holidays & Off-days</span>
                </h3>
                <button
                  onClick={() => refetchHolidays()}
                  className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[var(--text-muted)] cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {holidaysLoading ? (
                <div className="py-12 text-center text-[var(--text-muted)] animate-pulse">Loading holidays...</div>
              ) : holidays && holidays.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {holidays.map((h: any) => (
                    <div key={h.id} className="p-3 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[var(--foreground)]">{h.name}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{new Date(h.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${h.isClosed ? 'bg-red-50 dark:bg-red-950/20 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        {h.isClosed ? 'CLOSED' : 'OPEN'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--text-muted)] border border-dashed border-[var(--border)]/20 rounded-xl">
                  No upcoming holidays scheduled.
                </div>
              )}
            </div>

            {/* Add Holiday Form */}
            <form
              onSubmit={handleAddHoliday}
              className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-soft flex flex-col gap-4 h-fit"
            >
              <h3 className="text-sm font-bold tracking-tight border-b border-[var(--border)]/10 pb-2">
                Register Holiday Date
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <label htmlFor="h-name" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Holiday Name</label>
                  <input
                    id="h-name"
                    type="text"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    placeholder="e.g. Independence Day"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="h-date" className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-1">Holiday Date</label>
                  <input
                    id="h-date"
                    type="date"
                    value={holidayDate}
                    onChange={(e) => setHolidayDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] outline-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="h-closed"
                    type="checkbox"
                    checked={holidayClosed}
                    onChange={(e) => setHolidayClosed(e.target.checked)}
                    className="accent-[var(--color-primary)] w-4 h-4 border-[var(--border)] rounded cursor-pointer"
                  />
                  <label htmlFor="h-closed" className="text-xs font-semibold text-[var(--foreground)] cursor-pointer">
                    Close store operations on this day
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={addHolidayMutation.isPending}
                className="py-2.5 font-bold mt-2"
              >
                Add Holiday Date
              </Button>
            </form>
          </div>
        )}

        {/* TAB 4: MANAGERS */}
        {activeTab === 'managers' && (
          <div className="p-6 rounded-2xl border border-[var(--border)]/10 bg-[var(--surface)] shadow-soft flex flex-col gap-4 max-w-2xl mx-auto">
            <h3 className="text-sm font-bold tracking-tight flex items-center gap-2 border-b border-[var(--border)]/10 pb-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Assigned Store Managers</span>
            </h3>

            {managersLoading ? (
              <div className="py-8 text-center text-[var(--text-muted)] animate-pulse">Loading managers...</div>
            ) : managers && managers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {managers.map((mgr: any) => (
                  <div key={mgr.id} className="p-4 border border-[var(--border)]/5 bg-[var(--background)] rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center font-bold text-[var(--color-primary)]">
                        {mgr.user.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-[var(--foreground)]">{mgr.user.fullName}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{mgr.user.email}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
                      {mgr.role}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">No managers assigned to this store.</div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
