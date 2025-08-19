
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/icons';
import { useHydratedCart } from '@/hooks/use-cart.tsx';
import type { Product } from '@/lib/product-service';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useHydratedCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Producto añadido",
      description: `${product.name} se ha añadido a tu carrito.`,
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="aspect-square relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint="product image"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-bold mb-1">{product.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{product.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div>
          <p className="text-xl font-bold text-foreground">AR$ {product.price.toFixed(2)}</p>
          {product.allowRatings && <StarRating rating={4} className="mt-1" />}
        </div>
        <Button onClick={handleAddToCart}>Añadir</Button>
      </CardFooter>
    </Card>
  );
}
