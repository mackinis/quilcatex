
"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { addRole, updateRole, type Role, PERMISSIONS, PermissionKeys } from "@/lib/roles-service";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";

const permissionsSchema = z.object(
  Object.keys(PERMISSIONS).reduce((acc, key) => {
    acc[key as PermissionKeys] = z.boolean().optional();
    return acc;
  }, {} as Record<PermissionKeys, z.ZodOptional<z.ZodBoolean>>)
);

const formSchema = z.object({
  name: z.string().min(2, "El nombre del rol debe tener al menos 2 caracteres."),
  permissions: permissionsSchema,
});

type RoleFormData = z.infer<typeof formSchema>;

interface RoleModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onRoleSaved: (role: Role) => void;
  roleToEdit: Role | null;
}

export function RoleModal({ isOpen, onOpenChange, onRoleSaved, roleToEdit }: RoleModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!roleToEdit;

  const form = useForm<RoleFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: "",
        permissions: {},
    },
  });

  useEffect(() => {
    if (roleToEdit && isOpen) {
        form.reset({
            name: roleToEdit.name,
            permissions: roleToEdit.permissions,
        });
    } else if (!isOpen) {
        form.reset({
            name: "",
            permissions: {},
        });
    }
  }, [roleToEdit, isOpen, form]);

  const onSubmit = async (values: RoleFormData) => {
    setIsLoading(true);
    try {
      let savedRole: Role;
      const dataToSave = { ...values };
      
      if (isEditMode && roleToEdit?.id) {
          await updateRole(roleToEdit.id, dataToSave as Partial<Role>);
          savedRole = { ...roleToEdit, ...dataToSave };
      } else {
          savedRole = await addRole(dataToSave as Omit<Role, 'id' | 'createdAt'>);
      }
      toast({ title: "Éxito", description: `El rol ha sido ${isEditMode ? 'actualizado' : 'creado'}.` });
      onRoleSaved(savedRole);
      onOpenChange(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: `No se pudo ${isEditMode ? 'actualizar' : 'crear'} el rol.` });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Rol" : "Crear Nuevo Rol"}</DialogTitle>
          <DialogDescription>Asigna un nombre y selecciona los permisos para este rol.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Rol</FormLabel>
                      <FormControl><Input placeholder="Ej: Manager" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2 pt-4 border-t">
                    <FormLabel>Permisos del Panel</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(PERMISSIONS).map(([key, label]) => (
                             <FormField
                                key={key}
                                control={form.control}
                                name={`permissions.${key as PermissionKeys}`}
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                    <FormLabel>{label}</FormLabel>
                                    </div>
                                </FormItem>
                                )}
                            />
                        ))}
                    </div>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="pt-4 border-t">
                 <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? "Guardando..." : (isEditMode ? "Guardar Cambios" : "Crear Rol")}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
