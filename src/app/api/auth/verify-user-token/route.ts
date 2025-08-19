
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ message: 'Email y token son requeridos.' }, { status: 400 });
    }

    const pendingUserRef = doc(db, 'pendingUsers', email);
    const pendingUserDoc = await getDoc(pendingUserRef);

    if (!pendingUserDoc.exists()) {
      return NextResponse.json({ message: 'No hay registro pendiente para este email.' }, { status: 404 });
    }

    const data = pendingUserDoc.data();

    if (data.token !== token) {
      return NextResponse.json({ message: 'Token inválido.' }, { status: 400 });
    }

    if (Date.now() > data.tokenExpires) {
      return NextResponse.json({ message: 'El token ha expirado. Por favor, solicita uno nuevo.' }, { status: 400 });
    }

    const { token: removedToken, tokenExpires: removedTokenExpires, ...userData } = data;

    // Create final user in 'users' collection
    await setDoc(doc(db, 'users', email), {
        ...userData,
        createdAt: serverTimestamp(),
        verified: true,
        status: 'active', // Ensure status is set on creation
    });
    
    // Clean up pending registration
    await deleteDoc(pendingUserRef);

    return NextResponse.json({ message: 'Cuenta de usuario verificada y creada exitosamente.' });

  } catch (error: any) {
    console.error('Error verifying user token:', error);
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
