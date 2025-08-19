
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getSettings } from '@/lib/settings-service';


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

    const settings = await getSettings();
    const emailSettings = settings?.emails;
    const siteName = settings?.general?.siteName || 'Tu Tienda';

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
        port: 465,
        secure: true, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const defaultSubject = `Tu Token de Verificación de Admin para ${siteName}`;
    const defaultBody = `Hola {fullName},\n\nGracias por registrarte como administrador en ${siteName}.\n\nUsa el siguiente token para completar tu registro. Este token es válido por 1 hora.\n\nToken: {token}\n\nSi no solicitaste este registro, puedes ignorar este correo.\n\nSaludos,\nEl equipo de ${siteName}`;
    
    const subjectTemplate = emailSettings?.adminRegistration?.subject || defaultSubject;
    const bodyTemplate = emailSettings?.adminRegistration?.body || defaultBody;

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
    console.error('Error en register-admin:', error);
    if(error.code === 'EAUTH' || error.code === 'EENVELOPE') {
        return NextResponse.json({ message: 'Error de configuración del servidor de correo. Revisa las credenciales.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Error interno del servidor.', error: error.message }, { status: 500 });
  }
}
