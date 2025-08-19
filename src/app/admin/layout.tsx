
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import { Home, Settings, ShoppingBag, Percent, Users, LayoutTemplate, Image as ImageIcon, Footprints, Copyright, MessageSquare, MessagesSquare, Eye, MapPin, Mail, Wrench, ShieldCheck, Star, Newspaper } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "@/lib/roles-service";
import { onChatSessionsSnapshot, ChatSession } from "@/lib/chat-service";
import { onReviewsSnapshot, Review } from "@/lib/review-service";

const menuItems = [
  { href: "/admin/dashboard", icon: Home, label: "Panel Principal", requiredPermission: "dashboard" },
  { href: "/admin/appearance", icon: Eye, label: "Apariencia", requiredPermission: "appearance" },
  { href: "/admin/general", icon: Settings, label: "General", requiredPermission: "general" },
  { href: "/admin/products", icon: ShoppingBag, label: "Productos", requiredPermission: "products" },
  { href: "/admin/promotions", icon: Percent, label: "Promociones", requiredPermission: "promotions" },
  { href: "/admin/users", icon: Users, label: "Usuarios", requiredPermission: "users" },
  { href: "/admin/roles", icon: ShieldCheck, label: "Roles", requiredPermission: "roles" },
  { href: "/admin/reviews", icon: Star, label: "Reseñas", requiredPermission: "reviews" },
  { href: "/admin/suscripciones", icon: Newspaper, label: "Suscripciones", requiredPermission: "suscripciones" },
  { href: "/admin/header", icon: LayoutTemplate, label: "Header", requiredPermission: "header" },
  { href: "/admin/hero", icon: ImageIcon, label: "Hero Banner", requiredPermission: "hero" },
  { href: "/admin/mapa", icon: MapPin, label: "Mapa", requiredPermission: "mapa" },
  { href: "/admin/chats", icon: MessageSquare, label: "Chats", requiredPermission: "chats" },
  { href: "/admin/conversations", icon: MessagesSquare, label: "Conversaciones", requiredPermission: "conversations" },
  { href: "/admin/emails", icon: Mail, label: "Emails", requiredPermission: "emails" },
  { href: "/admin/services-texts", icon: Wrench, label: "Textos Servicios", requiredPermission: "services_texts" },
  { href: "/admin/footer-main", icon: Footprints, label: "Footer Principal", requiredPermission: "footer_main" },
  { href: "/admin/footer-copyright", icon: Copyright, label: "Footer Copyright", requiredPermission: "footer_copyright" },
];


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [hasUnreadChats, setHasUnreadChats] = useState(false);
  const [hasPendingReviews, setHasPendingReviews] = useState(false);

  useEffect(() => {
    const unsubscribeChats = onChatSessionsSnapshot((sessions: ChatSession[]) => {
      const unread = sessions.some(s => s.unread);
      setHasUnreadChats(unread);
    });

    const unsubscribeReviews = onReviewsSnapshot((reviews: Review[]) => {
        const pending = reviews.some(r => r.status === 'pending');
        setHasPendingReviews(pending);
    });

    return () => {
        unsubscribeChats();
        unsubscribeReviews();
    };
  }, []);

  useEffect(() => {
    const sessionData = sessionStorage.getItem('user-session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        if (session && (session.isAdmin || (session.role && session.role.permissions))) {
           if (session.isAdmin) {
             setIsVerified(true);
           } else {
             setUserRole(session.role);
             const requiredPermission = menuItems.find(item => pathname === item.href)?.requiredPermission;
             if (requiredPermission && session.role.permissions[requiredPermission]) {
                setIsVerified(true);
             } else if (pathname === '/admin/dashboard') { // Allow access to dashboard if no specific permission is needed
                setIsVerified(true);
             }
             else {
                router.replace('/');
             }
           }
        } else {
          router.replace('/');
        }
      } catch (error) {
        router.replace('/');
      }
    } else {
      router.replace('/');
    }
    setIsLoading(false);
  }, [router, pathname]);

  if (isLoading || !isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="w-full max-w-md space-y-4 p-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  const hasPermission = (permission: keyof Role['permissions']) => {
    if (userRole === null) return true; // Super admin
    return !!userRole?.permissions[permission];
  }
  
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-muted/40">
        <Sidebar collapsible="icon" className="hidden border-r bg-background sm:flex">
          <SidebarContent>
            <SidebarHeader>
              <h2 className="text-lg font-semibold text-center">QuilCatex</h2>
            </SidebarHeader>
            <SidebarMenu>
              {menuItems.map(item => {
                if (hasPermission(item.requiredPermission as keyof Role['permissions'])) {
                  const showChatNotification = item.href === '/admin/conversations' && hasUnreadChats;
                  const showReviewNotification = item.href === '/admin/reviews' && hasPendingReviews;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild tooltip={item.label}>
                        <Link href={item.href} className="relative">
                          <item.icon />
                          <span>{item.label}</span>
                          {(showChatNotification || showReviewNotification) && <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                }
                return null;
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 sm:h-16 sm:px-6">
            <SidebarTrigger className="sm:hidden" />
            <h1 className="text-lg font-semibold md:text-xl">Panel de Administrador</h1>
            <div className="ml-auto">
              <Button asChild variant="outline">
                <Link href="/">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Sitio
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
              {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
