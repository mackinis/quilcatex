
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingBag, BarChart, UserCheck, MessagesSquare, Newspaper } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getDashboardStats, type DashboardStats, type RecentUser } from "@/lib/dashboard-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { onChatSessionsSnapshot, ChatSession } from "@/lib/chat-service";
import { onSubscribersCountSnapshot } from "@/lib/subscription-service";


export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
        setSubscriberCount(dashboardStats.totalSubscribers);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    const unsubscribeChats = onChatSessionsSnapshot((sessions: ChatSession[]) => {
      const unreadCount = sessions.filter(s => s.unread).length;
      setStats(prevStats => {
        if (prevStats && prevStats.unreadChats !== unreadCount) {
          return { ...prevStats, unreadChats: unreadCount };
        }
        return prevStats;
      });
    });

    const unsubscribeSubscribers = onSubscribersCountSnapshot((count) => {
      setSubscriberCount(count);
    });

    return () => {
        unsubscribeChats();
        unsubscribeSubscribers();
    };
  }, []);


  const renderStatCard = (title: string, value: string | number, Icon: React.ElementType, description?: string, isLoading: boolean = false) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-1/2 mt-1" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {renderStatCard("Total Clientes", stats?.totalUsers ?? 0, Users, "Usuarios registrados en la tienda.", isLoading)}
        {renderStatCard("Nuevos Clientes (30d)", `+${stats?.newUsersLast30Days ?? 0}`, UserCheck, "Nuevos registros en el último mes.", isLoading)}
        {renderStatCard("Total Productos", stats?.totalProducts ?? 0, ShoppingBag, "Productos en el catálogo.", isLoading)}
        {renderStatCard("Mensajes Nuevos", stats?.unreadChats ?? 0, MessagesSquare, "Conversaciones no leídas.", isLoading)}
        {renderStatCard("Total Suscriptores", subscriberCount ?? 0, Newspaper, "Suscriptores al boletín.", isLoading || subscriberCount === null)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Nuevos Usuarios (Últimos 7 Días)</CardTitle>
            <CardDescription>Visualización de nuevos registros diarios.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
               <Skeleton className="h-[350px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={stats?.userChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                    <Tooltip
                        contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                        }}
                    />
                    <Bar dataKey="count" name="Nuevos Usuarios" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Usuarios Recientes</CardTitle>
            <CardDescription>Los últimos 5 usuarios que se han registrado.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                 <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
            ) : (
                 <div className="space-y-4">
                  {stats?.recentUsers.map((user: RecentUser) => (
                    <div key={user.id} className="flex items-center">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{user.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
