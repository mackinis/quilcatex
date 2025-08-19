import { Star } from 'lucide-react';

export const StarRating = ({ rating, className }: { rating: number, className?: string }) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${className} ${
            i < rating ? 'text-primary fill-primary' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};
