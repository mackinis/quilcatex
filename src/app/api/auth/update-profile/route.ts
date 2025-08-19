
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { updateUser, type UpdatableUser } from '@/lib/user-service';

export async function POST(request: Request) {
  try {
    const { email, ...userData } = await request.json() as UpdatableUser & { email: string };

    if (!email) {
      return NextResponse.json({ message: 'El email es requerido para identificar al usuario.' }, { status: 400 });
    }
    
    // The password field is optional
    if (userData.password && userData.password.length < 8) {
      return NextResponse.json({ message: 'La nueva contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
    }

    await updateUser(email, userData);

    return NextResponse.json({ message: 'Perfil actualizado correctamente.' });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
