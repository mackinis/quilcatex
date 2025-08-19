
"use client";

import { useEffect, useState } from "react";
import { useHydratedCart } from "@/hooks/use-cart.tsx";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ShoppingCart, Loader2, AlertTriangle, Lock, Home, Store } from "lucide-react";
import { Wallet } from '@mercadopago/sdk-react'
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    deliveryMethod: 'pickup' | 'delivery';
    address?: string;
    city?: string;
    province?: string;
    zipCode?: string;
}

export default function CheckoutPage() {
  const { items, getTotalPrice } = useHydratedCart();
  const { toast } = useToast();
  const router = useRouter();
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  
  const mpKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;

  useEffect(() => {
    const info = sessionStorage.getItem('checkout-customer');
    if (!info) {
        toast({ title: "Error", description: "No se encontraron los datos del cliente.", variant: "destructive" });
        router.replace('/checkout/details');
        return;
    }
    setCustomerInfo(JSON.parse(info));

    if (items.length > 0) {
        fetch('/api/checkout/mercado-pago', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(items),
        })
        .then(async (res) => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error en el servidor');
            }
            return res.json();
        })
        .then(data => {
            if(data.preferenceId) {
                setPreferenceId(data.preferenceId);
            } else {
                throw new Error(data.error || 'No se pudo generar el enlace de pago.');
            }
        })
        .catch(err => {
            console.error(err);
             toast({
                variant: 'destructive',
                title: 'Error de Configuración',
                description: err.message || 'Hubo un problema al conectar con Mercado Pago.'
            });
        })
        .finally(() => setIsProcessing(false));
    } else {
        setIsProcessing(false);
    }
  }, [items, toast, router]);

  if (!mpKey) {
       return (
        <div className="container mx-auto px-4 md:px-6 py-12 text-center">
             <AlertTriangle className="h-24 w-24 mx-auto text-destructive mb-4" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Error de Configuración</h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed mx-auto my-4">
                La pasarela de pagos no está configurada correctamente. Por favor, contacta al administrador del sitio.
            </p>
             <Button asChild>
                <Link href="/">Volver a la tienda</Link>
            </Button>
        </div>
    );
  }

  if (isProcessing) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12 text-center">
             <Loader2 className="h-24 w-24 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Generando orden...</h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed mx-auto my-4">
                Estamos preparando tu pedido para el pago seguro con Mercado Pago.
            </p>
        </div>
    )
  }

  if (items.length === 0) {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12 text-center">
             <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Tu carrito está vacío</h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed mx-auto my-4">
                No tienes productos en tu carrito. ¡Explora nuestros productos y empieza a comprar!
            </p>
            <Button asChild>
                <Link href="/">Volver a la tienda</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-center mb-12">Finalizar Compra</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                        <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md" />
                        <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Cantidad: {item.quantity} x $ {formatCurrency(item.price)}</p>
                        </div>
                   </div>
                   <p className="font-semibold">$ {formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
              <div className="border-t pt-4 mt-4 flex items-center justify-between text-lg font-bold">
                <p>Total</p>
                <p>$ {formatCurrency(getTotalPrice())}</p>
              </div>
            </CardContent>
          </Card>
            {customerInfo && (
                 <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Datos del Comprador</CardTitle>
                    </CardHeader>
                     <CardContent>
                        <p className="font-semibold">{customerInfo.name}</p>
                        <p className="text-sm text-muted-foreground">{customerInfo.email}</p>
                        <p className="text-sm text-muted-foreground">{customerInfo.phone}</p>
                        
                         <div className='border-t mt-4 pt-4'>
                            <h4 className='font-semibold mb-2'>Método de Entrega</h4>
                            {customerInfo.deliveryMethod === 'pickup' ? (
                                <div className='flex items-center gap-2 text-sm'>
                                    <Store className='h-4 w-4 text-muted-foreground'/>
                                    <span>Retiro en el local</span>
                                </div>
                            ) : (
                                 <div className='flex items-start gap-2 text-sm'>
                                    <Home className='h-4 w-4 text-muted-foreground mt-0.5'/>
                                    <div>
                                        <p className="font-medium">Envío a domicilio</p>
                                        <p className='text-muted-foreground'>{customerInfo.address}</p>
                                        <p className='text-muted-foreground'>{customerInfo.city}, {customerInfo.province}, {customerInfo.zipCode}</p>
                                    </div>
                                </div>
                            )}
                         </div>

                         <Button asChild variant="link" className="p-0 h-auto mt-2">
                            <Link href="/checkout/details">Editar datos</Link>
                        </Button>
                     </CardContent>
                </Card>
            )}
        </div>
        <div>
           <Card>
            <CardHeader>
              <CardTitle>Pagar con Mercado Pago</CardTitle>
              <CardDescription>Serás redirigido a Mercado Pago para completar tu compra de forma segura.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex justify-center items-center min-h-[140px] flex-col">
                    {preferenceId ? (
                         <div id="wallet_container" key={preferenceId}>
                            <Wallet initialization={{ preferenceId: preferenceId }} customization={{ texts:{ valueProp: 'smart_option'}}} />
                         </div>
                    ) : (
                        <Skeleton className="h-12 w-full" />
                    )}
                 </div>
                 <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Al hacer clic en el botón, serás redirigido al sitio seguro de Mercado Pago.
                 </p>
            </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
