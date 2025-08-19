
"use client";

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSettings, type HeroSettings } from '@/lib/settings-service';
import { Skeleton } from '../ui/skeleton';

const YouTubeEmbed = ({ url, opacity }: { url: string; opacity: number }) => {
    try {
        const urlObject = new URL(url);
        let videoId = urlObject.searchParams.get('v');
        if (!videoId && (urlObject.hostname === 'youtu.be')) {
            videoId = urlObject.pathname.substring(1);
        }
        if (!videoId) return null;

        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&autohide=1&modestbranding=1&vq=hd1080`;

        return (
            <iframe
                src={embedUrl}
                frameBorder="0"
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="absolute inset-0 w-full h-full object-cover -z-10"
                style={{ opacity, pointerEvents: 'none' }}
            ></iframe>
        );
    } catch (error) {
        console.error("Invalid YouTube URL:", error);
        return <div className="absolute inset-0 bg-destructive flex items-center justify-center text-destructive-foreground -z-10">URL de YouTube inválida</div>;
    }
};

const renderBackground = (settings: HeroSettings) => {
    const { mediaType, mediaUrl, mediaOpacity } = settings;
    const opacity = mediaOpacity ?? 1;

    switch (mediaType) {
        case 'video':
            return (
                <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover -z-10"
                    style={{ opacity }}
                ></video>
            );
        case 'youtube':
            return <YouTubeEmbed url={mediaUrl} opacity={opacity} />;
        case 'image':
        default:
            return (
                <Image
                    src={mediaUrl}
                    alt="Hero background"
                    fill
                    className="object-cover -z-10"
                    style={{ opacity }}
                    data-ai-hint="store interior"
                    priority
                />
            );
    }
};

export function HeroSection() {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getSettings();
        setSettings(loadedSettings?.hero || null);
      } catch (error) {
        console.error("Failed to load hero settings", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (isLoading) {
    return (
      <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center bg-muted">
        <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto mb-8" />
            <Skeleton className="h-12 w-48 mx-auto" />
        </div>
      </section>
    )
  }

  const {
    title = "Calidad y Estilo en un Solo Lugar",
    subtitle = "Descubre nuestra colección exclusiva de productos diseñados para mejorar tu día a día.",
    buttonText = "Explorar Productos",
    mediaType = 'image',
    mediaUrl = "https://placehold.co/1920x1080.png",
    mediaOpacity = 1,
  } = settings || {};
  
  const finalSettings = { title, subtitle, buttonText, mediaType, mediaUrl, mediaOpacity };

  return (
    <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center overflow-hidden text-white">
        {renderBackground(finalSettings)}
        <div className="absolute inset-0 bg-black/50 -z-10" />
        <div className="container relative z-10 mx-auto px-4 text-center">
            <div className='bg-black/30 backdrop-blur-sm p-8 rounded-xl inline-block'>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 text-white drop-shadow-lg animate-fade-in-down">
                {title}
                </h1>
                <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 drop-shadow-md animate-fade-in-up">
                {subtitle}
                </p>
                <Link href="#products">
                <Button size="lg" className="animate-fade-in">
                    {buttonText}
                </Button>
                </Link>
            </div>
        </div>
    </section>
  );
}
