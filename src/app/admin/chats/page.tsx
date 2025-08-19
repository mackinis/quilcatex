
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings, type ChatSettings, type Schedule } from "@/lib/settings-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

const scheduleEntrySchema = z.object({
  day: z.string(),
  enabled: z.boolean(),
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato HH:MM" }),
  close: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato HH:MM" }),
});

const whatsappSchema = z.object({
  whatsappEnabled: z.boolean(),
  whatsappNumber: z.string().optional(),
  whatsappMessage: z.string().optional(),
  whatsappIconUrl: z.string().url().optional().or(z.literal('')),
  buttonColor: z.string().optional(),
});

const liveChatSchema = z.object({
  liveChatEnabled: z.boolean(),
  chatTitle: z.string().optional(),
  assistantName: z.string().optional(),
  welcomeMessage: z.string().optional(),
  offlineMessage: z.string().optional(),
  forceOnline: z.boolean(),
  requestUserInfo: z.boolean(),
  liveChatIconUrl: z.string().url().optional().or(z.literal('')),
  notificationColor: z.string().optional(),
  userBubbleColor: z.string().optional(),
  schedule: z.array(scheduleEntrySchema).optional(),
});

type WhatsappFormData = z.infer<typeof whatsappSchema>;
type LiveChatFormData = z.infer<typeof liveChatSchema>;

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function ChatsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);
  const [isSavingLiveChat, setIsSavingLiveChat] = useState(false);

  const whatsappForm = useForm<WhatsappFormData>({
    resolver: zodResolver(whatsappSchema),
    defaultValues: {
      whatsappEnabled: true,
      whatsappNumber: "",
      whatsappMessage: "",
      whatsappIconUrl: "",
      buttonColor: "#25D366",
    },
  });

  const liveChatForm = useForm<LiveChatFormData>({
    resolver: zodResolver(liveChatSchema),
     defaultValues: {
      liveChatEnabled: true,
      chatTitle: "Chat de Soporte",
      assistantName: "Soporte",
      welcomeMessage: "¡Hola! Gracias por contactarnos. Un agente te atenderá en breve.",
      offlineMessage: "Estamos fuera de línea. Déjanos un mensaje y te responderemos pronto.",
      forceOnline: false,
      requestUserInfo: true,
      liveChatIconUrl: "",
      notificationColor: "#16A34A",
      userBubbleColor: "",
      schedule: daysOfWeek.map(day => ({ day, enabled: true, open: '09:00', close: '18:00' })),
    },
  });

   const { fields, update } = useFieldArray({
    control: liveChatForm.control,
    name: "schedule",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        if (settings && settings.chat) {
          const { whatsapp, liveChat } = settings.chat;
          if (whatsapp) {
            whatsappForm.reset({
                whatsappEnabled: whatsapp.enabled,
                whatsappNumber: whatsapp.phoneNumber,
                whatsappMessage: whatsapp.predefinedMessage,
                whatsappIconUrl: whatsapp.iconUrl,
                buttonColor: whatsapp.buttonColor || "#25D366",
            });
          }
          if (liveChat) {
             const schedule = daysOfWeek.map(day => {
              const existingDay = liveChat.schedule?.find(s => s.day === day);
              return existingDay || { day, enabled: false, open: '09:00', close: '18:00' };
            });

            liveChatForm.reset({
                liveChatEnabled: liveChat.enabled,
                chatTitle: liveChat.chatTitle,
                assistantName: liveChat.assistantName,
                welcomeMessage: liveChat.welcomeMessage,
                offlineMessage: liveChat.offlineMessage || "Estamos fuera de línea. Déjanos un mensaje y te responderemos pronto.",
                forceOnline: liveChat.forceOnline || false,
                requestUserInfo: liveChat.requestUserInfo,
                liveChatIconUrl: liveChat.iconUrl,
                notificationColor: liveChat.notificationColor,
                userBubbleColor: liveChat.userBubbleColor,
                schedule: schedule
            });
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la configuración de chat.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [toast, whatsappForm, liveChatForm]);

  const onWhatsappSubmit = async (data: WhatsappFormData) => {
    setIsSavingWhatsapp(true);
    try {
      const settings: Partial<ChatSettings> = {
        whatsapp: {
          enabled: data.whatsappEnabled,
          phoneNumber: data.whatsappNumber || "",
          predefinedMessage: data.whatsappMessage || "",
          iconUrl: data.whatsappIconUrl || "",
          buttonColor: data.buttonColor || "#25D366",
        },
      };
      await saveSettings({ chat: settings });
      toast({
        title: "Éxito",
        description: "La configuración de WhatsApp se ha guardado correctamente.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración de WhatsApp.",
      });
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const onLiveChatSubmit = async (data: LiveChatFormData) => {
    setIsSavingLiveChat(true);
    try {
      const settings: Partial<ChatSettings> = {
        liveChat: {
          enabled: data.liveChatEnabled,
          chatTitle: data.chatTitle || "Chat de Soporte",
          assistantName: data.assistantName || "Soporte",
          welcomeMessage: data.welcomeMessage || "¡Hola! ¿En qué podemos ayudarte?",
          offlineMessage: data.offlineMessage || "Estamos fuera de línea.",
          forceOnline: data.forceOnline,
          requestUserInfo: data.requestUserInfo,
          iconUrl: data.liveChatIconUrl || "",
          notificationColor: data.notificationColor || "#16A34A",
          userBubbleColor: data.userBubbleColor,
          schedule: data.schedule,
        },
      };
      await saveSettings({ chat: settings });
      toast({
        title: "Éxito",
        description: "La configuración del Chat en Vivo se ha guardado correctamente.",
      });
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la configuración del Chat en Vivo.",
      });
    } finally {
      setIsSavingLiveChat(false);
    }
  };
  
  if (isLoading) {
      return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <h2 className="text-3xl font-bold tracking-tight">Configuración de Chats</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
              <CardContent className="space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Configuración de Chats</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <form onSubmit={whatsappForm.handleSubmit(onWhatsappSubmit)}>
            <CardHeader>
              <CardTitle>Chat de WhatsApp</CardTitle>
              <CardDescription>Configura el botón flotante de WhatsApp para tu sitio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <Controller
                control={whatsappForm.control}
                name="whatsappEnabled"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Switch id="whatsapp-enabled" checked={field.value} onCheckedChange={field.onChange} />
                    <Label htmlFor="whatsapp-enabled">Habilitar chat de WhatsApp</Label>
                  </div>
                )}
              />
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">Número de Teléfono (con código de país)</Label>
                <Input id="whatsapp-number" placeholder="Ej: 5491112345678" {...whatsappForm.register("whatsappNumber")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-message">Mensaje predefinido</Label>
                <Textarea id="whatsapp-message" placeholder="Hola, me gustaría hacer una consulta sobre..." {...whatsappForm.register("whatsappMessage")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-icon">URL del Ícono Personalizado (opcional)</Label>
                <Input id="whatsapp-icon" placeholder="https://ejemplo.com/icono.png" {...whatsappForm.register("whatsappIconUrl")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-button-color">Color del Botón (Hex)</Label>
                <Input type="color" id="whatsapp-button-color" {...whatsappForm.register("buttonColor")} className="p-1 h-10"/>
              </div>
              <Button type="submit" disabled={isSavingWhatsapp}>
                {isSavingWhatsapp ? "Guardando..." : "Guardar Configuración de WhatsApp"}
              </Button>
            </CardContent>
          </form>
        </Card>
        
        <Card>
          <form onSubmit={liveChatForm.handleSubmit(onLiveChatSubmit)}>
            <CardHeader>
              <CardTitle>Chat en Vivo Personalizado</CardTitle>
              <CardDescription>Configura el chat interno para hablar con tus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Controller
                  control={liveChatForm.control}
                  name="liveChatEnabled"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Switch id="livechat-enabled" checked={field.value} onCheckedChange={field.onChange} />
                      <Label htmlFor="livechat-enabled">Habilitar chat en vivo</Label>
                    </div>
                  )}
              />
               <div className="space-y-2">
                <Label htmlFor="chat-title">Título del Chat</Label>
                <Input id="chat-title" placeholder="Ej: ¿Necesitas ayuda?" {...liveChatForm.register("chatTitle")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistant-name">Nombre del Asistente</Label>
                <Input id="assistant-name" placeholder="Ej: Sofía" {...liveChatForm.register("assistantName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Mensaje de Bienvenida (Online)</Label>
                <Textarea id="welcome-message" placeholder="Ej: ¡Hola! ¿En qué podemos ayudarte?" {...liveChatForm.register("welcomeMessage")} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="offline-message">Mensaje de Bienvenida (Offline)</Label>
                <Textarea id="offline-message" placeholder="Ej: Estamos fuera de línea en este momento. Déjanos tu mensaje." {...liveChatForm.register("offlineMessage")} />
              </div>

               <Controller
                  control={liveChatForm.control}
                  name="requestUserInfo"
                  render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Switch id="livechat-request-info" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="livechat-request-info">Pedir datos al usuario (nombre, email)</Label>
                      </div>
                  )}
              />
              <div className="space-y-2">
                <Label htmlFor="livechat-icon">URL del Ícono Personalizado (opcional)</Label>
                <Input id="livechat-icon" placeholder="https://ejemplo.com/icono.png" {...liveChatForm.register("liveChatIconUrl")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="notification-color">Color de Notificación</Label>
                    <Input type="color" id="notification-color" {...liveChatForm.register("notificationColor")} className="p-1 h-10"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-bubble-color">Color Globo Chat (Usuario)</Label>
                    <Input type="color" id="user-bubble-color" {...liveChatForm.register("userBubbleColor")} className="p-1 h-10"/>
                  </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-foreground">Horario de Atención</h4>
                  <div className="flex items-center space-x-2">
                    <Controller
                        control={liveChatForm.control}
                        name="forceOnline"
                        render={({ field }) => (
                           <Switch id="force-online" checked={field.value} onCheckedChange={field.onChange} />
                        )}
                    />
                    <Label htmlFor="force-online">Forzar estado "En línea"</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Define cuándo el chat aparecerá como "En línea" automáticamente. Activar el interruptor de arriba anulará este horario.</p>
                  <div className="space-y-2">
                    {fields.map((field, index) => {
                      const isEnabled = liveChatForm.watch(`schedule.${index}.enabled`);
                      return (
                        <div key={field.id} className="grid grid-cols-4 items-center gap-2">
                           <div className="flex items-center gap-2 col-span-1">
                             <Controller
                                control={liveChatForm.control}
                                name={`schedule.${index}.enabled`}
                                render={({ field: checkboxField }) => (
                                    <Checkbox
                                        id={`schedule-enabled-${index}`}
                                        checked={checkboxField.value}
                                        onCheckedChange={checkboxField.onChange}
                                    />
                                )}
                             />
                            <Label htmlFor={`schedule-enabled-${index}`} className="font-semibold">{field.day}</Label>
                          </div>
                           <div className="col-span-1">
                            <Input 
                                type="time" 
                                {...liveChatForm.register(`schedule.${index}.open`)}
                                disabled={!isEnabled}
                            />
                           </div>
                           <div className="col-span-1">
                             <Input 
                                type="time" 
                                {...liveChatForm.register(`schedule.${index}.close`)}
                                disabled={!isEnabled}
                            />
                           </div>
                        </div>
                      )
                    })}
                  </div>
              </div>
              
              <Button type="submit" disabled={isSavingLiveChat}>
                {isSavingLiveChat ? "Guardando..." : "Guardar Configuración de Chat en Vivo"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
