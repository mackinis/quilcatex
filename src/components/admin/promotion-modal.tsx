
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { addPromotion, type Promotion } from "@/lib/promotion-service";

const formSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").toUpperCase(),
  discount: z.preprocess((a) => parseInt(z.string().parse(a), 10), z.number().int().min(1, "El descuento debe ser al menos 1%.").max(100, "El descuento no puede ser mayor a 100%.")),
});

type PromotionFormData = z.infer<typeof formSchema>;

interface PromotionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPromotionAdded: (promotion: Promotion) => void;
}

export function PromotionModal({ isOpen, onOpenChange, onPromotionAdded }: PromotionModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<PromotionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { code: "", discount: 10 },
  });

  const onSubmit = async (values: PromotionFormData) => {
    setIsLoading(true);
    try {
      const newPromotion = await addPromotion(values);
      const fullPromotion = { ...newPromotion, ...values, createdAt: Date.now() };
      toast({ title: "Éxito", description: "La promoción ha sido creada." });
      onPromotionAdded(fullPromotion);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la promoción." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Promoción</DialogTitle>
          <DialogDescription>Completa los detalles del código de descuento.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Promoción</FormLabel>
                  <FormControl><Input placeholder="EJ: VERANO20" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="discount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje de Descuento (%)</FormLabel>
                  <FormControl><Input type="number" placeholder="10" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear Promoción"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
