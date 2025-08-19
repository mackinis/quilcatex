
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Promotion } from "@/lib/promotion-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PromotionTableProps {
  promotions: Promotion[];
  isLoading: boolean;
}

export function PromotionTable({ promotions, isLoading }: PromotionTableProps) {
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
          <TableHead>Creado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {promotions.map((promo) => (
          <TableRow key={promo.id}>
            <TableCell className="font-medium">{promo.code}</TableCell>
            <TableCell>{promo.discount}%</TableCell>
            <TableCell>{promo.createdAt ? format(new Date(promo.createdAt), "dd MMM yyyy", { locale: es }) : 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
