
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

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});

type ProvisionalLoginFormProps = {
  onSuccess: () => void;
};

export function ProvisionalLoginForm({ onSuccess }: ProvisionalLoginFormProps) {
  const { toast } = useToast();
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
        const response = await fetch('/api/auth/provisional-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Credenciales incorrectas.');
        }

        toast({
            title: 'Acceso Concedido',
            description: 'Credenciales provisionales correctas. Continúa con el registro.',
        });
        onSuccess();

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
              <FormLabel>Email Provisional</FormLabel>
              <FormControl>
                <Input placeholder="admin@admin.com" {...field} />
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
              <FormLabel>Contraseña Provisional</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Verificando...' : 'Siguiente'}
        </Button>
      </form>
    </Form>
  );
}
