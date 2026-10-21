import { useI18n, type Locale } from '@/i18n';

const OPTIONS: { id: Locale; label: string; name: string }[] = [
  { id: 'en', label: 'EN', name: 'English' },
  { id: 'fa', label: 'FA', name: 'فارسی' },
  { id: 'fr', label: 'FR', name: 'Français' },
];

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={`inline-flex items-center rounded-full bg-[#EFE6DA] p-1 ${className}`}
      role="group"
      aria-label={t('language')}
      dir="ltr"
    >
      {OPTIONS.map((option) => {
        const selected = locale === option.id;
        return (
          <button
            key={option.id}
            type="button"
            lang={option.id === 'fa' ? 'fa' : option.id}
            onClick={() => setLocale(option.id)}
            aria-pressed={selected}
            className={`min-w-9 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C] focus-visible:ring-offset-2 ${
              selected ? 'bg-white text-[#17352C] shadow-sm' : 'text-[#5C675F] hover:text-[#17352C]'
            }`}
          >
            <span aria-hidden="true">{option.label}</span>
            <span className="sr-only">{option.name}</span>
          </button>
        );
      })}
    </div>
  );
}
