
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getRoles, deleteRole, type Role } from "@/lib/roles-service";
import { RoleTable } from "@/components/admin/role-table";
import { RoleModal } from "@/components/admin/role-modal";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los roles.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (role: Role | null = null) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleRoleSaved = (savedRole: Role) => {
    const isNew = !roles.some(r => r.id === savedRole.id);
    if (isNew) {
      setRoles(prev => [savedRole, ...prev]);
    } else {
      setRoles(prev => 
        prev.map(r => r.id === savedRole.id ? savedRole : r)
      );
    }
  };
  
  const handleDeleteRequest = (roleId: string) => {
    setRoleToDelete(roleId);
    setIsAlertOpen(true);
  }

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
        await deleteRole(roleToDelete);
        setRoles(prev => prev.filter(r => r.id !== roleToDelete));
        toast({ title: "Éxito", description: "El rol ha sido eliminado." });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el rol.' });
    } finally {
        setIsAlertOpen(false);
        setRoleToDelete(null);
    }
  }

  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Roles y Permisos</h2>
          <Button onClick={() => handleOpenModal()}><PlusCircle className="mr-2 h-4 w-4" /> Crear Rol</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Roles</CardTitle>
            <CardDescription>Crea roles para asignar permisos específicos a los usuarios del panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <RoleTable roles={roles} isLoading={isLoading} onEdit={handleOpenModal} onDelete={handleDeleteRequest}/>
          </CardContent>
        </Card>
        <RoleModal 
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onRoleSaved={handleRoleSaved}
          roleToEdit={editingRole}
        />
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el rol. Los usuarios con este rol perderán sus permisos.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
