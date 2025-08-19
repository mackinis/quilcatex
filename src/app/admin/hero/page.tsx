
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type HeroSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const urlOrRelativePath = z.string().refine(val => {
    if (val === '') return true; // Allow empty string
    const isUrl = z.string().url().safeParse(val).success;
    const isRelative = val.startsWith('/');
    return isUrl || isRelative;
}, {
    message: "Debe ser una URL válida o una ruta relativa (ej: /videos/mi-video.mp4)",
});

const heroSchema = z.object({
  title: z.string().min(1, "El título es requerido."),
  subtitle: z.string().min(1, "El subtítulo es requerido."),
  backgroundType: z.enum(['image', 'video', 'youtube']).default('image'),
  backgroundImageUrl: urlOrRelativePath.optional(),
  backgroundVideoUrl: urlOrRelativePath.optional(),
  primaryButtonText: z.string().min(1, "El texto del botón es requerido."),
  primaryButtonLink: z.string().min(1, "El enlace del botón es requerido."),
  secondaryButtonText: z.string().min(1, "El texto del botón es requerido."),
  secondaryButtonLink: z.string().min(1, "El enlace del botón es requerido."),
});

type HeroFormData = z.infer<typeof heroSchema>;

const defaultValues: HeroFormData = {
  title: "Soluciones Innovadoras para un Mundo Moderno",
  subtitle: "En QuilCatex, ofrecemos productos y servicios de primer nivel diseñados para elevar tu experiencia e impulsar el éxito.",
  backgroundType: 'image',
  backgroundImageUrl: "https://placehold.co/1920x1080",
  backgroundVideoUrl: "",
  primaryButtonText: "Explorar Productos",
  primaryButtonLink: "#products",
  secondaryButtonText: "Ponerse en Contacto",
  secondaryButtonLink: "#contact",
};

export default function HeroBannerPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HeroFormData>({
    resolver: zodResolver(heroSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.hero) {
           const safeData = {
              ...defaultValues,
              ...settings.hero,
              backgroundImageUrl: settings.hero.backgroundImageUrl || '',
              backgroundVideoUrl: settings.hero.backgroundVideoUrl || '',
            };
          form.reset(safeData);
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
      await saveSettings({ hero: data });
      toast({ title: "Éxito", description: "La configuración del Hero Banner se ha guardado." });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const backgroundType = form.watch("backgroundType");

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-1/4" />
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
       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
            <CardHeader>
                <CardTitle>Editor del Hero Banner</CardTitle>
                <CardDescription>Cambia la imagen, títulos y botones de la sección principal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Título Principal</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="subtitle" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subtítulo</FormLabel>
                        <FormControl><Textarea {...field} rows={3}/></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>

                <FormField control={form.control} name="backgroundType" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel>Tipo de Fondo</FormLabel>
                        <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="image" /></FormControl><FormLabel className="font-normal">Imagen</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="video" /></FormControl><FormLabel className="font-normal">Video (MP4)</FormLabel></FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="youtube" /></FormControl><FormLabel className="font-normal">YouTube</FormLabel></FormItem>
                        </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                
                {backgroundType === 'image' && (
                    <FormField control={form.control} name="backgroundImageUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL de la Imagen de Fondo</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                )}
                {backgroundType === 'video' && (
                     <FormField control={form.control} name="backgroundVideoUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL del Video (MP4)</FormLabel>
                            <FormControl><Input {...field} placeholder="https://ejemplo.com/video.mp4 o /videos/local.mp4" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                )}
                {backgroundType === 'youtube' && (
                     <FormField control={form.control} name="backgroundVideoUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL del Video de YouTube</FormLabel>
                            <FormControl><Input {...field} placeholder="https://www.youtube.com/watch?v=..." /></FormControl>
                             <FormDescription>Pega la URL completa del video de YouTube.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>
                )}
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-medium">Botón Principal</h4>
                        <FormField control={form.control} name="primaryButtonText" render={({ field }) => (
                            <FormItem><FormLabel>Texto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                            <FormField control={form.control} name="primaryButtonLink" render={({ field }) => (
                            <FormItem><FormLabel>Enlace</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                        <div className="space-y-4 p-4 border rounded-lg">
                        <h4 className="font-medium">Botón Secundario</h4>
                            <FormField control={form.control} name="secondaryButtonText" render={({ field }) => (
                            <FormItem><FormLabel>Texto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                            <FormField control={form.control} name="secondaryButtonLink" render={({ field }) => (
                            <FormItem><FormLabel>Enlace</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                    </div>
                </div>

            </CardContent>
             <CardFooter>
                <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </CardFooter>
            </Card>
        </form>
       </Form>
    </div>
  );
}
