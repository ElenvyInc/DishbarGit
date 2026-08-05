import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  ChefHat, DollarSign, Clock, Users, Award,
  ArrowRight
} from 'lucide-react';
import { client, t, getLocale } from '@/lib/api';
import DishBarLogo from '@/components/DishBarLogo';

export default function BecomeAChef() {
  const navigate = useNavigate();
  const locale = getLocale();
  const isRtl = locale === 'fa';
  const [mealsPerWeek, setMealsPerWeek] = useState(20);
  const [avgPrice, setAvgPrice] = useState(18);

  const monthlyEarnings = Math.round(mealsPerWeek * avgPrice * 4.33);

  const benefits = [
    {
      icon: Clock,
      title: t('flexibleSchedule'),
      desc: t('flexibleScheduleDesc'),
    },
    {
      icon: DollarSign,
      title: t('keepEarnings'),
      desc: t('keepEarningsDesc'),
    },
    {
      icon: Award,
      title: t('growBusiness'),
      desc: t('growBusinessDesc'),
    },
    {
      icon: Users,
      title: t('joinCommunity'),
      desc: t('joinCommunityDesc'),
    },
  ];

  const steps = [
    { num: 1, title: t('chefStep1'), desc: t('chefStep1Desc') },
    { num: 2, title: t('chefStep2'), desc: t('chefStep2Desc') },
    { num: 3, title: t('chefStep3'), desc: t('chefStep3Desc') },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Simple Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <DishBarLogo size="md" />
          </div>
          <Button size="sm" onClick={() => client.auth.toLogin()} className="cursor-pointer">
            {t('login')}
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-background to-amber-50/30 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-sm px-3 py-1.5">
                {t('foundingChefs')}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                {t('becomeChefTitle')}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                {t('becomeChefDesc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => client.auth.toLogin()}
                  className="cursor-pointer text-base font-semibold px-8 gap-2"
                >
                  <ChefHat className="w-5 h-5" />
                  {t('startEarning')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                  className="cursor-pointer text-base font-semibold px-8 gap-2"
                >
                  <DollarSign className="w-5 h-5" />
                  {t('incomeCalcTitle')}
                </Button>
              </div>
            </div>
            <img
              src="https://mgx-backend-cdn.metadl.com/generate/images/1431173/2026-07-18/sxv7amacaiza/community-home-chefs-diverse.png"
              alt={t('chefAlt')}
              className="w-full rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Income Calculator */}
      <section id="calculator" className="py-20 bg-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('incomeCalcTitle')}</h2>
            <p className="text-muted-foreground mt-2">{t('incomeCalcDesc')}</p>
          </div>

          <Card className="border-2 border-primary/20 shadow-xl">
            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">{t('mealsPerWeek')}</label>
                  <span className="text-2xl font-bold text-primary">{mealsPerWeek}</span>
                </div>
                <Slider
                  value={[mealsPerWeek]}
                  onValueChange={(v) => setMealsPerWeek(v[0])}
                  min={5}
                  max={60}
                  step={5}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 meals</span>
                  <span>60 meals</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-semibold">{t('avgPrice')}</label>
                  <span className="text-2xl font-bold text-primary">${avgPrice}</span>
                </div>
                <Slider
                  value={[avgPrice]}
                  onValueChange={(v) => setAvgPrice(v[0])}
                  min={8}
                  max={35}
                  step={1}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$8</span>
                  <span>$35</span>
                </div>
              </div>

              <div className="border-t pt-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">{t('estimatedEarnings')}</p>
                <p className="text-5xl font-extrabold text-primary">
                  ${monthlyEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('calculatorDisclaimer')}
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => client.auth.toLogin()}
                className="w-full cursor-pointer text-base font-semibold gap-2"
              >
                {t('startEarning')} <ArrowRight className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('whyJoin')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-20 bg-secondary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t('howToApply')}</h2>
            <p className="text-muted-foreground mt-2">{t('howToApplyDesc')}</p>
          </div>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.num} className="flex gap-6 items-start">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0">
                  {step.num}
                </div>
                <div className="flex-1 pb-6 border-b last:border-b-0">
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  <p className="text-muted-foreground mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {t('readyTitle')}
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {t('readyBody')}
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => client.auth.toLogin()}
            className="cursor-pointer text-base font-semibold px-10 gap-2"
          >
            <ChefHat className="w-5 h-5" />
            {t('startEarning')}
          </Button>
          <p className="text-sm text-primary-foreground/60 mt-4">
            {t('applicationDisclaimer')}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <DishBarLogo size="sm" />
          <p className="text-sm text-muted-foreground">
            © 2026 DishBar. A marketplace for homemade food in Ontario, Canada.
          </p>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="cursor-pointer">
            ← Back to Home
          </Button>
        </div>
      </footer>
    </div>
  );
}