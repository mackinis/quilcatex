
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { UserData } from './auth-modal';

const formSchema = z.object({
  token: z.string().min(1, { message: 'El token es requerido.' }),
});

type UserTokenVerificationFormProps = {
  userData: UserData;
  onTokenVerified: () => void;
};

export function UserTokenVerificationForm({ userData, onTokenVerified }: UserTokenVerificationFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: '',
    },
  });

  const handleResendToken = async () => {
    setIsResending(true);
    try {
      const response = await fetch('/api/auth/resend-user-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error al reenviar el token.');
      }
      toast({
        title: 'Token Reenviado',
        description: 'Hemos enviado un nuevo token a tu correo.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/auth/verify-user-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email, token: values.token }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Token incorrecto o expirado.');
        }
        
        toast({
            title: '¡Registro Completado!',
            description: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        });

        onTokenVerified();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error de Verificación',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token de Verificación</FormLabel>
              <FormControl>
                <Input placeholder="Pega el token de tu email aquí" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verificando...' : 'Verificar y Crear Cuenta'}
            </Button>
            <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={handleResendToken}
                disabled={isResending}
            >
                {isResending ? 'Reenviando...' : 'Reenviar token'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
