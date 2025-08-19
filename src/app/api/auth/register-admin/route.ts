
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const generateToken = () => {
    // A more secure and URL-friendly token
    return crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
};


export async function POST(request: Request) {
  try {
    const { fullName, email, password } = await request.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: 'Todos los campos son requeridos.' }, { status: 400 });
    }
    
    // Check if an admin already exists
    const adminDocRef = doc(db, 'admins', email);
    const adminDoc = await getDoc(adminDocRef);

    if (adminDoc.exists() && adminDoc.data().verified) {
        return NextResponse.json({ message: 'Un administrador ya ha sido registrado y verificado.' }, { status: 409 });
    }

    const token = generateToken();
    const tokenExpires = Date.now() + 3600000; // 1 hour from now

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await setDoc(doc(db, "pendingAdmins", email), {
        fullName,
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

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Tu Token de Verificación para QuilCatex',
      html: `
        <h1>Hola ${fullName},</h1>
        <p>Gracias por registrarte como administrador en QuilCatex.</p>
        <p>Usa el siguiente token para completar tu registro. Este token es válido por 1 hora.</p>
        <h2><b>${token}</b></h2>
        <p>Si no solicitaste este registro, puedes ignorar este correo.</p>
        <p>Saludos,<br/>El equipo de QuilCatex</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Token de verificación enviado.' });

  } catch (error: any) {
    console.error('Error en register-admin:', error);
    if(error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        return NextResponse.json({ message: 'Error de configuración del servidor de correo.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
