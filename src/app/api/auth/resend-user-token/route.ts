
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const generateToken = () => {
    return crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
};

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'El email es requerido.' }, { status: 400 });
    }

    const pendingUserRef = doc(db, 'pendingUsers', email);
    const pendingUserDoc = await getDoc(pendingUserRef);

    if (!pendingUserDoc.exists()) {
      return NextResponse.json({ message: 'No hay registro pendiente para este email.' }, { status: 404 });
    }
    
    const data = pendingUserDoc.data();
    const newToken = generateToken();
    const newTokenExpires = Date.now() + 3600000; // 1 hour from now

    await updateDoc(pendingUserRef, {
        token: newToken,
        tokenExpires: newTokenExpires,
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
    
    const fullName = `${data.name} ${data.lastname}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Tu Nuevo Token de Verificación para QuilCatex',
      html: `
        <h1>Hola ${fullName},</h1>
        <p>Aquí tienes un nuevo token de verificación para tu cuenta en QuilCatex.</p>
        <p>Usa el siguiente token para completar tu registro. Este token es válido por 1 hora.</p>
        <h2><b>${newToken}</b></h2>
        <p>Si no solicitaste esto, puedes ignorar este correo.</p>
        <p>Saludos,<br/>El equipo de QuilCatex</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Nuevo token de verificación enviado.' });

  } catch (error: any) {
    console.error('Error en resend-user-token:', error);
    if(error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        return NextResponse.json({ message: 'Error de configuración del servidor de correo.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
