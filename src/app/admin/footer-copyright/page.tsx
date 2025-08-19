
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
import { getSettings, saveSettings, type FooterSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";

const socialSchema = z.object({
    twitter: z.string().url("URL inválida").or(z.literal('')),
    facebook: z.string().url("URL inválida").or(z.literal('')),
    instagram: z.string().url("URL inválida").or(z.literal('')),
});

const copyrightSchema = z.object({
  social: socialSchema,
  copyrightText: z.string().min(1, "El texto de copyright es requerido"),
  developerName: z.string().optional(),
  developerUrl: z.string().url("URL inválida").or(z.literal('')).optional(),
});

type CopyrightFormData = z.infer<typeof copyrightSchema>;

export default function FooterCopyrightPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CopyrightFormData>({
    resolver: zodResolver(copyrightSchema),
    defaultValues: {
      social: { twitter: "", facebook: "", instagram: "" },
      copyrightText: `© ${new Date().getFullYear()} QuilCatex. Todos los derechos reservados.`,
      developerName: "",
      developerUrl: "",
    },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.footer) {
          form.reset({
              social: settings.footer.social || { twitter: "", facebook: "", instagram: "" },
              copyrightText: settings.footer.copyrightText || `© ${new Date().getFullYear()} QuilCatex. Todos los derechos reservados.`,
              developerName: settings.footer.developerName || "",
              developerUrl: settings.footer.developerUrl || "",
          });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración." });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: CopyrightFormData) => {
    setIsSaving(true);
    try {
      await saveSettings({ footer: data as Partial<FooterSettings> });
      toast({ title: "Éxito", description: "La configuración se ha guardado." });
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
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Footer Copyright</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Editor del Footer Copyright</CardTitle>
            <CardDescription>Modifica el texto de copyright, los enlaces a redes sociales y la información del desarrollador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="copyright-text">Texto de Copyright</Label>
              <Input id="copyright-text" {...form.register("copyrightText")} />
              {form.formState.errors.copyrightText && <p className="text-sm text-destructive">{form.formState.errors.copyrightText.message}</p>}
            </div>
            <div className="space-y-4 border-t pt-6">
                <Label>Redes Sociales</Label>
                 <div className="space-y-2">
                    <Label htmlFor="social-twitter" className="text-sm font-normal">Twitter / X</Label>
                    <Input id="social-twitter" {...form.register("social.twitter")} placeholder="https://twitter.com/usuario" />
                    {form.formState.errors.social?.twitter && <p className="text-sm text-destructive">{form.formState.errors.social.twitter.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-facebook" className="text-sm font-normal">Facebook</Label>
                    <Input id="social-facebook" {...form.register("social.facebook")} placeholder="https://facebook.com/pagina" />
                    {form.formState.errors.social?.facebook && <p className="text-sm text-destructive">{form.formState.errors.social.facebook.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-instagram" className="text-sm font-normal">Instagram</Label>
                    <Input id="social-instagram" {...form.register("social.instagram")} placeholder="https://instagram.com/usuario" />
                    {form.formState.errors.social?.instagram && <p className="text-sm text-destructive">{form.formState.errors.social.instagram.message}</p>}
                </div>
            </div>
            <div className="space-y-4 border-t pt-6">
                <Label>Información del Desarrollador</Label>
                 <div className="space-y-2">
                    <Label htmlFor="developer-name" className="text-sm font-normal">Nombre del Desarrollador</Label>
                    <Input id="developer-name" {...form.register("developerName")} placeholder="Ej: WebCrafters Inc." />
                    {form.formState.errors.developerName && <p className="text-sm text-destructive">{form.formState.errors.developerName.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="developer-url" className="text-sm font-normal">URL del Desarrollador</Label>
                    <Input id="developer-url" {...form.register("developerUrl")} placeholder="https://webcrafters.com" />
                    {form.formState.errors.developerUrl && <p className="text-sm text-destructive">{form.formState.errors.developerUrl.message}</p>}
                </div>
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
