
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getSettings } from '@/lib/settings-service';

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
        const userData = userDoc.data();
        if (userData.status !== 'deleted') {
          return NextResponse.json({ message: 'Este email ya está registrado.' }, { status: 409 });
        }
    }
    
    const pendingUsersRef = collection(db, 'pendingUsers');
    const pendingUserDocRef = doc(pendingUsersRef, email);
    const pendingUserDoc = await getDoc(pendingUserDocRef);

    if (pendingUserDoc.exists()) {
        return NextResponse.json({ message: 'Ya hay un registro pendiente para este email. Revisa tu correo.' }, { status: 409 });
    }

    const settings = await getSettings();
    const emailSettings = settings?.emails;
    const siteName = settings?.general?.siteName || 'Tu Tienda';
    const fullName = `${restOfUser.name} ${restOfUser.lastname}`;

    const token = generateToken();
    const tokenExpires = Date.now() + 3600000; // 1 hour from now

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await setDoc(pendingUserDocRef, {
        ...restOfUser,
        email,
        password: hashedPassword,
        token,
        tokenExpires,
        status: 'active' // Initial status
    });
    
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 465,
        secure: true, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const defaultSubject = `Completa tu Registro en ${siteName}`;
    const defaultBody = `Hola {fullName},\n\nGracias por registrarte en ${siteName}.\n\nUsa el siguiente token para completar tu registro. Este token es válido por 1 hora.\n\nToken: {token}\n\nSi no solicitaste este registro, puedes ignorar este correo.\n\nSaludos,\nEl equipo de ${siteName}`;
    
    const subjectTemplate = emailSettings?.userRegistration?.subject || defaultSubject;
    const bodyTemplate = emailSettings?.userRegistration?.body || defaultBody;

    const replacements = {
        '{siteName}': siteName,
        '{fullName}': fullName,
        '{email}': email,
        '{token}': token,
    };

    const applyReplacements = (template: string) => {
        let result = template;
        for (const [key, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(key, 'g'), value);
        }
        return result;
    };

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || siteName}" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: applyReplacements(subjectTemplate),
      html: applyReplacements(bodyTemplate).replace(/\n/g, '<br>'),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Token de verificación enviado.' });

  } catch (error: any) {
    console.error('Error en register-user:', error);
    if(error.code === 'EAUTH' || error.code === 'EENVELOPE') {
        return NextResponse.json({ message: 'Error de configuración del servidor de correo. Revisa las credenciales.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
