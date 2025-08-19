
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from './password-input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UserData } from './auth-modal';
import { getSettings } from '@/lib/settings-service';

const formSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    lastname: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
    phone: z.string().min(1, {message: 'El teléfono es requerido.'}),
    email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
    address: z.string().min(1, {message: 'La dirección es requerida.'}),
    zipCode: z.string().min(1, {message: 'El código postal es requerido.'}),
    city: z.string().min(1, {message: 'La ciudad es requerida.'}),
    province: z.string().min(1, {message: 'La provincia es requerida.'}),
    country: z.string(),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

type UserRegistrationFormProps = {
  onSuccess: (data: UserData) => void;
};

export function UserRegistrationForm({ onSuccess }: UserRegistrationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCountryChangeable, setIsCountryChangeable] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      lastname: '',
      phone: '',
      email: '',
      address: '',
      zipCode: '',
      city: '',
      province: '',
      country: 'Argentina',
      password: '',
      confirmPassword: '',
    },
  });
  
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings?.general?.allowCountryChange) {
          setIsCountryChangeable(true);
        }
      } catch (error) {
        console.error("Failed to load general settings for registration form", error);
      }
    }
    loadSettings();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el usuario.');
      }

      toast({
        title: '¡Casi listo! Revisa tu correo',
        description: 'Hemos enviado un token de verificación a tu email.',
      });
      onSuccess({ email: values.email });

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error en el Registro',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <ScrollArea className="h-72 w-full pr-4" type="scroll">
        <div className="space-y-4 px-1">
         <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastname"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                    <Input placeholder="Tu apellido" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="tu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input placeholder="Tu teléfono" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Calle y número" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: 1878" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                    <Input placeholder="Tu ciudad" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

         <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Provincia</FormLabel>
                <FormControl>
                    <Input placeholder="Tu provincia" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
                <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                    <Input {...field} disabled={!isCountryChangeable}/>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        </ScrollArea>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Crear Cuenta'}
        </Button>
      </form>
    </Form>
  );
}
