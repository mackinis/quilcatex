
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
        // Successful admin login
        return NextResponse.json({ message: 'Inicio de sesión exitoso.', user: { fullName: adminData.fullName, email: adminData.email, isAdmin: true } });
      }
    }
    
    // 2. Check for user in 'users' collection
    const userDocRef = doc(db, 'users', email);
    const userDoc = await getDoc(userDocRef);

    if(userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user is suspended or deleted
        if (userData.status === 'suspended') {
            return NextResponse.json({ message: 'Tu cuenta ha sido suspendida. Contacta a soporte.' }, { status: 403 });
        }
        if (userData.status === 'deleted') {
            return NextResponse.json({ message: 'Credenciales incorrectas.' }, { status: 401 }); // Generic message for deleted user
        }

        // Check if user is verified
        if (!userData.verified) {
            return NextResponse.json({ message: 'Por favor, verifica tu email antes de iniciar sesión.' }, { status: 403 });
        }
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (isPasswordValid) {
            // Successful user login
            // Make sure to include fullName for consistency in session data
            return NextResponse.json({ message: 'Inicio de sesión exitoso.', user: { fullName: `${userData.name} ${userData.lastname}`, email: userData.email, isAdmin: false } });
        }
    }


    // 3. If not in 'admins' or 'users', check for provisional admin credentials
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      // This is the provisional login, signal to client to proceed with registration
      return NextResponse.json({ message: 'Credenciales provisionales correctas.', provisional: true });
    } 

    // 4. If nothing matches, fail
    return NextResponse.json({ message: 'Credenciales incorrectas.' }, { status: 401 });

  } catch (error: any) {
    console.error('Error en login:', error);
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
