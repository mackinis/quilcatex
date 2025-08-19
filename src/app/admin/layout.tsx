
"use client";

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarHeader, SidebarInset } from "@/components/ui/sidebar";
import { Home, Settings, ShoppingBag, Percent, Users, LayoutTemplate, Image as ImageIcon, Footprints, Copyright, MessageSquare, MessagesSquare, Eye, MapPin } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <Sidebar collapsible="icon" className="hidden border-r bg-background sm:flex">
          <SidebarContent>
            <SidebarHeader>
              <h2 className="text-lg font-semibold text-center">QuilCatex</h2>
            </SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Panel Principal">
                  <Link href="/admin/dashboard">
                    <Home />
                    <span>Panel Principal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild tooltip="Apariencia">
                  <Link href="/admin/appearance">
                    <Eye />
                    <span>Apariencia</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="General">
                   <Link href="/admin/general">
                    <Settings />
                    <span>General</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Productos">
                   <Link href="/admin/products">
                    <ShoppingBag />
                    <span>Productos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Promociones">
                   <Link href="/admin/promotions">
                    <Percent />
                    <span>Promociones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Usuarios">
                   <Link href="/admin/users">
                    <Users />
                    <span>Usuarios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild tooltip="Header">
                   <Link href="/admin/header">
                    <LayoutTemplate />
                    <span>Header</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Hero Banner">
                   <Link href="/admin/hero">
                    <ImageIcon />
                    <span>Hero Banner</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Mapa">
                   <Link href="/admin/mapa">
                    <MapPin />
                    <span>Mapa</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Chats">
                   <Link href="/admin/chats">
                    <MessageSquare />
                    <span>Chats</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Conversaciones">
                   <Link href="/admin/conversations">
                    <MessagesSquare />
                    <span>Conversaciones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild tooltip="Footer Principal">
                   <Link href="/admin/footer-main">
                    <Footprints />
                    <span>Footer Principal</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild tooltip="Footer Copyright">
                   <Link href="/admin/footer-copyright">
                    <Copyright />
                    <span>Footer Copyright</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-16 sm:px-6">
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
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
