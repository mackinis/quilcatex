
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
        return NextResponse.json({ message: 'La configuración del administrador no está disponible.' }, { status: 500 });
    }

    if (email === adminEmail && password === adminPassword) {
      return NextResponse.json({ message: 'Autenticación provisional exitosa.' });
    } else {
      return NextResponse.json({ message: 'Credenciales provisionales incorrectas.' }, { status: 401 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}
