
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type EmailSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const emailTemplateSchema = z.object({
  subject: z.string().min(1, "El asunto es requerido."),
  body: z.string().min(1, "El cuerpo del correo es requerido."),
});

const emailSettingsSchema = z.object({
  adminEmail: z.string().email("Debe ser un email válido."),
  customerPurchase: emailTemplateSchema,
  adminPurchase: emailTemplateSchema,
  userRegistration: emailTemplateSchema,
  adminRegistration: emailTemplateSchema,
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

const purchaseVariables = "{siteName}, {orderId}, {customerName}, {customerEmail}, {productList}, {totalPrice}";
const registrationVariables = "{siteName}, {fullName}, {email}, {token}";


export default function EmailsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      adminEmail: "",
      customerPurchase: {
        subject: "Confirmación de tu compra en {siteName}",
        body: "Hola {customerName},\n\nGracias por tu compra. Hemos recibido tu pedido #{orderId} y lo estamos procesando.\n\nResumen del pedido:\n{productList}\n\nTotal: ${totalPrice}\n\nGracias por confiar en nosotros,\nEl equipo de {siteName}",
      },
      adminPurchase: {
        subject: "Nueva Venta en {siteName} - Pedido #{orderId}",
        body: "Se ha realizado una nueva venta en tu tienda.\n\nPedido: #{orderId}\nCliente: {customerName} ({customerEmail})\n\nProductos:\n{productList}\n\nTotal: ${totalPrice}",
      },
      userRegistration: {
        subject: "Completa tu Registro en {siteName}",
        body: "Hola {fullName},\n\nGracias por registrarte en {siteName}.\n\nUsa el siguiente token para completar tu registro. Este token es válido por 1 hora.\n\nToken: {token}\n\nSi no solicitaste este registro, puedes ignorar este correo.\n\nSaludos,\nEl equipo de {siteName}",
      },
      adminRegistration: {
        subject: "Tu Token de Verificación de Admin para {siteName}",
        body: "Hola {fullName},\n\nGracias por registrarte como administrador en {siteName}.\n\nUsa el siguiente token para completar tu registro. Este token es válido por 1 hora.\n\nToken: {token}\n\nSi no solicitaste este registro, puedes ignorar este correo.\n\nSaludos,\nEl equipo de {siteName}",
      }
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.emails) {
          form.reset(settings.emails);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración de emails." });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: EmailSettingsFormData) => {
    setIsSaving(true);
    try {
      await saveSettings({ emails: data });
      toast({ title: "Éxito", description: "La configuración de emails se ha guardado." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderTemplateFields = (
    type: 'customerPurchase' | 'adminPurchase' | 'userRegistration' | 'adminRegistration', 
    title: string, 
    variables: string
  ) => (
     <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-semibold text-foreground">{title}</h3>
         <div className="text-xs text-muted-foreground">Variables disponibles: {variables.split(', ').map(v => <code key={v} className="bg-muted p-0.5 rounded-sm mx-0.5">{v}</code>)}</div>
        <div className="space-y-2">
            <Label htmlFor={`${type}-subject`}>Asunto</Label>
            <Input id={`${type}-subject`} {...form.register(`${type}.subject`)} />
            {form.formState.errors[type]?.subject && <p className="text-sm text-destructive">{form.formState.errors[type]?.subject?.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor={`${type}-body`}>Cuerpo del Email</Label>
            <Textarea id={`${type}-body`} {...form.register(`${type}.body`)} rows={10} />
            {form.formState.errors[type]?.body && <p className="text-sm text-destructive">{form.formState.errors[type]?.body?.message}</p>}
        </div>
    </div>
  )

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Emails Transaccionales</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
                <CardTitle>Plantillas de Email</CardTitle>
                <CardDescription>
                Personaliza los correos que se envían a tus clientes y administradores.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-8 pr-6">
                    <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email del Administrador para Notificaciones</Label>
                    <Input id="adminEmail" {...form.register("adminEmail")} placeholder="admin@tienda.com" />
                    {form.formState.errors.adminEmail && <p className="text-sm text-destructive">{form.formState.errors.adminEmail.message}</p>}
                    </div>
                
                    <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger className="text-lg font-medium">Emails de Compra</AccordionTrigger>
                            <AccordionContent className="space-y-6 pt-4">
                                {renderTemplateFields('customerPurchase', 'Confirmación de Compra para el Cliente', purchaseVariables)}
                                {renderTemplateFields('adminPurchase', 'Notificación de Compra para el Administrador', purchaseVariables)}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                             <AccordionTrigger className="text-lg font-medium">Emails de Registro</AccordionTrigger>
                             <AccordionContent className="space-y-6 pt-4">
                                {renderTemplateFields('userRegistration', 'Verificación de Cuenta para Usuario', registrationVariables)}
                                {renderTemplateFields('adminRegistration', 'Verificación de Cuenta para Administrador', registrationVariables)}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </ScrollArea>
             <div className="pt-6 border-t mt-6 flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Guardando..." : "Guardar Todas las Plantillas"}
                </Button>
            </div>
            </CardContent>
        </form>
      </Card>
    </div>
  );
}
