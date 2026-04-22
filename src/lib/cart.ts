import { useEffect, useState } from "react";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  image?: string;
  sellerId: string;
  quantity: number;
}

const KEY = "tradie:cart";

export function getCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function setCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("tradie:cart"));
}
export function addToCart(item: CartItem) {
  const cart = getCart();
  const existing = cart.find((c) => c.productId === item.productId);
  if (existing) existing.quantity += item.quantity;
  else cart.push(item);
  setCart(cart);
}
export function removeFromCart(productId: string) {
  setCart(getCart().filter((c) => c.productId !== productId));
}
export function clearCart() { setCart([]); }

export function useCart() {
  const [cart, setCartState] = useState<CartItem[]>(getCart());
  useEffect(() => {
    const handler = () => setCartState(getCart());
    window.addEventListener("tradie:cart", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tradie:cart", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return cart;
}

export const formatGHS = (n: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(n);
