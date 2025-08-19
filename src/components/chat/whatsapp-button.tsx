
"use client";

import { Button } from "@/components/ui/button";

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.919 6.066l-1.472 5.373 5.571-1.472z" />
    </svg>
);


interface WhatsappButtonProps {
    phoneNumber: string;
    message?: string;
    iconUrl?: string;
}

export function WhatsappButton({ phoneNumber, message, iconUrl }: WhatsappButtonProps) {
    if (!phoneNumber) return null;
    
    const whatsappLink = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message || '')}`;

    return (
        <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50"
        >
            <Button size="icon" className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg">
                {iconUrl ? (
                    <img src={iconUrl} alt="WhatsApp" className="w-8 h-8 object-cover rounded-full" />
                ) : (
                    <WhatsAppIcon className="w-8 h-8" />
                )}
                 <span className="sr-only">Contactar por WhatsApp</span>
            </Button>
        </a>
    );
}
