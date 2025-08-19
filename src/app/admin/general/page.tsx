
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
            <CardTitle>Ajustes Generales</CardTitle>
            <CardDescription>Configura los ajustes generales de la aplicación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Nombre del Sitio</Label>
              <Input id="siteName" {...form.register("siteName")} />
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
