
"use client";

import { Mountain } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getSettings, type FooterSettings } from '@/lib/settings-service';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 1.4 3.3 4.9 3.3 4.9s-1.4 1.2-2.7 1.2c-.2 3.3-2.7 6.3-2.7 6.3s-4.1 1.2-6.3-1.4c-2.3 2.1-4.9 2.1-4.9 2.1s-2.1-2.1-2.1-4.9c-.2-1.4-1.2-2.7-1.2-2.7s1.2-1.4 2.7-2.7c3.3-.2 6.3-2.7 6.3-2.7s2.1-1.4 3.4-2.7z" /></svg>
);
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
);

const defaultSettings: FooterSettings = {
    newsletterText: "Mantente al día con las últimas funciones y lanzamientos uniéndote a nuestro boletín.",
    columns: [
        { title: 'Compañía', links: [{ text: 'Servicios', href: '#services' }, { text: 'Ubicación', href: '#mapa' }, { text: 'Contacto', href: '#contact' }] },
        { title: 'Legal', links: [{ text: 'Sobre Nosotros', href: '#' }, { text: 'Política de Privacidad', href: '#' }, { text: 'Términos de Servicio', href: '#' }] },
    ],
    contact: { email: 'info@rchbytec.com.ar', phone: '+54 (011) 2470-1301', address: "Quilmes, Bs As, Arg." },
    social: { twitter: '#', facebook: '#', instagram: '#' },
    copyrightText: `© ${new Date().getFullYear()} QuilCatex. Todos los derechos reservados.`,
    developerName: "Firebase",
    developerUrl: "https://firebase.google.com"
};

export function Footer() {
  const [settings, setSettings] = useState<FooterSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getSettings();
        // Use loaded settings but merge with defaults to ensure all properties are present
        const mergedSettings: FooterSettings = {
            ...defaultSettings,
            ...loadedSettings?.footer,
            columns: loadedSettings?.footer?.columns?.length ? loadedSettings.footer.columns : defaultSettings.columns,
            contact: { ...defaultSettings.contact, ...loadedSettings?.footer?.contact },
            social: { ...defaultSettings.social, ...loadedSettings?.footer?.social },
        };
        setSettings(mergedSettings);
      } catch (error) {
        console.error("Failed to load footer settings, using defaults", error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

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

  const { newsletterText, columns = [], contact = defaultSettings.contact, social = {}, copyrightText, developerName, developerUrl } = settings;

  const contactColumn = {
    title: 'Contacto',
    links: [
      { text: contact.address, href: '#mapa' },
      { text: contact.email, href: `mailto:${contact.email}` },
      { text: contact.phone, href: `tel:${contact.phone}` },
    ]
  };

  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-12 md:grid-cols-4">
        
        {/* Columna 1: Logo y Newsletter */}
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Mountain className="h-6 w-6 text-primary" />
            <span>QuilCatex</span>
          </Link>
          <p className="text-sm">{newsletterText}</p>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="email" placeholder="Email" />
            <Button type="submit">Suscribirse</Button>
          </div>
        </div>

        {/* Columnas 2 y 3 Dinámicas */}
        {columns.map(column => (
            <div key={column.title}>
                <h4 className="font-semibold text-foreground mb-3">{column.title}</h4>
                <div className="space-y-2">
                    {column.links.map(link => (
                        <Link key={link.text} href={link.href} className="block text-sm transition-colors hover:text-primary">{link.text}</Link>
                    ))}
                </div>
            </div>
        ))}
        
        {/* Columna 4: Contacto */}
        <div>
            <h4 className="font-semibold text-foreground mb-3">{contactColumn.title}</h4>
            <div className="space-y-2">
                {contactColumn.links.map(link => (
                    <Link key={link.text} href={link.href} className="block text-sm transition-colors hover:text-primary">{link.text}</Link>
                ))}
            </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-4 sm:flex-row">
           <div className="flex items-center space-x-2">
            {social?.twitter && <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Link href={social.twitter} target="_blank"><TwitterIcon className="h-5 w-5" /></Link></Button>}
            {social?.facebook && <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Link href={social.facebook} target="_blank"><FacebookIcon className="h-5 w-5" /></Link></Button>}
            {social?.instagram && <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-primary"><Link href={social.instagram} target="_blank"><InstagramIcon className="h-5 w-5" /></Link></Button>}
          </div>
          <p className="text-center text-sm">
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
  );
}
