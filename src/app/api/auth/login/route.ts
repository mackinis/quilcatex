
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email y contraseña son requeridos.' }, { status: 400 });
    }

    // 1. Check for user in 'admins' collection
    const adminDocRef = doc(db, 'admins', email);
    const adminDoc = await getDoc(adminDocRef);

    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      const isPasswordValid = await bcrypt.compare(password, adminData.password);
      if (isPasswordValid) {
        return NextResponse.json({ message: 'Inicio de sesión exitoso.', user: { fullName: adminData.fullName, email: adminData.email } });
      } else {
        return NextResponse.json({ message: 'Credenciales incorrectas.' }, { status: 401 });
      }
    }

    // 2. If not in 'admins', check for provisional credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ message: 'La configuración del administrador no está disponible.' }, { status: 500 });
    }

    if (email === adminEmail && password === adminPassword) {
      // This is the provisional login, signal to client to proceed with registration
      return NextResponse.json({ message: 'Credenciales provisionales correctas.', provisional: true });
    } else {
      // If we are here, it means it's not in DB and not provisional credentials.
      return NextResponse.json({ message: 'Credenciales incorrectas.' }, { status: 401 });
    }

  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
