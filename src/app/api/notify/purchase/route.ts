
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSettings } from '@/lib/settings-service';
import { formatCurrency } from '@/lib/utils';
import type { CartItem } from '@/hooks/use-cart';

interface PurchaseData {
    customerName: string;
    customerEmail: string;
    cartItems: CartItem[];
    totalPrice: number;
    orderId: string;
}

export async function POST(request: Request) {
  try {
    const { customerName, customerEmail, cartItems, totalPrice, orderId } = await request.json() as PurchaseData;

    if (!customerName || !customerEmail || !cartItems || !totalPrice || !orderId) {
      return NextResponse.json({ message: 'Faltan datos para la notificación.' }, { status: 400 });
    }

    const settings = await getSettings();
    if (!settings || !settings.emails || !settings.general) {
       return NextResponse.json({ message: 'La configuración de correos no está completa.' }, { status: 500 });
    }

    const { siteName } = settings.general;
    const { adminEmail, customerPurchase, adminPurchase } = settings.emails;

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const productListHtml = cartItems.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$ ${formatCurrency(item.price * item.quantity)}</td>
        </tr>
    `).join('');

    const productListText = cartItems.map(item => `- ${item.name} (x${item.quantity}): $ ${formatCurrency(item.price * item.quantity)}`).join('\n');
    
    const replacements = {
        '{siteName}': siteName,
        '{orderId}': orderId,
        '{customerName}': customerName,
        '{customerEmail}': customerEmail,
        '{productList}': productListText, // Use text for plain text version
        '{totalPrice}': formatCurrency(totalPrice),
    };

    const applyReplacements = (template: string) => {
        let result = template;
        for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(key, 'g'), value);
        }
        return result;
    };
    
    // Email to customer
    const customerMailOptions = {
      from: `"${siteName}" <${process.env.EMAIL_FROM}>`,
      to: customerEmail,
      subject: applyReplacements(customerPurchase.subject),
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
            ${applyReplacements(customerPurchase.body).replace('{productList}', `<table style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left;">Producto</th><th style="text-align: center;">Cantidad</th><th style="text-align: right;">Precio</th></tr></thead><tbody>${productListHtml}</tbody></table>`).replace(/\n/g, '<br>')}
        </div>
      `,
    };
    
    await transporter.sendMail(customerMailOptions);

    // Email to admin
    if (adminEmail) {
        const adminMailOptions = {
          from: `"${siteName} - Notificaciones" <${process.env.EMAIL_FROM}>`,
          to: adminEmail,
          subject: applyReplacements(adminPurchase.subject),
          html: `
             <div style="font-family: sans-serif; line-height: 1.6;">
                ${applyReplacements(adminPurchase.body).replace('{productList}', `<table style="width: 100%; border-collapse: collapse;"><thead><tr><th style="text-align: left;">Producto</th><th style="text-align: center;">Cantidad</th><th style="text-align: right;">Precio</th></tr></thead><tbody>${productListHtml}</tbody></table>`).replace(/\n/g, '<br>')}
            </div>
          `,
        };
         await transporter.sendMail(adminMailOptions);
    }
    
    return NextResponse.json({ message: 'Notificaciones enviadas.' });

  } catch (error: any) {
    console.error('Error enviando notificación:', error);
    if(error.code === 'EAUTH' || error.code === 'EENVELOPE') {
        return NextResponse.json({ message: 'Error de configuración del servidor de correo.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
