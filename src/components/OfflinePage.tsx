import React from 'react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fffaf1] px-6 py-12">
      <div className="w-full max-w-xl rounded-[24px] border border-stone-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(18,38,32,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4DA528]">Offline</p>
        <h1 className="mt-4 text-3xl font-bold text-stone-900">You’re back online soon</h1>
        <p className="mt-3 text-sm leading-7 text-stone-600">
          The app is cached locally and will continue to work while the network reconnects.
        </p>
      </div>
    </div>
  );
}
