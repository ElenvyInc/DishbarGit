import { createClient } from '@metagptx/web-sdk';

export const client = createClient();

// ============ i18n / Translations ============
export type Locale = 'en' | 'fa' | 'fr';

export const translations = {
  en: {
    brand: 'DishBar',
    tagline: 'Homemade Meals From Trusted Home Chefs Near You',
    heroSubtitle: 'Craving real homemade food? Discover authentic dishes prepared by talented home chefs in your community. Order with confidence, support local families, or earn money by sharing your own cooking.',
    searchPlaceholder: 'Search meals, chefs, or cuisines...',
    browseChefs: 'Browse Chefs',
    browseMeals: 'Find Homemade Food',
    viewMenu: 'View Menu',
    orderNow: 'Order Now',
    becomeChef: 'Start Selling Homemade Meals',
    becomeChefShort: 'Become a Chef',
    login: 'Sign In',
    signup: 'Sign Up',
    logout: 'Sign Out',
    categories: 'Categories',
    allDishes: 'All Dishes',
    stews: 'Stews',
    kebabs: 'Kebabs',
    rice: 'Rice Dishes',
    desserts: 'Desserts',
    bread: 'Bread',
    featuredChefs: 'Local Home Chefs',
    popularDishes: 'Popular Meals',
    reviews: 'Reviews',
    rating: 'Rating',
    delivery: 'Delivery',
    pickup: 'Pickup',
    selfDelivery: 'Chef Delivery',
    thirdParty: 'Third-Party Delivery',
    addToCart: 'Add to Cart',
    cart: 'Cart',
    checkout: 'Checkout',
    total: 'Total',
    orderHistory: 'Order History',
    myProfile: 'My Profile',
    chefDashboard: 'Chef Dashboard',
    adminPanel: 'Admin Panel',
    menu: 'Menu',
    about: 'About',
    contact: 'Contact',
    howItWorks: 'How It Works',
    customers: 'Customers',
    chefs: 'Chefs',
    safety: 'Safety',
    support: 'Support',
    blog: 'Blog',
    step1Title: 'Discover Local Chefs',
    step1Desc: 'Browse verified home chefs in your neighbourhood and explore their homemade menus',
    step2Title: 'Order with Confidence',
    step2Desc: 'Choose your meals, read reviews, and place your order securely',
    step3Title: 'Enjoy Homemade Food',
    step3Desc: 'Fresh meals prepared with love, delivered to your door or ready for pickup',
    noResults: 'No results found',
    loading: 'Loading...',
    paymentSuccess: 'Payment Successful!',
    paymentSuccessMsg: 'Your order has been placed successfully.',
    backToHome: 'Back to Home',
    price: 'Price',
    quantity: 'Quantity',
    subtotal: 'Subtotal',
    commission: 'Service Fee',
    deliveryFee: 'Delivery Fee',
    placeOrder: 'Place Order',
    orderConfirmed: 'Order Confirmed',
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    writeReview: 'Write a Review',
    submitReview: 'Submit Review',
    language: 'Language',
    english: 'English',
    french: 'Français',
    persian: 'فارسی',
    // V2 Marketplace
    heroChefCta: 'Earn income doing what you love',
    heroCustomerCta: 'Discover authentic meals by trusted local chefs',
    howItWorksChefTitle: 'For Home Chefs',
    howItWorksCustomerTitle: 'For Customers',
    chefStep1: 'Create your profile and menu',
    chefStep2: 'Receive orders from local customers',
    chefStep3: 'Cook, deliver, and earn',
    trustTitle: 'Safety & Trust',
    trustSubtitle: 'Every chef is verified. Every meal is tracked. Every payment is secure.',
    faqTitle: 'Frequently Asked Questions',
    testimonialsTitle: 'What Our Community Says',
    featuredChefTitle: 'Featured Home Chef',
    becomeChefTitle: 'Turn Your Passion Into Income',
    becomeChefDesc: 'Join hundreds of home chefs earning flexible income by sharing their homemade meals with the community.',
    incomeCalcTitle: 'Income Calculator',
    incomeCalcDesc: 'See how much you could earn as a DishBar home chef',
    mealsPerWeek: 'Meals per week',
    avgPrice: 'Average price per meal',
    estimatedEarnings: 'Estimated monthly earnings',
    whyJoin: 'Why Join DishBar?',
    flexibleSchedule: 'Flexible Schedule',
    flexibleScheduleDesc: 'Cook when you want. No minimum hours.',
    keepEarnings: 'Keep 85% of Earnings',
    keepEarningsDesc: 'Low 15% platform fee. You set your prices.',
    growBusiness: 'Grow Your Business',
    growBusinessDesc: 'We handle marketing, payments, and customer support.',
    joinCommunity: 'Join a Community',
    joinCommunityDesc: 'Connect with fellow home chefs and food lovers.',
    startEarning: 'Start Earning Today',
    verifiedChefs: 'Verified Home Chefs',
    securePayments: 'Secure Payments',
    freshHomemade: 'Fresh Homemade Meals',
    localDelivery: 'Local Delivery',
    foodSafety: 'Food Safety Certified',
    transparentReviews: 'Transparent Reviews',
    communityTrust: 'Community Trust',
    repeatCustomers: 'Repeat Customers',
  },
  fa: {
    brand: 'دیش‌بار',
    tagline: 'غذای خانگی از آشپزهای مورد اعتماد نزدیک شما',
    heroSubtitle: 'هوس غذای خانگی واقعی دارید؟ غذاهای اصیل آماده‌شده توسط آشپزهای خانگی با استعداد در محله خود را کشف کنید. با اطمینان سفارش دهید، از خانواده‌های محلی حمایت کنید، یا با به اشتراک گذاشتن آشپزی خود درآمد کسب کنید.',
    searchPlaceholder: 'جستجوی غذا، آشپز یا نوع غذا...',
    browseChefs: 'مشاهده آشپزها',
    browseMeals: 'پیدا کردن غذای خانگی',
    viewMenu: 'مشاهده منو',
    orderNow: 'سفارش دهید',
    becomeChef: 'شروع فروش غذای خانگی',
    becomeChefShort: 'آشپز شوید',
    login: 'ورود',
    signup: 'ثبت‌نام',
    logout: 'خروج',
    categories: 'دسته‌بندی‌ها',
    allDishes: 'همه غذاها',
    stews: 'خورش‌ها',
    kebabs: 'کباب‌ها',
    rice: 'پلوها',
    desserts: 'دسرها',
    bread: 'نان',
    featuredChefs: 'آشپزهای خانگی محلی',
    popularDishes: 'غذاهای محبوب',
    reviews: 'نظرات',
    rating: 'امتیاز',
    delivery: 'ارسال',
    pickup: 'دریافت حضوری',
    selfDelivery: 'ارسال توسط آشپز',
    thirdParty: 'ارسال با پیک',
    addToCart: 'افزودن به سبد',
    cart: 'سبد خرید',
    checkout: 'پرداخت',
    total: 'مجموع',
    orderHistory: 'تاریخچه سفارشات',
    myProfile: 'پروفایل من',
    chefDashboard: 'پنل آشپز',
    adminPanel: 'پنل مدیریت',
    menu: 'منو',
    about: 'درباره ما',
    contact: 'تماس',
    howItWorks: 'نحوه کار',
    customers: 'مشتریان',
    chefs: 'آشپزها',
    safety: 'ایمنی',
    support: 'پشتیبانی',
    blog: 'وبلاگ',
    step1Title: 'کشف آشپزهای محلی',
    step1Desc: 'آشپزهای خانگی تأیید شده محله خود و منوهای خانگی آنها را کاوش کنید',
    step2Title: 'سفارش با اطمینان',
    step2Desc: 'غذاهای خود را انتخاب کنید، نظرات را بخوانید و سفارش خود را با امنیت ثبت کنید',
    step3Title: 'از غذای خانگی لذت ببرید',
    step3Desc: 'غذاهای تازه با عشق آماده شده، تحویل درب منزل یا آماده برای دریافت',
    noResults: 'نتیجه‌ای یافت نشد',
    loading: 'در حال بارگذاری...',
    paymentSuccess: 'پرداخت موفق!',
    paymentSuccessMsg: 'سفارش شما با موفقیت ثبت شد.',
    backToHome: 'بازگشت به صفحه اصلی',
    price: 'قیمت',
    quantity: 'تعداد',
    subtotal: 'جمع جزئی',
    commission: 'هزینه خدمات',
    deliveryFee: 'هزینه ارسال',
    placeOrder: 'ثبت سفارش',
    orderConfirmed: 'سفارش تأیید شد',
    pending: 'در انتظار',
    confirmed: 'تأیید شده',
    preparing: 'در حال آماده‌سازی',
    ready: 'آماده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
    writeReview: 'نوشتن نظر',
    submitReview: 'ارسال نظر',
    language: 'زبان',
    english: 'English',
    french: 'Français',
    persian: 'فارسی',
    // V2 Marketplace
    heroChefCta: 'با کاری که دوست دارید درآمد کسب کنید',
    heroCustomerCta: 'غذاهای اصیل از آشپزهای محلی مورد اعتماد',
    howItWorksChefTitle: 'برای آشپزهای خانگی',
    howItWorksCustomerTitle: 'برای مشتریان',
    chefStep1: 'پروفایل و منوی خود را بسازید',
    chefStep2: 'سفارش‌ها را از مشتریان محلی دریافت کنید',
    chefStep3: 'بپزید، تحویل دهید و درآمد کسب کنید',
    trustTitle: 'ایمنی و اعتماد',
    trustSubtitle: 'هر آشپز تأیید شده. هر غذا پیگیری شده. هر پرداخت امن.',
    faqTitle: 'سؤالات متداول',
    testimonialsTitle: 'نظرات جامعه ما',
    featuredChefTitle: 'آشپز خانگی برتر',
    becomeChefTitle: 'علاقه خود را به درآمد تبدیل کنید',
    becomeChefDesc: 'به صدها آشپز خانگی بپیوندید که با اشتراک غذاهای خانگی خود با جامعه، درآمد انعطاف‌پذیر کسب می‌کنند.',
    incomeCalcTitle: 'محاسبه‌گر درآمد',
    incomeCalcDesc: 'ببینید به عنوان آشپز خانگی دیش‌بار چقدر می‌توانید درآمد داشته باشید',
    mealsPerWeek: 'غذا در هفته',
    avgPrice: 'قیمت متوسط هر غذا',
    estimatedEarnings: 'درآمد تخمینی ماهانه',
    whyJoin: 'چرا به دیش‌بار بپیوندید؟',
    flexibleSchedule: 'برنامه انعطاف‌پذیر',
    flexibleScheduleDesc: 'هر وقت خواستید بپزید. بدون حداقل ساعت.',
    keepEarnings: '۸۵٪ درآمد را نگه دارید',
    keepEarningsDesc: 'کارمزد پلتفرم فقط ۱۵٪. شما قیمت‌ها را تعیین می‌کنید.',
    growBusiness: 'کسب‌وکار خود را رشد دهید',
    growBusinessDesc: 'ما بازاریابی، پرداخت‌ها و پشتیبانی مشتری را مدیریت می‌کنیم.',
    joinCommunity: 'به جامعه بپیوندید',
    joinCommunityDesc: 'با آشپزهای خانگی و دوستداران غذا ارتباط برقرار کنید.',
    startEarning: 'همین امروز شروع به کسب درآمد کنید',
    verifiedChefs: 'آشپزهای خانگی تأیید شده',
    securePayments: 'پرداخت‌های امن',
    freshHomemade: 'غذای تازه خانگی',
    localDelivery: 'تحویل محلی',
    foodSafety: 'گواهی ایمنی غذا',
    transparentReviews: 'نظرات شفاف',
    communityTrust: 'اعتماد جامعه',
    repeatCustomers: 'مشتریان وفادار',
  },
  fr: {
    brand: 'DishBar',
    tagline: 'Repas faits maison par des chefs de confiance près de chez vous',
    heroSubtitle: 'Envie de vrais plats faits maison ? Découvrez des plats authentiques préparés par des chefs talentueux dans votre communauté. Commandez en toute confiance, soutenez les familles locales ou gagnez de l\'argent en partageant votre cuisine.',
    searchPlaceholder: 'Rechercher des repas, chefs ou cuisines...',
    browseChefs: 'Parcourir les chefs',
    browseMeals: 'Trouver des plats maison',
    viewMenu: 'Voir le menu',
    orderNow: 'Commander',
    becomeChef: 'Commencer à vendre des plats maison',
    becomeChefShort: 'Devenir chef',
    login: 'Se connecter',
    signup: "S'inscrire",
    logout: 'Se déconnecter',
    categories: 'Catégories',
    allDishes: 'Tous les plats',
    stews: 'Ragoûts',
    kebabs: 'Kebabs',
    rice: 'Plats de riz',
    desserts: 'Desserts',
    bread: 'Pain',
    featuredChefs: 'Chefs à domicile locaux',
    popularDishes: 'Repas populaires',
    reviews: 'Avis',
    rating: 'Note',
    delivery: 'Livraison',
    pickup: 'Retrait',
    selfDelivery: 'Livraison par le chef',
    thirdParty: 'Livraison tierce',
    addToCart: 'Ajouter au panier',
    cart: 'Panier',
    checkout: 'Paiement',
    total: 'Total',
    orderHistory: 'Historique des commandes',
    myProfile: 'Mon profil',
    chefDashboard: 'Tableau de bord chef',
    adminPanel: 'Panneau admin',
    menu: 'Menu',
    about: 'À propos',
    contact: 'Contact',
    howItWorks: 'Comment ça marche',
    customers: 'Clients',
    chefs: 'Chefs',
    safety: 'Sécurité',
    support: 'Support',
    blog: 'Blog',
    step1Title: 'Découvrez les chefs locaux',
    step1Desc: 'Parcourez les chefs à domicile vérifiés et leurs menus faits maison',
    step2Title: 'Commandez en confiance',
    step2Desc: 'Choisissez vos repas, lisez les avis et commandez en sécurité',
    step3Title: 'Savourez le fait maison',
    step3Desc: 'Repas frais préparés avec amour, livrés ou prêts à retirer',
    noResults: 'Aucun résultat trouvé',
    loading: 'Chargement...',
    paymentSuccess: 'Paiement réussi!',
    paymentSuccessMsg: 'Votre commande a été passée avec succès.',
    backToHome: "Retour à l'accueil",
    price: 'Prix',
    quantity: 'Quantité',
    subtotal: 'Sous-total',
    commission: 'Frais de service',
    deliveryFee: 'Frais de livraison',
    placeOrder: 'Passer la commande',
    orderConfirmed: 'Commande confirmée',
    pending: 'En attente',
    confirmed: 'Confirmée',
    preparing: 'En préparation',
    ready: 'Prête',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    writeReview: 'Écrire un avis',
    submitReview: 'Soumettre un avis',
    language: 'Langue',
    english: 'English',
    french: 'Français',
    persian: 'فارسی',
    // V2 Marketplace
    heroChefCta: 'Gagnez un revenu en faisant ce que vous aimez',
    heroCustomerCta: 'Découvrez des repas authentiques par des chefs locaux de confiance',
    howItWorksChefTitle: 'Pour les chefs à domicile',
    howItWorksCustomerTitle: 'Pour les clients',
    chefStep1: 'Créez votre profil et menu',
    chefStep2: 'Recevez des commandes de clients locaux',
    chefStep3: 'Cuisinez, livrez et gagnez',
    trustTitle: 'Sécurité et confiance',
    trustSubtitle: 'Chaque chef est vérifié. Chaque repas est suivi. Chaque paiement est sécurisé.',
    faqTitle: 'Questions fréquentes',
    testimonialsTitle: 'Ce que dit notre communauté',
    featuredChefTitle: 'Chef à domicile en vedette',
    becomeChefTitle: 'Transformez votre passion en revenu',
    becomeChefDesc: 'Rejoignez des centaines de chefs à domicile qui gagnent un revenu flexible en partageant leurs repas faits maison.',
    incomeCalcTitle: 'Calculateur de revenus',
    incomeCalcDesc: 'Voyez combien vous pourriez gagner comme chef DishBar',
    mealsPerWeek: 'Repas par semaine',
    avgPrice: 'Prix moyen par repas',
    estimatedEarnings: 'Revenus mensuels estimés',
    whyJoin: 'Pourquoi rejoindre DishBar?',
    flexibleSchedule: 'Horaire flexible',
    flexibleScheduleDesc: 'Cuisinez quand vous voulez. Pas de minimum.',
    keepEarnings: 'Gardez 85% des revenus',
    keepEarningsDesc: 'Frais de plateforme de 15%. Vous fixez vos prix.',
    growBusiness: 'Développez votre activité',
    growBusinessDesc: 'Nous gérons le marketing, les paiements et le support.',
    joinCommunity: 'Rejoignez une communauté',
    joinCommunityDesc: 'Connectez-vous avec des chefs et des amateurs de cuisine.',
    startEarning: "Commencez à gagner aujourd'hui",
    verifiedChefs: 'Chefs maison vérifiés',
    securePayments: 'Paiements sécurisés',
    freshHomemade: 'Repas frais faits maison',
    localDelivery: 'Livraison locale',
    foodSafety: 'Certifié sécurité alimentaire',
    transparentReviews: 'Avis transparents',
    communityTrust: 'Confiance communautaire',
    repeatCustomers: 'Clients fidèles',
  },
};

export function getLocale(): Locale {
  const stored = localStorage.getItem('dishbar-locale');
  if (stored && (stored === 'en' || stored === 'fa' || stored === 'fr')) return stored;
  return 'en';
}

export function setLocale(locale: Locale) {
  localStorage.setItem('dishbar-locale', locale);
  document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
  window.location.reload();
}

export function t(key: keyof typeof translations['en']): string {
  const locale = getLocale();
  return translations[locale][key] || translations['en'][key] || key;
}

export function getDir(): 'rtl' | 'ltr' {
  return getLocale() === 'fa' ? 'rtl' : 'ltr';
}

// Initialize direction on load
if (typeof window !== 'undefined') {
  const locale = getLocale();
  document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
}

// ============ Cart State ============
export interface CartItem {
  id: number;
  title: string;
  title_fa?: string;
  price: number;
  quantity: number;
  chef_id: number;
  chef_name: string;
  image_url?: string;
}

export function getCart(): CartItem[] {
  try {
    const stored = localStorage.getItem('dishbar-cart');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem('dishbar-cart', JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(id: number) {
  const cart = getCart().filter((i) => i.id !== id);
  saveCart(cart);
  return cart;
}

export function updateCartQuantity(id: number, quantity: number) {
  const cart = getCart();
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.quantity = Math.max(0, quantity);
    if (item.quantity === 0) {
      return removeFromCart(id);
    }
  }
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem('dishbar-cart');
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}