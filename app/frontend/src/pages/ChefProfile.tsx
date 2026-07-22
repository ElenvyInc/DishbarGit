import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Star, ArrowLeft, Plus, Minus, ShoppingCart, MapPin, Heart } from 'lucide-react';
import { client, t, getLocale, addToCart, getCart, type CartItem } from '@/lib/api';
import DishBarLogo from '@/components/DishBarLogo';

// Appetizing Persian food placeholder images
const FOOD_PLACEHOLDERS = [
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocfpacaizq/menu-item-koobideh-kebab.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocf5ycaiza/menu-item-ghormeh-sabzi.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocgmqcai2q/menu-item-tahdig-saffron-rice.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocg3iaai2a/menu-item-zereshk-polo-chicken.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stochiacaiya/menu-item-persian-desserts.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocibycai2q/menu-item-ash-reshteh.png',
];

function getFoodPlaceholder(index: number): string {
  return FOOD_PLACEHOLDERS[index % FOOD_PLACEHOLDERS.length];
}
import { toast } from 'sonner';

interface Chef {
  id: number;
  name: string;
  name_fa?: string;
  bio?: string;
  bio_fa?: string;
  avatar_url?: string;
  city?: string;
  province?: string;
  cuisine_tags?: string;
  rating?: number;
  total_reviews?: number;
  delivery_options?: string;
}

interface MenuItem {
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
  is_available?: boolean;
  max_orders?: number;
}

interface Review {
  id: number;
  chef_id: number;
  rating: number;
  comment?: string;
  comment_fa?: string;
  created_at?: string;
}

export default function ChefProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chef, setChef] = useState<Chef | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>(getCart());
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isFavourited, setIsFavourited] = useState(false);
  const locale = getLocale();
  const isRtl = locale === 'fa';

  useEffect(() => {
    loadChefData();
    checkAuth();
  }, [id]);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) {
        setUser(res.data);
        checkFavourite();
      }
    } catch (e) {
      // User not authenticated - continue as guest
    }
  };

  const checkFavourite = async () => {
    try {
      const res = await client.entities.favourites.query({ query: { chef_id: Number(id) }, limit: 1 });
      if (res?.data?.items?.length > 0) setIsFavourited(true);
    } catch (e) {
      // Not favourited
    }
  };

  const handleToggleFavourite = async () => {
    if (!user) {
      client.auth.toLogin();
      return;
    }
    try {
      if (isFavourited) {
        const res = await client.entities.favourites.query({ query: { chef_id: Number(id) }, limit: 1 });
        if (res?.data?.items?.[0]) {
          await client.entities.favourites.delete({ id: String(res.data.items[0].id) });
          setIsFavourited(false);
          toast.success(locale === 'fa' ? 'از علاقه‌مندی‌ها حذف شد' : 'Removed from favourites');
        }
      } else {
        await client.entities.favourites.create({ data: { chef_id: Number(id) } });
        setIsFavourited(true);
        toast.success(locale === 'fa' ? 'به علاقه‌مندی‌ها اضافه شد' : 'Added to favourites');
      }
    } catch (e) {
      toast.error('Failed to update favourites');
    }
  };

  const loadChefData = async () => {
    try {
      const res = await client.apiCall.invoke({
        url: `/api/v1/public/chefs/${id}`,
        method: 'GET',
        data: {},
      });
      setChef(res.data?.chef || null);
      setMenuItems(res.data?.menu_items || []);
      setReviews(res.data?.reviews || []);
    } catch (e) {
      console.error('Failed to load chef:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    const updated = addToCart({
      id: item.id,
      title: item.title,
      title_fa: item.title_fa,
      price: item.price,
      chef_id: item.chef_id,
      chef_name: chef?.name || '',
      image_url: item.image_url,
    });
    setCartItems(updated);
    toast.success(locale === 'fa' ? 'به سبد خرید اضافه شد' : locale === 'fr' ? 'Ajouté au panier' : 'Added to cart');
  };

  const getItemQuantity = (itemId: number) => {
    return cartItems.find((c) => c.id === itemId)?.quantity || 0;
  };

  const handleSubmitReview = async () => {
    if (!user) {
      client.auth.toLogin();
      return;
    }
    try {
      await client.entities.reviews.create({
        data: {
          chef_id: Number(id),
          rating: reviewRating,
          comment: reviewComment,
          comment_fa: locale === 'fa' ? reviewComment : '',
        },
      });
      toast.success(locale === 'fa' ? 'نظر شما ثبت شد' : locale === 'fr' ? 'Avis soumis' : 'Review submitted');
      setShowReviewForm(false);
      setReviewComment('');
      loadChefData();
    } catch (e) {
      toast.error('Failed to submit review');
    }
  };

  const getName = (item: any) => {
    if (locale === 'fa') return item.name_fa || item.title_fa || item.name || item.title || '';
    return item.name || item.title || '';
  };

  const getDesc = (item: any) => {
    if (locale === 'fa') return item.bio_fa || item.description_fa || item.bio || item.description || '';
    return item.bio || item.description || '';
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 w-full max-w-2xl px-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-muted rounded" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!chef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Chef not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('backToHome')}
          </Button>
          <DishBarLogo size="sm" />
          <Button variant="outline" size="sm" onClick={() => navigate('/checkout')} className="cursor-pointer relative">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Chef Profile Header */}
      <section className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img
              src={chef.avatar_url || 'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stochuycaiza/default-chef-avatar.png'}
              alt={chef.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-primary/20"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold">{getName(chef)}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavourite}
                  className="cursor-pointer"
                >
                  <Heart className={`w-6 h-6 ${isFavourited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {chef.city}, {chef.province}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-foreground">{chef.rating?.toFixed(1)}</span>
                  ({chef.total_reviews} {t('reviews')})
                </span>
              </div>
              <p className="text-muted-foreground mt-3 max-w-2xl">{getDesc(chef)}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {chef.cuisine_tags?.split(',').map((tag) => (
                  <Badge key={tag} variant="secondary" className="capitalize">{tag.trim()}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {chef.delivery_options?.split(',').map((opt) => (
                  <Badge key={opt} variant="outline" className="text-xs">
                    {opt.trim() === 'pickup' ? t('pickup') : opt.trim() === 'self_delivery' ? t('selfDelivery') : t('thirdParty')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold mb-6">{t('menu')}</h2>
          {menuItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('noResults')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item, idx) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0">
                      <img
                        src={item.image_url || getFoodPlaceholder(idx)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{getName(item)}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{getDesc(item)}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.dietary_tags?.split(',').map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs capitalize">{tag.trim()}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-primary">${item.price.toFixed(2)}</span>
                        {getItemQuantity(item.id) > 0 ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8 cursor-pointer"
                              onClick={() => {
                                const cart = getCart();
                                const existing = cart.find((c) => c.id === item.id);
                                if (existing && existing.quantity > 1) {
                                  existing.quantity -= 1;
                                  localStorage.setItem('dishbar-cart', JSON.stringify(cart));
                                  setCartItems([...cart]);
                                } else {
                                  const filtered = cart.filter((c) => c.id !== item.id);
                                  localStorage.setItem('dishbar-cart', JSON.stringify(filtered));
                                  setCartItems(filtered);
                                }
                              }}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium w-6 text-center">{getItemQuantity(item.id)}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="w-8 h-8 cursor-pointer"
                              onClick={() => handleAddToCart(item)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => handleAddToCart(item)} className="cursor-pointer">
                            <Plus className="w-4 h-4 mr-1" /> {t('addToCart')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="py-8 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">{t('reviews')} ({reviews.length})</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => user ? setShowReviewForm(!showReviewForm) : client.auth.toLogin()}
              className="cursor-pointer"
            >
              {t('writeReview')}
            </Button>
          </div>

          {showReviewForm && (
            <Card className="mb-6">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="cursor-pointer"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder={locale === 'fa' ? 'نظر خود را بنویسید...' : locale === 'fr' ? 'Écrivez votre avis...' : 'Write your review...'}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                <Button onClick={handleSubmitReview} className="cursor-pointer">{t('submitReview')}</Button>
              </CardContent>
            </Card>
          )}

          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {locale === 'fa' ? 'هنوز نظری ثبت نشده' : locale === 'fr' ? 'Pas encore d\'avis' : 'No reviews yet'}
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                        ))}
                      </div>
                      {review.created_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString(locale === 'fa' ? 'fa-IR' : locale === 'fr' ? 'fr-CA' : 'en-CA')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">
                      {locale === 'fa' ? review.comment_fa || review.comment : review.comment}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <span className="font-medium">{cartCount} {locale === 'fa' ? 'مورد' : locale === 'fr' ? 'articles' : 'items'}</span>
              <span className="text-muted-foreground mx-2">•</span>
              <span className="font-bold text-primary">${cartTotal.toFixed(2)}</span>
            </div>
            <Button onClick={() => navigate('/checkout')} className="cursor-pointer">
              <ShoppingCart className="w-4 h-4 mr-2" /> {t('checkout')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}