
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
import { getSettings, saveSettings, type HeaderSettings, type HeaderLink } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash } from "lucide-react";

const headerLinkSchema = z.object({
  text: z.string().min(1, "El texto es requerido"),
  href: z.string().min(1, "El enlace es requerido"),
});

const headerSchema = z.object({
  links: z.array(headerLinkSchema),
});

type HeaderFormData = z.infer<typeof headerSchema>;

export default function HeaderSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<HeaderFormData>({
    resolver: zodResolver(headerSchema),
    defaultValues: {
      links: [
        { text: 'Productos', href: '#products' },
        { text: 'Servicios', href: '#services' },
        { text: 'Contacto', href: '#contact' },
      ]
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.header && settings.header.links) {
          form.reset({ links: settings.header.links });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración del Header." });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: HeaderFormData) => {
    setIsSaving(true);
    try {
      await saveSettings({ header: data });
      toast({ title: "Éxito", description: "La configuración del Header se ha guardado." });
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
        <h2 className="text-3xl font-bold tracking-tight">Configuración del Header</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Editor del Header</CardTitle>
            <CardDescription>Modifica los elementos del encabezado de la página.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Enlaces de Navegación</Label>
              <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-4 p-2 border rounded-md">
                    <Input {...form.register(`links.${index}.text`)} placeholder="Texto del enlace" className="flex-1" />
                    <Input {...form.register(`links.${index}.href`)} placeholder="URL o ancla (#contacto)" className="flex-1" />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ text: '', href: '' })}>
                Añadir Enlace
              </Button>
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
