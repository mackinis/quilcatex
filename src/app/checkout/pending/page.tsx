
"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CheckoutPendingPage() {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col items-center text-center">
            <AlertTriangle className="h-24 w-24 text-amber-500 mb-6" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Pago Pendiente</h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed mx-auto my-4">
                Tu pago está pendiente de aprobación. Te notificaremos por correo electrónico una vez que se complete el proceso.
            </p>
            <Button asChild>
                <Link href="/">Volver a la Tienda</Link>
            </Button>
        </div>
    );
}
