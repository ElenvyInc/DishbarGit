import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, ChefHat, ChevronDown, ChevronUp, DollarSign, Heart,
  Menu, Search, ShieldCheck, ShoppingCart, Truck, UserPlus, Users,
  Utensils, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import DishBarLogo from '@/components/DishBarLogo';
import { client, getCart, getLocale, setLocale, t, type Locale } from '@/lib/api';

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
  chef_name?: string;
  chef_name_fa?: string;
}

const FOOD_IMAGES = [
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocfpacaizq/menu-item-koobideh-kebab.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocf5ycaiza/menu-item-ghormeh-sabzi.png',
  'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stocgmqcai2q/menu-item-tahdig-saffron-rice.png',
];

const localeLabels: Record<Locale, string> = { en: 'EN', fa: 'فا', fr: 'FR' };

export default function HomePage() {
  const navigate = useNavigate();
  const locale = getLocale();
  const rtl = locale === 'fa';
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [meals, setMeals] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<unknown>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const cartCount = getCart().reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    document.title = 'DishBar | Homemade Food from Local Home Chefs in Ontario';
    Promise.all([
      client.apiCall.invoke({ url: '/api/v1/public/chefs', method: 'GET', data: {} }),
      client.apiCall.invoke({ url: '/api/v1/public/menu', method: 'GET', data: {} }),
    ]).then(([chefResponse, menuResponse]) => {
      setChefs(chefResponse.data?.items || []);
      setMeals(menuResponse.data?.items || []);
    }).catch(() => undefined).finally(() => setLoading(false));

    client.auth.me().then((response: { data?: unknown }) => setUser(response?.data || null)).catch(() => undefined);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const name = (item: Chef | MenuItem) => locale === 'fa'
    ? ('name_fa' in item ? item.name_fa || item.name : item.title_fa || item.title)
    : ('name' in item ? item.name : item.title);

  const description = (item: Chef | MenuItem) => locale === 'fa'
    ? ('bio_fa' in item ? item.bio_fa || item.bio : item.description_fa || item.description)
    : ('bio' in item ? item.bio : item.description);

  const languagePicker = (
    <div className="flex items-center gap-1 border rounded-lg p-1" aria-label={t('language')}>
      {(['en', 'fa', 'fr'] as Locale[]).map((item) => (
        <button
          key={item}
          onClick={() => setLocale(item)}
          className={`px-2 py-1 text-xs rounded font-medium cursor-pointer ${locale === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          aria-pressed={locale === item}
        >
          {localeLabels[item]}
        </button>
      ))}
    </div>
  );

  const faqs = [1, 2, 3, 4, 5].map((number) => ({
    question: t(`faq${number}Q` as 'faq1Q'),
    answer: t(`faq${number}A` as 'faq1A'),
  }));

  return (
    <div className="min-h-screen bg-background" dir={rtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} aria-label={t('brand')}><DishBarLogo size="md" /></button>
          <nav className="hidden lg:flex items-center gap-5">
            <button onClick={() => scrollTo('marketplace')} className="text-sm font-medium text-muted-foreground hover:text-foreground">{t('browseChefs')}</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-muted-foreground hover:text-foreground">{t('howItWorks')}</button>
            <button onClick={() => navigate('/become-a-chef')} className="text-sm font-medium text-muted-foreground hover:text-foreground">{t('becomeChefShort')}</button>
            <button onClick={() => scrollTo('safety')} className="text-sm font-medium text-muted-foreground hover:text-foreground">{t('safety')}</button>
            <a href="/blog/" className="text-sm font-medium text-muted-foreground hover:text-foreground">{t('blog')}</a>
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            {languagePicker}
            <Button variant="ghost" size="sm" onClick={() => navigate('/checkout')} className="relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 rounded-full bg-primary text-primary-foreground text-xs w-5 h-5">{cartCount}</span>}
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => navigate('/account')}>{t('myProfile')}</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>{t('login')}</Button>
                <Button size="sm" onClick={() => navigate('/signup')}>{t('signup')}</Button>
              </>
            )}
          </div>
          <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t bg-background p-4 grid gap-3">
            <button onClick={() => scrollTo('marketplace')} className="text-start py-2">{t('browseChefs')}</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-start py-2">{t('howItWorks')}</button>
            <button onClick={() => navigate('/become-a-chef')} className="text-start py-2">{t('becomeChefShort')}</button>
            <button onClick={() => scrollTo('safety')} className="text-start py-2">{t('safety')}</button>
            <a href="/blog/" className="py-2">{t('blog')}</a>
            {languagePicker}
            <Button variant="ghost" onClick={() => navigate('/login')}>{t('login')}</Button>
            <Button onClick={() => navigate('/signup')}>{t('signup')}</Button>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-background to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Badge variant="secondary">{t('launchOntario')}</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">{t('tagline')}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg">{t('heroSubtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate('/become-a-chef')} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <ChefHat className="w-5 h-5" />{t('becomeChef')}
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollTo('marketplace')} className="gap-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                <Utensils className="w-5 h-5" />{t('browseMeals')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex gap-2"><ShieldCheck className="w-4 h-4 text-amber-600" />{t('reviewedChefs')}</span>
              <span className="flex gap-2"><DollarSign className="w-4 h-4 text-amber-600" />{t('securePayments')}</span>
              <span className="flex gap-2"><Users className="w-4 h-4 text-orange-500" />{t('foundingChefs')}</span>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-18/sxv67sacaiyq/hero-marketplace-chef-handoff.png"
              alt={t('heroAlt')}
              className="w-full rounded-3xl shadow-2xl"
            />
            <div className="absolute -bottom-4 -left-4 bg-card border rounded-2xl p-4 shadow-lg hidden md:flex items-center gap-3">
              <Users className="w-6 h-6 text-green-700" />
              <div><p className="font-bold">{t('firstCustomers')}</p><p className="text-xs text-muted-foreground">{t('launchOntario')}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('howItWorks')}</h2>
            <p className="text-muted-foreground text-lg">{t('howIntro')}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {[
              { heading: t('howItWorksCustomerTitle'), icon: Utensils, steps: [[Search, t('step1Title'), t('step1Desc')], [ShoppingCart, t('step2Title'), t('step2Desc')], [Truck, t('step3Title'), t('step3Desc')]] },
              { heading: t('howItWorksChefTitle'), icon: ChefHat, steps: [[UserPlus, t('chefStep1'), t('chefStep1Desc')], [ShieldCheck, t('chefStep2'), t('chefStep2Desc')], [Award, t('chefStep3'), t('chefStep3Desc')]] },
            ].map((journey) => (
              <div key={journey.heading} className="space-y-6">
                <h3 className="text-xl font-bold flex gap-2"><journey.icon className="w-5 h-5 text-primary" />{journey.heading}</h3>
                {journey.steps.map(([Icon, title, body]) => (
                  <div key={String(title)} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-primary" /></div>
                    <div><h4 className="font-semibold">{String(title)}</h4><p className="text-sm text-muted-foreground">{String(body)}</p></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <img src="https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-18/sxv7cbicai2q/chef-earnings-freedom.png" alt={t('chefAlt')} className="w-full rounded-3xl shadow-lg" />
          <div className="space-y-6">
            <Badge variant="secondary">{t('foundingChefs')}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">{t('becomeChefTitle')}</h2>
            <p className="text-lg text-muted-foreground">{t('becomeChefDesc')}</p>
            <div className="grid grid-cols-2 gap-4">
              {[[Award, 'flexibleSchedule', 'flexibleScheduleDesc'], [DollarSign, 'keepEarnings', 'keepEarningsDesc'], [ChefHat, 'growBusiness', 'growBusinessDesc'], [Users, 'joinCommunity', 'joinCommunityDesc']].map(([Icon, title, body]) => (
                <div key={String(title)} className="flex gap-3"><Icon className="w-5 h-5 text-primary shrink-0" /><div><p className="font-semibold text-sm">{t(title as 'flexibleSchedule')}</p><p className="text-xs text-muted-foreground">{t(body as 'flexibleScheduleDesc')}</p></div></div>
              ))}
            </div>
            <Button size="lg" onClick={() => navigate('/become-a-chef')} className="gap-2"><ChefHat className="w-5 h-5" />{t('startEarning')}</Button>
          </div>
        </div>
      </section>

      <section id="marketplace" className="py-20 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold">{t('featuredChefs')}</h2>
          <p className="text-muted-foreground mt-2 mb-10">{t('launchOntario')}</p>
          {!loading && chefs.length === 0 && meals.length === 0 ? (
            <Card><CardContent className="py-12 text-center space-y-5"><Utensils className="w-10 h-10 text-primary mx-auto" /><p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t('noResults')}</p><Button onClick={() => client.auth.toLogin()}>{t('signup')}</Button></CardContent></Card>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {chefs.map((chef) => (
                  <Card key={chef.id} className="cursor-pointer hover:shadow-md" onClick={() => navigate(`/chef/${chef.id}`)}>
                    <CardContent className="p-6 text-center space-y-3">
                      <img src={chef.avatar_url || 'https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-16/stochuycaiza/default-chef-avatar.png'} alt={name(chef)} className="w-20 h-20 rounded-full object-cover mx-auto" />
                      <h3 className="font-bold">{name(chef)}</h3>
                      <p className="text-sm text-muted-foreground">{chef.city}{chef.province ? `, ${chef.province}` : ''}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{description(chef)}</p>
                      <span className="text-sm font-medium text-primary">{t('viewChefProfile')}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                {meals.slice(0, 6).map((meal, index) => (
                  <Card key={meal.id} className="overflow-hidden cursor-pointer" onClick={() => navigate(`/chef/${meal.chef_id}`)}>
                    <img src={meal.image_url || FOOD_IMAGES[index % FOOD_IMAGES.length]} alt={name(meal)} className="w-full h-48 object-cover" />
                    <CardContent className="p-4"><h3 className="font-bold">{name(meal)}</h3><p className="text-sm text-muted-foreground line-clamp-2">{description(meal)}</p><p className="font-bold mt-2">${meal.price.toFixed(2)}</p></CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <img src="https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-18/sxv7bhqcaiyq/featured-chef-portrait-home.png" alt={t('applicationAlt')} className="w-full max-w-md mx-auto rounded-3xl shadow-lg" />
          <div className="space-y-6"><h2 className="text-3xl md:text-4xl font-bold">{t('featuredChefTitle')}</h2><p className="text-lg text-muted-foreground">{t('featuredChefBody')}</p><Button variant="outline" onClick={() => navigate('/become-a-chef')}>{t('startEarning')}</Button></div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">{t('reviewTitle')}</h2>
          <p className="text-lg text-muted-foreground mt-4">{t('reviewIntro')}</p>
        </div>
      </section>

      <section id="safety" className="py-20 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold">{t('trustTitle')}</h2><p className="text-lg text-muted-foreground mt-2">{t('trustSubtitle')}</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[[ShieldCheck, 'reviewedChefs', 'reviewedChefsDesc'], [Award, 'foodSafety', 'foodSafetyDesc'], [DollarSign, 'securePayments', 'securePaymentsDesc'], [Heart, 'clearInformation', 'clearInformationDesc']].map(([Icon, title, body]) => (
              <Card key={String(title)}><CardContent className="p-6 space-y-3"><Icon className="w-7 h-7 text-primary" /><h3 className="font-bold">{t(title as 'reviewedChefs')}</h3><p className="text-sm text-muted-foreground">{t(body as 'reviewedChefsDesc')}</p></CardContent></Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('faqTitle')}</h2>
          <div className="space-y-3">
            {faqs.map((item, index) => (
              <div key={item.question} className="border rounded-xl overflow-hidden">
                <button onClick={() => setFaq(faq === index ? null : index)} className="w-full flex justify-between p-5 text-start font-semibold hover:bg-secondary/30">
                  <span>{item.question}</span>{faq === index ? <ChevronUp /> : <ChevronDown />}
                </button>
                {faq === index && <div className="px-5 pb-5 text-muted-foreground">{item.answer}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">{t('readyTitle')}</h2>
          <p className="text-lg opacity-80 my-6">{t('readyBody')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate('/become-a-chef')}>{t('becomeChef')}</Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo('marketplace')} className="!bg-transparent !hover:bg-transparent border-primary-foreground text-primary-foreground">{t('browseMeals')}</Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
          <div><DishBarLogo size="sm" /><p className="text-sm text-muted-foreground mt-4">{t('footerBody')}</p></div>
          <div><h3 className="font-semibold mb-3">{t('customers')}</h3><ul className="space-y-2 text-sm text-muted-foreground"><li><button onClick={() => scrollTo('marketplace')}>{t('browseChefs')}</button></li><li><button onClick={() => scrollTo('how-it-works')}>{t('howItWorks')}</button></li><li><button onClick={() => scrollTo('safety')}>{t('safety')}</button></li><li><button onClick={() => navigate('/legal/terms')}>{t('terms')}</button></li><li><button onClick={() => navigate('/legal/refund')}>{t('refundPolicy')}</button></li></ul></div>
          <div><h3 className="font-semibold mb-3">{t('chefs')}</h3><ul className="space-y-2 text-sm text-muted-foreground"><li><button onClick={() => navigate('/become-a-chef')}>{t('becomeChefShort')}</button></li><li><button onClick={() => navigate('/legal/chef-agreement')}>{t('chefAgreement')}</button></li><li><button onClick={() => navigate('/legal/food-safety')}>{t('foodSafetyRequirements')}</button></li></ul></div>
          <div><h3 className="font-semibold mb-3">{t('brand')}</h3><ul className="space-y-2 text-sm text-muted-foreground"><li><a href="/blog/">{t('blog')}</a></li><li><button onClick={() => navigate('/legal/privacy')}>{t('privacy')}</button></li><li><button onClick={() => navigate('/legal/contact')}>{t('contact')}</button></li></ul><div className="mt-4">{languagePicker}</div></div>
        </div>
        <p className="border-t max-w-7xl mx-auto mt-8 pt-8 px-4 text-center text-sm text-muted-foreground">© 2026 DishBar. {t('rights')}</p>
      </footer>
    </div>
  );
}