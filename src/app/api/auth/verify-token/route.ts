
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ message: 'Email y token son requeridos.' }, { status: 400 });
    }

    const pendingAdminRef = doc(db, 'pendingAdmins', email);
    const pendingAdminDoc = await getDoc(pendingAdminRef);

    if (!pendingAdminDoc.exists()) {
      return NextResponse.json({ message: 'No hay registro pendiente para este email.' }, { status: 404 });
    }

    const data = pendingAdminDoc.data();

    if (data.token !== token) {
      return NextResponse.json({ message: 'Token inválido.' }, { status: 400 });
    }

    if (Date.now() > data.tokenExpires) {
      // Don't delete immediately, allow user to resend a new token
      return NextResponse.json({ message: 'El token ha expirado. Por favor, solicita uno nuevo.' }, { status: 400 });
    }

    // Create final admin user in 'admins' collection
    await setDoc(doc(db, 'admins', email), {
        fullName: data.fullName,
        email: data.email,
        password: data.password, // Storing hashed password
        createdAt: new Date().toISOString(),
        verified: true,
    });
    
    // Clean up pending registration
    await deleteDoc(pendingAdminRef);

    return NextResponse.json({ message: 'Cuenta de administrador verificada y creada exitosamente.' });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
