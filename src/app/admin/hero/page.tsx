
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
import { getSettings, saveSettings, type HeroSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const heroSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  subtitle: z.string().min(1, "El subtítulo es requerido"),
  buttonText: z.string().min(1, "El texto del botón es requerido"),
  mediaType: z.enum(['image', 'video', 'youtube']),
  mediaUrl: z.string().url("Debe ser una URL válida"),
  mediaOpacity: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "La opacidad debe ser al menos 0").max(100, "La opacidad no puede ser mayor a 100")
  ),
});

type HeroFormData = z.infer<typeof heroSchema>;

export default function HeroBannerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      title: "Calidad y Estilo en un Solo Lugar",
      subtitle: "Descubre nuestra colección exclusiva de productos diseñados para mejorar tu día a día.",
      buttonText: "Explorar Productos",
      mediaType: "image",
      mediaUrl: "https://placehold.co/1920x1080.png",
      mediaOpacity: 100,
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.hero) {
          form.reset({
            ...settings.hero,
            // Convert opacity from 0-1 to 0-100 for the form
            mediaOpacity: (settings.hero.mediaOpacity ?? 1) * 100,
          });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración del Hero Banner." });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: HeroFormData) => {
    setIsSaving(true);
    try {
      // Convert opacity from 0-100 to 0-1 before saving
      const settingsToSave: HeroSettings = {
        ...data,
        mediaOpacity: data.mediaOpacity / 100,
      };
      await saveSettings({ hero: settingsToSave });
      toast({ title: "Éxito", description: "La configuración del Hero Banner se ha guardado." });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const mediaType = form.watch("mediaType");

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
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
        <h2 className="text-3xl font-bold tracking-tight">Configuración del Hero Banner</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Editor del Hero Banner</CardTitle>
            <CardDescription>Cambia la imagen, títulos y botones de la sección principal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="hero-title">Título Principal</Label>
              <Input id="hero-title" {...form.register("title")} />
              {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subtitle">Subtítulo</Label>
              <Input id="hero-subtitle" {...form.register("subtitle")} />
              {form.formState.errors.subtitle && <p className="text-sm text-destructive">{form.formState.errors.subtitle.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-button">Texto del Botón</Label>
              <Input id="hero-button" {...form.register("buttonText")} />
              {form.formState.errors.buttonText && <p className="text-sm text-destructive">{form.formState.errors.buttonText.message}</p>}
            </div>

            <Controller
              control={form.control}
              name="mediaType"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Tipo de Fondo</Label>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="image" id="image" />
                      <Label htmlFor="image">Imagen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="video" id="video" />
                      <Label htmlFor="video">Video MP4</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="youtube" id="youtube" />
                      <Label htmlFor="youtube">YouTube</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            />
            
            <div className="space-y-2">
              <Label htmlFor="hero-media-url">
                {mediaType === 'image' && 'URL de la Imagen'}
                {mediaType === 'video' && 'URL del Video MP4'}
                {mediaType === 'youtube' && 'URL del Video de YouTube'}
              </Label>
              <Input id="hero-media-url" {...form.register("mediaUrl")} />
              {form.formState.errors.mediaUrl && <p className="text-sm text-destructive">{form.formState.errors.mediaUrl.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hero-opacity">Opacidad del Fondo (0 a 100)</Label>
              <Input id="hero-opacity" type="number" step="1" {...form.register("mediaOpacity")} />
              {form.formState.errors.mediaOpacity && <p className="text-sm text-destructive">{form.formState.errors.mediaOpacity.message}</p>}
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
