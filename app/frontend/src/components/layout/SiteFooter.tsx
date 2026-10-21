import { Link, useLocation, useNavigate } from 'react-router-dom';
import DishBarLogo from '@/components/DishBarLogo';
import { useI18n } from '@/i18n';

export default function SiteFooter() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const explore = () => {
    if (location.pathname === '/') {
      document.getElementById('popular')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    navigate('/#popular');
  };

  return (
    <footer className="border-t border-[#17352C]/10 bg-[#FBF6EF]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/" aria-label={t('brand')} className="inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]">
            <DishBarLogo size="sm" />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-[#5E6A63]">{t('footerMarketplace')}</p>
        </div>
        <nav aria-label={t('footerExplore')} className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-[#17352C]">
          <Link to="/blog" className="hover:text-[#C45342]">{t('footerAbout')}</Link>
          <button type="button" onClick={explore} className="hover:text-[#C45342]">{t('footerExplore')}</button>
          <Link to="/become-a-chef" className="hover:text-[#C45342]">{t('footerCookWithUs')}</Link>
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-4 gap-y-2 px-4 pb-8 text-xs text-[#5E6A63] sm:px-6">
        <span>© {new Date().getFullYear()} DishBar</span>
        <Link to="/legal/terms" className="hover:text-[#17352C]">{t('terms')}</Link>
        <Link to="/legal/privacy" className="hover:text-[#17352C]">{t('privacy')}</Link>
        <Link to="/legal/contact" className="hover:text-[#17352C]">{t('contact')}</Link>
      </div>
    </footer>
  );
}
