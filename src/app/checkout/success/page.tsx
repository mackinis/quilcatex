
"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useHydratedCart } from "@/hooks/use-cart.tsx";
import { useEffect } from "react";
import { useSearchParams } from 'next/navigation'
import { useToast } from "@/hooks/use-toast";

export default function CheckoutSuccessPage() {
    const { items, clearCart, getTotalPrice } = useHydratedCart();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    useEffect(() => {
        const paymentId = searchParams.get('payment_id');
        if (paymentId && items.length > 0) {
            const customerInfo = sessionStorage.getItem('checkout-customer');
            const cartItems = items;
            const totalPrice = getTotalPrice();
            
            if (customerInfo) {
                const { name, email } = JSON.parse(customerInfo);
                
                fetch('/api/notify/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerName: name,
                        customerEmail: email,
                        cartItems: cartItems,
                        totalPrice: totalPrice,
                        orderId: paymentId
                    })
                })
                .then(res => {
                    if (!res.ok) console.error("Failed to send purchase notification email.");
                })
                .catch(err => {
                    console.error("Error sending purchase notification:", err);
                });
            }
            
            clearCart();
            sessionStorage.removeItem('checkout-customer');
        }
    }, [clearCart, items, getTotalPrice, searchParams, toast]);

    return (
        <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col items-center text-center">
            <CheckCircle2 className="h-24 w-24 text-green-500 mb-6" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">¡Pago Aprobado!</h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed mx-auto my-4">
                Tu compra ha sido realizada con éxito. Hemos enviado un correo de confirmación con los detalles de tu pedido.
            </p>
            <Button asChild>
                <Link href="/">Volver a la Tienda</Link>
            </Button>
        </div>
    );
}
