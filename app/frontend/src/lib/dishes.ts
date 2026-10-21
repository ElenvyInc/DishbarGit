import { SAMPLE_DISHES } from '@/data/sampleDishes';

export type DishSource = 'api' | 'seed';
export type DishBadge = 'persian' | 'vegetarian' | 'dessert' | 'other';
export type DishArt = 'chicken' | 'herbs' | 'eggplant' | 'rice' | 'soup' | 'stew' | 'pastry';
export type DishTone = 'peach' | 'sage' | 'lilac' | 'butter' | 'sky' | 'rose';

export interface Dish {
  id: number;
  chefId: number;
  title: string;
  titleFa?: string;
  titleFr?: string;
  price: number;
  cook: string;
  cookFa?: string;
  city: string;
  rating?: number;
  cuisines: string[];
  dietary: string[];
  badge: DishBadge;
  art: DishArt;
  tone: DishTone;
  imageUrl?: string;
  source: DishSource;
  description?: string;
}

export type DishFilter = 'all' | 'persian' | 'vegetarian' | 'desserts';

interface ApiMenuItem {
  id: number;
  chef_id: number;
  title: string;
  title_fa?: string;
  description?: string;
  description_fa?: string;
  price: number;
  image_url?: string;
  category?: string;
  dietary_tags?: string;
  chef_name?: string;
  chef_name_fa?: string;
  chef_city?: string;
}

interface ApiChef {
  id: number;
  name?: string;
  name_fa?: string;
  city?: string;
  cuisine_tags?: string;
  rating?: number;
}

const TONES: DishTone[] = ['peach', 'sage', 'lilac', 'butter', 'sky', 'rose'];

function artFor(text: string): DishArt {
  const value = text.toLowerCase();
  if (/baklava|dessert|pastry|sweet|شیرینی|باقلوا/.test(value)) return 'pastry';
  if (/bademjan|eggplant|بادمجان/.test(value)) return 'eggplant';
  if (/sabzi|herb|سبزی/.test(value)) return 'herbs';
  if (/ash|soup|آش|reshteh/.test(value)) return 'soup';
  if (/fesenjan|stew|khoresh|خورش|فسنجان/.test(value)) return 'stew';
  if (/kabab|kebab|morgh|joojeh|chicken|مرغ|کباب/.test(value)) return 'chicken';
  return 'rice';
}

function badgeFor(cuisines: string[], dietary: string[]): DishBadge {
  if (dietary.includes('dessert')) return 'dessert';
  if (dietary.includes('vegetarian')) return 'vegetarian';
  if (cuisines.includes('persian')) return 'persian';
  return 'other';
}

export function mapLiveDishes(items: ApiMenuItem[], chefs: ApiChef[]): Dish[] {
  const chefById = new Map(chefs.map((chef) => [chef.id, chef]));
  return items
    .filter((item) => item && typeof item.id === 'number' && item.title && typeof item.price === 'number')
    .map((item, index) => {
      const chef = chefById.get(item.chef_id);
      const blob = `${item.category || ''} ${item.dietary_tags || ''} ${chef?.cuisine_tags || ''} ${item.title}`.toLowerCase();
      const cuisines: string[] = [];
      if (/persian|iran|middle eastern|stew|kebab|kabab|rice|polo/.test(blob)) cuisines.push('persian');
      const dietary: string[] = [];
      if (blob.includes('vegetarian') || blob.includes('vegan')) dietary.push('vegetarian');
      if (/dessert|pastry|sweet|baklava/.test(blob)) dietary.push('dessert');
      const rating = chef?.rating && chef.rating > 0 ? chef.rating : undefined;
      return {
        id: item.id,
        chefId: item.chef_id,
        title: item.title,
        titleFa: item.title_fa,
        price: item.price,
        cook: item.chef_name || chef?.name || '',
        cookFa: item.chef_name_fa || chef?.name_fa,
        city: item.chef_city || chef?.city || '',
        rating,
        cuisines,
        dietary,
        badge: badgeFor(cuisines, dietary),
        art: artFor(`${item.title} ${item.category || ''} ${item.title_fa || ''}`),
        tone: TONES[index % TONES.length],
        imageUrl: item.image_url,
        source: 'api' as const,
        description: item.description,
      };
    });
}

export function dishesFromResponse(
  menu: { items?: ApiMenuItem[] } | undefined,
  chefs: { items?: ApiChef[] } | undefined,
): { dishes: Dish[]; source: DishSource } {
  const live = mapLiveDishes(menu?.items || [], chefs?.items || []);
  if (live.length > 0) return { dishes: live, source: 'api' };
  return { dishes: SAMPLE_DISHES, source: 'seed' };
}

export function dishMatches(dish: Dish, filter: DishFilter, area: string, query: string): boolean {
  if (filter === 'persian' && !dish.cuisines.includes('persian')) return false;
  if (filter === 'vegetarian' && !dish.dietary.includes('vegetarian')) return false;
  if (filter === 'desserts' && !dish.dietary.includes('dessert')) return false;
  if (area && dish.city.toLowerCase() !== area.toLowerCase()) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [dish.title, dish.titleFa, dish.titleFr, dish.cook, dish.cookFa, dish.city, dish.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}
