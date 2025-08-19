
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { getSettings, type HeroSettings } from "@/lib/settings-service";

const defaultSettings: HeroSettings = {
    title: "Soluciones Innovadoras para un Mundo Moderno",
    subtitle: "En QuilCatex, ofrecemos productos y servicios de primer nivel diseñados para elevar tu experiencia e impulsar el éxito.",
    backgroundType: 'image',
    backgroundImageUrl: "https://placehold.co/1920x1080",
    backgroundVideoUrl: "",
    primaryButtonText: "Explorar Productos",
    primaryButtonLink: "#products",
    secondaryButtonText: "Ponerse en Contacto",
    secondaryButtonLink: "#contact",
}

export function HeroSection() {
  const [settings, setSettings] = useState<HeroSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeroSettings = async () => {
      setIsLoading(true);
      try {
        const loadedSettings = await getSettings();
        if(loadedSettings && loadedSettings.hero) {
            setSettings(loadedSettings.hero);
        }
      } catch (error) {
        console.error("No se pudo cargar la configuración del Hero, usando valores por defecto.", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHeroSettings();
  }, [])
  
  const getYouTubeVideoId = (url: string): string | null => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
  }

  const renderBackground = () => {
    if (isLoading) {
      return <Skeleton className="h-full w-full" />;
    }

    switch (settings.backgroundType) {
      case 'video':
        return (
          <video
            key={settings.backgroundVideoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={settings.backgroundVideoUrl} type="video/mp4" />
          </video>
        );
      case 'youtube':
        const videoId = getYouTubeVideoId(settings.backgroundVideoUrl || '');
        if (!videoId) return <div className="absolute inset-0 bg-destructive flex items-center justify-center text-destructive-foreground">URL de YouTube inválida</div>;
        return (
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <iframe
                className="absolute top-1/2 left-1/2 w-[calc(100vw*1.5)] h-[calc(100vh*1.5)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&autohide=1&modestbranding=1`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video background"
            ></iframe>
          </div>
        );
      case 'image':
      default:
        return (
           <Image
                src={settings.backgroundImageUrl || defaultSettings.backgroundImageUrl!}
                alt="Imagen de fondo del héroe"
                fill
                className="object-cover"
                priority
            />
        );
    }
  };

  return (
    <section id="home" className="relative w-full h-[75vh] min-h-[600px] flex items-center justify-center text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
         {renderBackground()}
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative z-10 text-center px-4">
        {isLoading ? (
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-3/4 md:w-1/2" />
                <Skeleton className="h-6 w-full max-w-3xl" />
                 <Skeleton className="h-6 w-full max-w-2xl" />
                <div className="flex gap-4 mt-4">
                    <Skeleton className="h-12 w-40" />
                    <Skeleton className="h-12 w-40" />
                </div>
            </div>
        ) : (
            <>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-shadow-lg">
                    {settings.title}
                </h1>
                <p className="max-w-3xl mx-auto text-lg md:text-xl text-neutral-200 mb-8 text-shadow">
                   {settings.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                    <a href={settings.primaryButtonLink}>{settings.primaryButtonText}</a>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                    <a href={settings.secondaryButtonLink}>{settings.secondaryButtonText}</a>
                </Button>
                </div>
            </>
        )}
      </div>
      <style jsx>{`
        .text-shadow-lg {
          text-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .text-shadow {
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
      `}</style>
    </section>
  );
}
