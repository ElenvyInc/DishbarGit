import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, MapPin, Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import DishCard, { cityLabel } from '@/components/home/DishCard';
import { AvatarCluster, HeroPlate, StoryMarks } from '@/components/home/FoodArt';
import SiteFooter from '@/components/layout/SiteFooter';
import SiteHeader from '@/components/layout/SiteHeader';
import { useI18n } from '@/i18n';
import { addToCart, client } from '@/lib/api';
import { SAMPLE_AREAS } from '@/data/sampleDishes';
import { dishMatches, dishesFromResponse, type Dish, type DishFilter } from '@/lib/dishes';

const FAVOURITE_KEY = 'dishbar-favourite-dishes';
const FILTERS: DishFilter[] = ['all', 'persian', 'vegetarian', 'desserts'];

const FILTER_LABEL = {
  all: 'filterAll',
  persian: 'filterPersian',
  vegetarian: 'filterVegetarian',
  desserts: 'filterDesserts',
} as const;

function readFavourites(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVOURITE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

function writeFavourites(ids: number[]) {
  window.localStorage.setItem(FAVOURITE_KEY, JSON.stringify(ids));
}

export default function HomePage() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [source, setSource] = useState<'api' | 'seed'>('seed');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DishFilter>('all');
  const [area, setArea] = useState('');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState<number[]>(() => readFavourites());
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    document.title = locale === 'fa'
      ? 'دیش‌بار | غذای واقعی. دست‌پخت آدم‌های واقعی.'
      : locale === 'fr'
        ? 'DishBar | De la vraie cuisine, faite par de vraies personnes.'
        : 'DishBar | Real food. Made by real people.';
  }, [locale]);

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      document.getElementById(id)?.scrollIntoView();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      client.apiCall.invoke({ url: '/api/v1/public/menu?limit=24', method: 'GET', data: {} }),
      client.apiCall.invoke({ url: '/api/v1/public/chefs?limit=50', method: 'GET', data: {} }),
    ]).then(([menuResponse, chefResponse]) => {
      if (cancelled) return;
      const next = dishesFromResponse(menuResponse?.data, chefResponse?.data);
      setDishes(next.dishes);
      setSource(next.source);
    }).catch(() => {
      if (cancelled) return;
      const next = dishesFromResponse(undefined, undefined);
      setDishes(next.dishes);
      setSource(next.source);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    client.auth.me().then((response: { data?: unknown }) => {
      if (!cancelled) setSignedIn(Boolean(response?.data));
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    client.entities.favourites.query({ query: {}, limit: 50 }).then((response: { data?: { items?: { menu_item_id?: number }[] } }) => {
      const ids = (response?.data?.items || [])
        .map((item) => item.menu_item_id)
        .filter((id): id is number => typeof id === 'number');
      if (ids.length === 0) return;
      setSaved((current) => Array.from(new Set([...current, ...ids])));
    }).catch(() => undefined);
  }, [signedIn]);

  const areas = useMemo(() => {
    const fromDishes = dishes.map((dish) => dish.city).filter(Boolean);
    return Array.from(new Set([...SAMPLE_AREAS, ...fromDishes]));
  }, [dishes]);

  const visible = useMemo(
    () => dishes.filter((dish) => dishMatches(dish, filter, area, query)),
    [dishes, filter, area, query],
  );
  const shown = showAll ? visible : visible.slice(0, 6);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    setQuery(draft);
    setShowAll(true);
    document.getElementById('popular')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSave = async (dish: Dish) => {
    const nextSaved = saved.includes(dish.id)
      ? saved.filter((id) => id !== dish.id)
      : [...saved, dish.id];
    setSaved(nextSaved);
    writeFavourites(nextSaved);
    if (!signedIn || dish.source !== 'api') return;
    try {
      if (nextSaved.includes(dish.id)) {
        await client.entities.favourites.create({
          data: { chef_id: dish.chefId, menu_item_id: dish.id },
        });
      } else {
        const response = await client.entities.favourites.query({
          query: { menu_item_id: dish.id },
          limit: 1,
        });
        const row = response?.data?.items?.[0];
        if (row?.id) await client.entities.favourites.delete({ id: String(row.id) });
      }
    } catch {
      /* Guest-local save still stands when the favourites API is unavailable. */
    }
  };

  const onAdd = (dish: Dish) => {
    if (dish.source !== 'api') {
      toast.message(t('sampleAddNotice'));
      return;
    }
    addToCart({
      id: dish.id,
      title: dish.title,
      title_fa: dish.titleFa,
      price: dish.price,
      chef_id: dish.chefId,
      chef_name: dish.cook,
      image_url: dish.imageUrl,
    });
    toast.success(t('addedToCart'));
  };

  const steps = [
    { icon: Search, title: t('findFlavour'), body: t('findFlavourBody'), wrap: 'bg-[#F8D5D0] text-[#C45342]' },
    { icon: Heart, title: t('orderEase'), body: t('orderEaseBody'), wrap: 'bg-[#D7EFE4] text-[#1F7A56]' },
    { icon: Sparkles, title: t('enjoySpecial'), body: t('enjoySpecialBody'), wrap: 'bg-[#F8E7B0] text-[#9A6B10]' },
  ];

  return (
    <div className="min-h-screen bg-[#FBF6EF] text-[#17352C]">
      <SiteHeader />
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-16 lg:pt-14">
          <div>
            <p className={`flex items-center gap-2 text-[11px] font-bold text-[#C45342] ${locale === 'fa' ? '' : 'uppercase tracking-[0.16em]'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#C45342]" aria-hidden="true" />
              {t('heroEyebrow')}
            </p>
            <h1 className="mt-4 max-w-xl text-[clamp(2.6rem,5vw,4.25rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#14352C]">
              <span className="block">{t('heroLine1')}</span>
              <span className="block">{t('heroLine2')}</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#4E5B54] sm:text-lg">
              {t('heroDiscover')}
            </p>
            <form onSubmit={onSearch} role="search" className="mt-7 flex flex-col gap-2 rounded-[28px] bg-white p-2 shadow-[0_18px_50px_-28px_rgba(20,53,44,0.45)] ring-1 ring-[#17352C]/5 sm:flex-row sm:items-center sm:rounded-full">
              <label className="flex min-w-0 flex-1 items-center gap-2 px-3">
                <Search className="h-4 w-4 shrink-0 text-[#7B857F]" aria-hidden="true" />
                <span className="sr-only">{t('searchLabel')}</span>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-transparent py-3 text-sm text-[#17352C] outline-none placeholder:text-[#8A938D]"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C45342] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B34738] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C] focus-visible:ring-offset-2"
              >
                {t('browseFood')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </form>
            <p className="mt-5 flex items-center gap-3 text-sm text-[#4E5B54]">
              <AvatarCluster />
              {t('lovedBy')}
            </p>
          </div>

          <div className="relative">
            <HeroPlate />
            <p className="absolute start-[6%] top-[18%] hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#17352C] shadow-sm sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-[#E07A68]" aria-hidden="true" />
              {t('madeWithCare')}
            </p>
            <p className="absolute bottom-[16%] end-[2%] hidden items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#17352C] shadow-sm sm:inline-flex">
              {t('freshToday')}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </p>
            <p className="sr-only">{t('heroPlateAlt')}</p>
          </div>
        </section>

        <section id="popular" className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-busy={loading}>
          <p className={`text-[11px] font-bold text-[#7B857F] ${locale === 'fa' ? '' : 'uppercase tracking-[0.16em]'}`}>
            {t('popularEyebrow')}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{t('popularTitle')}</h2>
            {visible.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAll((value) => !value)}
                className="inline-flex items-center text-sm font-semibold text-[#C45342] hover:underline"
              >
                {showAll ? t('showLess') : t('viewAll')}
                <ArrowRight className="ms-1 inline h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label={t('filtersLabel')} className="flex flex-wrap gap-2">
              {FILTERS.map((item) => {
                const selected = filter === item;
                return (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => { setFilter(item); setShowAll(false); }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C] ${
                      selected ? 'bg-[#17352C] text-[#FBF6EF]' : 'bg-white text-[#17352C] ring-1 ring-[#17352C]/10 hover:bg-white/70'
                    }`}
                  >
                    {t(FILTER_LABEL[item])}
                  </button>
                );
              })}
            </div>
            <label className="relative inline-flex items-center">
              <span className="sr-only">{t('chooseArea')}</span>
              <MapPin className="pointer-events-none absolute start-3 h-4 w-4 text-[#17352C]" aria-hidden="true" />
              <select
                value={area}
                onChange={(event) => { setArea(event.target.value); setShowAll(false); }}
                className="appearance-none rounded-full bg-white py-2 pe-8 ps-9 text-sm font-semibold text-[#17352C] ring-1 ring-[#17352C]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]"
              >
                <option value="">{t('chooseArea')}</option>
                {areas.map((item) => (
                  <option key={item} value={item}>{cityLabel(item, locale)}</option>
                ))}
              </select>
            </label>
          </div>

          {source === 'seed' && !loading && (
            <p role="note" className="mt-5 rounded-2xl bg-[#F3E6D4] px-4 py-3 text-sm leading-relaxed text-[#17352C]">
              <span className="font-bold">{t('sampleBadge')}. </span>
              {t('sampleBanner')}
            </p>
          )}

          {loading ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-80 animate-pulse rounded-[28px] bg-[#EFE6DA]" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="mt-8 text-[#4E5B54]">{t('noResults')}</p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  saved={saved.includes(dish.id)}
                  onToggleSave={toggleSave}
                  onAdd={onAdd}
                />
              ))}
            </div>
          )}
          <p className="sr-only" aria-live="polite">
            {visible.length}
          </p>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <p className={`text-[11px] font-bold text-[#7B857F] ${locale === 'fa' ? '' : 'uppercase tracking-[0.16em]'}`}>
            {t('howEyebrow')}
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{t('howDishbarWorks')}</h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3">
            <span className="absolute top-8 hidden border-t border-dashed border-[#17352C]/20 md:block md:inset-x-[16%]" aria-hidden="true" />
            {steps.map((step) => (
              <li key={step.title} className="relative">
                <span className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${step.wrap}`}>
                  <step.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[#4E5B54]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="grid items-center gap-8 rounded-[32px] bg-[#14352C] px-6 py-10 text-[#F6F1E8] sm:px-10 md:grid-cols-[auto_1fr] md:px-14 md:py-14">
            <StoryMarks />
            <div>
              <p className={`text-[11px] font-bold text-[#E7B7A8] ${locale === 'fa' ? '' : 'uppercase tracking-[0.16em]'}`}>
                {t('cookEyebrow')}
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.04em] sm:text-4xl">
                {t('cookStoryTitle')}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#E4DDD2] sm:text-base">
                {t('cookStoryBody')}
              </p>
              <button
                type="button"
                onClick={() => navigate('/become-a-chef')}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#C45342] px-5 py-3 text-sm font-semibold text-white hover:bg-[#B34738] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#14352C]"
              >
                {t('startCooking')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
