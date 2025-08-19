
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/lib/product-service";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from 'next/image';
import { Button } from "../ui/button";
import { Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  onEdit: (product: Product) => void;
}

export function ProductTable({ products, isLoading, onEdit }: ProductTableProps) {
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
          <TableHead className="w-[60px] hidden sm:table-cell">Imagen</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Promoción Aplicada</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const promotionText = product.promotion
            ? `${product.promotion.discountType === 'percentage' ? `${product.promotion.value}%` : `$${formatCurrency(product.promotion.value)}`} OFF`
            : 'N/A';

          return (
            <TableRow key={product.id}>
              <TableCell className="hidden sm:table-cell">
                <Image 
                  src={product.imageUrl} 
                  alt={product.name} 
                  width={40} 
                  height={40} 
                  className="rounded-md object-cover"
                />
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                <Badge variant={product.paused ? "destructive" : "default"}>
                  {product.paused ? "Pausado" : "Activo"}
                </Badge>
              </TableCell>
              <TableCell>$ {formatCurrency(product.price)}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>
                <Badge variant={product.promotion ? "secondary" : "outline"}>
                    {promotionText}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="icon" onClick={() => onEdit(product)}>
                  <Pencil className="h-4 w-4" />
                   <span className="sr-only">Editar Producto</span>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
