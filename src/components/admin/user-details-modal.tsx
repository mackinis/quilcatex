
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User } from "@/lib/user-service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { useState } from "react";
import { updateUserRole } from "@/lib/user-service";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/roles-service";

interface UserDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUserUpdate: () => void;
  user: User | null;
  roles: Role[];
}

const DetailRow = ({ label, value }: { label: string, value: string | undefined }) => (
    <div className="flex justify-between border-b py-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-sm text-right">{value || '-'}</p>
    </div>
)

export function UserDetailsModal({ isOpen, onOpenChange, user, roles, onUserUpdate }: UserDetailsModalProps) {
  const [selectedRole, setSelectedRole] = useState(user?.role || "user");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  if (!user) return null;

  const handleRoleChange = async () => {
    setIsSaving(true);
    try {
        await updateUserRole(user.id, selectedRole);
        toast({ title: "Éxito", description: "El rol del usuario ha sido actualizado."});
        onUserUpdate();
        onOpenChange(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el rol del usuario." });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalles de Usuario</DialogTitle>
          <DialogDescription>
            Información completa del usuario seleccionado.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-96">
            <div className="space-y-2 pr-4">
                <DetailRow label="Nombre" value={user.name} />
                <DetailRow label="Apellido" value={user.lastname} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Teléfono" value={user.phone} />
                <DetailRow label="Dirección" value={user.address} />
                <DetailRow label="Código Postal" value={user.zipCode} />
                <DetailRow label="Ciudad" value={user.city} />
                <DetailRow label="Provincia" value={user.province} />
                <DetailRow label="País" value={user.country} />
                <DetailRow label="Fecha de Registro" value={user.createdAt} />
                <DetailRow label="Estado" value={user.status} />

                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="role-select">Rol</Label>
                    <Select onValueChange={setSelectedRole} defaultValue={selectedRole}>
                        <SelectTrigger id="role-select">
                            <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">Usuario</SelectItem>
                            {roles.map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-between">
           <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" onClick={handleRoleChange} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar Rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
