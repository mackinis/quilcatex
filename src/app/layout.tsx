
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { WhatsappButton } from '@/components/chat/whatsapp-button';
import { LiveChat } from '@/components/chat/live-chat';
import { useEffect, useState } from 'react';
import { getSettings, type AppSettings } from '@/lib/settings-service';
import { CartProvider, useHydratedCart } from '@/hooks/use-cart.tsx';
import { Header } from '@/components/layout/header';
import { CartModal } from '@/components/cart/cart-modal';
import { Footer } from '@/components/layout/footer';
import { initMercadoPago } from '@mercadopago/sdk-react'
import { usePathname } from 'next/navigation';

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const mpKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    if (mpKey) {
        initMercadoPago(mpKey, { locale: 'es-AR' });
    } else {
        console.warn("Mercado Pago public key is not configured. Payment button will not work.");
    }
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
}

function PageLayout({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { isCartOpen, closeCart } = useHydratedCart();
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  useEffect(() => {
    async function loadSettings() {
      const loadedSettings = await getSettings();
      if (loadedSettings) {
        setSettings(loadedSettings);
        
        // Set Site Name
        if (loadedSettings.general?.siteName) {
          document.title = loadedSettings.general.siteName;
        }

        // Set Favicon from Appearance settings
        if (loadedSettings.appearance?.faviconUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = loadedSettings.appearance.faviconUrl;
        }

        // Set Theme Colors
        if (loadedSettings.appearance) {
          const root = document.documentElement;
          root.style.setProperty('--primary', loadedSettings.appearance.primary);
          root.style.setProperty('--background', loadedSettings.appearance.background);
          root.style.setProperty('--accent', loadedSettings.appearance.accent);
        }
      }
    }
    loadSettings();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ClientOnly>
        <Toaster />
        <CartModal isOpen={isCartOpen} onOpenChange={closeCart} />
        {!isAdminPage && settings?.chat?.whatsapp?.enabled && <WhatsappButton />}
        {!isAdminPage && settings?.chat?.liveChat?.enabled && <LiveChat config={settings.chat.liveChat} />}
      </ClientOnly>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
       <head>
        <title>QuilCatex</title>
        <meta name="description" content="Tu tienda online de confianza." />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <CartProvider>
          <PageLayout>{children}</PageLayout>
        </CartProvider>
      </body>
    </html>
  )
}
