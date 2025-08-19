
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type FooterSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash, GripVertical, ArrowDown, ArrowUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const socialLinkSchema = z.object({
    icon: z.string().min(1, "Debe seleccionar un icono."),
    href: z.string().url("URL inválida").or(z.literal('')),
});

const copyrightSchema = z.object({
  social: z.array(socialLinkSchema),
  socialIconSize: z.coerce.number().min(10, "El tamaño debe ser al menos 10.").optional(),
  copyrightText: z.string().min(1, "El texto de copyright es requerido"),
  developerName: z.string().optional(),
  developerUrl: z.string().url("URL inválida").or(z.literal('')).optional(),
});

type CopyrightFormData = z.infer<typeof copyrightSchema>;

const availableIcons = ["Twitter", "Facebook", "Instagram", "Linkedin", "Youtube", "Tiktok"];

export default function FooterCopyrightPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CopyrightFormData>({
    resolver: zodResolver(copyrightSchema),
    defaultValues: {
      social: [],
      socialIconSize: 24,
      copyrightText: `© ${new Date().getFullYear()} QuilCatex. Todos los derechos reservados.`,
      developerName: "",
      developerUrl: "",
    },
  });

  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: "social",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.footer) {
          form.reset({
              social: settings.footer.social || [],
              socialIconSize: settings.footer.socialIconSize || 24,
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
                <div className="flex justify-between items-center">
                    <Label>Redes Sociales</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ icon: 'Twitter', href: '' })}>
                        <Plus className="mr-2 h-4 w-4"/> Añadir Red Social
                    </Button>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="social-icon-size" className="text-sm font-normal">Tamaño de Íconos (px)</Label>
                    <Input id="social-icon-size" type="number" {...form.register("socialIconSize")} className="w-24"/>
                    {form.formState.errors.socialIconSize && <p className="text-sm text-destructive">{form.formState.errors.socialIconSize.message}</p>}
                </div>
                 <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <Select
                          onValueChange={(value) => form.setValue(`social.${index}.icon`, value)}
                          defaultValue={field.icon}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Seleccionar icono" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableIcons.map(iconName => (
                              <SelectItem key={iconName} value={iconName}>{iconName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <Input {...form.register(`social.${index}.href`)} placeholder="URL de la red social" className="flex-1" />
                       <div className="flex flex-col">
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={() => swap(index, index - 1)}>
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" disabled={index === fields.length - 1} onClick={() => swap(index, index + 1)}>
                                <ArrowDown className="h-4 w-4" />
                            </Button>
                        </div>
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
