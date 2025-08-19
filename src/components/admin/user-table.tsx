
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/user-service";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
}

export function UserTable({ users, isLoading }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (users.length === 0) {
    return <p className="text-center text-muted-foreground">No se encontraron usuarios registrados.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre Completo</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Fecha de Registro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.fullName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.createdAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
