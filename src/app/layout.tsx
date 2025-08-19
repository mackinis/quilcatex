
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

function RootContent({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [siteName, setSiteName] = useState('QuilCatex');
  const { isCartOpen, closeCart } = useHydratedCart();

  useEffect(() => {
    async function loadSettings() {
      const loadedSettings = await getSettings();
      if (loadedSettings) {
        setSettings(loadedSettings);
        if (loadedSettings.general?.siteName) {
          setSiteName(loadedSettings.general.siteName);
          document.title = loadedSettings.general.siteName;
        }
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

  const chatSettings = settings?.chat;

  return (
    <>
      <Header />
      {children}
      <Toaster />
      <CartModal isOpen={isCartOpen} onOpenChange={closeCart} />
      
      {chatSettings?.whatsapp?.enabled && (
        <WhatsappButton 
          phoneNumber={chatSettings.whatsapp.phoneNumber}
          message={chatSettings.whatsapp.predefinedMessage}
          iconUrl={chatSettings.whatsapp.iconUrl}
        />
      )}

      {chatSettings?.liveChat?.enabled && (
        <LiveChat 
          config={{
              chatTitle: chatSettings.liveChat.chatTitle,
              assistantName: chatSettings.liveChat.assistantName,
              welcomeMessage: chatSettings.liveChat.welcomeMessage,
              isOnline: chatSettings.liveChat.isOnline,
              requestUserInfo: chatSettings.liveChat.requestUserInfo,
              iconUrl: chatSettings.liveChat.iconUrl,
              notificationColor: chatSettings.liveChat.notificationColor,
          }}
        />
      )}
    </>
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
          <RootContent>{children}</RootContent>
        </CartProvider>
      </body>
    </html>
  )
}
