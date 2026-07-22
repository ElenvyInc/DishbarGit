import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Star, Search, Users, ShieldCheck, ChefHat, Truck, Heart,
  Menu, X, ShoppingCart, Clock, DollarSign, Award, MessageCircle,
  ChevronDown, ChevronUp, Utensils, UserPlus
} from 'lucide-react';
import { client, t, getLocale, setLocale, getCart, type Locale } from '@/lib/api';
import DishBarLogo from '@/components/DishBarLogo';

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
  chef_name?: string;
  chef_name_fa?: string;
  chef_avatar?: string;
  chef_city?: string;
}

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

// FAQ data
const FAQ_DATA = [
  {
    q: 'What is DishBar?',
    a: 'DishBar is a trusted marketplace connecting local home chefs with customers looking for authentic homemade meals. We create economic opportunities for home chefs while helping customers discover fresh food prepared by people in their communities.',
  },
  {
    q: 'How do I become a home chef?',
    a: 'Click "Become a Home Chef", create your profile, set up your menu with prices, and go live! You\'ll need a valid Food Handler Certificate and to comply with Ontario home food regulations.',
  },
  {
    q: 'Is the food safe?',
    a: 'Absolutely. Every chef is verified, must hold a Food Handler Certificate, and follows Ontario Regulation 493/17 for home-prepared food. We also track every order and have transparent customer reviews.',
  },
  {
    q: 'How much does it cost?',
    a: 'Browsing and signing up is free. You only pay when you order. Prices are set by individual chefs. There\'s a small service fee added at checkout.',
  },
  {
    q: 'What areas do you serve?',
    a: 'We currently serve communities across Ontario, Canada. Check individual chef profiles to see their delivery areas and pickup options.',
  },
];

// Testimonials
const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Customer',
    text: 'Finally, homemade food that tastes like my grandmother used to make! The chef was so friendly and the delivery was prompt.',
    rating: 5,
  },
  {
    name: 'Maryam K.',
    role: 'Home Chef',
    text: 'DishBar helped me turn my passion for cooking into real income. I earn $2,000+ per month cooking from my own kitchen!',
    rating: 5,
  },
  {
    name: 'David L.',
    role: 'Customer',
    text: 'So much better than restaurant food. You can taste the love and care in every dish. Plus I love supporting local families.',
    rating: 5,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const locale = getLocale();
  const isRtl = locale === 'fa';

  useEffect(() => {
    loadData();
    checkAuth();
    setCartCount(getCart().reduce((sum, i) => sum + i.quantity, 0));
  }, []);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) setUser(res.data);
    } catch (e) {
      // Not authenticated
    }
  };

  const loadData = async () => {
    try {
      const [chefsRes, menuRes] = await Promise.all([
        client.apiCall.invoke({ url: '/api/v1/public/chefs', method: 'GET', data: {} }),
        client.apiCall.invoke({ url: '/api/v1/public/menu', method: 'GET', data: {} }),
      ]);
      setChefs(chefsRes.data?.items || []);
      setMenuItems(menuRes.data?.items || []);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const getName = (item: { name?: string; name_fa?: string; title?: string; title_fa?: string }) => {
    if (locale === 'fa') return item.name_fa || item.title_fa || item.name || item.title || '';
    return item.name || item.title || '';
  };

  const getDesc = (item: { bio?: string; bio_fa?: string; description?: string; description_fa?: string }) => {
    if (locale === 'fa') return item.bio_fa || item.description_fa || item.bio || item.description || '';
    return item.bio || item.description || '';
  };

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Navigation - Marketplace Style */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <DishBarLogo size="md" />

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-5">
              <button onClick={() => document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {t('browseChefs')}
              </button>
              <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {t('howItWorks')}
              </button>
              <button onClick={() => navigate('/become-a-chef')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {t('becomeChefShort')}
              </button>
              <a href="/blog/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {t('blog')}
              </a>
              <button onClick={() => document.getElementById('safety')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {t('safety')}
              </button>
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 border rounded-lg p-1">
                {(['en', 'fa', 'fr'] as Locale[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`px-2 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {l === 'en' ? 'EN' : l === 'fa' ? 'فا' : 'FR'}
                  </button>
                ))}
              </div>

              {/* Cart */}
              <Button variant="ghost" size="sm" onClick={() => navigate('/checkout')} className="relative cursor-pointer">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {user ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/account')} className="cursor-pointer">
                    {t('myProfile')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="cursor-pointer">
                    {t('chefDashboard')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => client.auth.toLogin()} className="cursor-pointer">
                    {t('login')}
                  </Button>
                  <Button size="sm" onClick={() => client.auth.toLogin()} className="cursor-pointer">
                    {t('signup')}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button className="lg:hidden cursor-pointer" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background p-4 space-y-3">
            <button onClick={() => { document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block w-full text-left text-sm font-medium py-2 cursor-pointer">
              {t('browseChefs')}
            </button>
            <button onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }} className="block w-full text-left text-sm font-medium py-2 cursor-pointer">
              {t('howItWorks')}
            </button>
            <button onClick={() => { navigate('/become-a-chef'); setMobileMenuOpen(false); }} className="block w-full text-left text-sm font-medium py-2 cursor-pointer">
              {t('becomeChef')}
            </button>
            <a href="/blog/" className="block w-full text-left text-sm font-medium py-2 cursor-pointer">
              {t('blog')}
            </a>
            <div className="flex gap-1 border rounded-lg p-1 w-fit">
              {(['en', 'fa', 'fr'] as Locale[]).map((l) => (
                <button key={l} onClick={() => setLocale(l)} className={`px-2 py-1 text-xs rounded font-medium cursor-pointer ${locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {l === 'en' ? 'EN' : l === 'fa' ? 'فا' : 'FR'}
                </button>
              ))}
            </div>
            {user ? (
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/account')} className="w-full cursor-pointer">{t('myProfile')}</Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="w-full cursor-pointer">{t('chefDashboard')}</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button variant="ghost" size="sm" onClick={() => client.auth.toLogin()} className="w-full cursor-pointer">{t('login')}</Button>
                <Button size="sm" onClick={() => client.auth.toLogin()} className="w-full cursor-pointer">{t('signup')}</Button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-background to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground">
                {t('tagline')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                {t('heroSubtitle')}
              </p>

              {/* Dual CTA - The core marketplace split */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/become-a-chef')}
                  className="cursor-pointer text-base font-semibold px-6 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <ChefHat className="w-5 h-5" />
                  {t('becomeChef')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' })}
                  className="cursor-pointer text-base font-semibold px-6 gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Utensils className="w-5 h-5" />
                  {t('browseMeals')}
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{t('verifiedChefs')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  <span>{t('freshHomemade')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>{t('securePayments')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="w-4 h-4 text-orange-500" />
                  <span>{t('localDelivery')}</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <img
                src="https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-18/sxv67sacaiyq/hero-marketplace-chef-handoff.png"
                alt="Home chef handing meal to customer"
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              {/* Floating stats card */}
              <div className="absolute -bottom-4 -left-4 bg-card border rounded-2xl p-4 shadow-lg hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">500+</p>
                    <p className="text-xs text-muted-foreground">Happy customers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW DISHBAR WORKS ===== */}
      <section id="how-it-works" className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('howItWorks')}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you want to order homemade meals or earn income cooking, DishBar makes it simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Customer Journey */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                {t('howItWorksCustomerTitle')}
              </h3>
              <div className="space-y-4">
                {[
                  { icon: Search, title: t('step1Title'), desc: t('step1Desc') },
                  { icon: ShoppingCart, title: t('step2Title'), desc: t('step2Desc') },
                  { icon: Heart, title: t('step3Title'), desc: t('step3Desc') },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chef Journey */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-accent" />
                {t('howItWorksChefTitle')}
              </h3>
              <div className="space-y-4">
                {[
                  { icon: UserPlus, title: t('chefStep1'), desc: 'Set up your storefront with your story, specialties, and pricing' },
                  { icon: MessageCircle, title: t('chefStep2'), desc: 'Get notified when customers order from your menu' },
                  { icon: DollarSign, title: t('chefStep3'), desc: 'Prepare meals, arrange delivery, and earn 85% of each sale' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <step.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BECOME A CHEF CTA ===== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-18/sxv7cbicai2q/chef-earnings-freedom.png"
                alt="Home chef earning income"
                className="w-full h-auto rounded-3xl shadow-lg"
              />
            </div>
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                🍳 {t('howItWorksChefTitle')}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                {t('becomeChefTitle')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('becomeChefDesc')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{t('flexibleSchedule')}</p>
                    <p className="text-xs text-muted-foreground">{t('flexibleScheduleDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{t('keepEarnings')}</p>
                    <p className="text-xs text-muted-foreground">{t('keepEarningsDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{t('growBusiness')}</p>
                    <p className="text-xs text-muted-foreground">{t('growBusinessDesc')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{t('joinCommunity')}</p>
                    <p className="text-xs text-muted-foreground">{t('joinCommunityDesc')}</p>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/become-a-chef')}
                className="cursor-pointer text-base font-semibold px-8 gap-2"
              >
                <ChefHat className="w-5 h-5" />
                {t('startEarning')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BROWSE LOCAL CHEFS ===== */}
      <section id="chefs" className="py-20 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">{t('featuredChefs')}</h2>
              <p className="text-muted-foreground mt-2">Meet the talented people behind your next meal</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-muted mx-auto" />
                    <div className="h-5 bg-muted rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chefs.map((chef) => (
                <Card
                  key={chef.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/30 overflow-hidden"
                  onClick={() => navigate(`/chef/${chef.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <img
                          src={chef.avatar_url || 'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stochuycaiza/default-chef-avatar.png'}
                          alt={chef.name}
                          className="w-20 h-20 rounded-full object-cover border-3 border-primary/20 group-hover:border-primary/50 transition-colors"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <ShieldCheck className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                          {getName(chef)}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {chef.city}{chef.province ? `, ${chef.province}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold">{chef.rating?.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">({chef.total_reviews} {t('reviews')})</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {getDesc(chef)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {chef.cuisine_tags?.split(',').slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs capitalize">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== POPULAR MEALS ===== */}
      <section id="meals" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('popularDishes')}</h2>
            <p className="text-muted-foreground mt-2">Fresh homemade meals prepared by local chefs today</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">{t('noResults')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.slice(0, 6).map((item, idx) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/chef/${item.chef_id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.image_url || getFoodPlaceholder(idx)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-background/90 text-foreground backdrop-blur-sm font-bold">
                        ${item.price.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">
                      {getName(item)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {getDesc(item)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.chef_avatar && (
                          <img src={item.chef_avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <span className="text-xs text-muted-foreground font-medium">
                          {locale === 'fa' ? item.chef_name_fa || item.chef_name : item.chef_name}
                        </span>
                      </div>
                      {item.dietary_tags && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.dietary_tags.split(',')[0]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURED HOME CHEF ===== */}
      <section className="py-20 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('featuredChefTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <img
              src="https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-18/sxv7bhqcaiyq/featured-chef-portrait-home.png"
              alt="Featured home chef"
              className="w-full max-w-md mx-auto rounded-3xl shadow-lg"
            />
            <div className="space-y-6">
              <blockquote className="text-xl italic text-muted-foreground border-l-4 border-primary pl-4">
                "Cooking has always been my passion. DishBar gave me the platform to share my grandmother's recipes with the community while earning a living from home."
              </blockquote>
              <div>
                <p className="font-bold text-lg">Maryam Hosseini</p>
                <p className="text-muted-foreground">Home Chef · Toronto, Ontario</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">150+</p>
                  <p className="text-xs text-muted-foreground">Orders completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">4.9</p>
                  <p className="text-xs text-muted-foreground">Average rating</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">92%</p>
                  <p className="text-xs text-muted-foreground">Repeat customers</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => chefs[0] && navigate(`/chef/${chefs[0].id}`)} className="cursor-pointer">
                View Chef Profile →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CUSTOMER TESTIMONIALS ===== */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('testimonialsTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SAFETY & TRUST ===== */}
      <section id="safety" className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('trustTitle')}</h2>
            <p className="text-lg text-muted-foreground mt-2">{t('trustSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: t('verifiedChefs'), desc: 'Every chef passes identity verification and background checks' },
              { icon: Award, title: t('foodSafety'), desc: 'Food Handler Certificates required. Ontario Regulation 493/17 compliant' },
              { icon: DollarSign, title: t('securePayments'), desc: 'Stripe-powered payments. Your money is protected until delivery' },
              { icon: Star, title: t('transparentReviews'), desc: 'Real reviews from real customers. No fake ratings allowed' },
              { icon: Users, title: t('communityTrust'), desc: 'Built on community. Chefs are your neighbours, not strangers' },
              { icon: Heart, title: t('repeatCustomers'), desc: '85% of customers reorder. That\'s trust you can taste' },
            ].map((item, i) => (
              <Card key={i} className="border-border/50 hover:shadow-md transition-shadow">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('faqTitle')}</h2>
          </div>
          <div className="space-y-3">
            {FAQ_DATA.map((faq, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left font-semibold hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-muted-foreground">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Whether you're looking for homemade meals or want to earn income cooking, DishBar is your community marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/become-a-chef')}
              className="cursor-pointer text-base font-semibold px-8 gap-2"
            >
              <ChefHat className="w-5 h-5" />
              {t('becomeChef')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' })}
              className="cursor-pointer text-base font-semibold px-8 gap-2 !bg-transparent border-primary-foreground text-primary-foreground hover:!bg-primary-foreground/10"
            >
              <Utensils className="w-5 h-5" />
              {t('browseMeals')}
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <DishBarLogo size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                A trusted marketplace connecting local home chefs with customers looking for authentic homemade meals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('customers')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => document.getElementById('chefs')?.scrollIntoView({ behavior: 'smooth' })}>{t('browseChefs')}</li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>{t('howItWorks')}</li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => document.getElementById('safety')?.scrollIntoView({ behavior: 'smooth' })}>{t('safety')}</li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/legal/terms')}>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('chefs')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/become-a-chef')}>{t('becomeChef')}</li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/dashboard')}>{t('chefDashboard')}</li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/legal/chef-agreement')}>Chef Agreement</li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/legal/food-safety')}>Food Safety</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">{t('brand')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="cursor-pointer hover:text-foreground transition-colors">
                  <a href="/blog/">{t('blog')}</a>
                </li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/legal/privacy')}>Privacy Policy</li>
                <li className="cursor-pointer hover:text-foreground transition-colors" onClick={() => navigate('/legal/contact')}>{t('contact')}</li>
              </ul>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">{t('language')}</h4>
                <div className="flex gap-2">
                  {(['en', 'fa', 'fr'] as Locale[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLocale(l)}
                      className={`text-xs cursor-pointer transition-colors px-2 py-1 rounded ${locale === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {l === 'en' ? '🇬🇧 EN' : l === 'fa' ? '🇮🇷 فا' : '🇫🇷 FR'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2026 DishBar. All rights reserved. A marketplace for homemade food in Ontario, Canada.
          </div>
        </div>
      </footer>
    </div>
  );
}