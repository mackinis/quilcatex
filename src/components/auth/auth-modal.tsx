
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LoginForm } from './login-form';
import { AdminRegistrationForm } from './admin-registration-form';
import { TokenVerificationForm } from './token-verification-form';
import { UserRegistrationForm } from './user-registration-form';
import { UserTokenVerificationForm } from './user-token-verification-form';
import { Button } from '@/components/ui/button';

type AuthModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialStep?: 'login' | 'register';
};

export type AdminData = {
  fullName: string;
  email: string;
};

export type UserData = {
  email: string;
};

export function AuthModal({ isOpen, onOpenChange, initialStep = 'login' }: AuthModalProps) {
  const [step, setStep] = useState(initialStep);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  const handleLoginSuccess = () => {
      onOpenChange(false);
      // You might want to redirect the user or update the UI state here
  };

  const handleProvisionalSuccess = () => {
    setStep('adminRegistration');
  };

  const handleAdminRegistrationSuccess = (data: AdminData) => {
    setAdminData(data);
    setStep('tokenVerification');
  };
  
  const handleUserRegistrationSuccess = (data: UserData) => {
    setUserData(data);
    setStep('userTokenVerification');
  };
  
  const handleTokenVerified = () => {
    setStep('login');
    setAdminData(null);
    setUserData(null);
    // You might want to automatically close the modal or show a success message before that
  };

  const resetToLogin = () => {
    setStep('login');
    setAdminData(null);
    setUserData(null);
  }

  const renderStep = () => {
    switch (step) {
      case 'login':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Iniciar Sesión</DialogTitle>
              <DialogDescription>
                Accede a tu cuenta.
              </DialogDescription>
            </DialogHeader>
            <LoginForm onSuccess={handleLoginSuccess} onProvisionalSuccess={handleProvisionalSuccess} />
            <div className="mt-4 text-center text-sm">
                ¿No tienes una cuenta?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => setStep('register')}>
                    Regístrate aquí
                </Button>
            </div>
          </>
        );
       case 'register':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Crear una Cuenta</DialogTitle>
              <DialogDescription>
                Completa tus datos para registrarte en nuestra tienda.
              </DialogDescription>
            </DialogHeader>
            <UserRegistrationForm onSuccess={handleUserRegistrationSuccess} />
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{" "}
              <Button variant="link" className="p-0 h-auto" onClick={resetToLogin}>
                Inicia sesión
              </Button>
            </div>
             <div className="mt-2 text-center text-sm">
                ¿Eres administrador?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={handleProvisionalSuccess}>
                    Registra tu cuenta de administrador
                </Button>
            </div>
          </>
        );
      case 'adminRegistration':
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Registro de Administrador</DialogTitle>
                    <DialogDescription>
                        Completa tus datos para crear tu cuenta de administrador definitiva.
                    </DialogDescription>
                </DialogHeader>
                <AdminRegistrationForm onSuccess={handleAdminRegistrationSuccess} />
                 <div className="mt-4 text-center text-sm">
                    ¿Ya tienes una cuenta?{" "}
                    <Button variant="link" className="p-0 h-auto" onClick={resetToLogin}>
                        Inicia sesión
                    </Button>
                </div>
            </>
        );
      case 'tokenVerification':
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Verificación de Token</DialogTitle>
                    <DialogDescription>
                        Introduce el token que hemos enviado a tu correo electrónico de administrador.
                    </DialogDescription>
                </DialogHeader>
                <TokenVerificationForm adminData={adminData!} onTokenVerified={handleTokenVerified} />
            </>
        );
      case 'userTokenVerification':
        return (
            <>
                <DialogHeader>
                    <DialogTitle>Verifica tu Cuenta</DialogTitle>
                    <DialogDescription>
                        Introduce el token que hemos enviado a tu correo electrónico para completar el registro.
                    </DialogDescription>
                </DialogHeader>
                <UserTokenVerificationForm userData={userData!} onTokenVerified={handleTokenVerified} />
            </>
        )
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            resetToLogin();
        }
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
