'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import type { ListingMedia } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ListingGalleryProps {
  media: ListingMedia[];
}

export default function ListingGallery({ media }: ListingGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleThumbClick = (index: number) => {
    api?.scrollTo(index);
  };
  
  if (!media || media.length === 0) {
    return (
        <Card className="overflow-hidden">
            <div className="relative aspect-video w-full bg-secondary flex items-center justify-center">
                <p className="text-muted-foreground">No Images Available</p>
            </div>
        </Card>
    );
  }

  return (
    <div>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {media.map((item, index) => (
            <CarouselItem key={index}>
              <Card className="overflow-hidden">
                <div className="relative aspect-video w-full">
                  <Image
                    src={item.url}
                    alt={`Listing image ${index + 1}`}
                    fill
                    className="object-cover"
                    data-ai-hint={item.imageHint}
                    sizes="(max-width: 768px) 100vw, 66vw"
                    priority={index === 0}
                  />
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {media.length > 1 && (
            <>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
            </>
        )}
      </Carousel>
      {media.length > 1 && (
        <div className="mt-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {media.map((item, index) => (
                <button
                    key={index}
                    onClick={() => handleThumbClick(index)}
                    className={cn(
                        'relative aspect-square w-full rounded-md overflow-hidden transition-opacity focus:outline-none focus:ring-2 focus:ring-ring ring-offset-2',
                        index === current - 1 ? 'opacity-100 ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
                    )}
                >
                    <Image
                        src={item.url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                        data-ai-hint={item.imageHint}
                        sizes="15vw"
                    />
                </button>
            ))}
        </div>
      )}
    </div>
  );
}
