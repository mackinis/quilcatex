
"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Product } from '@/lib/product-service';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  openCart: () => void;
  closeCart: () => void;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      addToCart: (product) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },
      removeFromCart: (productId) => {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
      },
      clearCart: () => {
        set({ items: [] });
      },
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Provider to ensure we are on the client before using the cart
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    return <>{isClient ? children : null}</>;
};

// Custom hook to access the cart state safely after client-side hydration
export const useHydratedCart = () => {
  const cartState = useCartStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const safeCartState = {
    ...cartState,
    items: hydrated ? cartState.items : [],
    getTotalPrice: () => (hydrated ? cartState.getTotalPrice() : 0),
  };

  return safeCartState;
};
