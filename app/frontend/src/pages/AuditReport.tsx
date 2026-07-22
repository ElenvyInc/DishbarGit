import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import DishBarLogo from '@/components/DishBarLogo';

type Status = 'working' | 'partial' | 'mock' | 'missing' | 'risk';

interface AuditItem {
  feature: string;
  status: Status;
  notes: string;
}

const AUDIT_DATA: Record<string, AuditItem[]> = {
  'Authentication & Authorization': [
    { feature: 'Customer registration/login', status: 'working', notes: 'Via Atoms Cloud auth (email/social). Working end-to-end.' },
    { feature: 'Chef registration/login', status: 'working', notes: 'Same auth system, chef creates profile after login.' },
    { feature: 'Admin login', status: 'partial', notes: 'Uses same auth. NO separate admin role check — any authenticated user can access /admin routes.' },
    { feature: 'Phone/SMS OTP', status: 'missing', notes: 'NOT connected to any SMS provider. No OTP verification implemented.' },
    { feature: 'Session persistence', status: 'working', notes: 'Handled by Atoms Cloud auth SDK.' },
    { feature: 'Protected routes (frontend)', status: 'partial', notes: 'Routes exist but no role-based guards prevent customers from accessing /admin or /dashboard URLs.' },
    { feature: 'Protected routes (backend)', status: 'partial', notes: 'All admin endpoints require auth but do NOT verify admin role. Any logged-in user can call admin APIs.' },
    { feature: 'Logout', status: 'working', notes: 'Working via client.auth.logout().' },
  ],
  'Payments (Stripe)': [
    { feature: 'Stripe integration', status: 'working', notes: 'Stripe SDK configured. Keys read from env vars (not exposed in frontend).' },
    { feature: 'Checkout session creation', status: 'working', notes: 'Backend creates sessions with server-calculated amounts.' },
    { feature: 'Payment verification', status: 'working', notes: 'verify_payment endpoint checks Stripe session status.' },
    { feature: 'Stripe webhooks', status: 'missing', notes: 'NO webhook endpoint. Payment confirmation relies on client-side verify call only.' },
    { feature: 'Refund processing', status: 'partial', notes: 'Admin refund endpoint exists and calls Stripe API. Not tested with real transactions.' },
    { feature: 'Duplicate charge prevention', status: 'partial', notes: 'Order created before Stripe session. No idempotency key used.' },
    { feature: 'Stripe Connect (chef payouts)', status: 'missing', notes: 'NOT implemented. No connected accounts, no split payments.' },
    { feature: 'Commission calculation', status: 'working', notes: '15% platform commission calculated server-side.' },
    { feature: 'Price manipulation prevention', status: 'working', notes: 'Server recalculates all amounts. Frontend values ignored.' },
    { feature: 'Test vs Live mode', status: 'risk', notes: 'Depends on STRIPE_SECRET_KEY env var. No indicator in admin UI.' },
  ],
  'Order Workflow': [
    { feature: 'Cart management', status: 'working', notes: 'localStorage-based cart with add/remove/quantity.' },
    { feature: 'Inventory check before payment', status: 'working', notes: 'Server validates item availability and max_orders before creating Stripe session.' },
    { feature: 'Order creation', status: 'working', notes: 'Order created in DB before Stripe redirect.' },
    { feature: 'Chef notification on new order', status: 'mock', notes: 'Notification table exists but no real-time push. Chef must refresh dashboard.' },
    { feature: 'Chef accept/reject order', status: 'partial', notes: 'Status update possible via entity API but no dedicated accept/reject UI flow.' },
    { feature: 'Order status updates to customer', status: 'partial', notes: 'Customer can view status in portal. No push notifications.' },
    { feature: 'Order cancellation', status: 'partial', notes: 'Admin can cancel. No customer self-cancel with time window.' },
    { feature: 'Minimum order enforcement', status: 'working', notes: 'Server checks minimum_order_amount from platform settings.' },
    { feature: 'Ordering hours enforcement', status: 'working', notes: 'Server validates against platform settings ordering hours.' },
    { feature: 'Daily order limit', status: 'working', notes: 'Server counts today\'s paid orders against limit.' },
    { feature: 'Postal code restriction', status: 'working', notes: 'Server validates postal code prefix against allowed list.' },
  ],
  'Delivery & Address': [
    { feature: 'Distance calculation', status: 'partial', notes: 'Frontend uses city-name matching with Haversine formula. NOT real geocoding.' },
    { feature: 'Address validation', status: 'missing', notes: 'No geocoding API connected. Address is free-text input.' },
    { feature: 'Postal code zone delivery', status: 'working', notes: 'Backend validates postal code prefix against admin-configured allowed list.' },
    { feature: 'Delivery fee calculation', status: 'partial', notes: 'Server uses base_delivery_fee from settings. Distance-based fee is frontend-only estimate.' },
    { feature: 'Chef address privacy', status: 'working', notes: 'Chef home address not stored or displayed publicly.' },
    { feature: 'Maximum delivery distance', status: 'partial', notes: 'Setting exists but not enforced without real geocoding.' },
  ],
  'Chef Portal': [
    { feature: 'Profile creation/edit', status: 'working', notes: 'Chef can create and update profile via dashboard.' },
    { feature: 'Menu item management', status: 'working', notes: 'Add/edit/delete menu items with images, prices, categories.' },
    { feature: 'Order management', status: 'partial', notes: 'Chef can view orders. No accept/reject buttons. Status updates via generic entity API.' },
    { feature: 'Earnings/payout view', status: 'mock', notes: 'Stats shown but no real payout tracking. Stripe Connect not connected.' },
    { feature: 'Schedule management', status: 'missing', notes: 'No chef schedule/availability calendar.' },
    { feature: 'Document upload', status: 'missing', notes: 'No food handler cert or ID upload functionality.' },
    { feature: 'Inventory management', status: 'partial', notes: 'max_orders field exists per item. No real-time stock tracking.' },
  ],
  'Admin Portal': [
    { feature: 'Dashboard statistics', status: 'working', notes: 'Real counts from database (chefs, orders, revenue, commission).' },
    { feature: 'Chef approval/suspension', status: 'working', notes: 'Working approve/suspend actions.' },
    { feature: 'Order management', status: 'working', notes: 'List all orders with status filter.' },
    { feature: 'Refund processing', status: 'partial', notes: 'Calls Stripe refund API. Not tested with real payments.' },
    { feature: 'Review moderation', status: 'working', notes: 'Can view and delete reviews.' },
    { feature: 'Coupon management', status: 'working', notes: 'Create/list/delete coupons.' },
    { feature: 'Platform settings', status: 'working', notes: 'NEW: Full settings panel with pilot mode controls.' },
    { feature: 'Pause/resume ordering', status: 'working', notes: 'NEW: Emergency pause button.' },
    { feature: 'Chef compliance tracking', status: 'missing', notes: 'No document verification, expiry tracking, or compliance fields.' },
    { feature: 'Notification broadcasting', status: 'working', notes: 'Can send notifications (stored in DB, no push delivery).' },
  ],
  'Customer Portal': [
    { feature: 'Order history', status: 'working', notes: 'Shows user\'s orders with status.' },
    { feature: 'Order tracking (progress bar)', status: 'working', notes: 'Visual progress bar based on order status.' },
    { feature: 'Favourites', status: 'working', notes: 'Add/remove chefs from favourites.' },
    { feature: 'Notifications', status: 'partial', notes: 'Shows stored notifications. No real-time push.' },
    { feature: 'Messaging', status: 'partial', notes: 'Message form exists. No real-time chat. Messages stored in DB.' },
    { feature: 'Referral program', status: 'mock', notes: 'UI shows referral code. No actual reward tracking or redemption.' },
    { feature: 'Reorder', status: 'working', notes: 'Can reorder from previous orders.' },
  ],
  'Security & Privacy': [
    { feature: 'API key exposure', status: 'working', notes: 'Stripe secret key in backend env only. Not in frontend.' },
    { feature: 'SQL injection protection', status: 'working', notes: 'SQLAlchemy ORM with parameterized queries.' },
    { feature: 'XSS protection', status: 'working', notes: 'React auto-escapes. No dangerouslySetInnerHTML.' },
    { feature: 'Auth on sensitive endpoints', status: 'partial', notes: 'All entity routes require auth. Admin routes lack role verification.' },
    { feature: 'Rate limiting', status: 'missing', notes: 'No rate limiting on any endpoint.' },
    { feature: 'File upload restrictions', status: 'missing', notes: 'No file upload implemented yet (no type/size validation needed).' },
    { feature: 'Chef document privacy', status: 'missing', notes: 'No document upload system exists yet.' },
    { feature: 'Audit logging', status: 'missing', notes: 'No audit trail for admin actions.' },
    { feature: 'HTTPS/TLS', status: 'working', notes: 'Enforced by Atoms Cloud hosting.' },
  ],
  'Legal & Compliance': [
    { feature: 'Terms of Service', status: 'working', notes: 'NEW: Draft page at /legal/terms. Requires legal review.' },
    { feature: 'Privacy Policy', status: 'working', notes: 'NEW: Draft page at /legal/privacy. Requires legal review.' },
    { feature: 'Refund Policy', status: 'working', notes: 'NEW: Draft page at /legal/refund. Requires legal review.' },
    { feature: 'Chef Agreement', status: 'working', notes: 'NEW: Draft page at /legal/chef-agreement. Requires legal review.' },
    { feature: 'Food Safety Notice', status: 'working', notes: 'NEW: Draft page at /legal/food-safety.' },
    { feature: 'Allergen acknowledgement', status: 'working', notes: 'NEW: Required checkbox at checkout.' },
    { feature: 'Terms acceptance at registration', status: 'missing', notes: 'No checkbox during Atoms Cloud auth flow (cannot customize).' },
  ],
  'Internationalization': [
    { feature: 'English', status: 'working', notes: 'Full translation coverage.' },
    { feature: 'French', status: 'working', notes: 'Full translation coverage.' },
    { feature: 'Persian/Farsi', status: 'working', notes: 'Full translation with RTL layout.' },
    { feature: 'RTL layout', status: 'working', notes: 'Proper dir="rtl" on all pages.' },
  ],
};

const statusConfig: Record<Status, { icon: typeof CheckCircle; color: string; label: string }> = {
  working: { icon: CheckCircle, color: 'text-green-600', label: 'Working' },
  partial: { icon: AlertTriangle, color: 'text-yellow-600', label: 'Partial' },
  mock: { icon: Info, color: 'text-blue-600', label: 'Mock/Simulated' },
  missing: { icon: XCircle, color: 'text-red-600', label: 'Missing' },
  risk: { icon: AlertTriangle, color: 'text-orange-600', label: 'Risk' },
};

export default function AuditReportPage() {
  const navigate = useNavigate();

  const allItems = Object.values(AUDIT_DATA).flat();
  const counts = {
    working: allItems.filter(i => i.status === 'working').length,
    partial: allItems.filter(i => i.status === 'partial').length,
    mock: allItems.filter(i => i.status === 'mock').length,
    missing: allItems.filter(i => i.status === 'missing').length,
    risk: allItems.filter(i => i.status === 'risk').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="cursor-pointer gap-2">
            <ArrowLeft className="w-4 h-4" /> Admin
          </Button>
          <DishBarLogo size="sm" />
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Production Readiness Audit</h1>
        <p className="text-muted-foreground mb-6">DishBar — Pilot Launch Assessment (July 2026)</p>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {Object.entries(counts).map(([status, count]) => {
            const config = statusConfig[status as Status];
            const Icon = config.icon;
            return (
              <Card key={status}>
                <CardContent className="p-4 text-center">
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${config.color}`} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{config.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed Audit */}
        <div className="space-y-6">
          {Object.entries(AUDIT_DATA).map(([category, items]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item, i) => {
                    const config = statusConfig[item.status];
                    const Icon = config.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 py-2 border-b last:border-0">
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.feature}</span>
                            <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Launch Blockers */}
        <Card className="mt-8 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-lg text-red-600">🚫 Launch Blockers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. <strong>No admin role verification</strong> — Any authenticated user can access admin APIs and approve/suspend chefs.</p>
            <p>2. <strong>No Stripe webhooks</strong> — Payment confirmation relies only on client-side verify call. Abandoned sessions may create unpaid orders.</p>
            <p>3. <strong>No real geocoding</strong> — Distance calculation uses city-name matching. Address validation is not real.</p>
            <p>4. <strong>No SMS/OTP provider</strong> — Phone verification not connected to any service.</p>
            <p>5. <strong>Stripe Connect not implemented</strong> — Chef payouts cannot be automated.</p>
            <p>6. <strong>Mock data in database</strong> — Fake chefs and menu items must be removed before pilot.</p>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card className="mt-4 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-lg text-amber-600">⚠️ Required Before Pilot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Set up admin role check (use user metadata or a dedicated admins table).</p>
            <p>2. Remove all mock/fake data from the database.</p>
            <p>3. Enter real pilot chef data through the admin onboarding flow.</p>
            <p>4. Configure Stripe in test mode and verify a complete payment cycle.</p>
            <p>5. Set pilot_postal_codes to restrict delivery areas.</p>
            <p>6. Have all legal pages reviewed by a lawyer.</p>
            <p>7. Set up a support email that is actually monitored.</p>
            <p>8. Configure ordering hours and daily limits appropriately.</p>
            <p>9. Test the full order flow on mobile and desktop.</p>
            <p>10. Set manual_payouts=true and process chef payments manually.</p>
          </CardContent>
        </Card>

        {/* What's Working */}
        <Card className="mt-4 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg text-green-600">✅ What Is Genuinely Working</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Customer browsing, searching, and filtering chefs/menu items</p>
            <p>• Cart management with localStorage persistence</p>
            <p>• Stripe payment session creation with server-side amount calculation</p>
            <p>• Payment verification and order status update</p>
            <p>• Chef profile creation and menu management</p>
            <p>• Admin chef approval/suspension</p>
            <p>• Order history and tracking for customers</p>
            <p>• Favourites system</p>
            <p>• Trilingual support (EN/FR/FA) with RTL</p>
            <p>• Pilot mode with configurable restrictions</p>
            <p>• Inventory validation before payment</p>
            <p>• Allergen acknowledgement at checkout</p>
            <p>• Legal pages (draft, requires review)</p>
            <p>• Platform settings management</p>
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">🔑 Required Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            <p>STRIPE_SECRET_KEY — Stripe secret key (test mode for pilot)</p>
            <p>STRIPE_PUBLISHABLE_KEY — Stripe publishable key</p>
            <p className="text-muted-foreground italic">Note: Database, auth, and hosting are managed by Atoms Cloud.</p>
          </CardContent>
        </Card>

        {/* Portal URLs */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">🔗 Portal URLs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Customer Portal:</strong> / (homepage) and /account (after login)</p>
            <p><strong>Chef Portal:</strong> /dashboard (after login, create chef profile)</p>
            <p><strong>Admin Portal:</strong> /admin (after login — needs role restriction)</p>
            <p><strong>Audit Report:</strong> /admin/audit</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}