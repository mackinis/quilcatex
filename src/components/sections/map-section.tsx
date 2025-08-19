
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Skeleton } from '../ui/skeleton';
import { getSettings, type MapSettings } from '@/lib/settings-service';
import { ClientMap } from '@/components/client-map';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';


export function MapSection() {
    const [settings, setSettings] = useState<MapSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const mapRef = useRef<google.maps.Map | null>(null);
    
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

    const handleRecenter = () => {
        if (mapRef.current && settings) {
            mapRef.current.panTo({ lat: settings.lat, lng: settings.lng });
        }
    };


    const finalSettings: MapSettings = settings || {
        lat: -34.712,
        lng: -58.255,
        showOverlay: true,
        overlayTitle: "QuilCatex",
        overlayAddress: "Quilmes, Buenos Aires, Argentina",
    };
    
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <section className="w-full py-12 md:py-24 lg:py-32">
                 <div className="container mx-auto px-4 md:px-6">
                    <div className="h-[400px] w-full rounded-lg shadow-lg flex items-center justify-center bg-destructive text-destructive-foreground">
                        API Key de Google Maps no encontrada.
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Encuéntranos</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                            Visita nuestra tienda física para una experiencia de compra única.
                        </p>
                    </div>
                </div>
                <div className="relative h-[400px] w-full">
                    {isClient && !isLoading && settings ? (
                         <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                            <div className='relative h-full w-full'>
                               <ClientMap position={{ lat: settings.lat, lng: settings.lng }} mapRef={mapRef} />
                               {finalSettings.showOverlay && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className="rounded-lg bg-background/80 p-6 text-center text-foreground backdrop-blur-sm shadow-md min-w-[280px]">
                                            <h3 className="text-2xl font-bold">{finalSettings.overlayTitle}</h3>
                                            <p className="mt-2">{finalSettings.overlayAddress}</p>
                                             <Button onClick={handleRecenter} variant="secondary" size="sm" className="mt-4">
                                                <LocateFixed className="mr-2 h-4 w-4" />
                                                Volver al centro
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </APIProvider>
                    ) : (
                        <Skeleton className="w-full h-full" />
                    )}
                </div>
            </div>
        </section>
    );
}
