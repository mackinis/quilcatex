
"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type ServicesTextSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, ShieldCheck, Truck, BarChart, ShoppingCart, Headset, Package, BadgePercent, CreditCard, Wallet, PhoneCall, Award } from 'lucide-react';

const serviceCardSchema = z.object({
  icon: z.string(),
  title: z.string().min(1, "El título es requerido."),
  description: z.string().min(1, "La descripción es requerida."),
});

const servicesTextSchema = z.object({
  mainTitle: z.string().min(1, "El título principal es requerido."),
  mainDescription: z.string().min(1, "La descripción principal es requerida."),
  cards: z.array(serviceCardSchema),
});

type ServicesTextFormData = z.infer<typeof servicesTextSchema>;

const iconMap: { [key: string]: React.ElementType } = {
  ShoppingCart, Headset, BarChart, Truck, ShieldCheck, Wrench, Package, BadgePercent, CreditCard, Wallet, PhoneCall, Award
};
const availableIcons = Object.keys(iconMap);

const defaultServiceCards = [
    { icon: 'ShoppingCart', title: "Venta de Productos", description: "Ofrecemos una amplia gama de productos de alta calidad para satisfacer sus necesidades comerciales y personales." },
    { icon: 'Headset', title: "Consultoría Experta", description: "Nuestro equipo de expertos brinda servicios de consultoría a medida para ayudarlo a alcanzar sus objetivos." },
    { icon: 'BarChart', title: "Soluciones a Medida", description: "Desarrollamos soluciones personalizadas para abordar sus desafíos y requisitos únicos." },
    { icon: 'Truck', title: "Envío Rápido y Seguro", description: "Recibe tus productos en la puerta de tu casa en tiempo récord y con la máxima seguridad." },
    { icon: 'ShieldCheck', title: "Transacciones Seguras", description: "Compre con confianza sabiendo que todas sus transacciones son seguras y están protegidas." },
    { icon: 'Wrench', title: "Soporte", description: "Soporte confiable y oportuno para garantizar que sus sistemas funcionen sin problemas." },
    { icon: 'Truck', title: "Entrega Rápida", description: "Recibe tus productos de manera rápida y eficiente con nuestra red logística optimizada." },
    { icon: 'Headset', title: 'Soporte 24/7', description: 'Nuestro equipo de atención al cliente está disponible para ayudarte en cualquier momento.' },
    { icon: 'ShieldCheck', title: 'Garantía de Calidad', description: 'Todos nuestros productos pasan por un riguroso control de calidad para tu tranquilidad.' },
];


export default function ServicesTextsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ServicesTextFormData>({
    resolver: zodResolver(servicesTextSchema),
    defaultValues: {
      mainTitle: "Nuestros Servicios",
      mainDescription: "Brindando soluciones integrales para potenciar su éxito. Estamos comprometidos con la excelencia.",
      cards: defaultServiceCards,
    },
  });
  
  const { fields } = useFieldArray({
    control: form.control,
    name: "cards",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.servicesTexts) {
          form.reset(settings.servicesTexts);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración." });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, form]);

  const onSubmit = async (data: ServicesTextFormData) => {
    setIsSaving(true);
    try {
      await saveSettings({ servicesTexts: data });
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
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Textos de la Sección "Servicios"</h2>
      </div>
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Editor de Contenidos</CardTitle>
            <CardDescription>Modifica los textos que aparecen en la sección de servicios de la página principal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">

             <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-foreground">Encabezado de la Sección</h3>
                 <div className="space-y-2">
                    <Label htmlFor="mainTitle">Título Principal</Label>
                    <Input id="mainTitle" {...form.register("mainTitle")} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mainDescription">Descripción</Label>
                    <Textarea id="mainDescription" {...form.register("mainDescription")} rows={3}/>
                </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-foreground">Tarjetas de Servicios</h3>
                <Accordion type="multiple" defaultValue={fields.map((f, i) => `item-${i}`)} className="w-full">
                    {fields.map((field, index) => {
                      const selectedIconName = form.watch(`cards.${index}.icon`);
                      const Icon = iconMap[selectedIconName];
                      return (
                        <AccordionItem value={`item-${index}`} key={field.id}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                  {Icon && <Icon className="h-5 w-5 text-primary" />}
                                  <span>{form.watch(`cards.${index}.title`)}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 p-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <Controller
                                        control={form.control}
                                        name={`cards.${index}.icon`}
                                        render={({ field: selectField }) => (
                                            <div className="space-y-2">
                                                <Label>Ícono</Label>
                                                <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar icono" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableIcons.map(iconName => {
                                                            const IconComponent = iconMap[iconName];
                                                            return (
                                                                <SelectItem key={iconName} value={iconName}>
                                                                    <div className="flex items-center gap-2">
                                                                        <IconComponent className="h-4 w-4" />
                                                                        <span>{iconName}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor={`cards.${index}.title`}>Título de la Tarjeta</Label>
                                        <Input id={`cards.${index}.title`} {...form.register(`cards.${index}.title`)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`cards.${index}.description`}>Descripción de la Tarjeta</Label>
                                    <Textarea id={`cards.${index}.description`} {...form.register(`cards.${index}.description`)} rows={4}/>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                </Accordion>
            </div>
            
            <Button type="submit" disabled={isSaving} size="lg">
              {isSaving ? "Guardando..." : "Guardar Todos los Cambios"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
