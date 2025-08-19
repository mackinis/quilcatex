
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/product-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductTable({ products, isLoading }: ProductTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (products.length === 0) {
    return <p className="text-center text-muted-foreground">No se encontraron productos.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Creado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              <Badge variant={product.paused ? "destructive" : "default"}>
                {product.paused ? "Pausado" : "Activo"}
              </Badge>
            </TableCell>
            <TableCell>AR$ {product.price.toFixed(2)}</TableCell>
            <TableCell>{product.stock}</TableCell>
            <TableCell>{product.createdAt ? format(new Date(product.createdAt), "dd MMM yyyy", { locale: es }) : 'N/A'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
