import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Star } from 'lucide-react';
import { DishIllustration, toneClass } from '@/components/home/FoodArt';
import { useI18n, type Locale } from '@/i18n';
import type { Dish } from '@/lib/dishes';

const CITIES: Record<string, { fa: string; fr: string }> = {
  toronto: { fa: 'تورنتو', fr: 'Toronto' },
  'north york': { fa: 'نورث یورک', fr: 'North York' },
  mississauga: { fa: 'میسیساگا', fr: 'Mississauga' },
  'richmond hill': { fa: 'ریچموند هیل', fr: 'Richmond Hill' },
  vaughan: { fa: 'وان', fr: 'Vaughan' },
  oakville: { fa: 'اوکویل', fr: 'Oakville' },
  markham: { fa: 'مارکهام', fr: 'Markham' },
  brampton: { fa: 'برامپتون', fr: 'Brampton' },
  scarborough: { fa: 'اسکاربرو', fr: 'Scarborough' },
};

export function cityLabel(city: string, locale: Locale) {
  if (!city) return '';
  if (locale === 'en') return city;
  const translated = CITIES[city.toLowerCase()];
  if (!translated) return city;
  return locale === 'fa' ? translated.fa : translated.fr;
}

function money(price: number, locale: Locale) {
  const digits = Number.isInteger(price) ? 0 : 2;
  if (locale === 'fa') {
    const formatted = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(price);
    return `${formatted} $`;
  }
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(price);
}

function ratingLabel(rating: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : locale === 'fr' ? 'fr-CA' : 'en-CA', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(rating);
}

interface DishCardProps {
  dish: Dish;
  saved: boolean;
  onToggleSave: (dish: Dish) => void;
  onAdd: (dish: Dish) => void;
}

export default function DishCard({ dish, saved, onToggleSave, onAdd }: DishCardProps) {
  const { locale, t } = useI18n();
  const [imageFailed, setImageFailed] = useState(false);
  const name = locale === 'fa' ? dish.titleFa || dish.title : locale === 'fr' ? dish.titleFr || dish.title : dish.title;
  const cook = locale === 'fa' ? dish.cookFa || dish.cook : dish.cook;
  const city = cityLabel(dish.city, locale);
  const badge = dish.badge === 'dessert'
    ? t('filterDesserts')
    : dish.badge === 'vegetarian'
      ? t('filterVegetarian')
      : dish.badge === 'persian'
        ? t('filterPersian')
        : dish.cuisines[0] || '';
  const showImage = Boolean(dish.imageUrl) && !imageFailed;
  const live = dish.source === 'api' && dish.chefId > 0;

  const art = showImage ? (
    <img
      src={dish.imageUrl}
      alt=""
      className="mx-auto h-36 w-36 rounded-full object-cover"
      onError={() => setImageFailed(true)}
    />
  ) : (
    <DishIllustration art={dish.art} className="mx-auto h-36 w-40" />
  );

  return (
    <article className={`relative flex min-h-[22rem] flex-col rounded-[28px] p-4 ${toneClass(dish.tone)}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#17352C]">
          {dish.source === 'seed' ? `${t('sampleBadge')} · ${t('availableToday')}` : t('availableToday')}
        </span>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? t('favouriteRemove') : t('favouriteAdd')}
          onClick={() => onToggleSave(dish)}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#17352C] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]"
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-[#C45342] text-[#C45342]' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center py-2">
        {live ? (
          <Link to={`/chef/${dish.chefId}`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]" aria-label={name}>
            {art}
          </Link>
        ) : art}
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-snug text-[#17352C]">
            {live ? (
              <Link to={`/chef/${dish.chefId}`} className="hover:underline">{name}</Link>
            ) : name}
          </h3>
          <p className="shrink-0 text-base font-bold text-[#17352C]" dir="ltr">{money(dish.price, locale)}</p>
        </div>
        <p className="text-sm text-[#4E5B54]">
          {cook}{city ? ` · ${city}` : ''}
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm text-[#17352C]">
            {typeof dish.rating === 'number' && (
              <>
                <Star className="h-3.5 w-3.5 fill-[#E0A106] text-[#E0A106]" aria-hidden="true" />
                <span>{ratingLabel(dish.rating, locale)}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>{badge}</span>
          </p>
          <button
            type="button"
            onClick={() => onAdd(dish)}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#17352C] shadow-sm hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17352C]"
          >
            {t('addDish')}
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
