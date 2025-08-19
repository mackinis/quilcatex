
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  brandDisplay: z.enum(['logoAndName', 'logoOnly', 'nameOnly']).default('logoAndName'),
  columns: z.array(footerColumnSchema),
  contact: footerContactSchema,
  aboutUsText: z.string().optional(),
  privacyPolicyText: z.string().optional(),
  termsOfServiceText: z.string().optional(),
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
      brandDisplay: 'logoAndName',
      columns: [],
      contact: { address: "", email: "", phone: "" },
      aboutUsText: "",
      privacyPolicyText: "",
      termsOfServiceText: "",
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
            brandDisplay: settings.footer.brandDisplay || 'logoAndName',
            columns: settings.footer.columns || [],
            contact: settings.footer.contact || { address: "", email: "", phone: "" },
            aboutUsText: settings.footer.aboutUsText || "Somos QuilCatex...",
            privacyPolicyText: settings.footer.privacyPolicyText || "Tu privacidad es importante...",
            termsOfServiceText: settings.footer.termsOfServiceText || "Al usar nuestro sitio...",
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
            <CardDescription>Modifica los enlaces, información y textos legales del pie de página.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">

             <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-foreground">Columna 1: Boletín y Marca</h3>
                <div className="space-y-2">
                    <Label htmlFor="newsletter-text">Texto del Boletín</Label>
                    <Textarea id="newsletter-text" {...form.register("newsletterText")} />
                    {form.formState.errors.newsletterText && <p className="text-sm text-destructive">{form.formState.errors.newsletterText.message}</p>}
                </div>
                <Controller
                    control={form.control}
                    name="brandDisplay"
                    render={({ field }) => (
                        <div className="space-y-2">
                        <Label>Visualización de la Marca</Label>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cómo mostrar la marca" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="logoAndName">Logo y Nombre</SelectItem>
                            <SelectItem value="logoOnly">Solo Logo</SelectItem>
                            <SelectItem value="nameOnly">Solo Nombre</SelectItem>
                            </SelectContent>
                        </Select>
                        </div>
                    )}
                />
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">Columnas de Enlaces</h3>
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
                <h3 className="font-semibold text-foreground">Columna de Contacto</h3>
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
             <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-foreground">Textos Legales</h3>
                 <div className="space-y-2">
                    <Label htmlFor="about-us-text">Sobre Nosotros</Label>
                    <Textarea id="about-us-text" {...form.register("aboutUsText")} rows={5} placeholder="Describe brevemente tu empresa..."/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="privacy-policy-text">Política de Privacidad</Label>
                    <Textarea id="privacy-policy-text" {...form.register("privacyPolicyText")} rows={5} placeholder="Detalla cómo manejas los datos de los usuarios..."/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="terms-of-service-text">Términos de Servicio</Label>
                    <Textarea id="terms-of-service-text" {...form.register("termsOfServiceText")} rows={5} placeholder="Define las reglas y condiciones de uso de tu sitio..."/>
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
