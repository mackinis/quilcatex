
"use client";

import { useEffect, useState } from "react";
import { onChatSessionsSnapshot, type ChatSession, markChatAsRead, deleteChatSession } from "@/lib/chat-service";
import { AdminChatView } from "@/components/chat/admin-chat-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function ConversationsPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
    const { toast } = useToast();


    useEffect(() => {
        const unsubscribe = onChatSessionsSnapshot((newSessions) => {
            setSessions(newSessions);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId);
        const chat = sessions.find(s => s.id === chatId);
        if (chat && chat.unread) {
            markChatAsRead(chatId);
        }
    };
    
    const handleDeleteRequest = (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        setSessionToDelete(chatId);
        setIsAlertOpen(true);
    }

    const handleDeleteConfirm = async () => {
        if (!sessionToDelete) return;
        try {
            await deleteChatSession(sessionToDelete);
            toast({ title: "Éxito", description: "La conversación ha sido eliminada." });
            if (selectedChatId === sessionToDelete) {
                setSelectedChatId(null);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la conversación.' });
        } finally {
            setIsAlertOpen(false);
            setSessionToDelete(null);
        }
    }
    
    const selectedSession = sessions.find(s => s.id === selectedChatId);

    return (
      <>
        <div className="flex h-full bg-background">
            <aside className="w-1/3 border-r flex flex-col">
                <header className="p-4 border-b">
                    <h2 className="text-xl font-bold">Conversaciones</h2>
                </header>
                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                           {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                        </div>
                    ) : sessions.length === 0 ? (
                         <div className="p-4 text-center text-muted-foreground">
                            No hay conversaciones activas.
                        </div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => handleSelectChat(session.id)}
                                className={cn(
                                    "p-4 border-b cursor-pointer hover:bg-muted/50 flex flex-col relative",
                                    selectedChatId === session.id && "bg-muted"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-8">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-semibold">{session.userInfo.name}</h3>
                                            {session.unread && <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{session.lastMessage}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 absolute top-2 right-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => handleDeleteRequest(e, session.id)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <p className="text-xs text-muted-foreground text-right mt-1">
                                    {session.updatedAt ? formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true, locale: es }) : 'Recién'}
                                </p>
                            </div>
                        ))
                    )}
                </ScrollArea>
            </aside>
            <main className="flex-1 flex flex-col">
                {selectedChatId && selectedSession ? (
                    <AdminChatView chatId={selectedChatId} session={selectedSession} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <p>Selecciona una conversación para empezar a chatear.</p>
                    </div>
                )}
            </main>
        </div>
         <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente la conversación y todos sus mensajes.
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
