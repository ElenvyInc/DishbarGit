import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChefHat, Plus, Package, DollarSign, Star, ArrowLeft, Trash2 } from 'lucide-react';
import { client, t, getLocale } from '@/lib/api';
import DishBarLogo from '@/components/DishBarLogo';
import { toast } from 'sonner';

interface ChefProfile {
  id?: number;
  name: string;
  name_fa: string;
  bio: string;
  bio_fa: string;
  avatar_url: string;
  city: string;
  province: string;
  cuisine_tags: string;
  delivery_options: string;
  rating?: number;
  total_reviews?: number;
  is_approved?: boolean;
}

interface MenuItem {
  id?: number;
  title: string;
  title_fa: string;
  description: string;
  description_fa: string;
  price: number;
  image_url: string;
  category: string;
  dietary_tags: string;
  is_available: boolean;
  max_orders: number;
}

interface Order {
  id: number;
  items_json: string;
  total_amount: number;
  status: string;
  delivery_type: string;
  customer_name: string;
  customer_phone: string;
  payment_status: string;
  created_at: string;
}

export default function ChefDashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [chef, setChef] = useState<ChefProfile | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newItem, setNewItem] = useState<MenuItem>({
    title: '', title_fa: '', description: '', description_fa: '',
    price: 0, image_url: '', category: 'stews', dietary_tags: 'halal',
    is_available: true, max_orders: 20,
  });
  const [profileForm, setProfileForm] = useState<ChefProfile>({
    name: '', name_fa: '', bio: '', bio_fa: '', avatar_url: '',
    city: '', province: 'Ontario', cuisine_tags: '', delivery_options: 'pickup',
  });
  const [saving, setSaving] = useState(false);
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
        loadChefData();
        loadOrders();
      } else {
        client.auth.toLogin();
      }
    } catch {
      client.auth.toLogin();
    } finally {
      setAuthLoading(false);
    }
  };

  const loadChefData = async () => {
    try {
      const res = await client.entities.chefs.query({ query: {}, limit: 1 });
      if (res?.data?.items?.length > 0) {
        const chefData = res.data.items[0];
        setChef(chefData);
        setProfileForm(chefData);
        loadMenuItems();
      }
    } catch (e) {
      console.error('Failed to load chef data:', e);
    }
  };

  const loadMenuItems = async () => {
    try {
      const res = await client.entities.menu_items.query({ query: {}, limit: 50 });
      if (res?.data?.items) {
        setMenuItems(res.data.items);
      }
    } catch (e) {
      console.error('Failed to load menu:', e);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await client.entities.orders.query({ query: {}, sort: '-created_at', limit: 50 });
      if (res?.data?.items) {
        setOrders(res.data.items);
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      if (chef?.id) {
        await client.entities.chefs.update({ id: String(chef.id), data: profileForm });
        toast.success(locale === 'fa' ? 'پروفایل به‌روزرسانی شد' : 'Profile updated');
      } else {
        const res = await client.entities.chefs.create({ data: profileForm });
        setChef(res.data);
        toast.success(locale === 'fa' ? 'پروفایل ایجاد شد' : 'Profile created');
      }
      loadChefData();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMenuItem = async () => {
    if (!chef?.id) {
      toast.error('Please create your chef profile first');
      return;
    }
    if (!newItem.title || !newItem.price) {
      toast.error('Title and price are required');
      return;
    }
    try {
      await client.entities.menu_items.create({
        data: { ...newItem, chef_id: chef.id },
      });
      toast.success(locale === 'fa' ? 'غذا اضافه شد' : 'Menu item added');
      setShowAddMenu(false);
      setNewItem({
        title: '', title_fa: '', description: '', description_fa: '',
        price: 0, image_url: '', category: 'stews', dietary_tags: 'halal',
        is_available: true, max_orders: 20,
      });
      loadMenuItems();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add item');
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    try {
      await client.entities.menu_items.delete({ id: String(id) });
      toast.success('Item deleted');
      loadMenuItems();
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await client.entities.orders.update({ id: String(orderId), data: { status } });
      toast.success('Order updated');
      loadOrders();
    } catch (e) {
      toast.error('Failed to update order');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

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
        {/* Stats */}
        {chef && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{orders.length}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'fa' ? 'سفارشات' : 'Orders'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${orders.reduce((s, o) => s + (o.total_amount || 0), 0).toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'fa' ? 'درآمد' : 'Revenue'}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{chef.rating?.toFixed(1) || '0.0'}</p>
                  <p className="text-xs text-muted-foreground">{t('rating')}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{menuItems.length}</p>
                  <p className="text-xs text-muted-foreground">{locale === 'fa' ? 'آیتم منو' : 'Menu Items'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue={chef ? 'orders' : 'profile'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="cursor-pointer">{t('myProfile')}</TabsTrigger>
            <TabsTrigger value="menu" className="cursor-pointer">{t('menu')}</TabsTrigger>
            <TabsTrigger value="orders" className="cursor-pointer">{t('orderHistory')}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'fa' ? 'پروفایل آشپز' : locale === 'fr' ? 'Profil du chef' : 'Chef Profile'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Name (English)</Label>
                    <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>نام (فارسی)</Label>
                    <Input value={profileForm.name_fa} onChange={(e) => setProfileForm({ ...profileForm, name_fa: e.target.value })} className="mt-1" dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Bio (English)</Label>
                    <Textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>بیوگرافی (فارسی)</Label>
                    <Textarea value={profileForm.bio_fa} onChange={(e) => setProfileForm({ ...profileForm, bio_fa: e.target.value })} className="mt-1" dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>City</Label>
                    <Input value={profileForm.city} onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Province</Label>
                    <Input value={profileForm.province} onChange={(e) => setProfileForm({ ...profileForm, province: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <Label>Avatar URL</Label>
                    <Input value={profileForm.avatar_url} onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Cuisine Tags (comma-separated)</Label>
                    <Input value={profileForm.cuisine_tags} onChange={(e) => setProfileForm({ ...profileForm, cuisine_tags: e.target.value })} placeholder="stews,kebabs,rice" className="mt-1" />
                  </div>
                  <div>
                    <Label>Delivery Options</Label>
                    <Input value={profileForm.delivery_options} onChange={(e) => setProfileForm({ ...profileForm, delivery_options: e.target.value })} placeholder="pickup,self_delivery,third_party" className="mt-1" />
                  </div>
                </div>
                {chef && !chef.is_approved && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    {locale === 'fa' ? '⏳ پروفایل شما در انتظار تأیید مدیر است' : '⏳ Your profile is pending admin approval'}
                  </div>
                )}
                <Button onClick={handleSaveProfile} disabled={saving} className="cursor-pointer">
                  {saving ? '...' : (chef?.id ? (locale === 'fa' ? 'به‌روزرسانی' : 'Update Profile') : (locale === 'fa' ? 'ایجاد پروفایل' : 'Create Profile'))}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Tab */}
          <TabsContent value="menu">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('menu')}</CardTitle>
                <Button size="sm" onClick={() => setShowAddMenu(!showAddMenu)} className="cursor-pointer">
                  <Plus className="w-4 h-4 mr-1" /> {locale === 'fa' ? 'افزودن غذا' : 'Add Item'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddMenu && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Title (English)</Label>
                          <Input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                          <Label>عنوان (فارسی)</Label>
                          <Input value={newItem.title_fa} onChange={(e) => setNewItem({ ...newItem, title_fa: e.target.value })} className="mt-1" dir="rtl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label>Description (English)</Label>
                          <Textarea value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                          <Label>توضیحات (فارسی)</Label>
                          <Textarea value={newItem.description_fa} onChange={(e) => setNewItem({ ...newItem, description_fa: e.target.value })} className="mt-1" dir="rtl" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <Label>Price ($)</Label>
                          <Input type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })} className="mt-1" />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} placeholder="stews" className="mt-1" />
                        </div>
                        <div>
                          <Label>Dietary Tags</Label>
                          <Input value={newItem.dietary_tags} onChange={(e) => setNewItem({ ...newItem, dietary_tags: e.target.value })} placeholder="halal,vegetarian" className="mt-1" />
                        </div>
                        <div>
                          <Label>Max Orders</Label>
                          <Input type="number" value={newItem.max_orders} onChange={(e) => setNewItem({ ...newItem, max_orders: parseInt(e.target.value) || 20 })} className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label>Image URL</Label>
                        <Input value={newItem.image_url} onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })} placeholder="https://..." className="mt-1" />
                      </div>
                      <Button onClick={handleAddMenuItem} className="cursor-pointer">
                        {locale === 'fa' ? 'ذخیره' : 'Save Item'}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {menuItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {locale === 'fa' ? 'هنوز غذایی اضافه نشده' : 'No menu items yet. Add your first dish!'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {menuItems.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">{item.category} • {item.dietary_tags}</p>
                          <p className="text-sm font-semibold text-primary">${item.price?.toFixed(2)}</p>
                        </div>
                        <Badge variant={item.is_available ? 'default' : 'secondary'}>
                          {item.is_available ? (locale === 'fa' ? 'موجود' : 'Available') : (locale === 'fa' ? 'ناموجود' : 'Unavailable')}
                        </Badge>
                        <Button size="icon" variant="ghost" className="text-destructive cursor-pointer" onClick={() => handleDeleteMenuItem(item.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t('orderHistory')}</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {locale === 'fa' ? 'هنوز سفارشی ندارید' : 'No orders yet'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">#{order.id}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{locale === 'fa' ? 'مشتری' : 'Customer'}: {order.customer_name}</p>
                          <p>{locale === 'fa' ? 'تلفن' : 'Phone'}: {order.customer_phone}</p>
                          <p>{locale === 'fa' ? 'تحویل' : 'Delivery'}: {order.delivery_type}</p>
                          <p className="font-semibold text-foreground">{t('total')}: ${order.total_amount?.toFixed(2)}</p>
                          <p className="text-xs">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        {order.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')} className="cursor-pointer">
                              {locale === 'fa' ? 'تأیید' : 'Confirm'}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')} className="cursor-pointer">
                              {locale === 'fa' ? 'لغو' : 'Cancel'}
                            </Button>
                          </div>
                        )}
                        {order.status === 'confirmed' && (
                          <Button size="sm" className="mt-3 cursor-pointer" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>
                            {locale === 'fa' ? 'شروع آماده‌سازی' : 'Start Preparing'}
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button size="sm" className="mt-3 cursor-pointer" onClick={() => handleUpdateOrderStatus(order.id, 'ready')}>
                            {locale === 'fa' ? 'آماده تحویل' : 'Mark Ready'}
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button size="sm" className="mt-3 cursor-pointer" onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}>
                            {locale === 'fa' ? 'تحویل داده شد' : 'Mark Delivered'}
                          </Button>
                        )}
                      </div>
                    ))}
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