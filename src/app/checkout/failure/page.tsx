
"use client";

import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutFailurePage() {
    return (
        <div className="container mx-auto px-4 md:px-6 py-12 flex flex-col items-center text-center">
            <XCircle className="h-24 w-24 text-destructive mb-6" />
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Pago Rechazado</h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed mx-auto my-4">
                Lo sentimos, no se pudo procesar tu pago. Por favor, intenta con otro método de pago o contacta a tu banco.
            </p>
            <div className="flex gap-4">
                <Button asChild variant="outline">
                    <Link href="/checkout">Intentar de Nuevo</Link>
                </Button>
                 <Button asChild>
                    <Link href="/">Volver a la Tienda</Link>
                </Button>
            </div>
        </div>
    );
}
