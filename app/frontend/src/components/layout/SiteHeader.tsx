import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, X } from 'lucide-react';
import DishBarLogo from '@/components/DishBarLogo';
import LanguageToggle from '@/components/layout/LanguageToggle';
import { useI18n } from '@/i18n';

interface SiteHeaderProps {
  variant?: 'marketing' | 'compact';
  onBack?: () => void;
  backLabel?: string;
  trailing?: ReactNode;
}

export default function SiteHeader({
  variant = 'marketing',
  onBack,
  backLabel,
  trailing,
}: SiteHeaderProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Loaded on demand so the blog prerender (Node, no window) never evaluates the browser API client.
    const refreshCart = () => {
      import('@/lib/api').then(({ getCart }) => {
        if (!cancelled) setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
      }).catch(() => undefined);
    };
    import('@/lib/api').then(({ client }) => {
      if (cancelled) return;
      client.auth.me().then((response: { data?: unknown }) => {
        if (!cancelled) setSignedIn(Boolean(response?.data));
      }).catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    }).catch(() => undefined);
    refreshCart();
    window.addEventListener('dishbar-cart', refreshCart);
    return () => {
      cancelled = true;
      window.removeEventListener('dishbar-cart', refreshCart);
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const goToSection = (id: string) => {
    setOpen(false);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate(`/#${id}`);
  };

  const accountButton = (
    <button
      type="button"
      onClick={() => navigate(signedIn ? '/account' : '/login')}
      className="rounded-full border border-[#17352C]/15 bg-white/70 px-3 py-2 text-sm font-semibold text-[#17352C] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C] focus-visible:ring-offset-2 sm:px-4"
    >
      {signedIn ? t('account') : t('signIn')}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#FBF6EF]/90 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        {t('skipToContent')}
      </a>
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {variant === 'compact' && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-full px-2 py-1 text-sm font-semibold text-[#17352C] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]"
            >
              <span aria-hidden="true" className="me-1 inline-block rtl:rotate-180">←</span>
              <span className="hidden sm:inline">{backLabel || t('back')}</span>
              <span className="sr-only sm:hidden">{backLabel || t('back')}</span>
            </button>
          )}
          <Link to="/" aria-label={t('brand')} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]">
            <DishBarLogo size="md" />
          </Link>
        </div>

        {variant === 'marketing' && (
          <nav className="hidden items-center gap-7 lg:flex" aria-label={t('brand')}>
            <button type="button" onClick={() => goToSection('popular')} className="text-sm font-medium text-[#17352C]/80 hover:text-[#17352C]">
              {t('browseFood')}
            </button>
            <button type="button" onClick={() => goToSection('how-it-works')} className="text-sm font-medium text-[#17352C]/80 hover:text-[#17352C]">
              {t('howDishbarWorks')}
            </button>
            <Link to="/become-a-chef" className="text-sm font-medium text-[#17352C]/80 hover:text-[#17352C]">
              {t('becomeACook')}
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <LanguageToggle />
          {cartCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="relative rounded-full p-2 text-[#17352C] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]"
              aria-label={t('cart')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#C45342] px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            </button>
          )}
          {variant === 'marketing' ? accountButton : trailing}
          {variant === 'marketing' && (
            <button
              type="button"
              className="rounded-full p-2 text-[#17352C] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C] lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">{open ? t('closeMenu') : t('openMenu')}</span>
            </button>
          )}
        </div>
      </div>

      {variant === 'marketing' && open && (
        <div id="mobile-nav" className="border-t border-[#17352C]/10 bg-[#FBF6EF] px-4 py-3 lg:hidden">
          <nav className="grid gap-1">
            <button type="button" onClick={() => goToSection('popular')} className="rounded-xl px-2 py-3 text-start text-base font-medium">
              {t('browseFood')}
            </button>
            <button type="button" onClick={() => goToSection('how-it-works')} className="rounded-xl px-2 py-3 text-start text-base font-medium">
              {t('howDishbarWorks')}
            </button>
            <Link to="/become-a-chef" onClick={() => setOpen(false)} className="rounded-xl px-2 py-3 text-base font-medium">
              {t('becomeACook')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
