
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const generateToken = () => {
    return crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
};

export async function POST(request: Request) {
  try {
    const { email, password, ...restOfUser } = await request.json();

    if (!email || !password || !restOfUser.name || !restOfUser.lastname) {
      return NextResponse.json({ message: 'Nombre, apellido, email y contraseña son requeridos.' }, { status: 400 });
    }
    
    const usersRef = collection(db, 'users');
    const userDocRef = doc(usersRef, email);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
        return NextResponse.json({ message: 'Este email ya está registrado.' }, { status: 409 });
    }
    
    const pendingUsersRef = collection(db, 'pendingUsers');
    const pendingUserDocRef = doc(pendingUsersRef, email);
    const pendingUserDoc = await getDoc(pendingUserDocRef);

    if (pendingUserDoc.exists()) {
        return NextResponse.json({ message: 'Ya hay un registro pendiente para este email. Revisa tu correo.' }, { status: 409 });
    }

    const token = generateToken();
    const tokenExpires = Date.now() + 3600000; // 1 hour from now

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await setDoc(pendingUserDocRef, {
        ...restOfUser,
        email,
        password: hashedPassword,
        token,
        tokenExpires,
    });
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: (process.env.EMAIL_PORT === '465'), 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const fullName = `${restOfUser.name} ${restOfUser.lastname}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Completa tu Registro en QuilCatex',
      html: `
        <h1>Hola ${fullName},</h1>
        <p>Gracias por registrarte en QuilCatex.</p>
        <p>Usa el siguiente token para completar tu registro. Este token es válido por 1 hora.</p>
        <h2><b>${token}</b></h2>
        <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
        <p>Saludos,<br/>El equipo de QuilCatex</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Token de verificación enviado.' });

  } catch (error: any) {
    console.error('Error en register-user:', error);
    if(error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        return NextResponse.json({ message: 'Error de configuración del servidor de correo.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
