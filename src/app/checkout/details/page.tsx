
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useHydratedCart } from '@/hooks/use-cart';
import { getUserByEmail, type User } from '@/lib/user-service';
import { AuthModal } from '@/components/auth/auth-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Home, Store, Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es requerido.' }),
  email: z.string().email({ message: 'Debe ser un email válido.' }),
  phone: z.string().min(1, { message: 'El teléfono es requerido.' }),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
}).refine(data => {
    if (data.deliveryMethod === 'delivery') {
        return !!data.address && !!data.zipCode && !!data.city && !!data.province;
    }
    return true;
}, {
    message: 'La dirección completa es requerida para el envío a domicilio.',
    path: ['address'],
});


type CheckoutFormData = z.infer<typeof formSchema>;

export default function CheckoutDetailsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { items, getTotalPrice, hydrated } = useHydratedCart();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    
    const form = useForm<CheckoutFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            deliveryMethod: 'pickup',
            address: '',
            zipCode: '',
            city: '',
            province: '',
        },
    });
    
    const deliveryMethod = form.watch('deliveryMethod');

    useEffect(() => {
        if (!hydrated) return;

        if (items.length === 0) {
            toast({
                title: "Carrito vacío",
                description: "No hay productos en tu carrito.",
                variant: "destructive"
            });
            router.replace('/');
            return;
        }

        const sessionData = sessionStorage.getItem('user-session');
        if (sessionData) {
            setIsLoggedIn(true);
            try {
                const session = JSON.parse(sessionData);
                getUserByEmail(session.email)
                    .then(user => {
                        if (user) {
                            form.reset({
                                name: user.fullName,
                                email: user.email,
                                phone: user.phone || '',
                                deliveryMethod: 'pickup',
                                address: user.address || '',
                                zipCode: user.zipCode || '',
                                city: user.city || '',
                                province: user.province || '',
                            });
                        }
                    }).finally(() => setIsLoading(false));
            } catch {
                setIsLoading(false);
            }
        } else {
            setIsLoggedIn(false);
            setIsLoading(false);
        }
    }, [hydrated, items.length, router, toast, form]);

    const handleFormSubmit = (data: CheckoutFormData) => {
        setIsProcessing(true);
        sessionStorage.setItem('checkout-customer', JSON.stringify(data));
        router.push('/checkout');
    };
    
    if (isLoading || !hydrated) {
        return (
            <div className="container mx-auto px-4 md:px-6 py-12">
                 <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-center mb-12">Detalles de la Compra</h1>
                 <div className="mx-auto grid max-w-4xl grid-cols-1 md:grid-cols-2 gap-12">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                 </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 md:px-6 py-12">
             <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl text-center mb-12">Detalles de la Compra</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div>
                    <Card>
                        <CardHeader><CardTitle>Resumen del Pedido</CardTitle></CardHeader>
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
                </div>
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tu Información</CardTitle>
                             <CardDescription>Completa tus datos para continuar.</CardDescription>
                        </CardHeader>
                         <CardContent>
                            {!isLoggedIn && (
                                <div className="mb-4">
                                    <Button onClick={() => setIsAuthModalOpen(true)} className="w-full">Iniciar Sesión / Registrarse</Button>
                                    <p className="text-center text-sm text-muted-foreground my-2">O continúa como invitado</p>
                                </div>
                            )}
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                                     <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input {...field} placeholder="Tu nombre y apellido" disabled={isLoggedIn} /></FormControl><FormMessage /></FormItem>
                                     )}/>
                                      <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="tu@email.com" disabled={isLoggedIn} /></FormControl><FormMessage /></FormItem>
                                     )}/>
                                      <FormField control={form.control} name="phone" render={({ field }) => (
                                        <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} placeholder="Tu teléfono de contacto" /></FormControl><FormMessage /></FormItem>
                                     )}/>

                                    <FormField control={form.control} name="deliveryMethod" render={({ field }) => (
                                        <FormItem className="space-y-3 pt-4 border-t">
                                            <FormLabel>Método de Entrega</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                                                    <FormItem>
                                                        <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                                                        <Label htmlFor="pickup" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                            <Store className="mb-3 h-6 w-6" />
                                                            Retiro en el local
                                                        </Label>
                                                    </FormItem>
                                                     <FormItem>
                                                        <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                                                         <Label htmlFor="delivery" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                            <Home className="mb-3 h-6 w-6" />
                                                            Envío a domicilio
                                                        </Label>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}/>

                                    {deliveryMethod === 'delivery' && (
                                        <div className="space-y-4 pt-4 border-t animate-in fade-in-50">
                                            <FormField control={form.control} name="address" render={({ field }) => (
                                                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} placeholder="Calle y número" /></FormControl><FormMessage /></FormItem>
                                            )}/>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="zipCode" render={({ field }) => (
                                                    <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} placeholder="C.P." /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                                <FormField control={form.control} name="city" render={({ field }) => (
                                                    <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} placeholder="Tu ciudad" /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                             <FormField control={form.control} name="province" render={({ field }) => (
                                                <FormItem><FormLabel>Provincia</FormLabel><FormControl><Input {...field} placeholder="Tu provincia" /></FormControl><FormMessage /></FormItem>
                                            )}/>
                                        </div>
                                    )}

                                     <Button type="submit" className="w-full" disabled={isProcessing}>
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isProcessing ? 'Procesando...' : 'Continuar al Pago'}
                                     </Button>
                                </form>
                            </Form>
                         </CardContent>
                    </Card>
                </div>
            </div>
             <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
        </div>
    );
}
