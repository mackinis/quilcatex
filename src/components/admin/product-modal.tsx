
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { addProduct, type Product } from "@/lib/product-service";
import { ScrollArea } from "../ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  price: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive({ message: "El precio debe ser un número positivo." })),
  stock: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().int().min(0, { message: "El stock no puede ser negativo." })),
  imageUrl: z.string().url({ message: "Debe ser una URL de imagen válida." }),
  allowRatings: z.boolean(),
  paused: z.boolean(),
});

type ProductFormData = z.infer<typeof formSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProductAdded: (product: Product) => void;
}

export function ProductModal({ isOpen, onOpenChange, onProductAdded }: ProductModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      imageUrl: "",
      allowRatings: true,
      paused: false,
    },
  });

  const onSubmit = async (values: ProductFormData) => {
    setIsLoading(true);
    try {
      const newProductData = {
        ...values,
      };
      const addedProduct = await addProduct(newProductData);
      
      toast({
        title: "Éxito",
        description: "El producto ha sido añadido correctamente.",
      });
      onProductAdded({ ...addedProduct, ...newProductData });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo añadir el producto.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa los detalles del producto a continuación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
           <ScrollArea className="h-96 pr-3">
            <div className="space-y-4 pr-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Zapatillas Deportivas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe el producto..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (AR$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="99.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Disponible</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Imagen</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com/imagen.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="allowRatings"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Permitir Calificaciones</FormLabel>
                    </div>
                    <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="paused"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                        <FormLabel>Pausar Producto</FormLabel>
                    </div>
                    <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    </FormItem>
                )}
            />
            </div>
            </ScrollArea>
            <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Añadiendo..." : "Añadir Producto"}
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
