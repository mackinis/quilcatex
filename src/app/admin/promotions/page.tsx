
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getPromotions, deletePromotion, type Promotion } from "@/lib/promotion-service";
import { PromotionTable } from "@/components/admin/promotion-table";
import { PromotionModal } from "@/components/admin/promotion-modal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const fetchedPromotions = await getPromotions();
      setPromotions(fetchedPromotions);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las promociones.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (promotion: Promotion | null = null) => {
    setEditingPromotion(promotion);
    setIsModalOpen(true);
  };

  const handlePromotionSaved = (savedPromotion: Promotion) => {
    const isNew = !promotions.some(p => p.id === savedPromotion.id);
    if (isNew) {
      setPromotions(prev => [savedPromotion, ...prev].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } else {
      setPromotions(prev => 
        prev.map(p => p.id === savedPromotion.id ? savedPromotion : p)
      );
    }
  };
  
  const handleDeleteRequest = (promotionId: string) => {
    setPromotionToDelete(promotionId);
    setIsAlertOpen(true);
  }

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return;
    try {
        await deletePromotion(promotionToDelete);
        setPromotions(prev => prev.filter(p => p.id !== promotionToDelete));
        toast({ title: "Éxito", description: "La promoción ha sido eliminada." });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la promoción.' });
    } finally {
        setIsAlertOpen(false);
        setPromotionToDelete(null);
    }
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Promociones</h2>
          <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Crear Promoción</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Promociones</CardTitle>
            <CardDescription>Crea y administra códigos de descuento y ofertas.</CardDescription>
          </CardHeader>
          <CardContent>
            <PromotionTable promotions={promotions} isLoading={isLoading} onEdit={handleOpenModal} onDelete={handleDeleteRequest}/>
          </CardContent>
        </Card>
        <PromotionModal 
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onPromotionSaved={handlePromotionSaved}
          promotionToEdit={editingPromotion}
        />
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la promoción.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
