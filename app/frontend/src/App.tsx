import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import ChefProfile from './pages/ChefProfile';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import ChefDashboard from './pages/ChefDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CustomerPortal from './pages/CustomerPortal';
import Legal from './pages/Legal';
import AuditReport from './pages/AuditReport';
import BecomeAChef from './pages/BecomeAChef';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
import BlogRoutes from './blog-routes';

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/chef/:id" element={<ChefProfile />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/payment-success" element={<OrderSuccess />} />
    <Route path="/dashboard" element={<ChefDashboard />} />
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/account" element={<CustomerPortal />} />
    <Route path="/legal/:page" element={<Legal />} />
    <Route path="/admin/audit" element={<AuditReport />} />
    <Route path="/become-a-chef" element={<BecomeAChef />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />
    <Route path="/blog/*" element={<BlogRoutes />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export { AppRoutes };