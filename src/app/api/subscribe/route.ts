
import { NextResponse } from 'next/server';
import { addSubscriber, getEmailTemplates } from '@/lib/subscription-service';
import { getSettings } from '@/lib/settings-service';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const host = request.headers.get('origin') || `https://${request.headers.get('host')}`;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'Por favor, introduce un email válido.' }, { status: 400 });
    }

    const newSubscriber = await addSubscriber(email);

    if (!newSubscriber) {
        return NextResponse.json({ message: 'Este email ya está suscrito.' }, { status: 409 });
    }
    
    if(newSubscriber.status === 'active') {
        const [templates, generalSettings] = await Promise.all([
          getEmailTemplates(),
          getSettings().then(s => s?.general)
        ]);
        
        const siteName = generalSettings?.siteName || 'Tu Tienda';
        
        if (templates.welcomeEmailBody && templates.welcomeEmailSubject) {
            const { welcomeEmailSubject, welcomeEmailBody } = templates;

            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: 465,
                secure: true, 
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            
            const unsubscribeUrl = `${host}/api/subscribe/unsubscribe?email=${encodeURIComponent(email)}`;
            const finalBody = welcomeEmailBody.replace(/{siteName}/g, siteName).replace(/{unsubscribeUrl}/g, unsubscribeUrl).replace(/\n/g, '<br>');
            const finalSubject = welcomeEmailSubject.replace(/{siteName}/g, siteName);

            const mailOptions = {
                from: `"${process.env.EMAIL_FROM_NAME || siteName}" <${process.env.EMAIL_FROM}>`,
                to: email,
                subject: finalSubject,
                html: finalBody,
            };

            transporter.sendMail(mailOptions).catch(console.error);
        }
    }

    return NextResponse.json({ message: '¡Gracias por suscribirte!' });

  } catch (error: any) {
    if (error.message.includes('Ud se ha desuscrito recientemente')) {
        return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error('Error en suscripción:', error);
    if(error.code === 'EAUTH' || error.code === 'EENVELOPE') {
        return NextResponse.json({ message: 'Error de configuración del servidor de correo. Revisa las credenciales.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
