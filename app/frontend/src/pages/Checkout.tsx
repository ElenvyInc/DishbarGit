import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft, Minus, Plus, Trash2, ShoppingCart,
  MapPin, Truck, CreditCard, Shield,
} from 'lucide-react';
import { client, t, getLocale, getCart, saveCart, removeFromCart, MAX_ITEM_QUANTITY, type CartItem } from '@/lib/api';
import DishBarLogo from '@/components/DishBarLogo';
import { toast } from 'sonner';

interface ServerQuote {
  food_subtotal: string;
  service_fee: string;
  delivery_fee: string;
  tax: string;
  customer_total: string;
  service_fee_rate_label: string;
  auto_tax_enabled: boolean;
  tax_applied: boolean;
  delivery_fee_pending_policy: boolean;
  items?: { id: number; unit_price: string; line_total: string }[];
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>(getCart());
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [allergenAcknowledged, setAllergenAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [quote, setQuote] = useState<ServerQuote | null>(null);
  const [quoteError, setQuoteError] = useState('');
  const locale = getLocale();
  const isRtl = locale === 'fa';
  const mixedCooks = new Set(cartItems.map((item) => item.chef_id)).size > 1;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadQuote = async () => {
      if (cartItems.length === 0 || mixedCooks) {
        setQuote(null);
        return;
      }
      try {
        const response = await client.apiCall.invoke({
          url: '/api/v1/payment/quote',
          method: 'POST',
          data: {
            items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
            delivery_type: deliveryType,
          },
        });
        if (!cancelled) {
          setQuote(response?.data || null);
          setQuoteError('');
        }
      } catch (error: any) {
        if (!cancelled) {
          setQuote(null);
          setQuoteError(error?.data?.detail || t('serverQuotePending'));
        }
      }
    };
    loadQuote();
    return () => {
      cancelled = true;
    };
  }, [cartItems, deliveryType, mixedCooks]);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) setUser(res.data);
    } catch (e) {
      // User not authenticated
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        return { ...item, quantity: Math.min(MAX_ITEM_QUANTITY, Math.max(1, item.quantity + delta)) };
      }
      return item;
    });
    setCartItems(updated);
    saveCart(updated);
  };

  const handleRemove = (id: number) => {
    const updated = removeFromCart(id);
    setCartItems(updated);
  };

  const serverPrice = (itemId: number, fallback: number) => {
    const priced = quote?.items?.find((entry) => entry.id === itemId);
    return priced ? `$${priced.unit_price}` : `$${fallback.toFixed(2)}`;
  };

  const handleCheckout = async () => {
    if (!user) {
      client.auth.toLogin();
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error(locale === 'fa' ? 'لطفاً نام و شماره تلفن را وارد کنید' : 'Please fill in your name and phone number');
      return;
    }

    if (deliveryType !== 'pickup' && !deliveryAddress.trim()) {
      toast.error(locale === 'fa' ? 'لطفاً آدرس تحویل را وارد کنید' : 'Please enter delivery address');
      return;
    }

    if (!allergenAcknowledged) {
      toast.error(locale === 'fa' ? 'لطفاً اطلاعیه آلرژن را تأیید کنید' : 'Please acknowledge the allergen notice before ordering');
      return;
    }

    if (mixedCooks) {
      toast.error(t('mixedCartBlocked'));
      return;
    }

    setLoading(true);
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/payment/create_payment_session',
        method: 'POST',
        data: {
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          delivery_postal_code: deliveryPostalCode,
          delivery_instructions: deliveryInstructions,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          allergen_acknowledged: allergenAcknowledged,
        },
      });

      if (response.data?.url) {
        client.utils.openUrl(response.data.url);
      } else {
        toast.error('Failed to create payment session');
      }
    } catch (e: any) {
      const detail = e?.data?.detail || e?.message || '';
      // Show user-friendly messages based on error type
      if (detail.includes('payment is temporarily unavailable') || detail.includes('Payment service')) {
        toast.error(locale === 'fa' 
          ? 'پرداخت آنلاین موقتاً در دسترس نیست. لطفاً بعداً تلاش کنید.' 
          : locale === 'fr'
          ? 'Le paiement en ligne est temporairement indisponible.'
          : 'Online payment is temporarily unavailable. Please try again later.');
      } else if (detail.includes('Authentication') || detail.includes('token')) {
        toast.error(locale === 'fa' 
          ? 'لطفاً ابتدا وارد حساب خود شوید.' 
          : 'Please sign in before placing your order.');
        client.auth.toLogin();
      } else if (detail) {
        toast.error(detail);
      } else {
        toast.error(locale === 'fa' ? 'خطا در ثبت سفارش' : 'Checkout failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {locale === 'fa' ? 'سبد خرید شما خالی است' : locale === 'fr' ? 'Votre panier est vide' : 'Your cart is empty'}
        </h2>
        <p className="text-muted-foreground mb-6">
          {locale === 'fa' ? 'غذاهای مورد علاقه خود را اضافه کنید' : locale === 'fr' ? 'Ajoutez vos plats préférés' : 'Add your favourite dishes to get started'}
        </p>
        <Button onClick={() => navigate('/')} className="cursor-pointer">{t('browseChefs')}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" />
            {locale === 'fa' ? 'بازگشت' : locale === 'fr' ? 'Retour' : 'Back'}
          </Button>
          <DishBarLogo size="sm" />
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t('checkout')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items + Delivery + Payment */}
          <div className="lg:col-span-2 space-y-4">
            {/* Cart Items */}
            <Card>
              <CardContent className="p-4 divide-y">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {locale === 'fa' ? item.title_fa || item.title : item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{item.chef_name}</p>
                      <p className="text-sm font-semibold text-primary mt-1">{serverPrice(item.id, item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="w-7 h-7 cursor-pointer" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="w-7 h-7 cursor-pointer" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive cursor-pointer" onClick={() => handleRemove(item.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Options with Distance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {t('delivery')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t('pickup')}</p>
                          <p className="text-xs text-muted-foreground">
                            {locale === 'fa' ? 'دریافت از محل آشپز' : locale === 'fr' ? 'Retrait chez le chef' : 'Pick up from chef\'s location'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-green-700 bg-green-50">
                          {locale === 'fa' ? 'رایگان' : 'FREE'}
                        </Badge>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="self_delivery" id="self_delivery" />
                    <Label htmlFor="self_delivery" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t('selfDelivery')}</p>
                          <p className="text-xs text-muted-foreground">
                            {locale === 'fa' ? 'ارسال مستقیم توسط آشپز' : locale === 'fr' ? 'Livraison par le chef' : 'Chef delivers to your address'}
                          </p>
                        </div>
                        {deliveryType === 'self_delivery' && (
                          <Badge variant="outline" className="text-xs">
                            {t('deliveryFeePending')}
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value="third_party" id="third_party" />
                    <Label htmlFor="third_party" className="cursor-pointer flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{t('thirdParty')}</p>
                          <p className="text-xs text-muted-foreground">
                            {locale === 'fa' ? 'ارسال با پیک سریع' : locale === 'fr' ? 'Livraison par coursier' : 'Fast courier delivery'}
                          </p>
                        </div>
                        {deliveryType === 'third_party' && (
                          <Badge variant="outline" className="text-xs">
                            {t('deliveryFeePending')}
                          </Badge>
                        )}
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryType !== 'pickup' && (
                  <div className="space-y-3 pt-2 border-t">
                    <div>
                      <Label className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {locale === 'fa' ? 'آدرس تحویل' : locale === 'fr' ? 'Adresse de livraison' : 'Delivery Address'}
                      </Label>
                      <Input
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder={locale === 'fa' ? 'مثال: 123 خیابان اصلی، تورنتو' : 'e.g. 123 Main St, Toronto, ON'}
                        className="mt-1"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">{t('deliveryFeePending')}</p>
                  </div>
                )}

                {deliveryType !== 'pickup' && deliveryAddress && (
                  <div className="space-y-3">
                    <div>
                      <Label>{locale === 'fa' ? 'کد پستی' : locale === 'fr' ? 'Code postal' : 'Postal Code'}</Label>
                      <Input
                        value={deliveryPostalCode}
                        onChange={(e) => setDeliveryPostalCode(e.target.value)}
                        placeholder="e.g. M5V 3L9"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>{locale === 'fa' ? 'دستورالعمل تحویل' : locale === 'fr' ? 'Instructions de livraison' : 'Delivery Instructions'}</Label>
                      <Input
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder={locale === 'fa' ? 'مثال: زنگ واحد ۳ را بزنید' : 'e.g. Ring unit 3, leave at door'}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <Label>{locale === 'fa' ? 'نام کامل' : locale === 'fr' ? 'Nom complet' : 'Full Name'} *</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={locale === 'fa' ? 'نام و نام خانوادگی' : 'Full name'}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label>{locale === 'fa' ? 'ایمیل' : 'Email'}</Label>
                    <Input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder={locale === 'fa' ? 'ایمیل شما' : 'your@email.com'}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>{locale === 'fa' ? 'شماره تلفن' : locale === 'fr' ? 'Téléphone' : 'Phone'} *</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={locale === 'fa' ? 'شماره تماس' : '+1 (647) 000-0000'}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {locale === 'fa' ? 'روش‌های پرداخت' : locale === 'fr' ? 'Options de paiement' : 'Payment Options'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {locale === 'fa'
                    ? 'پس از کلیک روی "ثبت سفارش"، به صفحه پرداخت امن Stripe هدایت می‌شوید.'
                    : locale === 'fr'
                    ? 'Après avoir cliqué sur "Passer la commande", vous serez redirigé vers le paiement sécurisé Stripe.'
                    : 'After clicking "Place Order", you\'ll be redirected to Stripe\'s secure checkout.'}
                </p>

                {/* Payment method icons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">VISA</span>
                    </div>
                    <span className="text-sm">Visa</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <div className="w-10 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">MC</span>
                    </div>
                    <span className="text-sm">Mastercard</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <div className="w-10 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">AMEX</span>
                    </div>
                    <span className="text-sm">Amex</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <div className="w-10 h-6 bg-black rounded flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">G Pay</span>
                    </div>
                    <span className="text-sm">Google Pay</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <div className="w-10 h-6 bg-black rounded flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">Apple</span>
                    </div>
                    <span className="text-sm">Apple Pay</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <div className="w-10 h-6 bg-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">Link</span>
                    </div>
                    <span className="text-sm">Link</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <Shield className="w-3 h-3" />
                  {locale === 'fa'
                    ? 'پرداخت امن با رمزنگاری SSL توسط Stripe'
                    : locale === 'fr'
                    ? 'Paiement sécurisé avec cryptage SSL par Stripe'
                    : 'Secure payment with SSL encryption by Stripe'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">{locale === 'fa' ? 'خلاصه سفارش' : locale === 'fr' ? 'Résumé' : 'Order Summary'}</h3>
                <div className="space-y-2 text-sm">
                  {mixedCooks && <p className="text-destructive text-xs">{t('mixedCartBlocked')}</p>}
                  {quoteError && <p className="text-destructive text-xs">{quoteError}</p>}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span>{quote ? `$${quote.food_subtotal}` : t('serverQuotePending')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('serviceFee')}{quote ? ` (${quote.service_fee_rate_label})` : ''}</span>
                    <span>{quote ? `$${quote.service_fee}` : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('deliveryFee')}</span>
                    <span>{quote ? `$${quote.delivery_fee}` : '—'}</span>
                  </div>
                  {quote?.delivery_fee_pending_policy && (
                    <p className="text-[11px] text-muted-foreground">{t('deliveryFeePending')}</p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('tax')}</span>
                    <span>{quote ? `$${quote.tax}` : '—'}</span>
                  </div>
                  {quote && !quote.tax_applied && (
                    <p className="text-[11px] text-muted-foreground">{t('taxNotApplied')}</p>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-base">
                    <span>{t('total')}</span>
                    <span className="text-primary">{quote ? `$${quote.customer_total}` : '—'}</span>
                  </div>
                </div>

                {/* Allergen Acknowledgement */}
                <div className="border rounded-lg p-3 bg-yellow-50/50 dark:bg-yellow-900/10 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {locale === 'fa'
                      ? '⚠️ غذاهای خانگی ممکن است حاوی آلرژن‌ها باشند. اگر آلرژی شدید دارید، قبل از سفارش با آشپز تماس بگیرید.'
                      : locale === 'fr'
                      ? '⚠️ Les aliments faits maison peuvent contenir des allergènes. Contactez le chef avant de commander si vous avez des allergies graves.'
                      : '⚠️ Home-prepared food may contain allergens. If you have severe allergies, contact the chef before ordering. DishBar cannot guarantee an allergen-free environment.'}
                  </p>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allergenAcknowledged}
                      onChange={(e) => setAllergenAcknowledged(e.target.checked)}
                      className="mt-0.5 rounded border-muted-foreground"
                    />
                    <span className="text-xs">
                      {locale === 'fa'
                        ? 'من اطلاعیه آلرژن و مواد تشکیل‌دهنده را مطالعه کرده‌ام و می‌پذیرم.'
                        : locale === 'fr'
                        ? "J'ai lu et j'accepte l'avis sur les allergènes et les ingrédients."
                        : 'I have reviewed the allergen and ingredient information and accept the risks.'}
                    </span>
                  </label>
                </div>

                {/* Terms acceptance */}
                <p className="text-[10px] text-muted-foreground text-center">
                  {locale === 'fa'
                    ? 'با ثبت سفارش، شرایط استفاده و سیاست حریم خصوصی را می‌پذیرید.'
                    : locale === 'fr'
                    ? 'En passant commande, vous acceptez nos conditions et politique de confidentialité.'
                    : 'By placing an order, you agree to our '}
                  {locale === 'en' && (
                    <>
                      <a href="/legal/terms" className="underline hover:text-foreground">Terms</a>
                      {' & '}
                      <a href="/legal/privacy" className="underline hover:text-foreground">Privacy Policy</a>
                    </>
                  )}
                </p>

                <Button
                  className="w-full cursor-pointer mt-4"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading || !allergenAcknowledged || mixedCooks || !quote}
                >
                  {loading
                    ? (locale === 'fa' ? 'در حال پردازش...' : 'Processing...')
                    : t('placeOrder')}
                </Button>

                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    {locale === 'fa' ? 'برای ثبت سفارش باید وارد شوید' : locale === 'fr' ? 'Connectez-vous pour commander' : 'Sign in to place your order'}
                  </p>
                )}

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-3 pt-3 border-t">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    {locale === 'fa' ? 'پرداخت امن' : 'Secure'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CreditCard className="w-3 h-3" />
                    {locale === 'fa' ? 'رمزنگاری شده' : 'Encrypted'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Truck className="w-3 h-3" />
                    {locale === 'fa' ? 'ردیابی سفارش' : 'Tracked'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}