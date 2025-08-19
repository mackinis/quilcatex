
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type FooterSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const footerLinkSchema = z.object({
  text: z.string().min(1, "El texto es requerido"),
  href: z.string().min(1, "El enlace es requerido"),
});

const footerColumnSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  links: z.array(footerLinkSchema),
});

const footerContactSchema = z.object({
  address: z.string().min(1, "La dirección es requerida"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es requerido"),
});

const footerSchema = z.object({
  newsletterText: z.string().min(1, "El texto del boletín es requerido"),
  columns: z.array(footerColumnSchema),
  contact: footerContactSchema,
});

type FooterFormData = z.infer<typeof footerSchema>;

export default function FooterMainPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FooterFormData>({
    resolver: zodResolver(footerSchema),
    defaultValues: {
      newsletterText: "",
      columns: [],
      contact: { address: "", email: "", phone: "" },
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "columns",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.footer) {
          form.reset({
            newsletterText: settings.footer.newsletterText || "Mantente al día...",
            columns: settings.footer.columns || [],
            contact: settings.footer.contact || { address: "", email: "", phone: "" },
          });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración del Footer." });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: FooterFormData) => {
    setIsSaving(true);
    try {
      // We only want to save the 'footer' part of the settings
      const settingsToSave = { footer: data as Partial<FooterSettings> };
      await saveSettings(settingsToSave);
      toast({ title: "Éxito", description: "La configuración del Footer se ha guardado." });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
    } finally {
      setIsSaving(false);
    }
  };

  const addColumn = () => {
    append({ title: "Nueva Columna", links: [{ text: "Nuevo Enlace", href: "#" }] });
  };

  const addLink = (columnIndex: number) => {
    const currentLinks = form.getValues(`columns.${columnIndex}.links`);
    const updatedLinks = [...currentLinks, { text: '', href: '#' }];
    const columnToUpdate = form.getValues(`columns.${columnIndex}`);
    update(columnIndex, { ...columnToUpdate, links: updatedLinks });
  };

  const removeLink = (columnIndex: number, linkIndex: number) => {
     const currentLinks = form.getValues(`columns.${columnIndex}.links`);
     currentLinks.splice(linkIndex, 1);
     const columnToUpdate = form.getValues(`columns.${columnIndex}`);
     update(columnIndex, { ...columnToUpdate, links: currentLinks });
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Footer Principal</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Editor del Footer Principal</CardTitle>
            <CardDescription>Modifica los enlaces y la información del pie de página principal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">

             <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-foreground">Columna 1: Boletín (Newsletter)</h3>
                <div className="space-y-2">
                    <Label htmlFor="newsletter-text">Texto del Boletín</Label>
                    <Textarea id="newsletter-text" {...form.register("newsletterText")} />
                    {form.formState.errors.newsletterText && <p className="text-sm text-destructive">{form.formState.errors.newsletterText.message}</p>}
                </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">Columnas 2 y 3: Enlaces</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                        <Plus className="mr-2 h-4 w-4"/> Añadir Columna
                    </Button>
                </div>
                <Accordion type="multiple" defaultValue={fields.map((_, i) => `item-${i}`)} className="w-full">
                {fields.map((field, columnIndex) => (
                    <AccordionItem value={`item-${columnIndex}`} key={field.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-2">
                         <Input {...form.register(`columns.${columnIndex}.title`)} className="text-lg font-semibold border-none focus-visible:ring-0 p-0" placeholder="Título de la columna"/>
                          <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); remove(columnIndex); }} className="hover:bg-destructive/10 text-destructive ml-auto">
                              <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 p-2">
                        {form.getValues(`columns.${columnIndex}.links`).map((_, linkIndex) => (
                        <div key={linkIndex} className="flex items-center gap-2 p-2 border rounded-md">
                            <Input {...form.register(`columns.${columnIndex}.links.${linkIndex}.text`)} placeholder="Texto del enlace" className="flex-1" />
                            <Input {...form.register(`columns.${columnIndex}.links.${linkIndex}.href`)} placeholder="URL o ancla (#contacto)" className="flex-1" />
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeLink(columnIndex, linkIndex)}>
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addLink(columnIndex)}>
                            <Plus className="mr-2 h-4 w-4"/> Añadir enlace
                        </Button>
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </div>
            
             <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-foreground">Columna 4: Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label htmlFor="contact-address">Dirección</Label>
                        <Input id="contact-address" {...form.register(`contact.address`)} />
                         {form.formState.errors.contact?.address && <p className="text-sm text-destructive">{form.formState.errors.contact.address.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact-email">Email de Contacto</Label>
                        <Input id="contact-email" {...form.register(`contact.email`)} />
                         {form.formState.errors.contact?.email && <p className="text-sm text-destructive">{form.formState.errors.contact.email.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contact-phone">Teléfono de Contacto</Label>
                        <Input id="contact-phone" {...form.register(`contact.phone`)} />
                         {form.formState.errors.contact?.phone && <p className="text-sm text-destructive">{form.formState.errors.contact.phone.message}</p>}
                    </div>
                </div>
            </div>
            
            <Button type="submit" disabled={isSaving} size="lg">
              {isSaving ? "Guardando..." : "Guardar Cambios del Footer"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
