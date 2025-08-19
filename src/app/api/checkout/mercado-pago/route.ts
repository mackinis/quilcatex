
import { NextResponse, NextRequest } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import type { CartItem } from '@/hooks/use-cart.tsx';
import type { PreferenceItem } from 'mercadopago/dist/clients/preference/common-types';

export async function POST(request: NextRequest) {
    
    const items = await request.json() as CartItem[];
    const host = request.headers.get('origin') || `https://${request.headers.get('host')}`;

    if (!items || items.length === 0) {
        return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
        console.error("Mercado Pago keys are not set in environment variables.");
        return NextResponse.json({ error: 'La configuración del servidor de pagos no está completa. Contacta al administrador.' }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ 
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
        options: { timeout: 5000 }
    });
    
    const preferenceItems: PreferenceItem[] = items
        .filter(item => item.id && typeof item.quantity === 'number' && typeof item.price === 'number') // Ensure items are valid
        .map(item => ({
            id: String(item.id),
            title: item.name,
            quantity: Number(item.quantity),
            unit_price: Number(item.price),
            currency_id: 'ARS',
            picture_url: item.imageUrl,
            description: item.description,
        }));

    if (preferenceItems.length === 0) {
        return NextResponse.json({ error: 'No hay artículos válidos en el carrito.' }, { status: 400 });
    }

    try {
        const preference = new Preference(client);
        const result = await preference.create({
            body: {
                items: preferenceItems,
                back_urls: {
                    success: `${host}/checkout/success`,
                    failure: `${host}/checkout/failure`,
                    pending: `${host}/checkout/pending`,
                },
                auto_return: 'approved',
            }
        });

        return NextResponse.json({ preferenceId: result.id });

    } catch (error: any) {
        console.error('Error al crear preferencia de Mercado Pago:', error);
        return NextResponse.json({ error: 'Error al generar la preferencia de pago.', details: error.message }, { status: 500 });
    }
}
