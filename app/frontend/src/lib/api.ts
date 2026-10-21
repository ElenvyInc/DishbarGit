import { createClient } from '@metagptx/web-sdk';

export const client = createClient();

export type { Locale, TranslationKey } from '@/i18n';
export { translations, getLocale, setLocale, t, getDir } from '@/i18n';

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

function notifyCart() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('dishbar-cart'));
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem('dishbar-cart', JSON.stringify(items));
  notifyCart();
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
  notifyCart();
}

export function getCartTotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}