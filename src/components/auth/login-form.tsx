
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from './password-input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});

type LoginFormProps = {
  onSuccess: () => void;
  onProvisionalSuccess: () => void;
};

export function LoginForm({ onSuccess, onProvisionalSuccess }: LoginFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Credenciales incorrectas.');
        }

        if (data.provisional) {
             toast({
                title: 'Acceso Provisional',
                description: 'Credenciales correctas. Continúa con el registro.',
            });
            onProvisionalSuccess();
        } else {
            toast({
                title: '¡Bienvenido de vuelta!',
                description: 'Has iniciado sesión correctamente.',
            });
            // Store session info
            sessionStorage.setItem('user-session', JSON.stringify(data.user));
            // Dispatch event to notify other components like Header
            window.dispatchEvent(new CustomEvent('session-change'));
            
            onSuccess();

            if (data.user.isAdmin) {
                router.push('/admin/dashboard');
            }
        }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error de Autenticación',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
        </Button>
      </form>
    </Form>
  );
}
