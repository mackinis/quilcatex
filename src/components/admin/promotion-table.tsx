
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Promotion } from "@/lib/promotion-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PromotionTableProps {
  promotions: Promotion[];
  isLoading: boolean;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotionId: string) => void;
}

const getStatus = (promo: Promotion): { text: string; variant: "default" | "secondary" | "destructive" } => {
    if (promo.paused) {
        return { text: "Pausada", variant: "secondary" };
    }
    const now = new Date();
    const startDate = new Date(promo.startDate);
    
    if (now < startDate) {
        return { text: "Programada", variant: "secondary" };
    }

    if (!promo.isIndefinite && promo.endDate) {
        const endDate = new Date(promo.endDate);
        endDate.setHours(23, 59, 59, 999); // Include the whole end day
        if (now > endDate) {
            return { text: "Expirada", variant: "destructive" };
        }
    }
    
    return { text: "Activa", variant: "default" };
}

export function PromotionTable({ promotions, isLoading, onEdit, onDelete }: PromotionTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (promotions.length === 0) {
    return <p className="text-center text-muted-foreground">No se encontraron promociones.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Descuento</TableHead>
          <TableHead>Validez</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.map((promo) => {
            const status = getStatus(promo);
            const discountText = promo.discountType === 'percentage' 
                ? `${promo.value}%` 
                : `$ ${formatCurrency(promo.value)}`;
            
            const validityText = promo.isIndefinite
                ? `Desde ${format(new Date(promo.startDate), "dd/MM/yy", { locale: es })}`
                : `${format(new Date(promo.startDate), "dd/MM/yy", { locale: es })} - ${promo.endDate ? format(new Date(promo.endDate), "dd/MM/yy", { locale: es }) : 'N/A'}`

            return (
                 <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.code}</TableCell>
                    <TableCell>{discountText}</TableCell>
                    <TableCell>{validityText}</TableCell>
                    <TableCell>
                        <Badge variant={status.variant}>{status.text}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(promo)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(promo.id!)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
            )
        })}
      </TableBody>
    </Table>
  );
}
