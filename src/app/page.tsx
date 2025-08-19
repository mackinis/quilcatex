
import { HeroSection } from '@/components/sections/hero-section';
import { ProductsSection } from '@/components/sections/products-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ContactSection } from '@/components/sections/contact-section';

export default function Home() {
  return (
    <>
      <HeroSection />
      <ProductsSection />
      <ServicesSection />
      <ContactSection />
    </>
  );
}
