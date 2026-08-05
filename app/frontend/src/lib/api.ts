import { createClient } from '@metagptx/web-sdk';

export const client = createClient();

export type Locale = 'en' | 'fa' | 'fr';

const en = {
  brand: 'DishBar',
  tagline: 'Homemade Meals From Trusted Home Chefs Near You',
  heroSubtitle: 'DishBar is launching in Ontario. Discover homemade meals as approved local chefs join the marketplace, or apply to become a founding home chef.',
  browseChefs: 'Browse Chefs',
  browseMeals: 'Find Homemade Food',
  viewMenu: 'View Menu',
  orderNow: 'Order Now',
  becomeChef: 'Start Selling Homemade Meals',
  becomeChefShort: 'Become a Chef',
  login: 'Sign In',
  signup: 'Sign Up',
  logout: 'Sign Out',
  featuredChefs: 'Local Home Chefs',
  popularDishes: 'Available Meals',
  reviews: 'Reviews',
  delivery: 'Delivery',
  pickup: 'Pickup',
  addToCart: 'Add to Cart',
  cart: 'Cart',
  checkout: 'Checkout',
  total: 'Total',
  orderHistory: 'Order History',
  myProfile: 'My Profile',
  chefDashboard: 'Chef Dashboard',
  contact: 'Contact',
  howItWorks: 'How It Works',
  customers: 'Customers',
  chefs: 'Chefs',
  safety: 'Safety',
  blog: 'Blog',
  language: 'Language',
  step1Title: 'Discover Local Chefs',
  step1Desc: 'Browse approved chef profiles and explore menus available in your area.',
  step2Title: 'Place Your Order',
  step2Desc: 'Choose an available meal and pay securely online through Stripe.',
  step3Title: 'Receive Your Meal',
  step3Desc: 'Follow the pickup or delivery option shown by the chef.',
  chefStep1: 'Create your profile and menu',
  chefStep1Desc: 'Share your story, specialties, availability, and prices.',
  chefStep2: 'Submit required documents',
  chefStep2Desc: 'Chef profiles and required documentation are reviewed before marketplace approval.',
  chefStep3: 'Prepare approved orders',
  chefStep3Desc: 'Set your availability and fulfil the orders you accept.',
  howItWorksChefTitle: 'For Home Chefs',
  howItWorksCustomerTitle: 'For Customers',
  howIntro: 'DishBar is preparing to connect Ontario customers with approved home chefs.',
  noResults: 'No meals are available in your area yet. Join the launch list to be notified when local chefs become available.',
  loading: 'Loading...',
  trustTitle: 'Safety & Trust',
  trustSubtitle: 'Clear approval requirements, transparent meal information, and secure online payments.',
  reviewTitle: 'Launching With Our Community',
  reviewIntro: 'Be among our first customers, or apply now as a founding home chef in Ontario.',
  featuredChefTitle: 'Founding Chef Applications',
  featuredChefBody: 'We are now reviewing applications from Ontario home chefs who want to help shape the DishBar marketplace.',
  becomeChefTitle: 'Share Your Cooking With Your Community',
  becomeChefDesc: 'Founding chef applications are now open for eligible home chefs in Ontario.',
  flexibleSchedule: 'Flexible Schedule',
  flexibleScheduleDesc: 'Choose when your menu is available.',
  keepEarnings: 'Clear Platform Fee',
  keepEarningsDesc: 'Review applicable fees before accepting marketplace orders.',
  growBusiness: 'Build Your Profile',
  growBusinessDesc: 'Introduce your food and availability to local customers.',
  joinCommunity: 'Founding Community',
  joinCommunityDesc: 'Help shape a marketplace built for Ontario home chefs.',
  startEarning: 'Apply as a Founding Chef',
  backHome: 'Back to Home',
  mealsUnit: 'meals',
  incomeCalcTitle: 'Illustrative Planning Calculator',
  incomeCalcDesc: 'Explore example sales scenarios. This is not a promise of earnings.',
  mealsPerWeek: 'Example meals per week',
  avgPrice: 'Example average price per meal',
  estimatedEarnings: 'Illustrative monthly gross sales',
  whyJoin: 'Why apply as a founding chef?',
  howToApply: 'How to apply',
  howToApplyDesc: 'Submit your profile and required information for review before publishing a menu.',
  calculatorDisclaimer: 'Illustrative only. Actual results depend on approval, demand, pricing, costs, taxes, fees, refunds, and completed orders.',
  applicationDisclaimer: 'Applications are reviewed before a chef can publish a menu. DishBar does not guarantee approval, orders, or earnings.',
  reviewedChefs: 'Approval Review',
  reviewedChefsDesc: 'Chef profiles and required documentation are reviewed before marketplace approval.',
  foodSafety: 'Food Safety Requirements',
  foodSafetyDesc: 'Chefs must follow applicable Ontario and local public-health requirements.',
  securePayments: 'Secure Payments',
  securePaymentsDesc: 'Online payments are processed securely through Stripe.',
  clearInformation: 'Clear Meal Information',
  clearInformationDesc: 'Chefs provide ingredients, allergen details, prices, and fulfilment options.',
  launchOntario: 'Launching in Ontario',
  foundingChefs: 'Now welcoming founding home chefs',
  firstCustomers: 'Be among our first customers',
  viewChefProfile: 'View Chef Profile',
  faqTitle: 'Frequently Asked Questions',
  faq1Q: 'What is DishBar?',
  faq1A: 'DishBar is a launch-stage Ontario marketplace designed to connect customers with approved home chefs offering homemade meals.',
  faq2Q: 'How do I become a home chef?',
  faq2A: 'Open the chef application flow, create your profile, submit the required information, and wait for marketplace review before publishing a menu.',
  faq3Q: 'How are chef profiles approved?',
  faq3A: 'Chef profiles and required documentation are reviewed before marketplace approval. DishBar does not claim to conduct criminal background checks.',
  faq4Q: 'How are payments handled?',
  faq4A: 'Online payments are processed securely through Stripe. DishBar does not describe payments as escrow.',
  faq5Q: 'Where is DishBar available?',
  faq5A: 'DishBar is launching in Ontario. Availability depends on approved chefs and their pickup or delivery areas.',
  readyTitle: 'Join the DishBar Launch',
  readyBody: 'Apply as a founding chef or check the marketplace for meals becoming available near you.',
  footerBody: 'A launch-stage marketplace connecting Ontario customers with approved home chefs.',
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
  chefAgreement: 'Chef Agreement',
  foodSafetyRequirements: 'Food Safety Requirements',
  refundPolicy: 'Refund and Cancellation Policy',
  rights: 'All rights reserved. Launching in Ontario, Canada.',
  heroAlt: 'A home chef presenting a prepared homemade meal to a customer',
  chefAlt: 'Home chef preparing to join the DishBar Ontario marketplace',
  applicationAlt: 'Ontario home chef applicant preparing homemade food',
};

const fr: typeof en = {
  brand: 'DishBar',
  tagline: 'Des repas faits maison préparés par des chefs locaux près de chez vous',
  heroSubtitle: 'DishBar se lance en Ontario. Découvrez des repas maison à mesure que des chefs locaux approuvés rejoignent la plateforme, ou posez votre candidature comme chef fondateur.',
  browseChefs: 'Parcourir les chefs',
  browseMeals: 'Trouver des plats maison',
  viewMenu: 'Voir le menu',
  orderNow: 'Commander',
  becomeChef: 'Commencer à vendre des plats maison',
  becomeChefShort: 'Devenir chef',
  login: 'Se connecter',
  signup: "S’inscrire",
  logout: 'Se déconnecter',
  featuredChefs: 'Chefs à domicile locaux',
  popularDishes: 'Repas disponibles',
  reviews: 'Avis',
  delivery: 'Livraison',
  pickup: 'Ramassage',
  addToCart: 'Ajouter au panier',
  cart: 'Panier',
  checkout: 'Paiement',
  total: 'Total',
  orderHistory: 'Historique des commandes',
  myProfile: 'Mon profil',
  chefDashboard: 'Tableau de bord du chef',
  contact: 'Contact',
  howItWorks: 'Comment ça marche',
  customers: 'Clients',
  chefs: 'Chefs',
  safety: 'Sécurité',
  blog: 'Blogue',
  language: 'Langue',
  step1Title: 'Découvrez les chefs locaux',
  step1Desc: 'Parcourez les profils approuvés et les menus offerts dans votre secteur.',
  step2Title: 'Passez votre commande',
  step2Desc: 'Choisissez un repas disponible et payez en ligne de façon sécurisée avec Stripe.',
  step3Title: 'Recevez votre repas',
  step3Desc: 'Suivez l’option de ramassage ou de livraison indiquée par le chef.',
  chefStep1: 'Créez votre profil et votre menu',
  chefStep1Desc: 'Présentez votre parcours, vos spécialités, vos disponibilités et vos prix.',
  chefStep2: 'Soumettez les documents requis',
  chefStep2Desc: 'Les profils et les documents requis sont examinés avant l’approbation sur la plateforme.',
  chefStep3: 'Préparez les commandes acceptées',
  chefStep3Desc: 'Définissez vos disponibilités et exécutez les commandes que vous acceptez.',
  howItWorksChefTitle: 'Pour les chefs à domicile',
  howItWorksCustomerTitle: 'Pour les clients',
  howIntro: 'DishBar se prépare à relier les clients ontariens à des chefs à domicile approuvés.',
  noResults: 'Aucun repas n’est encore disponible dans votre secteur. Inscrivez-vous à la liste de lancement pour être avisé lorsque des chefs locaux seront disponibles.',
  loading: 'Chargement…',
  trustTitle: 'Sécurité et confiance',
  trustSubtitle: 'Des exigences d’approbation claires, des renseignements transparents et des paiements en ligne sécurisés.',
  reviewTitle: 'Un lancement avec notre communauté',
  reviewIntro: 'Faites partie de nos premiers clients ou posez votre candidature comme chef fondateur en Ontario.',
  featuredChefTitle: 'Candidatures des chefs fondateurs',
  featuredChefBody: 'Nous examinons maintenant les candidatures de chefs à domicile ontariens qui souhaitent contribuer à façonner DishBar.',
  becomeChefTitle: 'Partagez votre cuisine avec votre communauté',
  becomeChefDesc: 'Les candidatures des chefs fondateurs sont maintenant ouvertes aux chefs à domicile admissibles en Ontario.',
  flexibleSchedule: 'Horaire flexible',
  flexibleScheduleDesc: 'Choisissez quand votre menu est disponible.',
  keepEarnings: 'Frais de plateforme clairs',
  keepEarningsDesc: 'Consultez les frais applicables avant d’accepter des commandes.',
  growBusiness: 'Créez votre profil',
  growBusinessDesc: 'Présentez vos plats et vos disponibilités aux clients locaux.',
  joinCommunity: 'Communauté fondatrice',
  joinCommunityDesc: 'Aidez à façonner une plateforme conçue pour les chefs ontariens.',
  startEarning: 'Postuler comme chef fondateur',
  backHome: 'Retour à l’accueil',
  mealsUnit: 'repas',
  incomeCalcTitle: 'Calculateur indicatif de planification',
  incomeCalcDesc: 'Explorez des scénarios de vente. Il ne s’agit pas d’une promesse de revenus.',
  mealsPerWeek: 'Repas indicatifs par semaine',
  avgPrice: 'Prix moyen indicatif par repas',
  estimatedEarnings: 'Ventes mensuelles brutes indicatives',
  whyJoin: 'Pourquoi poser sa candidature comme chef fondateur?',
  howToApply: 'Comment poser sa candidature',
  howToApplyDesc: 'Soumettez votre profil et les renseignements requis pour examen avant de publier un menu.',
  calculatorDisclaimer: 'À titre indicatif seulement. Les résultats réels dépendent de l’approbation, de la demande, des prix, des coûts, des taxes, des frais, des remboursements et des commandes réalisées.',
  applicationDisclaimer: 'Les candidatures sont examinées avant qu’un chef puisse publier un menu. DishBar ne garantit ni l’approbation, ni les commandes, ni les revenus.',
  reviewedChefs: 'Examen avant approbation',
  reviewedChefsDesc: 'Les profils et les documents requis sont examinés avant l’approbation sur la plateforme.',
  foodSafety: 'Exigences de salubrité',
  foodSafetyDesc: 'Les chefs doivent respecter les exigences ontariennes et locales applicables.',
  securePayments: 'Paiements sécurisés',
  securePaymentsDesc: 'Les paiements en ligne sont traités de façon sécurisée par Stripe.',
  clearInformation: 'Renseignements clairs',
  clearInformationDesc: 'Les chefs indiquent les ingrédients, allergènes, prix et options de remise.',
  launchOntario: 'Lancement en Ontario',
  foundingChefs: 'Nous accueillons les chefs fondateurs',
  firstCustomers: 'Faites partie de nos premiers clients',
  viewChefProfile: 'Voir le profil du chef',
  faqTitle: 'Questions fréquentes',
  faq1Q: 'Qu’est-ce que DishBar?',
  faq1A: 'DishBar est une plateforme ontarienne en phase de lancement conçue pour relier les clients à des chefs à domicile approuvés.',
  faq2Q: 'Comment devenir chef à domicile?',
  faq2A: 'Ouvrez le parcours de candidature, créez votre profil, soumettez les renseignements requis et attendez l’approbation avant de publier un menu.',
  faq3Q: 'Comment les profils sont-ils approuvés?',
  faq3A: 'Les profils et documents requis sont examinés avant l’approbation. DishBar ne prétend pas effectuer de vérification des antécédents criminels.',
  faq4Q: 'Comment les paiements sont-ils traités?',
  faq4A: 'Les paiements en ligne sont traités de façon sécurisée par Stripe. DishBar ne présente pas les paiements comme un service d’entiercement.',
  faq5Q: 'Où DishBar est-il offert?',
  faq5A: 'DishBar se lance en Ontario. La disponibilité dépend des chefs approuvés et de leurs zones de ramassage ou de livraison.',
  readyTitle: 'Participez au lancement de DishBar',
  readyBody: 'Postulez comme chef fondateur ou consultez la plateforme pour découvrir les repas offerts près de chez vous.',
  footerBody: 'Une plateforme en phase de lancement reliant les clients ontariens à des chefs à domicile approuvés.',
  terms: 'Conditions d’utilisation',
  privacy: 'Politique de confidentialité',
  chefAgreement: 'Entente avec les chefs',
  foodSafetyRequirements: 'Exigences de salubrité alimentaire',
  refundPolicy: 'Politique de remboursement et d’annulation',
  rights: 'Tous droits réservés. Lancement en Ontario, Canada.',
  heroAlt: 'Un chef à domicile présente un repas maison préparé à une cliente',
  chefAlt: 'Un chef à domicile se prépare à rejoindre DishBar en Ontario',
  applicationAlt: 'Une candidate chef ontarienne prépare un repas maison',
};

const fa: typeof en = {
  brand: 'دیش‌بار',
  tagline: 'غذای خانگی از آشپزهای محلی مورد اعتماد نزدیک شما',
  heroSubtitle: 'دیش‌بار در استان انتاریو در حال راه‌اندازی است. با پیوستن آشپزهای محلی تأییدشده، غذاهای خانگی را پیدا کنید یا برای عضویت به‌عنوان آشپز بنیان‌گذار درخواست دهید.',
  browseChefs: 'مشاهده آشپزها',
  browseMeals: 'پیدا کردن غذای خانگی',
  viewMenu: 'مشاهده منو',
  orderNow: 'ثبت سفارش',
  becomeChef: 'شروع فروش غذای خانگی',
  becomeChefShort: 'آشپز شوید',
  login: 'ورود',
  signup: 'ثبت‌نام',
  logout: 'خروج',
  featuredChefs: 'آشپزهای خانگی محلی',
  popularDishes: 'غذاهای موجود',
  reviews: 'نظرها',
  delivery: 'تحویل',
  pickup: 'دریافت حضوری',
  addToCart: 'افزودن به سبد',
  cart: 'سبد خرید',
  checkout: 'پرداخت',
  total: 'مجموع',
  orderHistory: 'تاریخچه سفارش‌ها',
  myProfile: 'پروفایل من',
  chefDashboard: 'پنل آشپز',
  contact: 'تماس',
  howItWorks: 'نحوه کار',
  customers: 'مشتریان',
  chefs: 'آشپزها',
  safety: 'ایمنی',
  blog: 'وبلاگ',
  language: 'زبان',
  step1Title: 'آشپزهای محلی را پیدا کنید',
  step1Desc: 'پروفایل آشپزهای تأییدشده و منوهای موجود در منطقه خود را ببینید.',
  step2Title: 'سفارش خود را ثبت کنید',
  step2Desc: 'غذای موجود را انتخاب کنید و پرداخت آنلاین را با امنیت از طریق استرایپ انجام دهید.',
  step3Title: 'غذای خود را دریافت کنید',
  step3Desc: 'روش دریافت حضوری یا تحویل اعلام‌شده توسط آشپز را دنبال کنید.',
  chefStep1: 'پروفایل و منوی خود را بسازید',
  chefStep1Desc: 'داستان، تخصص‌ها، زمان‌های فعالیت و قیمت‌های خود را معرفی کنید.',
  chefStep2: 'مدارک لازم را ارسال کنید',
  chefStep2Desc: 'پروفایل و مدارک لازم آشپز پیش از تأیید در بازار بررسی می‌شود.',
  chefStep3: 'سفارش‌های پذیرفته‌شده را آماده کنید',
  chefStep3Desc: 'زمان فعالیت خود را مشخص کنید و سفارش‌هایی را که پذیرفته‌اید انجام دهید.',
  howItWorksChefTitle: 'برای آشپزهای خانگی',
  howItWorksCustomerTitle: 'برای مشتریان',
  howIntro: 'دیش‌بار در حال آماده‌سازی ارتباط میان مشتریان انتاریو و آشپزهای خانگی تأییدشده است.',
  noResults: 'هنوز غذایی در منطقه شما موجود نیست. به فهرست راه‌اندازی بپیوندید تا هنگام فعال شدن آشپزهای محلی به شما اطلاع داده شود.',
  loading: 'در حال بارگذاری…',
  trustTitle: 'ایمنی و اعتماد',
  trustSubtitle: 'شرایط روشن تأیید، اطلاعات شفاف غذا و پرداخت آنلاین امن.',
  reviewTitle: 'راه‌اندازی با همراهی جامعه',
  reviewIntro: 'از نخستین مشتریان ما باشید یا اکنون به‌عنوان آشپز بنیان‌گذار در انتاریو درخواست دهید.',
  featuredChefTitle: 'درخواست آشپزهای بنیان‌گذار',
  featuredChefBody: 'اکنون درخواست آشپزهای خانگی انتاریو را که می‌خواهند در شکل‌گیری دیش‌بار نقش داشته باشند بررسی می‌کنیم.',
  becomeChefTitle: 'آشپزی خود را با جامعه به اشتراک بگذارید',
  becomeChefDesc: 'ثبت درخواست آشپزهای بنیان‌گذار واجد شرایط در انتاریو اکنون باز است.',
  flexibleSchedule: 'برنامه انعطاف‌پذیر',
  flexibleScheduleDesc: 'زمان فعال بودن منوی خود را انتخاب کنید.',
  keepEarnings: 'کارمزد شفاف پلتفرم',
  keepEarningsDesc: 'پیش از پذیرش سفارش، کارمزدهای مربوط را بررسی کنید.',
  growBusiness: 'پروفایل خود را بسازید',
  growBusinessDesc: 'غذاها و زمان فعالیت خود را به مشتریان محلی معرفی کنید.',
  joinCommunity: 'جامعه بنیان‌گذار',
  joinCommunityDesc: 'در ساخت بازاری ویژه آشپزهای خانگی انتاریو نقش داشته باشید.',
  startEarning: 'درخواست آشپز بنیان‌گذار',
  backHome: 'بازگشت به صفحه اصلی',
  mealsUnit: 'غذا',
  incomeCalcTitle: 'محاسبه‌گر نمونه برای برنامه‌ریزی',
  incomeCalcDesc: 'سناریوهای نمونه فروش را بررسی کنید. این محاسبه تضمین درآمد نیست.',
  mealsPerWeek: 'تعداد نمونه غذا در هفته',
  avgPrice: 'قیمت متوسط نمونه هر غذا',
  estimatedEarnings: 'فروش ناخالص ماهانه نمونه',
  whyJoin: 'چرا به‌عنوان آشپز بنیان‌گذار درخواست دهید؟',
  howToApply: 'نحوه درخواست',
  howToApplyDesc: 'پروفایل و اطلاعات لازم را برای بررسی ارسال کنید و سپس منو را منتشر کنید.',
  calculatorDisclaimer: 'فقط نمونه‌ای است. نتیجه واقعی به تأیید، تقاضا، قیمت‌گذاری، هزینه‌ها، مالیات، کارمزدها، بازپرداخت‌ها و سفارش‌های تکمیل‌شده بستگی دارد.',
  applicationDisclaimer: 'درخواست‌ها پیش از انتشار منو بررسی می‌شوند. دیش‌بار تأیید، سفارش یا درآمد را تضمین نمی‌کند.',
  reviewedChefs: 'بررسی پیش از تأیید',
  reviewedChefsDesc: 'پروفایل و مدارک لازم آشپز پیش از تأیید در بازار بررسی می‌شود.',
  foodSafety: 'الزامات ایمنی غذا',
  foodSafetyDesc: 'آشپزها باید قوانین قابل اجرا در انتاریو و واحد بهداشت محلی را رعایت کنند.',
  securePayments: 'پرداخت امن',
  securePaymentsDesc: 'پرداخت‌های آنلاین با امنیت از طریق استرایپ پردازش می‌شوند.',
  clearInformation: 'اطلاعات روشن غذا',
  clearInformationDesc: 'آشپزها مواد اولیه، آلرژن‌ها، قیمت و روش تحویل را اعلام می‌کنند.',
  launchOntario: 'در حال راه‌اندازی در انتاریو',
  foundingChefs: 'پذیرای آشپزهای بنیان‌گذار هستیم',
  firstCustomers: 'از نخستین مشتریان ما باشید',
  viewChefProfile: 'مشاهده پروفایل آشپز',
  faqTitle: 'پرسش‌های متداول',
  faq1Q: 'دیش‌بار چیست؟',
  faq1A: 'دیش‌بار یک بازار اینترنتی در مرحله راه‌اندازی در انتاریو است که برای ارتباط مشتریان با آشپزهای خانگی تأییدشده طراحی شده است.',
  faq2Q: 'چگونه آشپز خانگی شوم؟',
  faq2A: 'فرایند درخواست را باز کنید، پروفایل خود را بسازید، اطلاعات لازم را بفرستید و پیش از انتشار منو منتظر بررسی بازار بمانید.',
  faq3Q: 'پروفایل آشپزها چگونه تأیید می‌شود؟',
  faq3A: 'پروفایل و مدارک لازم پیش از تأیید بررسی می‌شود. دیش‌بار ادعای انجام بررسی سابقه کیفری ندارد.',
  faq4Q: 'پرداخت‌ها چگونه انجام می‌شود؟',
  faq4A: 'پرداخت‌های آنلاین با امنیت از طریق استرایپ پردازش می‌شوند. دیش‌بار پرداخت‌ها را به‌عنوان حساب امانی معرفی نمی‌کند.',
  faq5Q: 'دیش‌بار در کجا فعال است؟',
  faq5A: 'دیش‌بار در انتاریو در حال راه‌اندازی است. دسترسی به آشپزهای تأییدشده و محدوده دریافت یا تحویل آن‌ها بستگی دارد.',
  readyTitle: 'به راه‌اندازی دیش‌بار بپیوندید',
  readyBody: 'به‌عنوان آشپز بنیان‌گذار درخواست دهید یا بازار را برای غذاهای تازه‌فعال‌شده نزدیک خود بررسی کنید.',
  footerBody: 'بازاری در مرحله راه‌اندازی برای ارتباط مشتریان انتاریو با آشپزهای خانگی تأییدشده.',
  terms: 'شرایط استفاده از خدمات',
  privacy: 'سیاست حفظ حریم خصوصی',
  chefAgreement: 'قرارداد آشپز',
  foodSafetyRequirements: 'الزامات ایمنی غذا',
  refundPolicy: 'سیاست بازپرداخت و لغو',
  rights: 'تمام حقوق محفوظ است. در حال راه‌اندازی در انتاریو، کانادا.',
  heroAlt: 'یک آشپز خانگی غذای آماده‌شده را به مشتری ارائه می‌کند',
  chefAlt: 'آشپز خانگی در حال آماده‌شدن برای پیوستن به بازار دیش‌بار انتاریو',
  applicationAlt: 'متقاضی آشپزی در انتاریو در حال آماده‌کردن غذای خانگی',
};

export const translations = { en, fr, fa };

export type TranslationKey = keyof typeof en;

export function getLocale(): Locale {
  const stored = localStorage.getItem('dishbar-locale');
  return stored === 'fa' || stored === 'fr' || stored === 'en' ? stored : 'en';
}

export function setLocale(locale: Locale) {
  localStorage.setItem('dishbar-locale', locale);
  document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.lang = locale;
  window.location.reload();
}

export function t(key: TranslationKey): string {
  return translations[getLocale()][key] || translations.en[key] || key;
}

export function getDir(): 'rtl' | 'ltr' {
  return getLocale() === 'fa' ? 'rtl' : 'ltr';
}

if (typeof window !== 'undefined') {
  document.documentElement.dir = getDir();
  document.documentElement.lang = getLocale();
}

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
  const existing = cart.find((entry) => entry.id === item.id);
  if (existing) existing.quantity += 1;
  else cart.push({ ...item, quantity: 1 });
  saveCart(cart);
  return cart;
}

export function removeFromCart(id: number) {
  const cart = getCart().filter((entry) => entry.id !== id);
  saveCart(cart);
  return cart;
}

export function updateCartQuantity(id: number, quantity: number) {
  const cart = getCart();
  const item = cart.find((entry) => entry.id === id);
  if (item) {
    item.quantity = Math.max(0, quantity);
    if (item.quantity === 0) return removeFromCart(id);
  }
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem('dishbar-cart');
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}