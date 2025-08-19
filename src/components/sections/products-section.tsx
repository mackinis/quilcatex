
"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { getProducts, type Product } from "@/lib/product-service";
import { Skeleton } from "../ui/skeleton";

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const fetchedProducts = await getProducts();
        // Filter out paused products for the storefront
        setProducts(fetchedProducts.filter(p => !p.paused));
      } catch (error) {
        console.error("Failed to fetch products for storefront:", error);
        // Optionally, set an error state to show a message to the user
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);


  return (
    <section id="products" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nuestros Productos</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Explora nuestra selección de productos de alta calidad, elegidos para ti.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mt-12">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
               <div key={index} className="flex flex-col space-y-3">
                  <Skeleton className="h-[225px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
            ))
          ) : (
             products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
