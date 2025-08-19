
"use client";

import { useEffect, useState } from "react";
import { onChatSessionsSnapshot, type ChatSession, markChatAsRead } from "@/lib/chat-service";
import { AdminChatView } from "@/components/chat/admin-chat-view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationsPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onChatSessionsSnapshot((newSessions) => {
            setSessions(newSessions);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSelectChat = (chatId: string) => {
        setSelectedChatId(chatId);
        // Mark chat as read when admin opens it
        const chat = sessions.find(s => s.id === chatId);
        if (chat && chat.unread) {
            markChatAsRead(chatId);
        }
    };
    
    const selectedSession = sessions.find(s => s.id === selectedChatId);

    return (
        <div className="flex h-[calc(100vh-3.5rem)] bg-background">
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
                                    "p-4 border-b cursor-pointer hover:bg-muted/50",
                                    selectedChatId === session.id && "bg-muted"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold">{session.userInfo.name}</h3>
                                    {session.unread && <span className="w-2.5 h-2.5 bg-primary rounded-full"></span>}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{session.lastMessage}</p>
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
    );
}
