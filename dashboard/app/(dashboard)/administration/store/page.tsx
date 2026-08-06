'use client';

import React from 'react';
import { useDashboardAuth } from '@/components/providers/AuthProvider';
import { useStoreProfile, useStoreHolidays, useStoreManagers, useStoreFacilities, useStoreGallery } from '@/hooks/useDashboardOps';
import { Store, Clock, Calendar, Users, Heart, Image, MapPin, Phone, Mail } from 'lucide-react';

export default function StoreManagementPage() {
  const { store } = useDashboardAuth();
  const { data: profile, isLoading: profileLoading } = useStoreProfile();
  const { data: holidays, isLoading: holidaysLoading } = useStoreHolidays(store?.storeId || '');
  const { data: managers, isLoading: managersLoading } = useStoreManagers(store?.storeId || '');
  const { data: facilities, isLoading: facilitiesLoading } = useStoreFacilities(store?.storeId || '');
  const { data: gallery, isLoading: galleryLoading } = useStoreGallery(store?.storeId || '');

  return (
    <div className="flex flex-col gap-6">
      {/* Store Profile */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Store Information</h2>
        </div>

        {profileLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-[var(--surface-hover)] rounded"></div>
            ))}
          </div>
        ) : profile || store ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Store Name</p>
              <p className="text-sm font-bold text-[var(--foreground)]">{profile?.name || store?.storeName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1">Store Code</p>
              <p className="text-sm font-mono text-[var(--foreground)]">{profile?.code || store?.storeId}</p>
            </div>

            {(profile?.address || store?.city) && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Address
                </p>
                <p className="text-sm text-[var(--foreground)]">
                  {profile?.address || `${store?.city}, ${store?.state}`}
                </p>
              </div>
            )}

            {profile?.phone && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </p>
                <p className="text-sm text-[var(--foreground)]">{profile.phone}</p>
              </div>
            )}

            {profile?.email && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="text-sm text-[var(--foreground)]">{profile.email}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Store information not available</p>
        )}
      </div>

      {/* Operating Hours */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Operating Hours</h2>
        </div>

        {(profile as any)?.hours || (profile as any)?.operatingHours ? (
          <div className="space-y-2">
            {Object.entries((profile as any).hours || (profile as any).operatingHours || {}).map(([day, hours]: [string, any]) => (
              <div key={day} className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)]/50 rounded">
                <span className="text-sm font-semibold text-[var(--foreground)] capitalize">{day}</span>
                <span className="text-sm text-[var(--text-muted)]">
                  {hours.isClosed ? 'Closed' : `${hours.open} - ${hours.close}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Operating hours not configured</p>
        )}
      </div>

      {/* Holidays */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Holidays & Closures</h2>
        </div>

        {holidaysLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-[var(--surface-hover)] rounded"></div>
            ))}
          </div>
        ) : holidays && holidays.length > 0 ? (
          <div className="space-y-2">
            {holidays.map((holiday: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--border)]/50 rounded">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{holiday.name}</p>
                  {holiday.isClosed && (
                    <span className="text-xs text-red-600 dark:text-red-400 font-bold">CLOSED</span>
                  )}
                </div>
                <span className="text-sm text-[var(--text-muted)]">
                  {holiday.date ? new Date(holiday.date).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No holidays configured</p>
        )}
      </div>

      {/* Store Managers */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Store Managers</h2>
        </div>

        {managersLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-[var(--surface-hover)] rounded"></div>
            ))}
          </div>
        ) : managers && managers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {managers.map((manager: any, index: number) => (
              <div key={index} className="p-3 bg-[var(--background)] border border-[var(--border)]/50 rounded">
                <p className="text-sm font-semibold text-[var(--foreground)]">{manager.name}</p>
                {manager.role && (
                  <p className="text-xs text-[var(--text-muted)] uppercase mt-1">{manager.role}</p>
                )}
                {manager.email && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{manager.email}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No managers assigned</p>
        )}
      </div>

      {/* Facilities */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Facilities & Amenities</h2>
        </div>

        {facilitiesLoading ? (
          <div className="animate-pulse h-12 bg-[var(--surface-hover)] rounded"></div>
        ) : facilities && facilities.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {facilities.map((facility: any, index: number) => (
              <span
                key={index}
                className="px-3 py-1.5 text-xs font-semibold bg-[var(--background)] border border-[var(--border)] rounded-lg"
              >
                {facility.name || facility}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No facilities listed</p>
        )}
      </div>

      {/* Gallery */}
      {gallery && gallery.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Store Gallery</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gallery.map((image: any, index: number) => (
              <div key={index} className="aspect-square rounded-lg overflow-hidden border border-[var(--border)]">
                <img
                  src={image.url || image}
                  alt={image.caption || `Store image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
