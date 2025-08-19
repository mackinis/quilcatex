
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getProducts, type Product } from "@/lib/product-service";
import { ProductTable } from "@/components/admin/product-table";
import { ProductModal } from "@/components/admin/product-modal";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, []);
  
  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  }

  const handleProductSaved = (savedProduct: Product) => {
    const isNew = !products.some(p => p.id === savedProduct.id);
    if (isNew) {
      setProducts(prevProducts => [savedProduct, ...prevProducts]);
    } else {
      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === savedProduct.id ? savedProduct : p))
      );
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
        <Button onClick={() => handleOpenModal()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Producto
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Productos</CardTitle>
          <CardDescription>Administra el catálogo de productos de tu tienda.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTable products={products} isLoading={isLoading} onEdit={handleOpenModal} />
        </CardContent>
      </Card>
      <ProductModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onProductSaved={handleProductSaved}
        productToEdit={editingProduct}
      />
    </div>
  );
}
