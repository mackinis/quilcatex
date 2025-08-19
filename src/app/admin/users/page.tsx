
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUsers, type User } from "@/lib/user-service";
import { UserTable } from "@/components/admin/user-table";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la lista de usuarios.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [toast]);

  return (
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
           <UserTable users={users} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
