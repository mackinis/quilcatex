
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers, updateUserStatus, deleteUser, type User } from "@/lib/user-service";
import { UserTable } from "@/components/admin/user-table";
import { UserDetailsModal } from "@/components/admin/user-details-modal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getRoles, type Role } from "@/lib/roles-service";

type AlertAction = 'suspend' | 'activate' | 'delete';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertAction, setAlertAction] = useState<AlertAction | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedUsers, fetchedRoles] = await Promise.all([getUsers(), getRoles()]);
      setUsers(fetchedUsers);
      setRoles(fetchedRoles);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la lista de usuarios o roles." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleActionRequest = (user: User, action: AlertAction) => {
    setSelectedUser(user);
    setAlertAction(action);
    setIsAlertOpen(true);
  };
  
  const handleUserUpdate = () => {
    fetchData(); // Refetch all data when a user is updated
  }

  const handleConfirmAction = async () => {
    if (!selectedUser || !alertAction) return;

    try {
      if (alertAction === 'delete') {
        await deleteUser(selectedUser.id);
        toast({ title: "Éxito", description: "El usuario ha sido eliminado." });
      } else {
        const newStatus = alertAction === 'suspend' ? 'suspended' : 'active';
        await updateUserStatus(selectedUser.id, newStatus);
        toast({ title: "Éxito", description: `El usuario ha sido ${newStatus === 'suspended' ? 'suspendido' : 'reactivado'}.` });
      }
      fetchData(); // Refresh the list
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `No se pudo completar la acción.` });
    } finally {
      setIsAlertOpen(false);
      setSelectedUser(null);
      setAlertAction(null);
    }
  };

  const getAlertContent = () => {
    if (!alertAction || !selectedUser) return { title: '', description: '' };
    switch (alertAction) {
        case 'delete':
            return { title: '¿Estás seguro?', description: `Esta acción marcará al usuario ${selectedUser.fullName} como eliminado. No podrá iniciar sesión y sus datos no serán visibles.` };
        case 'suspend':
            return { title: '¿Suspender Usuario?', description: `¿Estás seguro de que quieres suspender a ${selectedUser.fullName}? No podrá iniciar sesión hasta que sea reactivado.` };
        case 'activate':
            return { title: '¿Reactivar Usuario?', description: `¿Estás seguro de que quieres reactivar a ${selectedUser.fullName}? Podrá volver a iniciar sesión.` };
    }
  };

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Administra los usuarios registrados en tu tienda.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable 
              users={users} 
              isLoading={isLoading} 
              onViewDetails={handleViewDetails}
              onAction={handleActionRequest}
            />
          </CardContent>
        </Card>
      </div>
      
      <UserDetailsModal
        user={selectedUser}
        roles={roles}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUserUpdate={handleUserUpdate}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getAlertContent().title}</AlertDialogTitle>
            <AlertDialogDescription>{getAlertContent().description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
