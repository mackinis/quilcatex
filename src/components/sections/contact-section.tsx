
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { APIProvider } from '@vis.gl/react-google-maps';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSettings, type MapSettings } from '@/lib/settings-service';
import { Skeleton } from '../ui/skeleton';
import { ClientMap } from '@/components/client-map';

const formSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
  message: z.string().min(10, { message: "El mensaje debe tener al menos 10 caracteres." }),
});

export function ContactSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<MapSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  useEffect(() => {
    setIsClient(true);
    async function loadSettings() {
      try {
        const loadedSettings = await getSettings();
        if (loadedSettings?.map) {
            setSettings(loadedSettings.map);
        }
      } catch (error) {
        console.error("Failed to load map settings", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);


  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Mensaje Enviado",
      description: "Gracias por contactarnos. Te responderemos pronto.",
    });
    form.reset();
  }
  
  const finalSettings: MapSettings = settings || {
      lat: -34.712,
      lng: -58.255,
      showOverlay: false,
      overlayTitle: "QuilCatex",
      overlayAddress: "Quilmes, Buenos Aires, Argentina",
  };
  
  const renderMap = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="h-full w-full rounded-lg shadow-lg flex items-center justify-center bg-destructive text-destructive-foreground">
                API Key de Google Maps no encontrada.
            </div>
        )
    }

    if (!isClient || isLoading) {
      return <Skeleton className="w-full h-full" />;
    }

    return (
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
          <ClientMap position={{ lat: finalSettings.lat, lng: finalSettings.lng }} />
      </APIProvider>
    )
  }

  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Contáctanos</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              ¿Tienes alguna pregunta o quieres trabajar con nosotros? Rellena el formulario o visítanos.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Enviar un mensaje</CardTitle>
              <CardDescription>Nos encantaría saber de ti.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 flex-grow flex flex-col">
                   <div className="flex-grow space-y-4">
                      <FormField control={form.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="message" render={({ field }) => (
                          <FormItem><FormLabel>Mensaje</FormLabel><FormControl><Textarea placeholder="Escribe tu mensaje aquí..." className="min-h-[120px]" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                   </div>
                  <Button type="submit" className="w-full">Enviar Mensaje</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
           <div className="min-h-[400px] md:min-h-full w-full rounded-lg overflow-hidden shadow-lg relative">
             {renderMap()}
           </div>
        </div>
      </div>
    </section>
  );
}
