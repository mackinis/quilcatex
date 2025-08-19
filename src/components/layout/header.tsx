
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, Mountain, User as UserIcon, LogOut, LayoutDashboard, ShoppingCart } from 'lucide-react';
import { AuthModal } from '@/components/auth/auth-modal';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSettings, type HeaderLink } from '@/lib/settings-service';
import { useHydratedCart } from '@/hooks/use-cart.tsx';

export function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalStep, setAuthModalStep] = React.useState<'login' | 'register'>('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [navLinks, setNavLinks] = useState<HeaderLink[]>([
    { text: 'Productos', href: '#products' },
    { text: 'Servicios', href: '#services' },
    { text: 'Contacto', href: '#contact' },
  ]);
  const router = useRouter();
  const pathname = usePathname();
  const { items, openCart } = useHydratedCart();

  useEffect(() => {
    const adminSession = sessionStorage.getItem('admin-session');
    setIsAdmin(!!adminSession);
  }, [pathname]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings?.header?.links) {
          setNavLinks(settings.header.links);
        }
      } catch (error) {
        console.error("Failed to load header settings", error);
      }
    }
    loadSettings();
  }, []);
  
  const handleLogout = () => {
    sessionStorage.removeItem('admin-session');
    setIsAdmin(false);
    router.push('/');
    router.refresh();
  };

  const openAuthModal = (step: 'login' | 'register') => {
    setAuthModalStep(step);
    setIsAuthModalOpen(true);
  };
  
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center md:hidden">
             <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                  <Mountain className="h-6 w-6 text-primary" />
                  <span className="font-bold">QuilCatex</span>
                </Link>
                <div className="mt-6 flex flex-col space-y-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-lg font-medium text-foreground/90 transition-colors hover:text-primary"
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="hidden md:flex items-center">
             <Link href="/" className="mr-6 flex items-center space-x-2">
              <Mountain className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block">QuilCatex</span>
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
            {isAdmin ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="rounded-full">
                      <UserIcon className="h-5 w-5" />
                      <span className="sr-only">Toggle user menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                       <Link href="/admin/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Panel de Admin</span>
                       </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <div className="hidden sm:flex">
                  <Button variant="ghost" onClick={() => openAuthModal('login')}>Iniciar Sesión</Button>
                  <Button onClick={() => openAuthModal('register')}>Registrarse</Button>
                </div>
            )}
          </div>
        </div>
      </header>
      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} initialStep={authModalStep} />
    </>
  );
}
