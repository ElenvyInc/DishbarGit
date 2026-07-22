import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft, Heart, Package, Bell, MessageSquare, Gift, Copy,
  RefreshCw, Star, Send, Check,
} from 'lucide-react';
import { client, t, getLocale, addToCart } from '@/lib/api';
import DishBarLogo from '@/components/DishBarLogo';
import { toast } from 'sonner';

interface Order {
  id: number;
  chef_id: number;
  items_json: string;
  total_amount: number;
  status: string;
  delivery_type: string;
  payment_status: string;
  created_at: string;
}

interface Favourite {
  id: number;
  chef_id: number;
  menu_item_id?: number;
}

interface Notification {
  id: number;
  title: string;
  title_fa?: string;
  message: string;
  message_fa?: string;
  type: string;
  is_read: boolean;
  created_at?: string;
}

interface Message {
  id: number;
  sender_id: string;
  receiver_id: string;
  order_id?: number;
  content: string;
  is_read: boolean;
  created_at?: string;
}

interface Referral {
  id: number;
  referral_code: string;
  referred_user_id?: string;
  reward_amount: number;
  status: string;
}

export default function CustomerPortalPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const locale = getLocale();
  const isRtl = locale === 'fa';

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await client.auth.me();
      if (res?.data) {
        setUser(res.data);
        loadAllData();
        generateReferralCode(res.data.id);
      } else {
        client.auth.toLogin();
      }
    } catch (e) {
      client.auth.toLogin();
    } finally {
      setAuthLoading(false);
    }
  };

  const generateReferralCode = (userId: string) => {
    const code = 'DISH' + userId.substring(0, 6).toUpperCase();
    setReferralCode(code);
  };

  const loadAllData = async () => {
    await Promise.all([loadOrders(), loadFavourites(), loadNotifications(), loadMessages(), loadReferrals()]);
  };

  const loadOrders = async () => {
    try {
      const res = await client.entities.orders.query({ query: {}, sort: '-created_at', limit: 50 });
      setOrders(res?.data?.items || []);
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  const loadFavourites = async () => {
    try {
      const res = await client.entities.favourites.query({ query: {}, limit: 50 });
      setFavourites(res?.data?.items || []);
    } catch (e) {
      console.error('Failed to load favourites:', e);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await client.entities.notifications.query({ query: {}, sort: '-created_at', limit: 50 });
      setNotifications(res?.data?.items || []);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await client.entities.messages.query({ query: {}, sort: '-created_at', limit: 50 });
      setMessages(res?.data?.items || []);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const loadReferrals = async () => {
    try {
      const res = await client.entities.referrals.query({ query: {}, limit: 50 });
      setReferrals(res?.data?.items || []);
    } catch (e) {
      console.error('Failed to load referrals:', e);
    }
  };

  const handleReorder = (order: Order) => {
    try {
      const items = JSON.parse(order.items_json || '[]');
      items.forEach((item: any) => {
        addToCart({
          id: item.id,
          title: item.title,
          price: item.price,
          chef_id: item.chef_id,
          chef_name: '',
        });
      });
      toast.success(locale === 'fa' ? 'آیتم‌ها به سبد اضافه شدند' : 'Items added to cart');
      navigate('/checkout');
    } catch (e) {
      toast.error('Failed to reorder');
    }
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await client.entities.notifications.update({ id: String(id), data: { is_read: true } });
      loadNotifications();
    } catch (e) {
      // Silent fail
    }
  };

  const handleRemoveFavourite = async (id: number) => {
    try {
      await client.entities.favourites.delete({ id: String(id) });
      toast.success(locale === 'fa' ? 'از علاقه‌مندی‌ها حذف شد' : 'Removed from favourites');
      loadFavourites();
    } catch (e) {
      toast.error('Failed to remove');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrderId) {
      toast.error('Please select an order and type a message');
      return;
    }
    try {
      await client.entities.messages.create({
        data: {
          sender_id: user.id,
          receiver_id: 'chef',
          order_id: selectedOrderId,
          content: newMessage,
          is_read: false,
        },
      });
      toast.success(locale === 'fa' ? 'پیام ارسال شد' : 'Message sent');
      setNewMessage('');
      loadMessages();
    } catch (e) {
      toast.error('Failed to send message');
    }
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success(locale === 'fa' ? 'کد کپی شد' : 'Code copied!');
  };

  const handleCreateReferral = async () => {
    try {
      await client.entities.referrals.create({
        data: { referral_code: referralCode, reward_amount: 5.0, status: 'pending' },
      });
      toast.success('Referral code activated');
      loadReferrals();
    } catch (e) {
      // May already exist
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t('pending'),
      confirmed: t('confirmed'),
      preparing: t('preparing'),
      ready: t('ready'),
      delivered: t('delivered'),
      cancelled: t('cancelled'),
    };
    return labels[status] || status;
  };

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" /> {t('backToHome')}
          </Button>
          <DishBarLogo size="sm" />
          <Button variant="ghost" size="sm" onClick={() => { client.auth.logout(); navigate('/'); }} className="cursor-pointer">
            {t('logout')}
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders" className="cursor-pointer text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1 hidden sm:inline" /> {t('orderHistory')}
            </TabsTrigger>
            <TabsTrigger value="favourites" className="cursor-pointer text-xs sm:text-sm">
              <Heart className="w-4 h-4 mr-1 hidden sm:inline" /> {locale === 'fa' ? 'علاقه‌مندی' : 'Favourites'}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="cursor-pointer text-xs sm:text-sm relative">
              <Bell className="w-4 h-4 mr-1 hidden sm:inline" /> {locale === 'fa' ? 'اعلان‌ها' : 'Notifications'}
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                  {unreadNotifs}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="cursor-pointer text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4 mr-1 hidden sm:inline" /> {locale === 'fa' ? 'پیام‌ها' : 'Messages'}
            </TabsTrigger>
            <TabsTrigger value="referrals" className="cursor-pointer text-xs sm:text-sm">
              <Gift className="w-4 h-4 mr-1 hidden sm:inline" /> {locale === 'fa' ? 'معرفی' : 'Referrals'}
            </TabsTrigger>
          </TabsList>

          {/* Orders / Tracking */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t('orderHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{locale === 'fa' ? 'هنوز سفارشی ندارید' : 'No orders yet'}</p>
                    <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => navigate('/')}>
                      {t('browseChefs')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">#{order.id}</span>
                            <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                          </div>
                          <span className="font-bold text-primary">${order.total_amount?.toFixed(2)}</span>
                        </div>

                        {/* Order Progress Tracker */}
                        <div className="flex items-center gap-1 mb-3">
                          {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((step, i) => {
                            const steps = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
                            const currentIdx = steps.indexOf(order.status);
                            const isCompleted = i <= currentIdx;
                            const isCurrent = i === currentIdx;
                            return (
                              <div key={step} className="flex items-center flex-1">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                  isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                } ${isCurrent ? 'ring-2 ring-primary/30' : ''}`}>
                                  {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                                </div>
                                {i < 4 && <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? 'bg-primary' : 'bg-muted'}`} />}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t('pending')}</span>
                          <span>{t('confirmed')}</span>
                          <span>{t('preparing')}</span>
                          <span>{t('ready')}</span>
                          <span>{t('delivered')}</span>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-CA')}
                          </span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleReorder(order)} className="cursor-pointer">
                              <RefreshCw className="w-3 h-3 mr-1" /> {locale === 'fa' ? 'سفارش مجدد' : 'Reorder'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSelectedOrderId(order.id)} className="cursor-pointer">
                              <MessageSquare className="w-3 h-3 mr-1" /> {locale === 'fa' ? 'پیام' : 'Message'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favourites */}
          <TabsContent value="favourites">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'fa' ? 'علاقه‌مندی‌ها' : 'My Favourites'}</CardTitle>
              </CardHeader>
              <CardContent>
                {favourites.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {locale === 'fa' ? 'هنوز آشپزی را به علاقه‌مندی‌ها اضافه نکرده‌اید' : 'No favourites yet'}
                    </p>
                    <Button variant="outline" className="mt-4 cursor-pointer" onClick={() => navigate('/')}>
                      {t('browseChefs')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {favourites.map((fav) => (
                      <div key={fav.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                          <div>
                            <p className="font-medium text-sm">Chef #{fav.chef_id}</p>
                            {fav.menu_item_id && <p className="text-xs text-muted-foreground">Item #{fav.menu_item_id}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/chef/${fav.chef_id}`)} className="cursor-pointer">
                            {t('viewMenu')}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive cursor-pointer" onClick={() => handleRemoveFavourite(fav.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'fa' ? 'اعلان‌ها' : 'Notifications'}</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">{locale === 'fa' ? 'اعلانی وجود ندارد' : 'No notifications'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                        onClick={() => handleMarkNotificationRead(notif.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{locale === 'fa' ? notif.title_fa || notif.title : notif.title}</h4>
                              {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {locale === 'fa' ? notif.message_fa || notif.message : notif.message}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{notif.type}</Badge>
                        </div>
                        {notif.created_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'fa' ? 'پیام‌ها' : 'Messages'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Send Message */}
                <div className="p-4 border rounded-lg bg-secondary/30 space-y-3">
                  <div>
                    <label className="text-sm font-medium">
                      {locale === 'fa' ? 'شماره سفارش' : 'Order #'}
                    </label>
                    <Input
                      type="number"
                      value={selectedOrderId || ''}
                      onChange={(e) => setSelectedOrderId(parseInt(e.target.value) || null)}
                      placeholder={locale === 'fa' ? 'شماره سفارش را وارد کنید' : 'Enter order number'}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={locale === 'fa' ? 'پیام خود را بنویسید...' : 'Type your message...'}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} className="cursor-pointer self-end">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Message List */}
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">{locale === 'fa' ? 'پیامی وجود ندارد' : 'No messages'}</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`p-3 border rounded-lg ${msg.sender_id === user?.id ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">
                            {msg.sender_id === user?.id ? (locale === 'fa' ? 'شما' : 'You') : (locale === 'fa' ? 'آشپز' : 'Chef')}
                          </span>
                          {msg.order_id && <Badge variant="outline" className="text-xs">Order #{msg.order_id}</Badge>}
                        </div>
                        <p className="text-sm">{msg.content}</p>
                        {msg.created_at && (
                          <p className="text-xs text-muted-foreground mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'fa' ? 'برنامه معرفی' : 'Referral Program'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                  <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-semibold mb-2">
                    {locale === 'fa' ? 'دوستان خود را دعوت کنید' : 'Invite Friends, Earn Rewards'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {locale === 'fa'
                      ? 'با هر معرفی موفق ۵ دلار اعتبار دریافت کنید'
                      : 'Earn $5 credit for each successful referral'}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-background border rounded-lg px-4 py-2 font-mono text-lg font-bold">
                      {referralCode}
                    </div>
                    <Button size="icon" variant="outline" onClick={handleCopyReferral} className="cursor-pointer">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button className="mt-4 cursor-pointer" onClick={handleCreateReferral}>
                    {locale === 'fa' ? 'فعال‌سازی کد' : 'Activate Code'}
                  </Button>
                </div>

                {referrals.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">{locale === 'fa' ? 'تاریخچه معرفی' : 'Referral History'}</h4>
                    <div className="space-y-2">
                      {referrals.map((ref) => (
                        <div key={ref.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-mono text-sm">{ref.referral_code}</span>
                            <p className="text-xs text-muted-foreground">
                              {locale === 'fa' ? `پاداش: $${ref.reward_amount}` : `Reward: $${ref.reward_amount}`}
                            </p>
                          </div>
                          <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                            {ref.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Missing import fix
function Trash2Icon(props: any) { return <Trash2 {...props} />; }