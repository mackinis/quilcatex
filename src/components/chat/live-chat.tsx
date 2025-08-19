
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, X, User as UserIcon } from "lucide-react";
import { createChatSession, sendMessage, onMessagesSnapshot, type Message, markChatAsRead, getChatSession } from "@/lib/chat-service";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { LiveChatConfig } from "@/lib/settings-service";
import { onSettingsSnapshot } from "@/lib/settings-service";
import { cn } from "@/lib/utils";

const LiveChatIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <MessageSquare {...props} />
);

const UserInfoSchema = z.object({
    name: z.string().min(2, { message: "El nombre es requerido." }),
    email: z.string().email({ message: "Email inválido." }).optional().or(z.literal('')),
    phone: z.string().optional(),
});

type UserInfo = z.infer<typeof UserInfoSchema>;


interface LiveChatProps {
    config: LiveChatConfig;
}

const checkIsOnline = (config: LiveChatConfig): boolean => {
    if (config.forceOnline) return true;
    if (!config.schedule) return true; // Default to online if no schedule is set

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to match our array (Mon=0)
    const todaySchedule = config.schedule[todayIndex];

    if (!todaySchedule || !todaySchedule.enabled) {
        return false;
    }

    return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close;
};


export function LiveChat({ config: initialConfig }: LiveChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatId, setChatId] = useState<string | null>(null);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [currentUser, setCurrentUser] = useState<{name: string} | null>(null);
    const [hasUnread, setHasUnread] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [config, setConfig] = useState<LiveChatConfig>(initialConfig);

    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const form = useForm<UserInfo>({ 
        resolver: zodResolver(UserInfoSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
        }
    });
    
    useEffect(() => {
        const unsubscribe = onSettingsSnapshot((settings) => {
            if (settings?.chat?.liveChat) {
                setConfig(settings.chat.liveChat);
                document.documentElement.style.setProperty('--chat-user-bubble', settings.chat.liveChat.userBubbleColor || 'hsl(var(--primary))');
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setIsOnline(checkIsOnline(config));
        const interval = setInterval(() => {
             setIsOnline(checkIsOnline(config));
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [config]);


    useEffect(() => {
        const storedChatId = localStorage.getItem("liveChatId");
        if (storedChatId) {
            getChatSession(storedChatId).then(session => {
                if (session) {
                    const storedUserInfo = localStorage.getItem("liveChatUser");
                    if(storedUserInfo) {
                        setCurrentUser(JSON.parse(storedUserInfo));
                    }
                    setChatId(storedChatId);
                    setHasUnread(session.unread);
                } else {
                    // Chat was deleted by admin, clean up local storage
                    localStorage.removeItem("liveChatId");
                    localStorage.removeItem("liveChatUser");
                    setChatId(null);
                    setCurrentUser(null);
                }
            });
        }
    }, []);

    useEffect(() => {
        if (chatId) {
            const unsubscribe = onMessagesSnapshot(chatId, (newMessages) => {
                setMessages(newMessages);
                const isAdmin = sessionStorage.getItem('admin-session')
                if (!isAdmin) {
                    getChatSession(chatId).then(session => {
                        if (session) setHasUnread(session.unread);
                    });
                }
                setTimeout(() => scrollToBottom(), 100);
            });
            return () => unsubscribe();
        }
    }, [chatId]);

    const handleToggleChat = (open: boolean) => {
        setIsOpen(open);
        if (open && chatId) {
            const isAdmin = sessionStorage.getItem('admin-session');
            if (!isAdmin && hasUnread) {
                markChatAsRead(chatId);
                setHasUnread(false);
            }
        }
    }


     const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector('div');
            if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }
        }
    };


    const handleStartChat = async (data: UserInfo) => {
        setIsStartingSession(true);
        try {
            const initialMessage = isOnline 
                ? config.welcomeMessage || "¡Hola {name}! Gracias por contactarnos. Un agente te atenderá en breve."
                : config.offlineMessage || "Estamos fuera de línea. Déjanos un mensaje y te responderemos pronto.";
            
            const assistantName = config.assistantName || "Soporte";
            
            const newChatId = await createChatSession({
                name: data.name,
                email: data.email,
                phone: data.phone,
            }, initialMessage, assistantName);
            
            const userInfo = { name: data.name };
            setCurrentUser(userInfo);
            setChatId(newChatId);
            localStorage.setItem("liveChatId", newChatId);
            localStorage.setItem("liveChatUser", JSON.stringify(userInfo));

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar el chat. Inténtalo de nuevo.' });
            console.error("Error starting chat session:", error);
        } finally {
            setIsStartingSession(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !chatId || !currentUser) return;

        // Check if chat session still exists before sending
        const sessionExists = await getChatSession(chatId);
        if (!sessionExists) {
            toast({ variant: 'destructive', title: 'Chat finalizado', description: 'Esta conversación fue finalizada por un administrador. Inicia una nueva.' });
            localStorage.removeItem("liveChatId");
            localStorage.removeItem("liveChatUser");
            setChatId(null);
            setCurrentUser(null);
            setNewMessage("");
            return;
        }

        const text = newMessage;
        setNewMessage("");
        try {
            await sendMessage(chatId, { text, sender: "user", senderName: currentUser.name });
             setTimeout(() => scrollToBottom(), 100);
        } catch (error) {
            console.error("Error sending message:", error);
            setNewMessage(text);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
        }
    };

    const renderChatContent = () => {
        if (!chatId) {
            if(!config.requestUserInfo) {
                 handleStartChat({ name: "Invitado" });
                 return <CardContent><p>Iniciando chat...</p></CardContent>;
            }
            return (
                 <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleStartChat)} className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                { isOnline ? 'Para comenzar, déjanos tus datos.' : 'Déjanos tu mensaje y te contactaremos a la brevedad.'}
                            </p>
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Nombre *</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                             <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input placeholder="Tu teléfono" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <Button type="submit" disabled={isStartingSession} className="w-full">
                                {isStartingSession ? 'Iniciando...' : 'Iniciar Chat'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            );
        }

        return (
            <>
                <CardContent className="flex-grow p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col gap-1 ${
                                        msg.sender === "agent" ? "items-start" : "items-end"
                                    }`}
                                >
                                     <span className="text-xs text-muted-foreground px-2">{msg.senderName}</span>
                                    <div
                                        className={`flex items-end gap-2 max-w-[85%] ${ msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                                    >
                                        {msg.sender === 'agent' && (
                                             <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground p-1 shrink-0 flex items-center justify-center">
                                                <UserIcon className="w-4 h-4" />
                                             </div>
                                        )}
                                        <div
                                            className={`rounded-lg px-3 py-2 text-sm ${
                                                msg.sender === "agent"
                                                    ? "bg-muted text-muted-foreground"
                                                    : "bg-chat-user-bubble text-primary-foreground"
                                            }`}
                                        >
                                            <p>{msg.text}</p>
                                            <p className={`text-xs mt-1 ${
                                                msg.sender === 'agent' ? 'text-right text-muted-foreground/80' : 'text-right text-primary-foreground/80'
                                                }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex-shrink-0 pt-4 border-t">
                    <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                            placeholder="Escribe un mensaje..."
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Enviar</span>
                        </Button>
                    </form>
                </CardFooter>
            </>
        );
    };
    
    const Icon = () => config.iconUrl 
        ? <img src={config.iconUrl} alt="Live Chat" className="w-8 h-8"/>
        : <LiveChatIcon className="w-8 h-8" />;

    return (
        <>
            <div className="fixed bottom-6 left-6 z-50">
                 <div className="relative">
                    <Button 
                        size="icon" 
                        className="w-14 h-14 rounded-full shadow-lg" 
                        onClick={() => handleToggleChat(!isOpen)}
                        aria-label="Abrir chat en vivo"
                    >
                        {isOpen ? <X className="w-8 h-8" /> : <Icon />}
                    </Button>
                    {hasUnread && !isOpen && (
                        <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white" style={{backgroundColor: config.notificationColor || '#16A34A'}} />
                    )}
                 </div>
            </div>

            {isOpen && (
                <div className="fixed bottom-24 left-6 z-50">
                    <Card className={cn(
                        "w-80 h-[32rem] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
                         isInputFocused ? "sm:transform-none -translate-y-24" : ""
                    )}>
                        <CardHeader className="flex-shrink-0 flex flex-row justify-between items-center border-b">
                            <div className="space-y-1">
                                <CardTitle className="text-base">{config.chatTitle || 'Chat de Soporte'}</CardTitle>
                                <CardDescription className="text-xs">
                                    {isOnline 
                                        ? `Online: ${config.assistantName}`
                                        : 'Fuera de línea'}
                                </CardDescription>
                            </div>
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleChat(false)}>
                                <X className="h-4 w-4" />
                                <span className="sr-only">Cerrar chat</span>
                            </Button>
                        </CardHeader>
                       {renderChatContent()}
                    </Card>
                </div>
            )}
        </>
    );
}
