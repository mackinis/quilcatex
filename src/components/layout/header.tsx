
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, Mountain, User as UserIcon, LogOut, LayoutDashboard, ShoppingCart, UserCog } from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSettings, type HeaderLink, type GeneralSettings } from '@/lib/settings-service';
import { useHydratedCart } from '@/hooks/use-cart.tsx';
import { ProfileModal } from '@/components/auth/profile-modal';
import Image from 'next/image';

interface UserSession {
    fullName: string;
    email: string;
    isAdmin: boolean;
}

export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<'login' | 'register'>('login');
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);
  const [navLinks, setNavLinks] = useState<HeaderLink[]>([
    { text: 'Productos', href: '#products' },
    { text: 'Servicios', href: '#services' },
    { text: 'Contacto', href: '#contact' },
  ]);
  const router = useRouter();
  const pathname = usePathname();
  const { items, openCart } = useHydratedCart();
  
  const updateSession = () => {
     try {
      const sessionData = sessionStorage.getItem('user-session');
      if (sessionData) {
          setUserSession(JSON.parse(sessionData));
      } else {
        setUserSession(null);
      }
    } catch (error) {
      console.error("Failed to parse user session:", error);
      sessionStorage.removeItem('user-session');
       setUserSession(null);
    }
  }

  useEffect(() => {
    updateSession();

    const handleSessionChange = () => {
      updateSession();
    };

    window.addEventListener('session-change', handleSessionChange);

    return () => {
      window.removeEventListener('session-change', handleSessionChange);
    };
  }, [pathname]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings?.header?.links) {
          setNavLinks(settings.header.links);
        }
        if (settings?.general) {
            setGeneralSettings(settings.general);
        }
      } catch (error) {
        console.error("Failed to load header settings", error);
      }
    }
    loadSettings();
  }, []);
  
  const handleLogout = () => {
    sessionStorage.removeItem('user-session');
    setUserSession(null);
    // Dispatch event to notify other components like Header
    window.dispatchEvent(new CustomEvent('session-change'));
    router.push('/');
    setIsSheetOpen(false); // Close sheet on logout
  };

  const openAuthModal = (step: 'login' | 'register') => {
    setAuthModalStep(step);
    setIsAuthModalOpen(true);
    setIsSheetOpen(false); // Close sheet when opening auth modal
  };
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  
  const Brand = () => {
    const displayName = generalSettings?.displayName || "QuilCatex";
    const logoUrl = generalSettings?.logoUrl;
    
    return (
        <div className="flex items-center gap-2 text-lg font-bold">
            {logoUrl ? (
                <Image src={logoUrl} alt={displayName} width={32} height={32} className="h-8 w-auto rounded-md object-contain"/>
            ) : (
                <Mountain className="h-6 w-6 text-primary" />
            )}
            <span className="font-bold">{displayName}</span>
        </div>
    )
  }

  const renderUserMenu = () => {
    if (!userSession) {
      return (
        <div className="hidden sm:flex">
          <Button variant="ghost" onClick={() => openAuthModal('login')}>Iniciar Sesión</Button>
          <Button onClick={() => openAuthModal('register')}>Registrarse</Button>
        </div>
      );
    }
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
                <UserIcon className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuLabel>
                {userSession.isAdmin ? 'Admin' : 'Mi Cuenta'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {userSession.isAdmin ? (
                <DropdownMenuItem asChild>
                    <Link href="/admin/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Panel de Admin</span>
                    </Link>
                </DropdownMenuItem>
            ) : (
                 <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                 </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center md:hidden">
             <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menú de Navegación</SheetTitle>
                  <SheetDescription>Enlaces principales del sitio</SheetDescription>
                </SheetHeader>
                <Link href="/" className="mr-6 flex items-center" onClick={() => setIsSheetOpen(false)}>
                    <Brand />
                </Link>
                <div className="mt-6 flex flex-col space-y-4 flex-grow">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-foreground/90 transition-colors hover:text-primary"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
                 <SheetFooter>
                    <div className="mt-6 flex flex-col w-full gap-2 border-t pt-4">
                        {userSession ? (
                            <Button variant="outline" onClick={handleLogout}>Cerrar Sesión</Button>
                        ) : (
                            <>
                                <Button onClick={() => openAuthModal('login')}>Iniciar Sesión</Button>
                                <Button variant="secondary" onClick={() => openAuthModal('register')}>Registrarse</Button>
                            </>
                        )}
                    </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="hidden md:flex items-center">
             <Link href="/" className="mr-6">
              <Brand />
            </Link>
          </div>

          <nav className="hidden md:flex flex-1 justify-center">
             <div className="flex items-center space-x-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  {link.text}
                </Link>
              ))}
            </div>
          </nav>


          <div className="flex items-center justify-end space-x-2 md:w-auto w-full">
             <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {totalItems}
                    </span>
                )}
                <span className="sr-only">Abrir carrito</span>
            </Button>
            {renderUserMenu()}
          </div>
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} initialStep={authModalStep} />
      {userSession && !userSession.isAdmin && (
          <ProfileModal 
            isOpen={isProfileModalOpen} 
            onOpenChange={setIsProfileModalOpen}
            userEmail={userSession.email}
          />
      )}
    </>
  );
}
