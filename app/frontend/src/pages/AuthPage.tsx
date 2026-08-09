import { ArrowLeft, ChefHat, ShieldCheck, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DishBarLogo from '@/components/DishBarLogo';
import { client, getLocale } from '@/lib/api';

type AuthMode = 'login' | 'signup';

const copy = {
  en: {
    loginTitle: 'Welcome back to DishBar',
    signupTitle: 'Join the DishBar community',
    loginDescription: 'Sign in securely to manage your orders, profile, and saved meals.',
    signupDescription: 'Create your account to order homemade meals or apply as a founding chef.',
    continueLogin: 'Continue to sign in',
    continueSignup: 'Create your account',
    secure: 'Secure account access',
    secureBody: 'You will be redirected to our secure authentication service. Your password is never stored in this app.',
    customer: 'Order homemade meals',
    chef: 'Apply as a home chef',
    back: 'Back to DishBar',
    switchLogin: 'Already have an account? Sign in',
    switchSignup: 'New to DishBar? Create an account',
  },
  fr: {
    loginTitle: 'Bon retour sur DishBar',
    signupTitle: 'Rejoignez la communauté DishBar',
    loginDescription: 'Connectez-vous pour gérer vos commandes, votre profil et vos repas enregistrés.',
    signupDescription: 'Créez votre compte pour commander des repas maison ou poser votre candidature comme chef fondateur.',
    continueLogin: 'Continuer la connexion',
    continueSignup: 'Créer mon compte',
    secure: 'Accès sécurisé au compte',
    secureBody: 'Vous serez redirigé vers notre service d’authentification sécurisé.',
    customer: 'Commander des repas maison',
    chef: 'Devenir chef à domicile',
    back: 'Retour à DishBar',
    switchLogin: 'Vous avez déjà un compte? Se connecter',
    switchSignup: 'Nouveau sur DishBar? Créer un compte',
  },
  fa: {
    loginTitle: 'به دیش‌بار خوش آمدید',
    signupTitle: 'به جامعه دیش‌بار بپیوندید',
    loginDescription: 'برای مدیریت سفارش‌ها، پروفایل و غذاهای ذخیره‌شده وارد شوید.',
    signupDescription: 'برای سفارش غذای خانگی یا درخواست عضویت به‌عنوان آشپز بنیان‌گذار حساب بسازید.',
    continueLogin: 'ادامه ورود',
    continueSignup: 'ساخت حساب',
    secure: 'ورود امن به حساب',
    secureBody: 'برای احراز هویت امن به سرویس ورود هدایت می‌شوید.',
    customer: 'سفارش غذای خانگی',
    chef: 'عضویت به‌عنوان آشپز خانگی',
    back: 'بازگشت به دیش‌بار',
    switchLogin: 'حساب دارید؟ وارد شوید',
    switchSignup: 'تازه به دیش‌بار پیوسته‌اید؟ حساب بسازید',
  },
} as const;

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const locale = getLocale();
  const text = copy[locale];
  const rtl = locale === 'fa';
  const isLogin = mode === 'login';

  const continueToAuth = () => {
    client.auth.toLogin();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-amber-50/40 px-4 py-8" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border bg-card shadow-xl md:grid-cols-2">
          <section className="hidden bg-gradient-to-br from-orange-500 to-amber-600 p-10 text-white md:flex md:flex-col md:justify-between">
            <button onClick={() => navigate('/')} className="w-fit">
              <DishBarLogo size="md" />
            </button>
            <div className="space-y-6">
              <ChefHat className="h-12 w-12" />
              <h2 className="text-4xl font-extrabold leading-tight">Homemade food, shared with your community.</h2>
              <p className="text-white/85">Discover local home chefs, order with confidence, and help build Ontario’s first DishBar community.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/85">
              <ShieldCheck className="h-5 w-5" /> {text.secure}
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mb-8 flex items-center justify-between">
              <button onClick={() => navigate('/')} className="md:hidden">
                <DishBarLogo size="md" />
              </button>
              <button onClick={() => navigate('/')} className="ml-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" /> {text.back}
              </button>
            </div>

            <CardHeader className="px-0">
              <CardTitle className="text-3xl">{isLogin ? text.loginTitle : text.signupTitle}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {isLogin ? text.loginDescription : text.signupDescription}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 px-0">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">{text.secure}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{text.secureBody}</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full" onClick={continueToAuth}>
                {isLogin ? text.continueLogin : text.continueSignup}
              </Button>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border p-4 text-sm"><strong>{text.customer}</strong></div>
                <div className="rounded-xl border p-4 text-sm"><strong>{text.chef}</strong></div>
              </div>

              <button
                onClick={() => navigate(isLogin ? '/signup' : '/login')}
                className="w-full text-center text-sm font-medium text-primary hover:underline"
              >
                {isLogin ? text.switchSignup : text.switchLogin}
              </button>
            </CardContent>
          </section>
        </div>
      </div>
    </main>
  );
}
