
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type MapSettings } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";

const mapSchema = z.object({
    lat: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number()),
    lng: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number()),
    showOverlay: z.boolean(),
    overlayTitle: z.string().optional(),
    overlayAddress: z.string().optional(),
});

type MapFormData = z.infer<typeof mapSchema>;

export default function MapSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<MapFormData>({
        resolver: zodResolver(mapSchema),
        defaultValues: {
            lat: -34.6037,
            lng: -58.3816,
            showOverlay: true,
            overlayTitle: "QuilCatex",
            overlayAddress: "Av. Corrientes 1234, CABA, Argentina",
        },
    });

    useEffect(() => {
        async function loadSettings() {
            try {
                const settings = await getSettings();
                if (settings && settings.map) {
                    form.reset(settings.map);
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la configuración del mapa." });
            } finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [toast, form]);

    const onSubmit = async (data: MapFormData) => {
        setIsSaving(true);
        try {
            await saveSettings({ map: data });
            toast({ title: "Éxito", description: "La configuración del mapa se ha guardado." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const showOverlay = form.watch("showOverlay");

    if (isLoading) {
        return (
            <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <Skeleton className="h-8 w-1/2" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                    <CardContent className="space-y-6">
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
                <h2 className="text-3xl font-bold tracking-tight">Configuración del Mapa</h2>
            </div>
            <Card>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Ubicación y Visualización</CardTitle>
                        <CardDescription>Configura las coordenadas y el texto que se muestra en el mapa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="lat">Latitud</Label>
                                <Input id="lat" type="number" step="any" {...form.register("lat")} />
                                {form.formState.errors.lat && <p className="text-sm text-destructive">{form.formState.errors.lat.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lng">Longitud</Label>
                                <Input id="lng" type="number" step="any" {...form.register("lng")} />
                                {form.formState.errors.lng && <p className="text-sm text-destructive">{form.formState.errors.lng.message}</p>}
                            </div>
                        </div>

                        <Controller
                            control={form.control}
                            name="showOverlay"
                            render={({ field }) => (
                                <div className="flex items-center space-x-2 rounded-lg border p-3">
                                    <Switch id="show-overlay" checked={field.value} onCheckedChange={field.onChange} />
                                    <Label htmlFor="show-overlay">Mostrar texto superpuesto en el mapa</Label>
                                </div>
                            )}
                        />

                        {showOverlay && (
                            <div className="space-y-4 pt-4 border-t">
                                 <div className="space-y-2">
                                    <Label htmlFor="overlay-title">Título del Texto</Label>
                                    <Input id="overlay-title" {...form.register("overlayTitle")} />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="overlay-address">Dirección en el Texto</Label>
                                    <Input id="overlay-address" {...form.register("overlayAddress")} />
                                </div>
                            </div>
                        )}
                        
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}
