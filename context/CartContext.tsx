"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { Cart, CartItem } from "@/types";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });
        if (res.ok) {
          const data = await res.json();
          setCart(data);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Failed to add item:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", { method: "DELETE" });
      if (res.ok) {
        setCart(null);
      }
    } catch (error) {
      console.error("Failed to clear cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const itemCount =
    cart?.items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0) ?? 0;

  const subtotal =
    cart?.items.reduce(
      (sum: number, item: CartItem) => sum + item.product.price * item.quantity,
      0
    ) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((prev) => !prev),
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}


