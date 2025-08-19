
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useHydratedCart } from "@/hooks/use-cart.tsx";
import { ScrollArea } from "../ui/scroll-area";
import { Trash, ShoppingCart } from "lucide-react";
import Image from "next/image";

export function CartModal({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
  const { items, removeFromCart, clearCart, getTotalPrice } = useHydratedCart();

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
                            <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                             <p className="text-sm font-semibold">AR$ {(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFromCart(item.id)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Eliminar</span>
                    </Button>
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
                    <p className="text-lg font-semibold">AR$ {getTotalPrice().toFixed(2)}</p>
                </div>
                <div className="flex w-full gap-2">
                    <Button variant="outline" className="w-full" onClick={() => clearCart()}>Vaciar Carrito</Button>
                    <Button className="w-full">Finalizar Compra</Button>
                </div>
            </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
