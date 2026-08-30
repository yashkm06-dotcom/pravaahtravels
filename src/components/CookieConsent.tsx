import { useState } from 'react';
import { Cookie, ShieldCheck } from 'lucide-react';
import {
  CookieConsentPreferences,
  getCookieConsent,
  saveCookieConsent,
} from '../utils/cookieConsent';

export default function CookieConsent() {
  const [savedPreferences, setSavedPreferences] = useState<CookieConsentPreferences | null>(() => getCookieConsent());

  const hasSavedChoice = savedPreferences !== null;

  const persistPreferences = (preferences: Pick<CookieConsentPreferences, 'analytics' | 'marketing'>) => {
    const saved = saveCookieConsent(preferences);
    setSavedPreferences(saved);
  };

  return (
    <>
      {!hasSavedChoice && (
        <section
          aria-label="Cookie consent"
          className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] sm:bottom-5"
        >
          <div className="pointer-events-auto mx-auto flex max-w-6xl flex-col gap-3 border border-white/70 bg-white/95 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-md sm:p-4 lg:flex-row lg:items-center lg:gap-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#eff8ea] text-[#4DA528]" aria-hidden="true">
                <Cookie className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-stone-950 sm:text-base">Cookies on Pravaah Travels</h2>
                <p className="mt-0.5 text-xs leading-5 text-stone-600 sm:text-sm">
                  Necessary cookies keep the site working. Optional cookies help us improve your experience and measure campaigns.
                </p>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 lg:flex">
              <button
                type="button"
                onClick={() => persistPreferences({ analytics: true, marketing: true })}
                className="min-h-10 bg-[#4DA528] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-[#36751d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4DA528]"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => persistPreferences({ analytics: false, marketing: false })}
                className="min-h-10 border border-stone-300 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-stone-700 transition hover:border-stone-950 hover:text-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4DA528]"
              >
                Decline
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
