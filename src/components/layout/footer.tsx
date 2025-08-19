
"use client";

import { Mountain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getSettings, type FooterSettings, type GeneralSettings } from '@/lib/settings-service';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { LegalTextModal } from './legal-text-modal';
import Image from 'next/image';
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok, FaTwitter, FaYoutube } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormMessage } from '../ui/form';

const iconMap: { [key: string]: React.ElementType } = {
  Twitter: FaTwitter,
  Facebook: FaFacebook,
  Instagram: FaInstagram,
  Linkedin: FaLinkedin,
  Youtube: FaYoutube,
  Tiktok: FaTiktok,
};

const defaultSettings: FooterSettings = {
    newsletterText: "Mantente al día con las últimas funciones y lanzamientos uniéndote a nuestro boletín.",
    brandDisplay: 'logoAndName',
    columns: [
        { title: 'Compañía', links: [{ text: 'Servicios', href: '#services' }, { text: 'Ubicación', href: '#mapa' }, { text: 'Contacto', href: '#contact' }] },
        { title: 'Legal', links: [{ text: 'Sobre Nosotros', href: '#about' }, { text: 'Política de Privacidad', href: '#privacy' }, { text: 'Términos de Servicio', href: '#terms' }] },
    ],
    contact: { email: 'info@quilcatex.com.ar', phone: '+5411 2470 1301', address: "Quilmes, Bs As, Arg." },
    social: [{ icon: 'Twitter', href: '#' }, { icon: 'Facebook', href: '#' }, { icon: 'Instagram', href: '#' }],
    socialIconSize: 24,
    copyrightText: `© ${new Date().getFullYear()} QuilCatex. Todos los derechos reservados.`,
    developerName: "Firebase",
    developerUrl: "https://firebase.google.com",
    aboutUsText: "Somos QuilCatex, una empresa dedicada a ofrecer productos de la más alta calidad...",
    privacyPolicyText: "En QuilCatex, tu privacidad es nuestra prioridad. Nos comprometemos a proteger tus datos...",
    termsOfServiceText: "Al utilizar los servicios de QuilCatex, aceptas nuestros términos y condiciones..."
};

const subscriptionSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un email válido." }),
});

type ModalContent = {
    title: string;
    content: string;
} | null;

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof subscriptionSchema>>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getSettings();
        const mergedSettings: FooterSettings = {
            ...defaultSettings,
            ...loadedSettings?.footer,
            columns: loadedSettings?.footer?.columns?.length ? loadedSettings.footer.columns : defaultSettings.columns,
            contact: { ...defaultSettings.contact, ...loadedSettings?.footer?.contact },
            social: loadedSettings?.footer?.social?.length ? loadedSettings.footer.social : defaultSettings.social,
        };
        setSettings(mergedSettings);
        if (loadedSettings?.general) {
            setGeneralSettings(loadedSettings.general);
        }
      } catch (error) {
        console.error("Failed to load footer settings, using defaults", error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);
  
  const handleSubscriptionSubmit = async (values: z.infer<typeof subscriptionSchema>) => {
    setIsSubscribing(true);
    try {
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: values.email }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message);
        }
        toast({ title: "¡Suscripción exitosa!", description: data.message });
        form.reset();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error en la suscripción",
            description: error.message || "No se pudo completar la suscripción.",
        });
    } finally {
        setIsSubscribing(false);
    }
  };


  const Brand = () => {
    const displayName = generalSettings?.displayName || "QuilCatex";
    const logoUrl = generalSettings?.logoUrl;
    const displaySetting = settings?.brandDisplay || 'logoAndName';

    const showLogo = (displaySetting === 'logoAndName' || displaySetting === 'logoOnly') && logoUrl;
    const showName = (displaySetting === 'logoAndName' || displaySetting === 'nameOnly');
    
    return (
        <div className="flex items-center gap-2 text-lg font-bold text-foreground">
            {showLogo && (
                <Image src={logoUrl!} alt={displayName} width={32} height={32} className="h-8 w-auto rounded-md object-contain"/>
            )}
            {showName && !showLogo && <Mountain className="h-6 w-6 text-primary" />}
            {showName && <span>{displayName}</span>}
        </div>
    )
  }

  const handleLegalLinkClick = (type: 'about' | 'privacy' | 'terms') => {
    if (!settings) return;
    if (type === 'about') {
        setModalContent({ title: 'Sobre Nosotros', content: settings.aboutUsText || '' });
    } else if (type === 'privacy') {
        setModalContent({ title: 'Política de Privacidad', content: settings.privacyPolicyText || '' });
    } else if (type === 'terms') {
        setModalContent({ title: 'Términos de Servicio', content: settings.termsOfServiceText || '' });
    }
  };
  
  const renderLink = (link: { text: string; href: string; }) => {
    if (link.href === '#about' || link.href === '#privacy' || link.href === '#terms') {
        const type = link.href.substring(1) as 'about' | 'privacy' | 'terms';
        return (
             <button onClick={() => handleLegalLinkClick(type)} className="block text-sm transition-colors hover:text-primary text-left">
                {link.text}
            </button>
        )
    }
    return (
        <Link href={link.href} className="block text-sm transition-colors hover:text-primary">{link.text}</Link>
    )
  }

  if (isLoading || !settings) {
      return (
          <footer className="bg-muted text-muted-foreground">
              <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-4">
                  <div className="space-y-4"><Skeleton className="h-8 w-32 mb-4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-10 w-full mt-2" /></div>
                  <div className="space-y-2"><Skeleton className="h-6 w-24 mb-3" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-20" /></div>
                  <div className="space-y-2"><Skeleton className="h-6 w-24 mb-3" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-20" /></div>
                  <div className="space-y-2"><Skeleton className="h-6 w-24 mb-3" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-28" /></div>
              </div>
          </footer>
      );
  }

  const { newsletterText, columns = [], contact = defaultSettings.contact, social = [], socialIconSize = 24, copyrightText, developerName, developerUrl } = settings;

  return (
    <>
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-4">
        
        {/* Columna 1: Logo y Newsletter */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <Brand />
          </Link>
          <p className="text-sm">{newsletterText}</p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubscriptionSubmit)} className="flex w-full max-w-sm items-start space-x-2">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem className="flex-1">
                        <FormControl>
                            <Input placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage className="text-xs"/>
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isSubscribing}>
                    {isSubscribing ? '...' : 'Suscribirse'}
                </Button>
            </form>
          </Form>
        </div>

        {/* Columnas 2 y 3 Dinámicas */}
        {columns.map(column => (
            <div key={column.title}>
                <h4 className="font-semibold text-foreground mb-3">{column.title}</h4>
                <div className="space-y-2">
                    {column.links.map(link => (
                       <div key={link.text}>
                         {renderLink(link)}
                       </div>
                    ))}
                </div>
            </div>
        ))}
        
        {/* Columna 4: Contacto */}
        <div>
            <h4 className="font-semibold text-foreground mb-3">Contacto</h4>
            <div className="space-y-2 text-sm">
                <p>{contact.address}</p>
                <p>{contact.email}</p>
                <p>{contact.phone}</p>
            </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 py-6 text-center">
            <div className="flex items-center justify-center space-x-1">
            {social.map((socialLink) => {
              const Icon = iconMap[socialLink.icon];
              if (!Icon || !socialLink.href) return null;
              return (
                 <a href={socialLink.href} target="_blank" rel="noopener noreferrer" key={socialLink.icon} className="p-2 transition-colors text-primary hover:text-primary/80">
                     <Icon style={{ fontSize: `${socialIconSize}px` }} />
                     <span className="sr-only">{socialLink.icon}</span>
                 </a>
              )
            })}
          </div>
          <p className="text-sm">
            {copyrightText}
            {developerName && developerUrl && (
              <>
                {' | Desarrollado por '}
                <a href={developerUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary transition-colors hover:text-primary/80">
                  {developerName}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
    {modalContent && (
        <LegalTextModal 
            isOpen={!!modalContent}
            onOpenChange={() => setModalContent(null)}
            title={modalContent.title}
            content={modalContent.content}
        />
    )}
    </>
  );
}
