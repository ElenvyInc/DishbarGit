import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ChefHat, Package } from 'lucide-react';
import { client, t, getLocale, clearCart } from '@/lib/api';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const locale = getLocale();
  const isRtl = locale === 'fa';
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      verifyPayment();
    } else {
      setVerifying(false);
    }
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const response = await client.apiCall.invoke({
        url: '/api/v1/payment/verify_payment',
        method: 'POST',
        data: { session_id: sessionId },
      });
      if (response.data?.status === 'paid' || response.data?.payment_status === 'paid') {
        setVerified(true);
        clearCart();
      }
      setOrderStatus(response.data?.status || 'confirmed');
    } catch (e) {
      console.error('Verification failed:', e);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          {verifying ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center animate-pulse">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">
                {locale === 'fa' ? 'در حال تأیید پرداخت...' : locale === 'fr' ? 'Vérification du paiement...' : 'Verifying payment...'}
              </h2>
            </>
          ) : verified || !sessionId ? (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">{t('paymentSuccess')}</h2>
              <p className="text-muted-foreground">{t('paymentSuccessMsg')}</p>
              <div className="bg-secondary/50 rounded-lg p-4 text-sm">
                <p className="font-medium">
                  {locale === 'fa' ? 'وضعیت سفارش: تأیید شده' : locale === 'fr' ? 'Statut: Confirmée' : 'Status: Confirmed'}
                </p>
                <p className="text-muted-foreground mt-1">
                  {locale === 'fa'
                    ? 'آشپز شما به زودی سفارش را آماده می‌کند'
                    : locale === 'fr'
                    ? 'Votre chef préparera bientôt votre commande'
                    : 'Your chef will start preparing your order soon'}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/')} className="cursor-pointer w-full">
                  {t('backToHome')}
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="cursor-pointer w-full">
                  {t('orderHistory')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold">
                {locale === 'fa' ? 'پرداخت در حال بررسی' : locale === 'fr' ? 'Paiement en cours de vérification' : 'Payment pending verification'}
              </h2>
              <Button onClick={() => navigate('/')} className="cursor-pointer">{t('backToHome')}</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}