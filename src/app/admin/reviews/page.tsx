
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type ReviewSettings } from "@/lib/settings-service";
import { updateReviewStatus, deleteReview, type Review, onReviewsSnapshot } from "@/lib/review-service";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StarRating } from "@/components/icons";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, MoreHorizontal, PauseCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

export default function ReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>({
    policy: 'all',
    allowMultipleReviews: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchInitialSettings() {
      setIsLoading(true);
      try {
        const loadedSettings = await getSettings();
        if (loadedSettings?.reviews) {
          setReviewSettings(loadedSettings.reviews);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los datos de reseñas." });
      }
    }
    
    fetchInitialSettings();

    const unsubscribe = onReviewsSnapshot((loadedReviews) => {
        setReviews(loadedReviews);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleSettingsChange = async (newSettings: Partial<ReviewSettings>) => {
    const updatedSettings = { ...reviewSettings, ...newSettings };
    setReviewSettings(updatedSettings);
    setIsSaving(true);
    try {
      await saveSettings({ reviews: updatedSettings });
      toast({ title: "Éxito", description: "La configuración de reseñas ha sido actualizada." });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
       // Revert optimistic update
       const oldSettings = await getSettings();
       if(oldSettings?.reviews) setReviewSettings(oldSettings.reviews);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleStatusUpdate = async (review: Review, status: Review['status']) => {
     try {
        await updateReviewStatus(review.productId, review.id, status);
        toast({ title: "Éxito", description: `La reseña ha sido actualizada.`});
     } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar la reseña." });
     }
  };

  const handleDelete = async (review: Review) => {
    try {
        await deleteReview(review.productId, review.id);
        toast({ title: "Éxito", description: "La reseña ha sido eliminada." });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la reseña." });
    }
  };

  const statusMap: {[key in Review['status']]: {text: string, variant: 'default' | 'secondary' | 'destructive'}} = {
    pending: { text: 'Pendiente', variant: 'secondary' },
    approved: { text: 'Aprobada', variant: 'default' },
    rejected: { text: 'Rechazada', variant: 'destructive'},
    paused: { text: 'Pausada', variant: 'secondary' }
  }


  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Reseñas</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Política de Reseñas</CardTitle>
          <CardDescription>Configura quién puede dejar reseñas y cómo se gestionan. El switch en cada producto determina si las reseñas están habilitadas para ese ítem específico.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {isLoading ? <Skeleton className="h-10 w-full"/> : (
            <div className="space-y-4">
              <div>
                <Label className="font-semibold">¿Quién puede dejar reseñas?</Label>
                <RadioGroup 
                    value={reviewSettings.policy} 
                    onValueChange={(value) => handleSettingsChange({ policy: value as ReviewSettings['policy'] })} 
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2" 
                    disabled={isSaving}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="all" /><Label htmlFor="all">Cualquier visitante</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="registered" id="registered" /><Label htmlFor="registered">Solo usuarios registrados</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="buyers" id="buyers" /><Label htmlFor="buyers">Solo compradores verificados</Label></div>
                </RadioGroup>
              </div>
              <div className="flex items-center space-x-2 pt-4 border-t">
                  <Switch 
                    id="multiple-reviews"
                    checked={reviewSettings.allowMultipleReviews}
                    onCheckedChange={(checked) => handleSettingsChange({ allowMultipleReviews: checked })}
                    disabled={isSaving}
                  />
                  <Label htmlFor="multiple-reviews">Permitir múltiples reseñas del mismo usuario por producto</Label>
              </div>
            </div>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Moderar Reseñas</CardTitle>
          <CardDescription>Aprueba, rechaza o elimina las reseñas enviadas por los usuarios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead className="hidden md:table-cell">Reseña</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-12 w-full"/></TableCell></TableRow>)
                ) : reviews.length > 0 ? (
                    reviews.map(review => {
                        const statusInfo = statusMap[review.status];
                        return (
                         <TableRow key={review.id}>
                            <TableCell className="font-medium">{review.productName}</TableCell>
                            <TableCell>{review.author}</TableCell>
                            <TableCell><StarRating rating={review.rating} /></TableCell>
                            <TableCell className="hidden md:table-cell max-w-sm"><p className="truncate">{review.text}</p></TableCell>
                            <TableCell className="hidden lg:table-cell">{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: es })}</TableCell>
                            <TableCell>
                                <Badge variant={statusInfo.variant}>
                                    {statusInfo.text}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                               <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {review.status !== 'approved' && <DropdownMenuItem onClick={() => handleStatusUpdate(review, 'approved')}><Check className="mr-2 h-4 w-4"/> Aprobar</DropdownMenuItem>}
                                        {review.status === 'approved' && <DropdownMenuItem onClick={() => handleStatusUpdate(review, 'paused')}><PauseCircle className="mr-2 h-4 w-4"/> Pausar</DropdownMenuItem>}
                                        {review.status !== 'rejected' && <DropdownMenuItem onClick={() => handleStatusUpdate(review, 'rejected')}><X className="mr-2 h-4 w-4"/> Rechazar</DropdownMenuItem>}
                                        <DropdownMenuItem onClick={() => handleDelete(review)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                         </TableRow>
                        )
                    })
                ) : (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">No hay reseñas para moderar.</TableCell></TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
