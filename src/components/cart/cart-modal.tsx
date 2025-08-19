
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useHydratedCart } from "@/hooks/use-cart.tsx";
import { ScrollArea } from "../ui/scroll-area";
import { Trash, ShoppingCart, Plus, Minus, Loader2 } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CartModal({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
  const { items, addToCart, decreaseQuantity, removeFromCart, clearCart, getTotalPrice, closeCart } = useHydratedCart();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCheckout = () => {
    setIsNavigating(true);
    router.push('/checkout/details');
    closeCart();
  };
  
  // Reset loading state if modal is closed manually
  if (!isOpen && isNavigating) {
    setIsNavigating(false);
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Carrito de Compras ({items.length})</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full pr-6">
            {items.length > 0 ? (
              <div className="flex flex-col gap-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-md">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                        <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                Unitario: $ {formatCurrency(item.price)}
                            </p>
                             <div className="flex items-center gap-2 mt-2">
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => decreaseQuantity(item.id)}><Minus className="h-3 w-3"/></Button>
                                <span className="w-5 text-center">{item.quantity}</span>
                                <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => addToCart(item)}><Plus className="h-3 w-3"/></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><Trash className="h-4 w-4"/></Button>
                             </div>
                        </div>
                    </div>
                     <p className="font-semibold text-right">$ {formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">Tu carrito está vacío.</p>
                 <SheetClose asChild>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Seguir comprando
                    </Button>
                </SheetClose>
              </div>
            )}
          </ScrollArea>
        </div>

        {items.length > 0 && (
            <SheetFooter className="gap-2 border-t p-6">
                 <div className="flex w-full items-center justify-between">
                    <p className="text-lg font-semibold">Total:</p>
                    <p className="text-lg font-semibold">$ {formatCurrency(getTotalPrice())}</p>
                </div>
                <div className="flex w-full gap-2">
                    <Button variant="outline" className="w-full" onClick={() => clearCart()}>Vaciar Carrito</Button>
                     <Button onClick={handleCheckout} className="w-full" disabled={isNavigating}>
                        {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Finalizar Compra
                    </Button>
                </div>
            </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
