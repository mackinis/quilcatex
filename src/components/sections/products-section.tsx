
"use client";

import { useEffect, useState, useMemo } from "react";
import { ProductCard } from "@/components/product-card";
import { getProducts, type Product } from "@/lib/product-service";
import { Skeleton } from "../ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";
import { Filter, Search } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandList } from "../ui/command";
import { cn } from "@/lib/utils";


interface FilterOptions {
    weights: string[];
    colors: string[];
    types: string[];
    uses: string[];
    formats: string[];
    measures: string[];
}

export function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Partial<FilterOptions>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts.filter(p => !p.paused));
      } catch (error) {
        console.error("Failed to fetch data for storefront:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filterOptions = useMemo((): FilterOptions => {
    const options: FilterOptions = { weights: [], colors: [], types: [], uses: [], formats: [], measures: [] };
    products.forEach(p => {
        p.availableWeights?.forEach(w => !options.weights.includes(w) && options.weights.push(w));
        p.availableColors?.forEach(c => !options.colors.includes(c) && options.colors.push(c));
        p.availableTypes?.forEach(t => !options.types.includes(t) && options.types.push(t));
        p.availableUses?.forEach(u => !options.uses.includes(u) && options.uses.push(u));
        p.availableFormats?.forEach(f => !options.formats.includes(f) && options.formats.push(f));
        p.availableMeasures?.forEach(m => !options.measures.includes(m) && options.measures.push(m));
    });
    return options;
  }, [products]);

  const handleFilterChange = (category: keyof FilterOptions, value: string) => {
    setSelectedFilters(prev => {
        const currentCategoryFilters = prev[category] || [];
        const newCategoryFilters = currentCategoryFilters.includes(value)
            ? currentCategoryFilters.filter(v => v !== value)
            : [...currentCategoryFilters, value];
        
        const newFilters = { ...prev, [category]: newCategoryFilters };
        if (newCategoryFilters.length === 0) {
            delete newFilters[category];
        }
        return newFilters;
    });
  };

  const filteredProducts = useMemo(() => {
    let tempProducts = products;

    if (searchTerm) {
        tempProducts = tempProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    const activeFilterCategories = Object.keys(selectedFilters) as (keyof FilterOptions)[];
    if (activeFilterCategories.length === 0) {
        return tempProducts;
    }

    return tempProducts.filter(product => {
        return activeFilterCategories.every(category => {
            const selectedValues = selectedFilters[category];
            if (!selectedValues || selectedValues.length === 0) return true;

            const attributeKeyMap: Record<keyof FilterOptions, keyof Product> = {
                weights: 'availableWeights',
                colors: 'availableColors',
                types: 'availableTypes',
                uses: 'availableUses',
                formats: 'availableFormats',
                measures: 'availableMeasures'
            };
            
            const productAttributes = product[attributeKeyMap[category]] as string[] | undefined;
            if (!productAttributes || productAttributes.length === 0) return false;
            
            return selectedValues.some(value => productAttributes.includes(value));
        });
    });
  }, [products, selectedFilters, searchTerm]);


  const clearFilters = () => {
    setSelectedFilters({});
    setSearchTerm("");
  }
  
  const renderFilterOptions = (category: keyof FilterOptions, label: string) => {
    const options = filterOptions[category];
    if (!options || options.length === 0) return null;

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
            {label}
             {(selectedFilters[category]?.length || 0) > 0 && 
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {selectedFilters[category]?.length}
                </span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandList>
                <ScrollArea className="max-h-48">
                    <div className="p-2 space-y-2">
                        {options.map(option => (
                        <div key={option} className="flex items-center space-x-2">
                            <Checkbox
                                id={`${category}-${option}`}
                                onCheckedChange={() => handleFilterChange(category, option)}
                                checked={(selectedFilters[category] || []).includes(option)}
                            />
                            <Label htmlFor={`${category}-${option}`} className="text-sm font-normal leading-none cursor-pointer flex-1">
                                {option}
                            </Label>
                        </div>
                        ))}
                    </div>
                </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };


  const renderFilterModalContent = () => {
    return (
      <DialogContent 
        className={cn(
            "sm:max-w-md transition-transform duration-300 ease-in-out", 
            isInputFocused ? "data-[state=open]:-translate-y-24" : ""
        )}
      >
        <DialogHeader>
          <DialogTitle>Filtrar Productos</DialogTitle>
          <DialogDescription>
            Usa la búsqueda y los filtros para encontrar lo que necesitas.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar por nombre de producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                className="pl-8"
            />
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {renderFilterOptions('weights', 'Peso')}
            {renderFilterOptions('colors', 'Color')}
            {renderFilterOptions('types', 'Tipo')}
            {renderFilterOptions('uses', 'Uso')}
            {renderFilterOptions('formats', 'Formato')}
            {renderFilterOptions('measures', 'Medida')}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={clearFilters} disabled={Object.keys(selectedFilters).length === 0 && !searchTerm}>
            Limpiar Filtros
          </Button>
          <Button onClick={() => setIsFilterModalOpen(false)}>Ver Resultados</Button>
        </div>
      </DialogContent>
    );
  };

  return (
    <section id="products" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Nuestros Productos</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Explora nuestra selección de productos de alta calidad, elegidos para ti.
            </p>
          </div>
        </div>
        
        <div className="flex justify-center my-8">
            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filtrar y Buscar
                    </Button>
                </DialogTrigger>
                {renderFilterModalContent()}
            </Dialog>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {isLoading ? (
                <>
                    {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="flex flex-col space-y-3">
                        <Skeleton className="h-[225px] w-full rounded-xl" />
                        <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-[150px]" />
                        </div>
                        </div>
                    ))}
                </>
            ) : (
                filteredProducts.length > 0 ? (
                    <>
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </>
                ) : (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <h3 className="text-xl font-semibold">No se encontraron productos</h3>
                        <p className="mt-2">Intenta ajustar tus filtros o revisa más tarde.</p>
                    </div>
                )
            )}
        </div>
      </div>
    </section>
  );
}
