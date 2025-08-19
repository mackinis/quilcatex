
import { NextResponse } from 'next/server';
import { getEmailTemplates, getSubscribers } from '@/lib/subscription-service';
import { getSettings } from '@/lib/settings-service';
import nodemailer from 'nodemailer';


async function sendNewsletter(host: string): Promise<{ success: boolean; message: string; recipientCount?: number }> {
    try {
        const [templates, allSubscribers, generalSettings] = await Promise.all([
            getEmailTemplates(),
            getSubscribers(),
            getSettings().then(s => s?.general)
        ]);
        
        if (!templates.newsletterEmailBody || !templates.newsletterEmailSubject) {
            return { success: false, message: "La plantilla del newsletter no está configurada." };
        }

        const activeSubscribers = allSubscribers.filter(s => s.status === 'active');
        if (activeSubscribers.length === 0) {
            return { success: false, message: "No hay suscriptores activos para enviar." };
        }

        const siteName = generalSettings?.siteName || 'Tu Tienda';
        const fromEmail = process.env.EMAIL_FROM;
        const fromName = process.env.EMAIL_FROM_NAME || siteName;

        if (!fromEmail) {
            throw new Error("La variable de entorno EMAIL_FROM no está configurada.");
        }
        
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: 465,
            secure: true, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const sendPromises = activeSubscribers.map(subscriber => {
            const unsubscribeUrl = `${host}/api/subscribe/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
            const finalBody = templates.newsletterEmailBody
                .replace(/{siteName}/g, siteName)
                .replace(/{unsubscribeUrl}/g, unsubscribeUrl)
                .replace(/\n/g, '<br>');
            const finalSubject = templates.newsletterEmailSubject.replace(/{siteName}/g, siteName);

            const mailOptions = {
                from: `"${fromName}" <${fromEmail}>`,
                to: subscriber.email,
                subject: finalSubject,
                html: finalBody,
            };
            return transporter.sendMail(mailOptions);
        });

        await Promise.all(sendPromises);

        return { 
            success: true, 
            message: `Newsletter enviado a ${activeSubscribers.length} suscriptores.`, 
            recipientCount: activeSubscribers.length 
        };

    } catch (error: any) {
        console.error('Error enviando newsletter:', error);
        return { success: false, message: 'Error interno del servidor.' };
    }
};

export async function POST(request: Request) {
    try {
        const { host } = await request.json();
        if (!host) {
             return NextResponse.json({ message: "El host es requerido." }, { status: 400 });
        }
        
        const result = await sendNewsletter(host);
        
        if (result.success) {
            return NextResponse.json({ message: result.message, recipientCount: result.recipientCount });
        } else {
            return NextResponse.json({ message: result.message }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error en el endpoint send-newsletter:', error);
        return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
}
