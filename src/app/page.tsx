
import { Footer } from '@/components/layout/footer';
import { HeroSection } from '@/components/sections/hero-section';
import { ProductsSection } from '@/components/sections/products-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ContactSection } from '@/components/sections/contact-section';
import { MapSection } from '@/components/sections/map-section';

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        <HeroSection />
        <ProductsSection />
        <ServicesSection />
        <ContactSection />
        <MapSection />
      </main>
      <Footer />
    </div>
  );
}
