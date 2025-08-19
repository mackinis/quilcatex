
"use client";

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/icons';
import { useHydratedCart } from '@/hooks/use-cart.tsx';
import type { Product } from '@/lib/product-service';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { type Promotion } from '@/lib/promotion-service';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { onAllReviewsSnapshotForProduct, addReview, type Review, onApprovedReviewsSnapshotForProduct } from '@/lib/review-service';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSettings, type ReviewSettings } from '@/lib/settings-service';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';


interface ProductCardProps {
  product: Product;
}

const calculateDiscountedPrice = (price: number, promotion: Promotion) => {
  if (promotion.discountType === 'fixed') {
    return price - promotion.value;
  }
  if (promotion.discountType === 'percentage') {
    return price - (price * promotion.value) / 100;
  }
  return price;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useHydratedCart();
  const { toast } = useToast();
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'description' | 'reviews' | null>(null);
  const [reviewSettings, setReviewSettings] = useState<ReviewSettings | null>(null);
  const [userSession, setUserSession] = useState<{fullName: string, email: string} | null>(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // States for the new review form
  const [newRating, setNewRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    async function fetchSettings() {
        const settings = await getSettings();
        if (settings?.reviews) {
            setReviewSettings(settings.reviews);
        }
    }
    fetchSettings();
    
    try {
      const sessionData = sessionStorage.getItem('user-session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        setUserSession(session);
        setNewReviewAuthor(session.fullName); 
      }
    } catch(e) {}

    let allReviewsUnsubscribe: (() => void) | undefined;
    let approvedReviewsUnsubscribe: (() => void) | undefined;

    if (product.allowRatings && product.id) {
        allReviewsUnsubscribe = onAllReviewsSnapshotForProduct(product.id, (reviews) => {
            setAllReviews(reviews);
        });
        approvedReviewsUnsubscribe = onApprovedReviewsSnapshotForProduct(product.id, (reviews) => {
             setApprovedReviews(reviews);
             if (reviews.length > 0) {
                const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
                setAverageRating(totalRating / reviews.length);
            } else {
                setAverageRating(0);
            }
        });
    }


    if (product.promotion) {
      const promo = product.promotion;
      const now = new Date();
      const startDate = new Date(promo.startDate);
      const endDate = promo.endDate ? new Date(promo.endDate) : null;
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      if (!promo.paused && now >= startDate && (promo.isIndefinite || (endDate && now <= endDate))) {
        setPromotion(promo);
      } else {
        setPromotion(null);
      }
    }

     return () => {
        if (allReviewsUnsubscribe) allReviewsUnsubscribe();
        if (approvedReviewsUnsubscribe) approvedReviewsUnsubscribe();
    };
  }, [product]);

   useEffect(() => {
    if (userSession?.email && allReviews.length > 0 && !reviewSettings?.allowMultipleReviews) {
      setUserHasReviewed(allReviews.some(review => review.authorId === userSession.email));
    } else {
      setUserHasReviewed(false);
    }
  }, [userSession, allReviews, reviewSettings]);


  const hasPromotion = !!promotion;
  const discountedPrice = hasPromotion ? calculateDiscountedPrice(product.price, promotion) : product.price;
  const displayRating = product.overrideRating !== null && product.overrideRating !== undefined ? product.overrideRating : averageRating;
  
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0 || !newReviewAuthor.trim() || !newReviewText.trim()) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Por favor, completa todos los campos para la reseña.",
        });
        return;
    }
    setIsSubmitting(true);
    try {
        const reviewData: Omit<Review, 'id' | 'createdAt' | 'status' | 'productId' | 'productName'> = {
            author: newReviewAuthor,
            rating: newRating,
            text: newReviewText,
        };
        
        const finalReviewData: Partial<typeof reviewData> = {...reviewData};
        if (userSession?.email) {
            finalReviewData.authorId = userSession.email;
        }


        await addReview(product.id!, product.name, finalReviewData);

        toast({
            title: "Reseña Enviada",
            description: "Gracias por tu opinión. Tu reseña será revisada por un administrador.",
        });
        // Reset form
        setNewRating(0);
        setNewReviewText('');
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "No se pudo enviar tu reseña. Inténtalo de nuevo más tarde.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleAddToCart = () => {
    const productToAdd = { ...product, price: discountedPrice };
    addToCart(productToAdd);
    toast({
      title: "Producto añadido",
      description: `${product.name} se ha añadido a tu carrito.`,
    });
  };
  
  const openModal = (contentType: 'description' | 'reviews') => {
    if (contentType === 'reviews' && !product.allowRatings) return;
    setModalContent(contentType);
    setIsModalOpen(true);
  };
  

  const discountText = hasPromotion 
    ? promotion.discountType === 'percentage' 
        ? `${promotion.value}% OFF` 
        : `$${formatCurrency(promotion.value)} OFF`
    : '';
  
  const getStyleProps = (type: 'title' | 'discount') => {
    if (!hasPromotion || !promotion) return {};
    const styleProps: React.CSSProperties = {};
    if (type === 'title') {
        if (promotion.promotionTitleTextColor) styleProps.color = promotion.promotionTitleTextColor;
        if (promotion.promotionTitleTextSize) styleProps['--title-text-size' as any] = `${promotion.promotionTitleTextSize}px`;
    } else {
        if (promotion.promotionDiscountTextColor) styleProps.color = promotion.promotionDiscountTextColor;
        if (promotion.promotionDiscountTextSize) styleProps['--discount-text-size' as any] = `${promotion.promotionDiscountTextSize}px`;

    }
    return styleProps;
  }

  const renderPromotion = (type: 'title' | 'discount', text: string, style: 'ribbon' | 'star' | undefined, color: string | undefined) => {
    if (!text || !style || !color) return null;

    if (style === 'ribbon') {
      const className = type === 'title' ? 'offer-ribbon-title' : 'offer-ribbon-discount';
      return (
        <div className={className} style={{ backgroundColor: color }}>
            <span className="promotion-ribbon-text" style={getStyleProps(type)}>{text}</span>
        </div>
      );
    }
    if (style === 'star') {
      const className = type === 'title' ? 'star-tag-title' : 'star-tag-discount';
      return <div className={className}><div className="star-tag-background" style={{'--star-color': color} as React.CSSProperties}></div><span className="star-tag-text" style={getStyleProps(type)}>{text}</span></div>
    }
    return null;
  }
  
  const renderModalContent = () => {
    if (modalContent === 'description') {
        return (
            <>
                <DialogHeader><DialogTitle>{product.name}</DialogTitle></DialogHeader>
                <DialogDescription className="max-h-[60vh] overflow-y-auto p-4">{product.description}</DialogDescription>
                <div className="flex justify-end pt-2 border-t">
                    <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                </div>
            </>
        )
    }
    if (modalContent === 'reviews') {
        
        let canReview = false;
        if (reviewSettings) {
            const isRegistered = !!userSession;
            const policy = reviewSettings.policy;

            if (policy === 'all') {
                canReview = true;
            } else if (policy === 'registered' && isRegistered) {
                canReview = true;
            } else if (policy === 'buyers' && isRegistered) {
                // This logic can be expanded later if we track purchases
                canReview = true; 
            }
        }
        
        const showReviewForm = canReview && (!userHasReviewed || (reviewSettings?.allowMultipleReviews));

        return (
             <>
                <DialogHeader>
                    <DialogTitle>Reseñas de {product.name}</DialogTitle>
                     <DialogDescription>
                        {approvedReviews.length > 0 ? `Calificación promedio de ${displayRating.toFixed(1)} estrellas basada en ${approvedReviews.length} reseñas.` : 'Este producto aún no tiene reseñas.'}
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[60vh] pr-4">
                    {showReviewForm ? (
                        <form onSubmit={handleReviewSubmit} className="p-4 border-b space-y-4">
                            <h3 className="font-semibold">Deja tu opinión</h3>
                            <div className="space-y-1">
                                <Label>Tu calificación *</Label>
                                <StarRating rating={newRating} onRate={setNewRating} />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="review-author">Tu nombre *</Label>
                                <Input id="review-author" value={newReviewAuthor} onChange={(e) => setNewReviewAuthor(e.target.value)} placeholder="Ej: Juan Pérez" disabled={!!userSession}/>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="review-text">Tu reseña *</Label>
                                <Textarea id="review-text" value={newReviewText} onChange={(e) => setNewReviewText(e.target.value)} placeholder="¿Qué te pareció el producto?"/>
                            </div>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Enviar Reseña'}</Button>
                        </form>
                    ) : canReview && userHasReviewed && !reviewSettings?.allowMultipleReviews && (
                         <div className="p-4 border-b text-center text-sm text-muted-foreground">
                            Gracias, ya has dejado tu opinión sobre este producto.
                        </div>
                    )}

                    <div className="space-y-4 p-4">
                    {approvedReviews.map(review => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{review.author}</h4>
                                <StarRating rating={review.rating} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{format(new Date(review.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                            <p className="mt-2 text-sm">{review.text}</p>
                        </div>
                    ))}
                    {approvedReviews.length === 0 && !showReviewForm && (
                        <p className="text-center text-muted-foreground py-8">Aún no hay reseñas. ¡Sé el primero en dejar una!</p>
                    )}
                    </div>
                </ScrollArea>
                 <div className="flex justify-end pt-2 border-t">
                    <DialogClose asChild><Button type="button" variant="secondary">Cerrar</Button></DialogClose>
                </div>
            </>
        )
    }
    return null;
  }

  return (
    <>
      <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="p-0 relative">
          <div className="aspect-square relative overflow-hidden">
            {hasPromotion && renderPromotion('title', product.promotionTitle || '', promotion.promotionTitleStyle, promotion.promotionTitleColor)}
            {hasPromotion && renderPromotion('discount', discountText, promotion.promotionDiscountStyle, promotion.promotionDiscountColor)}
            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" data-ai-hint="product image"/>
          </div>
        </CardHeader>
        <div className="p-4 flex-grow flex flex-col justify-between">
            <div className="flex-grow mb-2">
              <CardTitle className="text-lg font-bold mb-1 line-clamp-2">{product.name}</CardTitle>
                <div onClick={() => openModal('description')} className="cursor-pointer">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                    </p>
                    <p className="text-xs text-muted-foreground">(leer descripcion)</p>
                </div>
            </div>
            <div className="pt-2">
                 <div onClick={() => openModal('reviews')} className="cursor-pointer">
                    {product.allowRatings && (
                        <>
                            <div className="flex items-center gap-2">
                                <StarRating rating={displayRating} />
                                <span className="text-xs text-muted-foreground">({approvedReviews.length})</span>
                            </div>
                            <p className="text-xs text-muted-foreground">( ver reseñas )</p>
                        </>
                    )}
                </div>
                <div className="mt-2">
                 <div className='flex flex-col md:flex-row md:items-baseline md:gap-2'>
                    {hasPromotion ? (
                        <>
                            <p className="text-sm text-muted-foreground line-through">$ {formatCurrency(product.price)}</p>
                            <p className="text-xl font-bold text-foreground">$ {formatCurrency(discountedPrice)}</p>
                        </>
                    ) : (
                    <p className="text-xl font-bold text-foreground">$ {formatCurrency(product.price)}</p>
                    )}
                 </div>
                </div>
                 <Button onClick={handleAddToCart} className="w-full mt-3">Añadir</Button>
            </div>
        </div>
      </Card>
      {
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-lg">
                {renderModalContent()}
            </DialogContent>
        </Dialog>
      }
    </>
  );
}


    




