
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, ShieldCheck, Truck, BarChart, ShoppingCart, Headset, Package, BadgePercent, CreditCard, Wallet, PhoneCall, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { getSettings, type ServicesTextSettings } from "@/lib/settings-service";
import { Skeleton } from "../ui/skeleton";

const iconMap: { [key: string]: React.ElementType } = {
  ShoppingCart, Headset, BarChart, Truck, ShieldCheck, Wrench, Package, BadgePercent, CreditCard, Wallet, PhoneCall, Award
};

const defaultServices: ServicesTextSettings = {
    mainTitle: "Nuestros Servicios",
    mainDescription: "Brindando soluciones integrales para potenciar su éxito. Estamos comprometidos con la excelencia.",
    cards: [
        { icon: 'ShoppingCart', title: "Venta de Productos", description: "Ofrecemos una amplia gama de productos de alta calidad para satisfacer sus necesidades comerciales y personales." },
        { icon: 'Headset', title: "Consultoría Experta", description: "Nuestro equipo de expertos brinda servicios de consultoría a medida para ayudarlo a alcanzar sus objetivos." },
        { icon: 'BarChart', title: "Soluciones a Medida", description: "Desarrollamos soluciones personalizadas para abordar sus desafíos y requisitos únicos." },
        { icon: 'Truck', title: "Entrega Rápida", description: "Reciba sus productos de manera rápida y eficiente con nuestra red logística optimizada." },
        { icon: 'ShieldCheck', title: "Transacciones Seguras", description: "Compre con confianza sabiendo que todas sus transacciones son seguras y están protegidas." },
        { icon: 'Wrench', title: "Soporte", description: "Soporte confiable y oportuno para garantizar que sus sistemas funcionen sin problemas." },
        { icon: 'Truck', title: 'Envío Rápido y Seguro', description: 'Recibe tus productos en la puerta de tu casa en tiempo récord y con la máxima seguridad.' },
        { icon: 'Headset', title: 'Soporte 24/7', description: 'Nuestro equipo de atención al cliente está disponible para ayudarte en cualquier momento.' },
        { icon: 'ShieldCheck', title: 'Garantía de Calidad', description: 'Todos nuestros productos pasan por un riguroso control de calidad para tu tranquilidad.' },
    ]
}


export function ServicesSection() {
  const [settings, setSettings] = useState<ServicesTextSettings>(defaultServices);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getSettings();
        if (loadedSettings?.servicesTexts) {
            setSettings(loadedSettings.servicesTexts);
        }
      } catch (error) {
        console.error("Failed to load services texts settings, using defaults", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full rounded-lg" />
            ))}
        </div>
      )
    }

    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {settings.cards.map((service, index) => {
            const Icon = iconMap[service.icon];
            return (
              <Card key={index} className="text-center hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit">
                    {Icon ? <Icon className="h-8 w-8" /> : <Wrench className="h-8 w-8" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="mb-2 text-xl">{service.title}</CardTitle>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
    )
  }

  return (
    <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{settings.mainTitle}</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            {settings.mainDescription}
          </p>
        </div>
        {renderContent()}
      </div>
    </section>
  );
}
