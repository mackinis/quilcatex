import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Headset, ShieldCheck } from 'lucide-react';

const services = [
  {
    icon: <Truck className="h-10 w-10 text-primary" />,
    title: 'Envío Rápido y Seguro',
    description: 'Recibe tus productos en la puerta de tu casa en tiempo récord y con la máxima seguridad.',
  },
  {
    icon: <Headset className="h-10 w-10 text-primary" />,
    title: 'Soporte 24/7',
    description: 'Nuestro equipo de atención al cliente está disponible para ayudarte en cualquier momento.',
  },
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Garantía de Calidad',
    description: 'Todos nuestros productos pasan por un riguroso control de calidad para tu tranquilidad.',
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Por Qué Elegirnos</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Ofrecemos más que solo productos. Ofrecemos una experiencia de compra excepcional.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.title} className="text-center p-6 flex flex-col items-center transition-all duration-300 hover:shadow-xl hover:border-primary">
              <CardHeader className="p-0">
                {service.icon}
                <CardTitle className="mt-4 text-xl font-semibold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2">
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
