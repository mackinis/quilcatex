
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type AppearanceSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";

// Zod schema for validation
const appearanceSchema = z.object({
  primary: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, { message: "Formato HSL inválido (ej: 180 50% 45%)" }),
  background: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, { message: "Formato HSL inválido (ej: 210 20% 98%)" }),
  accent: z.string().regex(/^(\d{1,3})\s(\d{1,3})%\s(\d{1,3})%$/, { message: "Formato HSL inválido (ej: 180 50% 90%)" }),
  faviconUrl: z.string().url("Debe ser una URL válida").or(z.literal('')).optional(),
});

type AppearanceFormData = z.infer<typeof appearanceSchema>;

export default function AppearancePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      primary: "180 50% 45%",
      background: "210 20% 98%",
      accent: "180 50% 90%",
      faviconUrl: "",
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.appearance) {
          form.reset(settings.appearance);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la configuración de apariencia.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: AppearanceFormData) => {
    setIsSaving(true);
    try {
      await saveSettings({ appearance: data });
      toast({
        title: "Éxito",
        description: "La configuración de apariencia se ha guardado. Refresca para ver los cambios.",
      });
       // Optionally force a reload to see changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración de apariencia.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight">Apariencia</h2>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
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
        <h2 className="text-3xl font-bold tracking-tight">Apariencia</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Colores y Favicon</CardTitle>
            <CardDescription>
              Modifica los colores principales de tu sitio y el ícono de la pestaña del navegador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Color Primario (botones, enlaces)</Label>
              <Input id="primary-color" {...form.register("primary")} />
              <p className="text-xs text-muted-foreground">Usa formato HSL (ej: "210 10% 23%").</p>
              {form.formState.errors.primary && <p className="text-sm text-destructive">{form.formState.errors.primary.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="background-color">Color de Fondo Principal</Label>
              <Input id="background-color" {...form.register("background")} />
               {form.formState.errors.background && <p className="text-sm text-destructive">{form.formState.errors.background.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">Color de Acento (resaltados, fondos secundarios)</Label>
              <Input id="accent-color" {...form.register("accent")} />
               {form.formState.errors.accent && <p className="text-sm text-destructive">{form.formState.errors.accent.message}</p>}
            </div>
             <div className="space-y-2 border-t pt-6">
              <Label htmlFor="favicon-url">URL del Favicon (opcional)</Label>
              <Input id="favicon-url" {...form.register("faviconUrl")} placeholder="https://ejemplo.com/favicon.ico"/>
              {form.formState.errors.faviconUrl && <p className="text-sm text-destructive">{form.formState.errors.faviconUrl.message}</p>}
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
