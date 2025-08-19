
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type GeneralSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

const generalSchema = z.object({
  siteName: z.string().min(1, { message: "El nombre del sitio es requerido." }),
  displayName: z.string().optional(),
  logoUrl: z.string().url("Debe ser una URL válida").or(z.literal('')).optional(),
  faviconUrl: z.string().url("Debe ser una URL válida").or(z.literal('')).optional(),
  contactEmail: z.string().email({ message: "Debe ser un email válido." }),
  allowCountryChange: z.boolean(),
});

type GeneralFormData = z.infer<typeof generalSchema>;

export default function GeneralPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      siteName: "QuilCatex",
      displayName: "",
      logoUrl: "",
      faviconUrl: "",
      contactEmail: "info@quilcatex.com",
      allowCountryChange: false,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.general) {
          form.reset(settings.general);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la configuración general.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: GeneralFormData) => {
    setIsSaving(true);
    try {
      await saveSettings({ general: data });
      toast({
        title: "Éxito",
        description: "La configuración general se ha guardado correctamente.",
      });
       // Optionally force a reload to see changes on other tabs
       setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración general.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight">Configuración General</h2>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Configuración General</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Identidad del Sitio</CardTitle>
            <CardDescription>Configura los ajustes de branding y contacto de la aplicación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre para mostrar</Label>
              <Input id="displayName" {...form.register("displayName")} placeholder="El nombre que ven tus clientes (ej: Mi Tienda)" />
              {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">URL del Logo (opcional)</Label>
                  <Input id="logoUrl" {...form.register("logoUrl")} placeholder="https://ejemplo.com/logo.png"/>
                  {form.formState.errors.logoUrl && <p className="text-sm text-destructive">{form.formState.errors.logoUrl.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="faviconUrl">URL del Favicon (opcional)</Label>
                  <Input id="faviconUrl" {...form.register("faviconUrl")} placeholder="https://ejemplo.com/favicon.ico"/>
                   {form.formState.errors.faviconUrl && <p className="text-sm text-destructive">{form.formState.errors.faviconUrl.message}</p>}
                </div>
             </div>
            <div className="space-y-2 border-t pt-6">
               <Label htmlFor="siteName">Nombre del Sitio (para Pestañas y Emails)</Label>
                <Input id="siteName" {...form.register("siteName")} />
                <p className="text-xs text-muted-foreground">Este es el nombre que aparece en la pestaña del navegador y en los correos automáticos.</p>
                {form.formState.errors.siteName && <p className="text-sm text-destructive">{form.formState.errors.siteName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de Contacto</Label>
              <Input id="contactEmail" {...form.register("contactEmail")} />
              {form.formState.errors.contactEmail && <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>}
            </div>
             <div className="flex items-center space-x-2">
              <Switch 
                id="allowCountryChange" 
                checked={form.watch("allowCountryChange")}
                onCheckedChange={(checked) => form.setValue("allowCountryChange", checked)}
              />
              <Label htmlFor="allowCountryChange">Permitir cambiar el país en el registro de usuario</Label>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
