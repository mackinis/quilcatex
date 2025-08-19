
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
  decreaseQuantity: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  openCart: () => void;
  closeCart: () => void;
  hydrated: boolean; // Add hydrated state
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,
      hydrated: false, // Default hydrated to false
      addToCart: (product) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === product.id);

        if (existingItem) {
          // If item exists, increase quantity and ensure price is updated (with discount if any)
          set({
            items: items.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1, price: product.price }
                : item
            ),
          });
        } else {
          // If new item, add with quantity 1 and the price passed (which includes discount)
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },
      decreaseQuantity: (productId) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === productId);

        if (existingItem && existingItem.quantity > 1) {
            set({
                items: items.map((item) =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                ),
            });
        } else {
            // Remove item if quantity is 1 or less
            set({
                items: items.filter((item) => item.id !== productId),
            });
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
      onRehydrateStorage: () => (state) => {
        if (state) {
            state.hydrated = true;
        }
      }
    }
  )
);

// Provider to ensure we are on the client before using the cart
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

// Custom hook to access the cart state safely after client-side hydration
export const useHydratedCart = () => {
  const cartState = useCartStore();
  
  useEffect(() => {
      // This triggers rehydration on mount
      useCartStore.persist.rehydrate();
  }, []);

  return cartState;
};
