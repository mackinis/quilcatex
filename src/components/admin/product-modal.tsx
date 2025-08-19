
"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useMemo } from "react";
import { addProduct, updateProduct, type Product } from "@/lib/product-service";
import { getActivePromotions, type Promotion } from "@/lib/promotion-service";
import { ScrollArea } from "../ui/scroll-area";
import { PlusCircle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  price: z.coerce.number().positive({ message: "El precio debe ser un número positivo." }),
  stock: z.coerce.number().int().min(0, { message: "El stock no puede ser negativo." }),
  imageUrl: z.string().url({ message: "Debe ser una URL de imagen válida." }),
  allowRatings: z.boolean(),
  overrideRating: z.coerce.number().min(0).max(5).nullable().optional(),
  paused: z.boolean(),
  hasWeights: z.boolean(),
  hasColors: z.boolean(),
  hasTypes: z.boolean(),
  hasUses: z.boolean(),
  hasFormats: z.boolean(),
  hasMeasures: z.boolean(),
  availableWeights: z.array(z.string()),
  availableColors: z.array(z.string()),
  availableTypes: z.array(z.string()),
  availableUses: z.array(z.string()),
  availableFormats: z.array(z.string()),
  availableMeasures: z.array(z.string()),
  promotionCode: z.string().optional(),
  promotionTitle: z.string().optional(),
});

type ProductFormData = z.infer<typeof formSchema>;

interface ProductModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProductSaved: (product: Product) => void;
  productToEdit: Product | null;
}

export function ProductModal({ isOpen, onOpenChange, onProductSaved, productToEdit }: ProductModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const isEditMode = !!productToEdit;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", description: "", price: 0, stock: 0, imageUrl: "",
      allowRatings: true, paused: false, overrideRating: null,
      hasWeights: false, hasColors: false, hasTypes: false, hasUses: false, hasFormats: false, hasMeasures: false,
      availableWeights: [], availableColors: [], availableTypes: [], availableUses: [], availableFormats: [], availableMeasures: [],
      promotionCode: "", promotionTitle: "",
    },
  });

  useEffect(() => {
    async function fetchData() {
        if (!isOpen) return;
        try {
            const activePromos = await getActivePromotions();
            setPromotions(activePromos);
        } catch (error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudieron cargar las promociones.",
            });
        }
    }
    fetchData();
  }, [isOpen, toast]);

  const { fields: weightFields, append: appendWeight, remove: removeWeight } = useFieldArray({ control: form.control, name: "availableWeights" });
  const { fields: colorFields, append: appendColor, remove: removeColor } = useFieldArray({ control: form.control, name: "availableColors" });
  const { fields: typeFields, append: appendType, remove: removeType } = useFieldArray({ control: form.control, name: "availableTypes" });
  const { fields: useFields, append: appendUse, remove: removeUse } = useFieldArray({ control: form.control, name: "availableUses" });
  const { fields: formatFields, append: appendFormat, remove: removeFormat } = useFieldArray({ control: form.control, name: "availableFormats" });
  const { fields: measureFields, append: appendMeasure, remove: removeMeasure } = useFieldArray({ control: form.control, name: "availableMeasures" });
  
  const watchedAttrs = {
    hasWeights: form.watch("hasWeights"),
    hasColors: form.watch("hasColors"),
    hasTypes: form.watch("hasTypes"),
    hasUses: form.watch("hasUses"),
    hasFormats: form.watch("hasFormats"),
    hasMeasures: form.watch("hasMeasures"),
  };

  useEffect(() => {
    if (productToEdit) {
      form.reset({
        ...productToEdit,
        price: productToEdit.price || 0,
        stock: productToEdit.stock || 0,
        overrideRating: productToEdit.overrideRating || null,
        availableWeights: productToEdit.availableWeights || [],
        availableColors: productToEdit.availableColors || [],
        availableTypes: productToEdit.availableTypes || [],
        availableUses: productToEdit.availableUses || [],
        availableFormats: productToEdit.availableFormats || [],
        availableMeasures: productToEdit.availableMeasures || [],
        promotionCode: productToEdit.promotionCode || "",
        promotionTitle: productToEdit.promotionTitle || "",
      });
    } else {
      form.reset({
        name: "", description: "", price: 0, stock: 0, imageUrl: "",
        allowRatings: true, paused: false, overrideRating: null,
        hasWeights: false, hasColors: false, hasTypes: false, hasUses: false, hasFormats: false, hasMeasures: false,
        availableWeights: [], availableColors: [], availableTypes: [], availableUses: [], availableFormats: [], availableMeasures: [],
        promotionCode: "", promotionTitle: "",
      });
    }
  }, [productToEdit, isOpen, form]);
  
  const onSubmit = async (values: ProductFormData) => {
    setIsLoading(true);
    try {
      const dataToSave: Partial<Product> = { ...values };

      // Clean up empty arrays if the attribute is not enabled
      if (!values.hasWeights) dataToSave.availableWeights = [];
      if (!values.hasColors) dataToSave.availableColors = [];
      if (!values.hasTypes) dataToSave.availableTypes = [];
      if (!values.hasUses) dataToSave.availableUses = [];
      if (!values.hasFormats) dataToSave.availableFormats = [];
      if (!values.hasMeasures) dataToSave.availableMeasures = [];

      if (!dataToSave.promotionCode || dataToSave.promotionCode === "NONE") {
        dataToSave.promotionCode = ""; dataToSave.promotionTitle = "";
      }
      
      // If overrideRating is empty string, convert to null
      if (values.overrideRating === '') {
        dataToSave.overrideRating = null;
      }

      let savedProduct: Product;
      if (isEditMode && productToEdit?.id) {
        savedProduct = await updateProduct(productToEdit.id, dataToSave);
      } else {
        savedProduct = await addProduct(dataToSave as Omit<Product, 'id' | 'createdAt'>);
      }
      
      toast({ title: "Éxito", description: `El producto ha sido ${isEditMode ? 'actualizado' : 'añadido'} correctamente.` });
      onProductSaved(savedProduct);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: `No se pudo ${isEditMode ? 'actualizar' : 'añadir'} el producto.` });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAttributeSection = (name: "Weights" | "Colors" | "Types" | "Uses" | "Formats" | "Measures", label: string, fields: any[], append: (val: string) => void, remove: (index: number) => void) => (
    <div className="space-y-2 p-3 border rounded-lg">
      <div className="flex justify-between items-center">
        <Label>{label} Disponibles</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => append('')}>
          <PlusCircle className="mr-2 h-4 w-4" />Añadir
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <Controller
            control={form.control}
            name={`available${name}.${index}` as any}
            render={({ field }) => <Input {...field} placeholder={`${label.slice(0, -1)} ${index + 1}`} />}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Producto" : "Añadir Nuevo Producto"}</DialogTitle>
          <DialogDescription>Completa los detalles del producto a continuación.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
           <ScrollArea className="h-[70vh] pr-3">
            <div className="space-y-4 pr-3">
              <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Nombre del Producto</FormLabel> <FormControl><Input placeholder="Ej: Zapatillas Deportivas" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descripción</FormLabel> <FormControl><Textarea placeholder="Describe el producto..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => ( <FormItem> <FormLabel>Precio ($)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="99,99" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem> <FormLabel>Stock</FormLabel> <FormControl><Input type="number" placeholder="100" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => ( <FormItem> <FormLabel>URL de la Imagen</FormLabel> <FormControl><Input placeholder="https://ejemplo.com/imagen.png" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="allowRatings" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Permitir Calificaciones</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                <FormField control={form.control} name="paused" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Pausar Producto</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
              </div>
              
              <FormField
                control={form.control}
                name="overrideRating"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Calificación Manual (Opcional)</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                step="0.1" 
                                min="0" 
                                max="5" 
                                placeholder="Dejar vacío para usar promedio real" 
                                {...field} 
                                value={field.value ?? ""}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
              />

              {/* PROMOCION */}
              <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Promoción</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="promotionCode" render={({ field }) => (
                        <FormItem><FormLabel>Aplicar Promoción</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="NONE">Ninguna</SelectItem>
                              {promotions.map(promo => (
                                <SelectItem key={promo.id} value={promo.code}>{promo.code} ({promo.discountType === 'percentage' ? `${promo.value}% OFF` : `$ ${promo.value} OFF`})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="promotionTitle" render={({ field }) => (
                        <FormItem><FormLabel>Título de la Oferta</FormLabel>
                          <FormControl><Input placeholder="Ej: OFERTA" {...field} disabled={!form.watch('promotionCode') || form.watch('promotionCode') === 'NONE'} /></FormControl>
                          <FormMessage />
                        </FormItem>
                     )}/>
                  </div>
              </div>

              {/* Atributos */}
              <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Atributos del Producto</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="hasWeights" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Habilitar Peso</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                    <FormField control={form.control} name="hasColors" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Habilitar Colores</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                    <FormField control={form.control} name="hasTypes" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Habilitar Tipos</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                    <FormField control={form.control} name="hasUses" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Habilitar Usos</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                    <FormField control={form.control} name="hasFormats" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Habilitar Formatos</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                    <FormField control={form.control} name="hasMeasures" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"> <div className="space-y-0.5"><FormLabel>Habilitar Medida</FormLabel></div> <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl> </FormItem> )}/>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {watchedAttrs.hasWeights && renderAttributeSection("Weights", "Pesos", weightFields, appendWeight, removeWeight)}
                    {watchedAttrs.hasColors && renderAttributeSection("Colors", "Colores", colorFields, appendColor, removeColor)}
                    {watchedAttrs.hasTypes && renderAttributeSection("Types", "Tipos", typeFields, appendType, removeType)}
                    {watchedAttrs.hasUses && renderAttributeSection("Uses", "Usos", useFields, appendUse, removeUse)}
                    {watchedAttrs.hasFormats && renderAttributeSection("Formats", "Formatos", formatFields, appendFormat, removeFormat)}
                    {watchedAttrs.hasMeasures && renderAttributeSection("Measures", "Medidas", measureFields, appendMeasure, removeMeasure)}
                  </div>
              </div>
            </div>
            </ScrollArea>
            <div className="pt-4 flex justify-end border-t">
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>{isLoading ? (isEditMode ? "Guardando..." : "Añadiendo...") : (isEditMode ? "Guardar Cambios" : "Añadir Producto")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
