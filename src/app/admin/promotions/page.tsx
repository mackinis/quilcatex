
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getPromotions, type Promotion } from "@/lib/promotion-service";
import { PromotionTable } from "@/components/admin/promotion-table";
import { PromotionModal } from "@/components/admin/promotion-modal";
import { useToast } from "@/hooks/use-toast";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const fetchedPromotions = await getPromotions();
        setPromotions(fetchedPromotions);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las promociones.' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPromotions();
  }, [toast]);

  const handlePromotionAdded = (newPromotion: Promotion) => {
    setPromotions(prev => [newPromotion, ...prev]);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Promociones</h2>
        <Button onClick={() => setIsModalOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Crear Promoción</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Promociones</CardTitle>
          <CardDescription>Crea y administra códigos de descuento y ofertas.</CardDescription>
        </CardHeader>
        <CardContent>
          <PromotionTable promotions={promotions} isLoading={isLoading} />
        </CardContent>
      </Card>
      <PromotionModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onPromotionAdded={handlePromotionAdded}
      />
    </div>
  );
}
