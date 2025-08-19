
import { NextResponse, type NextRequest } from 'next/server';
import { updateSubscriberStatus, getEmailTemplates } from '@/lib/subscription-service';
import { getSettings } from '@/lib/settings-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ message: 'Email no proporcionado.' }, { status: 400 });
    }

    await updateSubscriberStatus(email, 'unsubscribed');
    
    const [settings, templates] = await Promise.all([
        getSettings(),
        getEmailTemplates()
    ]);
    const siteName = settings?.general?.displayName || 'Tu Tienda';
    const primaryColor = 'hsl(180 50% 45%)';

    const title = templates.unsubscribeTitle || "Desuscripción Exitosa";
    const description = (templates.unsubscribeDescription || "Has sido dado de baja de la lista de correo de {siteName}.\nYa no recibirás más correos nuestros.")
        .replace(/{siteName}/g, `<strong>${siteName}</strong>`)
        .replace(/\n/g, '<br/>');
    const backToSiteButtonText = templates.unsubscribeBackToSiteButton || "Volver a la página principal";
    const closeButtonText = templates.unsubscribeCloseButton || "Cerrar página";


    // Return a simple HTML page confirming unsubscription
    return new NextResponse(
      `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f4f4f4; color: #333; text-align: center;}
            .container { padding: 2rem; background-color: #fff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 90%; width: 400px; }
            h1 { color: #10b981; margin-bottom: 1rem; }
            p { margin-bottom: 1.5rem; line-height: 1.6;}
            .buttons { display: flex; flex-direction: column; gap: 0.75rem; }
            a, button { text-decoration: none; padding: 0.75rem 1rem; border-radius: 6px; border: 1px solid transparent; font-weight: 500; cursor: pointer; transition: background-color 0.2s, color 0.2s; }
            .primary { background-color: ${primaryColor}; color: white; border-color: ${primaryColor};}
            .primary:hover { filter: brightness(0.9); }
            .secondary { background-color: #e5e7eb; color: #1f2937; border-color: #d1d5db;}
            .secondary:hover { background-color: #d1d5db; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${title}</h1>
            <p>${description}</p>
            <div class="buttons">
              <a href="/" class="primary">${backToSiteButtonText}</a>
              <button onclick="window.close()" class="secondary">${closeButtonText}</button>
            </div>
          </div>
        </body>
        </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error unsubscribing:", error);
    return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Error</h1>
          <p>No se pudo procesar tu solicitud de desuscripción. Por favor, inténtalo de nuevo más tarde.</p>
        </body>
        </html>
        `,
        {
            headers: { 'Content-Type': 'text/html' },
            status: 500
        }
    );
  }
}
