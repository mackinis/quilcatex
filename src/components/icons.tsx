
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export const StarRating = ({ rating, onRate, className }: { rating: number, className?: string, onRate?: (rating: number) => void }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const isInteractive = onRate !== undefined;

  const handleStarClick = (e: React.MouseEvent, index: number) => {
    if (!isInteractive || !onRate) return;
    
    // Logic to detect if click is on the left or right half of the star
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isHalf = clickX < rect.width / 2;

    onRate(index + (isHalf ? 0.5 : 1));
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const starIndex = Math.floor(x / rect.width * 5);
    const starElement = e.currentTarget.children[starIndex] as HTMLDivElement;
    if(!starElement) return;

    const starRect = starElement.getBoundingClientRect();
    const isHalf = (e.clientX - starRect.left) < starRect.width / 2;
    setHoverRating(starIndex + (isHalf ? 0.5 : 1));
  }

  return (
    <div 
        className={cn("flex items-center", isInteractive && "cursor-pointer")} 
        onMouseMove={isInteractive ? handleMouseMove : undefined} 
        onMouseLeave={() => isInteractive && setHoverRating(0)}
    >
      {[...Array(5)].map((_, i) => {
        const currentRating = isInteractive && hoverRating > 0 ? hoverRating : rating;
        const full = currentRating >= i + 1;
        const half = currentRating >= i + 0.5 && currentRating < i + 1;
        
        return (
             <div key={i} className="relative" onClick={(e) => handleStarClick(e, i)}>
                 <Star className={cn("h-5 w-5 text-muted-foreground/30", className)} />
                 <div style={{ width: full ? '100%' : half ? '50%' : '0%', overflow: 'hidden' }} className="absolute top-0 left-0">
                    <Star className={cn("h-5 w-5 text-primary fill-primary", className)} />
                 </div>
             </div>
        );
      })}
    </div>
  );
};
