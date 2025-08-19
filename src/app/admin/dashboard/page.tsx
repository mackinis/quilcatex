
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, ShoppingBag, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">AR$ 45,231.89</div>
                    <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+2350</div>
                    <p className="text-xs text-muted-foreground">+180.1% desde el mes pasado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+12,234</div>
                    <p className="text-xs text-muted-foreground">+19% desde el mes pasado</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Visitantes Activos</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">573</div>
                    <p className="text-xs text-muted-foreground">+201 desde la última hora</p>
                </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Visión General</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">{/* Chart placeholder */}</CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Ventas Recientes</CardTitle>
                    <CardDescription>Has realizado 265 ventas este mes.</CardDescription>
                </CardHeader>
                <CardContent>{/* Recent sales placeholder */}</CardContent>
            </Card>
        </div>
    </div>
  );
}
