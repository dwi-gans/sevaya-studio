import React from 'react';

// --- Catalog product card skeleton ---
export function CatalogCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-black/10 bg-white animate-pulse">
      <div className="aspect-[3/4] w-full bg-black/[0.06]" />
      <div className="flex flex-col p-2.5 sm:p-4 gap-2">
        <div className="h-2.5 bg-black/8 rounded w-1/3" />
        <div className="h-3.5 bg-black/8 rounded w-4/5" />
        <div className="h-2.5 bg-black/8 rounded w-1/2" />
        <div className="h-4 bg-black/8 rounded w-1/3 mt-1" />
        <div className="mt-2 rounded-xl bg-black/5 p-2 space-y-1.5">
          <div className="h-2.5 bg-black/8 rounded w-1/4" />
          <div className="flex gap-1">
            <div className="h-4 w-10 bg-black/8 rounded-full" />
            <div className="h-4 w-10 bg-black/8 rounded-full" />
          </div>
        </div>
        <div className="flex gap-1 pt-2 border-t border-black/8 mt-1">
          <div className="h-7 flex-1 bg-black/8 rounded-full" />
          <div className="h-7 w-7 bg-black/8 rounded-full" />
          <div className="h-7 w-7 bg-black/8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CatalogGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <CatalogCardSkeleton key={i} />
      ))}
    </div>
  );
}

// --- Inventory grouped product card skeleton ---
export function InventoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-xl bg-black/[0.06] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 bg-black/8 rounded w-2/5" />
          <div className="h-4 bg-black/8 rounded w-3/5" />
          <div className="h-2.5 bg-black/8 rounded w-1/4" />
        </div>
        <div className="h-7 w-16 bg-black/8 rounded-full shrink-0" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 bg-black/8 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function InventoryGroupedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <InventoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function InventoryTelemetrySkeleton() {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-black/10 bg-white p-4 animate-pulse">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 bg-black/8 rounded w-3/4" />
            <div className="h-5 bg-black/8 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InventoryTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-4 space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-4 w-28 bg-black/8 rounded shrink-0" />
          <div className="h-4 flex-1 bg-black/8 rounded" />
          <div className="h-4 w-16 bg-black/8 rounded shrink-0 hidden sm:block" />
          <div className="h-4 w-12 bg-black/8 rounded shrink-0" />
          <div className="h-6 w-16 bg-black/8 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

// --- Media library grid card skeleton ---
export function MediaCardSkeleton() {
  return (
    <div className="rounded-2xl border border-black/10 bg-white overflow-hidden p-3 space-y-2.5 animate-pulse">
      <div className="aspect-[3/4] w-full rounded-xl bg-black/[0.06]" />
      <div className="h-3.5 bg-black/8 rounded w-3/4" />
      <div className="h-2.5 bg-black/8 rounded w-1/2" />
    </div>
  );
}

export function MediaGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

// --- Settings form skeleton ---
export function SettingsFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2.5 bg-black/8 rounded w-1/3" />
            <div className="h-10 bg-black/8 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="h-10 bg-black/8 w-28 rounded-full mt-4" />
    </div>
  );
}

// --- Full-page admin auth hydration skeleton ---
export function AdminPageAuthSkeleton() {
  return (
    <div className="min-h-screen w-full bg-[#f9f9f8] antialiased">
      <div className="h-14 border-b border-black/10 bg-white px-4 flex items-center gap-3 animate-pulse">
        <div className="h-6 w-24 bg-black/8 rounded" />
        <div className="flex-1" />
        <div className="h-7 w-7 bg-black/8 rounded-full" />
        <div className="h-7 w-7 bg-black/8 rounded-full" />
      </div>
      <div className="flex">
        <div className="hidden sm:flex flex-col w-48 xl:w-56 shrink-0 border-r border-black/10 bg-white min-h-[calc(100vh-56px)] p-3 gap-1.5 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 bg-black/8 rounded-lg w-full" />
          ))}
        </div>
        <div className="flex-1 p-4 sm:p-6 space-y-4">
          <div className="h-6 bg-black/8 rounded w-40 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-black/10 bg-white overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-black/[0.06]" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-black/8 rounded w-3/4" />
                  <div className="h-2.5 bg-black/8 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}