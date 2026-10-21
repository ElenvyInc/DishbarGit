import { useEffect, useState, type ReactNode } from 'react';
import { translations, type TranslationKey } from './messages';

export type Locale = 'en' | 'fa' | 'fr';
export type { TranslationKey };
export { translations };

const STORAGE_KEY = 'dishbar-locale';

const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'fa' || stored === 'fr' || stored === 'en' ? stored : 'en';
  } catch {
    return 'en';
  }
}

let currentLocale: Locale = readStoredLocale();

export function applyDocumentLocale(locale: Locale) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.lang = locale === 'fa' ? 'fa' : locale;
  root.dir = locale === 'fa' ? 'rtl' : 'ltr';
  root.dataset.locale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function getDir(): 'rtl' | 'ltr' {
  return currentLocale === 'fa' ? 'rtl' : 'ltr';
}

export function setLocale(locale: Locale) {
  if (locale !== 'en' && locale !== 'fa' && locale !== 'fr') return;
  if (locale === currentLocale) return;
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* private mode */
    }
  }
  applyDocumentLocale(locale);
  listeners.forEach((listener) => listener());
}

export function t(key: TranslationKey): string {
  return translations[currentLocale][key] || translations.en[key] || key;
}

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useI18n() {
  const [locale, setSnapshot] = useState<Locale>(currentLocale);

  useEffect(() => subscribeLocale(() => setSnapshot(currentLocale)), []);

  return {
    locale,
    dir: locale === 'fa' ? 'rtl' as const : 'ltr' as const,
    t,
    setLocale,
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const i18n = useI18n();

  useEffect(() => {
    applyDocumentLocale(i18n.locale);
  }, [i18n.locale]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = readStoredLocale();
      if (next !== currentLocale) setLocale(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <div dir={i18n.dir} lang={i18n.locale} className="min-h-screen">
      {children}
    </div>
  );
}

if (typeof window !== 'undefined') {
  applyDocumentLocale(currentLocale);
}
