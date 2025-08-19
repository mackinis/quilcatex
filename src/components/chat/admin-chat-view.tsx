
"use client";

import { useEffect, useState, useRef } from "react";
import { onMessagesSnapshot, sendMessage, type Message, type ChatSession } from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminChatViewProps {
    chatId: string;
    session: ChatSession;
}

export function AdminChatView({ chatId, session }: AdminChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatId) {
            const unsubscribe = onMessagesSnapshot(chatId, (newMessages) => {
                setMessages(newMessages);
                setTimeout(() => scrollToBottom(), 100);
            });
            return () => unsubscribe();
        }
    }, [chatId]);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector('div');
            if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !chatId) return;

        const text = newMessage;
        setNewMessage("");
        try {
            // TODO: Get admin name from session/auth context
            await sendMessage(chatId, { text, sender: "agent", senderName: "Soporte" });
            setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            console.error("Error sending message:", error);
            setNewMessage(text);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
        }
    };

    return (
        <div className="flex flex-col h-full">
            <header className="p-4 border-b flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">{session.userInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">{session.userInfo.email}</p>
                </div>
                {/* You can add more actions here, like closing a chat */}
            </header>
            <div className="flex-grow p-0 overflow-hidden">
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.map((msg) => (
                             <div
                                key={msg.id}
                                className={`flex flex-col gap-1 ${
                                    msg.sender === "user" ? "items-start" : "items-end"
                                }`}
                            >
                                <span className="text-xs text-muted-foreground px-2">{msg.senderName}</span>
                                <div
                                    className={`flex items-end gap-2 max-w-[85%] ${ msg.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                    {msg.sender === 'user' && (
                                            <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground p-1 shrink-0 flex items-center justify-center">
                                            <UserIcon className="w-4 h-4" />
                                            </div>
                                    )}
                                    <div
                                        className={`rounded-lg px-3 py-2 text-sm ${
                                            msg.sender === "user"
                                                ? "bg-muted text-muted-foreground"
                                                : "bg-primary text-primary-foreground"
                                        }`}
                                    >
                                        <p>{msg.text}</p>
                                        <p className={`text-xs mt-1 ${
                                            msg.sender === 'user' ? 'text-right text-muted-foreground/80' : 'text-right text-primary-foreground/80'
                                            }`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <footer className="flex-shrink-0 p-4 border-t">
                 <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe una respuesta..."
                        autoComplete="off"
                    />
                    <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Enviar</span>
                    </Button>
                </form>
            </footer>
        </div>
    );
}
