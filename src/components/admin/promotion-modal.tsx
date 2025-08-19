
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { addPromotion, updatePromotion, type Promotion } from "@/lib/promotion-service";
import { CalendarIcon, Palette } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Switch } from "../ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";

const formSchema = z.object({
  code: z.string().min(3, "El código debe tener al menos 3 caracteres.").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed'], { required_error: "Debe seleccionar un tipo de descuento." }),
  value: z.coerce.number().positive("El valor debe ser positivo."),
  startDate: z.date({ required_error: "La fecha de inicio es requerida."}),
  isIndefinite: z.boolean(),
  endDate: z.date().nullable().optional(),
  paused: z.boolean(),
  promotionTitleStyle: z.enum(['ribbon', 'star']).optional(),
  promotionTitleColor: z.string().optional(),
  promotionDiscountStyle: z.enum(['ribbon', 'star']).optional(),
  promotionDiscountColor: z.string().optional(),
  promotionTitleTextColor: z.string().optional(),
  promotionTitleTextSize: z.coerce.number().optional(),
  promotionDiscountTextColor: z.string().optional(),
  promotionDiscountTextSize: z.coerce.number().optional(),
}).refine(data => {
    if (data.discountType === 'percentage' && data.value > 100) {
        return false;
    }
    return true;
}, {
    message: "El porcentaje no puede ser mayor a 100.",
    path: ["value"],
}).refine(data => {
    if (!data.isIndefinite && data.endDate && data.endDate < data.startDate) {
        return false;
    }
    return true;
}, {
    message: "La fecha de fin no puede ser anterior a la de inicio.",
    path: ["endDate"],
}).refine(data => !data.isIndefinite ? !!data.endDate : true, {
    message: "La fecha de fin es requerida si la promoción no es por tiempo indeterminado.",
    path: ["endDate"],
});


type PromotionFormData = z.infer<typeof formSchema>;

interface PromotionModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPromotionSaved: (promotion: Promotion) => void;
  promotionToEdit: Promotion | null;
}

export function PromotionModal({ isOpen, onOpenChange, onPromotionSaved, promotionToEdit }: PromotionModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!promotionToEdit;

  const form = useForm<PromotionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
        code: "", 
        discountType: "percentage",
        value: 10,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        isIndefinite: false,
        paused: false,
        promotionTitleStyle: 'ribbon',
        promotionTitleColor: '#dc2626',
        promotionTitleTextColor: '#ffffff',
        promotionTitleTextSize: 12,
        promotionDiscountStyle: 'ribbon',
        promotionDiscountColor: '#facc15',
        promotionDiscountTextColor: '#000000',
        promotionDiscountTextSize: 12,
    },
  });

  useEffect(() => {
    if (promotionToEdit && isOpen) {
        form.reset({
            ...promotionToEdit,
            startDate: new Date(promotionToEdit.startDate),
            endDate: promotionToEdit.endDate ? new Date(promotionToEdit.endDate) : null,
            promotionTitleColor: promotionToEdit.promotionTitleColor || '#dc2626',
            promotionTitleTextColor: promotionToEdit.promotionTitleTextColor || '#ffffff',
            promotionTitleTextSize: promotionToEdit.promotionTitleTextSize || 12,
            promotionDiscountColor: promotionToEdit.promotionDiscountColor || '#facc15',
            promotionDiscountTextColor: promotionToEdit.promotionDiscountTextColor || '#000000',
            promotionDiscountTextSize: promotionToEdit.promotionDiscountTextSize || 12,
        });
    } else if (!isOpen) {
        form.reset({
            code: "", 
            discountType: "percentage",
            value: 10,
            startDate: new Date(),
            endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
            isIndefinite: false,
            paused: false,
            promotionTitleStyle: 'ribbon',
            promotionTitleColor: '#dc2626',
            promotionTitleTextColor: '#ffffff',
            promotionTitleTextSize: 12,
            promotionDiscountStyle: 'ribbon',
            promotionDiscountColor: '#facc15',
            promotionDiscountTextColor: '#000000',
            promotionDiscountTextSize: 12,
        });
    }
  }, [promotionToEdit, isOpen, form]);

  const onSubmit = async (values: PromotionFormData) => {
    setIsLoading(true);
    try {
      let savedPromotion: Promotion;
      const dataToSave = { ...values };

      if (dataToSave.isIndefinite) {
        dataToSave.endDate = null;
      }
      
      if (isEditMode && promotionToEdit?.id) {
          savedPromotion = await updatePromotion(promotionToEdit.id, dataToSave as Partial<Promotion>);
      } else {
          savedPromotion = await addPromotion(dataToSave as Omit<Promotion, 'id' | 'createdAt'>);
      }
      toast({ title: "Éxito", description: `La promoción ha sido ${isEditMode ? 'actualizada' : 'creada'}.` });
      onPromotionSaved(savedPromotion);
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `No se pudo ${isEditMode ? 'actualizar' : 'crear'} la promoción.` });
    } finally {
      setIsLoading(false);
    }
  };
  
  const discountType = form.watch("discountType");
  const isIndefinite = form.watch("isIndefinite");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Promoción" : "Crear Nueva Promoción"}</DialogTitle>
          <DialogDescription>Completa los detalles del código de descuento.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Promoción</FormLabel>
                      <FormControl><Input placeholder="EJ: VERANO20" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField control={form.control} name="discountType" render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Descuento</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="percentage" /></FormControl>
                            <FormLabel className="font-normal">Porcentaje (%)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="fixed" /></FormControl>
                            <FormLabel className="font-normal">Monto Fijo ($)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField control={form.control} name="value" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl><Input type="number" placeholder={discountType === 'percentage' ? "10" : "500"} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                 <FormField control={form.control} name="isIndefinite" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Tiempo Indeterminado</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>

                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="startDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Inicio</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="endDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha de Fin</FormLabel>
                           <Popover>
                            <PopoverTrigger asChild disabled={isIndefinite}>
                              <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground", isIndefinite && "disabled:opacity-50")}>
                                  {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value || undefined} onSelect={field.onChange} initialFocus/>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                 <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-muted-foreground"/>
                        <h3 className="text-md font-medium">Estilo de la Promoción</h3>
                    </div>
                     <div className="space-y-4 rounded-lg border p-4">
                         <Label className="text-sm font-semibold">Cinta de Título (Ej: OFERTA)</Label>
                         <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="promotionTitleStyle" render={({ field }) => (
                                <FormItem><FormLabel>Estilo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Estilo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ribbon">Cinta</SelectItem><SelectItem value="star">Estrella</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                             )}/>
                             <FormField control={form.control} name="promotionTitleColor" render={({ field }) => (
                                 <FormItem><FormLabel>Color Fondo</FormLabel><FormControl><Input type="color" {...field} className="p-1 h-10"/>
                                 </FormControl><FormMessage /></FormItem>
                             )}/>
                         </div>
                         <div className="grid grid-cols-2 gap-4 mt-2">
                             <FormField control={form.control} name="promotionTitleTextColor" render={({ field }) => (
                                 <FormItem><FormLabel>Color Texto</FormLabel><FormControl><Input type="color" {...field} className="p-1 h-10"/>
                                 </FormControl><FormMessage /></FormItem>
                             )}/>
                             <FormField control={form.control} name="promotionTitleTextSize" render={({ field }) => (
                                <FormItem><FormLabel>Tamaño Texto (px)</FormLabel><FormControl><Input type="number" {...field} />
                                </FormControl><FormMessage /></FormItem>
                             )}/>
                         </div>
                     </div>
                     <div className="space-y-4 rounded-lg border p-4">
                         <Label className="text-sm font-semibold">Cinta de Descuento (Ej: 10% OFF)</Label>
                         <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="promotionDiscountStyle" render={({ field }) => (
                                <FormItem><FormLabel>Estilo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Estilo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="ribbon">Cinta</SelectItem><SelectItem value="star">Estrella</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                             )}/>
                             <FormField control={form.control} name="promotionDiscountColor" render={({ field }) => (
                                 <FormItem><FormLabel>Color Fondo</FormLabel><FormControl><Input type="color" {...field} className="p-1 h-10"/>
                                 </FormControl><FormMessage /></FormItem>
                             )}/>
                         </div>
                         <div className="grid grid-cols-2 gap-4 mt-2">
                             <FormField control={form.control} name="promotionDiscountTextColor" render={({ field }) => (
                                 <FormItem><FormLabel>Color Texto</FormLabel><FormControl><Input type="color" {...field} className="p-1 h-10"/>
                                 </FormControl><FormMessage /></FormItem>
                             )}/>
                             <FormField control={form.control} name="promotionDiscountTextSize" render={({ field }) => (
                                <FormItem><FormLabel>Tamaño Texto (px)</FormLabel><FormControl><Input type="number" {...field} />
                                </FormControl><FormMessage /></FormItem>
                             )}/>
                         </div>
                     </div>
                </div>

                <FormField control={form.control} name="paused" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>Pausar Promoción</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )}/>
              </div>
            </ScrollArea>
            
            <DialogFooter className="pt-4 border-t">
                 <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Crear Promoción")}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
