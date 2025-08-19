
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from './password-input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUserByEmail, type User, type UpdatableUser } from '@/lib/user-service';
import { Skeleton } from '../ui/skeleton';

const formSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    lastname: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres.' }),
    phone: z.string().min(1, { message: 'El teléfono es requerido.' }),
    address: z.string().min(1, { message: 'La dirección es requerida.' }),
    zipCode: z.string().min(1, { message: 'El código postal es requerido.' }),
    city: z.string().min(1, { message: 'La ciudad es requerida.' }),
    province: z.string().min(1, { message: 'La provincia es requerida.' }),
    country: z.string(),
    password: z.string().optional(),
    confirmPassword: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
}).refine(data => {
    if (data.password && data.password.length < 8) {
        return false;
    }
    return true;
}, {
    message: "La nueva contraseña debe tener al menos 8 caracteres.",
    path: ["password"],
});

type ProfileFormProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userEmail: string;
};

export function ProfileModal({ isOpen, onOpenChange, userEmail }: ProfileFormProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      lastname: '',
      phone: '',
      address: '',
      zipCode: '',
      city: '',
      province: '',
      country: '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    async function fetchUserData() {
      if (isOpen && userEmail) {
        setIsLoading(true);
        try {
          const user = await getUserByEmail(userEmail);
          if (user) {
            setUserData(user);
            form.reset({
              name: user.name,
              lastname: user.lastname,
              phone: user.phone,
              address: user.address,
              zipCode: user.zipCode,
              city: user.city,
              province: user.province,
              country: user.country,
              password: '',
              confirmPassword: '',
            });
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudieron cargar los datos del perfil.',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchUserData();
  }, [isOpen, userEmail, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
        const dataToUpdate: UpdatableUser = {
            name: values.name,
            lastname: values.lastname,
            phone: values.phone,
            address: values.address,
            zipCode: values.zipCode,
            city: values.city,
            province: values.province,
            country: values.country,
        };

        if (values.password) {
            dataToUpdate.password = values.password;
        }

      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, ...dataToUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el perfil.');
      }

      toast({
        title: 'Perfil Actualizado',
        description: 'Tus datos se han guardado correctamente.',
      });
      onOpenChange(false);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const renderFormContent = () => {
    if (isLoading) {
        return (
            <div className="space-y-4 p-1">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
            </div>
        )
    }
    
    return (
         <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-96 pr-4">
            <div className="space-y-4 px-1">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                  <Input value={userEmail} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="lastname" render={({ field }) => (
                    <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="zipCode" render={({ field }) => (
                    <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="province" render={({ field }) => (
                    <FormItem><FormLabel>Provincia</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </div>
            <div className='pt-4 border-t'>
                 <h3 className="text-sm font-medium">Cambiar Contraseña</h3>
                 <p className='text-xs text-muted-foreground'>Deja los campos en blanco si no quieres cambiarla.</p>
            </div>
             <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Nueva Contraseña</FormLabel><FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem><FormLabel>Confirmar Contraseña</FormLabel><FormControl><PasswordInput placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            </div>
            </ScrollArea>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tus datos personales. El email no se puede modificar.
          </DialogDescription>
        </DialogHeader>
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  );
}
