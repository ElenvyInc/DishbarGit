import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, Users, ChefHat, Package, DollarSign, Star, ArrowLeft,
  Check, X, Trash2, Send, Tag, Bell, Shield,
} from 'lucide-react';
import DishBarLogo from '@/components/DishBarLogo';
import { client, t, getLocale } from '@/lib/api';
import { toast } from 'sonner';

interface AdminStats {
  total_chefs: number;
  pending_chefs: number;
  active_chefs: number;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  total_reviews: number;
  orders_today: number;
}

interface ChefItem {
  id: number;
  user_id: string;
  name: string;
  name_fa?: string;
  city?: string;
  province?: string;
  cuisine_tags?: string;
  rating?: number;
  total_reviews?: number;
  is_approved: boolean;
  is_active: boolean;
  created_at?: string;
}

interface OrderItem {
  id: number;
  user_id: string;
  chef_id: number;
  items_json: string;
  total_amount: number;
  commission_amount?: number;
  chef_amount?: number;
  status: string;
  delivery_type?: string;
  customer_name?: string;
  customer_phone?: string;
  payment_status?: string;
  created_at?: string;
}

interface ReviewItem {
  id: number;
  user_id: string;
  chef_id: number;
  rating: number;
  comment?: string;
  comment_fa?: string;
  created_at?: string;
}

interface CouponItem {
  id: number;
  code: string;
  discount_percent?: number;
  discount_amount?: number;
  min_order_amount?: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at?: string;
  chef_id?: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [chefs, setChefs] = useState<ChefItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [chefFilter, setChefFilter] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState('system');
  const [couponCode, setCouponCode] = useState('');
  const [couponPercent, setCouponPercent] = useState('');
  const [couponMinOrder, setCouponMinOrder] = useState('0');
  const [couponMaxUses, setCouponMaxUses] = useState('100');
  const [refundOrderId, setRefundOrderId] = useState('');
  const [refundReason, setRefundReason] = useState('');
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
      } else {
        client.auth.toLogin();
      }
    } catch (e) {
      client.auth.toLogin();
    } finally {
      setAuthLoading(false);
    }
  };

  const loadAllData = async () => {
    await Promise.all([loadStats(), loadChefs(), loadOrders(), loadReviews(), loadCoupons()]);
  };

  const loadStats = async () => {
    try {
      const res = await client.apiCall.invoke({ url: '/api/v1/admin/stats', method: 'GET', data: {} });
      setStats(res.data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  };

  const loadChefs = async () => {
    try {
      const params: any = {};
      if (chefFilter) params.status = chefFilter;
      const res = await client.apiCall.invoke({ url: '/api/v1/admin/chefs', method: 'GET', data: params });
      setChefs(res.data?.items || []);
    } catch (e) {
      console.error('Failed to load chefs:', e);
    }
  };

  const loadOrders = async () => {
    try {
      const params: any = {};
      if (orderFilter) params.status = orderFilter;
      const res = await client.apiCall.invoke({ url: '/api/v1/admin/orders', method: 'GET', data: params });
      setOrders(res.data?.items || []);
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await client.apiCall.invoke({ url: '/api/v1/admin/reviews', method: 'GET', data: {} });
      setReviews(res.data?.items || []);
    } catch (e) {
      console.error('Failed to load reviews:', e);
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await client.apiCall.invoke({ url: '/api/v1/admin/coupons', method: 'GET', data: {} });
      setCoupons(res.data?.items || []);
    } catch (e) {
      console.error('Failed to load coupons:', e);
    }
  };

  const handleChefAction = async (chefId: number, action: string) => {
    try {
      await client.apiCall.invoke({
        url: '/api/v1/admin/chefs/approve',
        method: 'POST',
        data: { chef_id: chefId, action },
      });
      toast.success(`Chef ${action}d successfully`);
      loadChefs();
      loadStats();
    } catch (e) {
      toast.error(`Failed to ${action} chef`);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      await client.apiCall.invoke({
        url: `/api/v1/admin/reviews/${reviewId}`,
        method: 'DELETE',
        data: {},
      });
      toast.success('Review deleted');
      loadReviews();
    } catch (e) {
      toast.error('Failed to delete review');
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle || !notifMessage) {
      toast.error('Title and message required');
      return;
    }
    try {
      await client.apiCall.invoke({
        url: '/api/v1/admin/notifications/send',
        method: 'POST',
        data: { title: notifTitle, message: notifMessage, type: notifType },
      });
      toast.success('Notification sent');
      setNotifTitle('');
      setNotifMessage('');
    } catch (e) {
      toast.error('Failed to send notification');
    }
  };

  const handleCreateCoupon = async () => {
    if (!couponCode) {
      toast.error('Coupon code required');
      return;
    }
    try {
      await client.apiCall.invoke({
        url: '/api/v1/admin/coupons',
        method: 'POST',
        data: {
          code: couponCode,
          discount_percent: parseFloat(couponPercent) || null,
          min_order_amount: parseFloat(couponMinOrder) || 0,
          max_uses: parseInt(couponMaxUses) || 100,
        },
      });
      toast.success('Coupon created');
      setCouponCode('');
      setCouponPercent('');
      loadCoupons();
    } catch (e) {
      toast.error('Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    try {
      await client.apiCall.invoke({ url: `/api/v1/admin/coupons/${id}`, method: 'DELETE', data: {} });
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (e) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleRefund = async () => {
    if (!refundOrderId) {
      toast.error('Order ID required');
      return;
    }
    try {
      await client.apiCall.invoke({
        url: '/api/v1/admin/orders/refund',
        method: 'POST',
        data: { order_id: parseInt(refundOrderId), reason: refundReason },
      });
      toast.success('Refund processed');
      setRefundOrderId('');
      setRefundReason('');
      loadOrders();
    } catch (e: any) {
      toast.error(e?.data?.detail || 'Refund failed');
    }
  };

  useEffect(() => {
    if (user) loadChefs();
  }, [chefFilter]);

  useEffect(() => {
    if (user) loadOrders();
  }, [orderFilter]);

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
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ChefHat className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active_chefs}</p>
                    <p className="text-xs text-muted-foreground">Active Chefs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending_chefs}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${stats.total_revenue.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Orders ({stats.orders_today} today)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="chefs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="chefs" className="cursor-pointer text-xs sm:text-sm">Chefs</TabsTrigger>
            <TabsTrigger value="orders" className="cursor-pointer text-xs sm:text-sm">Orders</TabsTrigger>
            <TabsTrigger value="reviews" className="cursor-pointer text-xs sm:text-sm">Reviews</TabsTrigger>
            <TabsTrigger value="coupons" className="cursor-pointer text-xs sm:text-sm">Coupons</TabsTrigger>
            <TabsTrigger value="notifications" className="cursor-pointer text-xs sm:text-sm">Notify</TabsTrigger>
            <TabsTrigger value="refunds" className="cursor-pointer text-xs sm:text-sm">Refunds</TabsTrigger>
          </TabsList>

          {/* Chefs Management */}
          <TabsContent value="chefs">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Chef Management</CardTitle>
                  <div className="flex gap-2">
                    {['', 'pending', 'approved', 'suspended'].map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={chefFilter === f ? 'default' : 'outline'}
                        onClick={() => setChefFilter(f)}
                        className="cursor-pointer text-xs"
                      >
                        {f || 'All'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chefs.map((chef) => (
                    <div key={chef.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{chef.name}</h4>
                          <Badge variant={chef.is_approved ? (chef.is_active ? 'default' : 'destructive') : 'secondary'}>
                            {chef.is_approved ? (chef.is_active ? 'Active' : 'Suspended') : 'Pending'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {chef.city} • {chef.cuisine_tags} • ⭐ {chef.rating?.toFixed(1)} ({chef.total_reviews} reviews)
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!chef.is_approved && (
                          <Button size="sm" onClick={() => handleChefAction(chef.id, 'approve')} className="cursor-pointer">
                            <Check className="w-3 h-3 mr-1" /> Approve
                          </Button>
                        )}
                        {chef.is_active && chef.is_approved && (
                          <Button size="sm" variant="destructive" onClick={() => handleChefAction(chef.id, 'suspend')} className="cursor-pointer">
                            <X className="w-3 h-3 mr-1" /> Suspend
                          </Button>
                        )}
                        {!chef.is_active && chef.is_approved && (
                          <Button size="sm" onClick={() => handleChefAction(chef.id, 'approve')} className="cursor-pointer">
                            <Check className="w-3 h-3 mr-1" /> Reactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {chefs.length === 0 && <p className="text-center text-muted-foreground py-4">No chefs found</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Management */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Management</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {['', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((f) => (
                      <Button
                        key={f}
                        size="sm"
                        variant={orderFilter === f ? 'default' : 'outline'}
                        onClick={() => setOrderFilter(f)}
                        className="cursor-pointer text-xs"
                      >
                        {f || 'All'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">#{order.id}</span>
                        <div className="flex gap-2">
                          <Badge>{order.status}</Badge>
                          <Badge variant="outline">{order.payment_status}</Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <span>Customer: {order.customer_name}</span>
                        <span>Phone: {order.customer_phone}</span>
                        <span>Total: ${order.total_amount?.toFixed(2)}</span>
                        <span>Commission: ${order.commission_amount?.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.created_at && new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-center text-muted-foreground py-4">No orders found</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Moderation */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Review Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">Chef #{review.chef_id}</span>
                        </div>
                        <p className="text-sm">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {review.created_at && new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="icon" variant="ghost" className="text-destructive cursor-pointer" onClick={() => handleDeleteReview(review.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {reviews.length === 0 && <p className="text-center text-muted-foreground py-4">No reviews to moderate</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coupons */}
          <TabsContent value="coupons">
            <Card>
              <CardHeader>
                <CardTitle>Coupon Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 border rounded-lg bg-secondary/30">
                  <div>
                    <Label>Code</Label>
                    <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="WELCOME20" className="mt-1" />
                  </div>
                  <div>
                    <Label>Discount %</Label>
                    <Input type="number" value={couponPercent} onChange={(e) => setCouponPercent(e.target.value)} placeholder="20" className="mt-1" />
                  </div>
                  <div>
                    <Label>Min Order ($)</Label>
                    <Input type="number" value={couponMinOrder} onChange={(e) => setCouponMinOrder(e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleCreateCoupon} className="cursor-pointer w-full">
                      <Tag className="w-4 h-4 mr-1" /> Create
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <span className="font-mono font-medium">{coupon.code}</span>
                        <span className="text-sm text-muted-foreground ml-3">
                          {coupon.discount_percent ? `${coupon.discount_percent}% off` : `$${coupon.discount_amount} off`}
                        </span>
                        <span className="text-xs text-muted-foreground ml-3">
                          Used: {coupon.used_count}/{coupon.max_uses}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="icon" variant="ghost" className="text-destructive cursor-pointer" onClick={() => handleDeleteCoupon(coupon.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {coupons.length === 0 && <p className="text-center text-muted-foreground py-4">No coupons yet</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Send Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Notification title" className="mt-1" />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="Notification message..." className="mt-1" />
                </div>
                <div>
                  <Label>Type</Label>
                  <div className="flex gap-2 mt-1">
                    {['system', 'promotion', 'order_update'].map((type) => (
                      <Button
                        key={type}
                        size="sm"
                        variant={notifType === type ? 'default' : 'outline'}
                        onClick={() => setNotifType(type)}
                        className="cursor-pointer capitalize"
                      >
                        {type.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSendNotification} className="cursor-pointer">
                  <Send className="w-4 h-4 mr-2" /> Send Broadcast
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Refunds */}
          <TabsContent value="refunds">
            <Card>
              <CardHeader>
                <CardTitle>Process Refund</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Order ID</Label>
                    <Input type="number" value={refundOrderId} onChange={(e) => setRefundOrderId(e.target.value)} placeholder="Enter order ID" className="mt-1" />
                  </div>
                  <div>
                    <Label>Reason</Label>
                    <Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason for refund" className="mt-1" />
                  </div>
                </div>
                <Button onClick={handleRefund} variant="destructive" className="cursor-pointer">
                  Process Refund
                </Button>
                <p className="text-xs text-muted-foreground">
                  Note: Refunds are processed through Stripe and may take 5-10 business days to appear.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}