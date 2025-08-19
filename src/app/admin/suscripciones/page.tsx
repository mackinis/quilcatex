
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
    updateSubscriberStatus,
    deleteSubscriber,
    saveEmailTemplates,
    getEmailTemplates,
    onSubscribersSnapshot,
    type Subscriber,
    type EmailTemplates
} from "@/lib/subscription-service";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Trash2, Play, Pause, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const subscriptionSettingsSchema = z.object({
  welcomeEmailSubject: z.string().min(1, "El asunto es requerido."),
  welcomeEmailBody: z.string().min(1, "El cuerpo del correo es requerido."),
  newsletterEmailSubject: z.string().min(1, "El asunto es requerido."),
  newsletterEmailBody: z.string().min(1, "El cuerpo del correo es requerido."),
  unsubscribeTitle: z.string().min(1, "El título es requerido."),
  unsubscribeDescription: z.string().min(1, "La descripción es requerida."),
  unsubscribeBackToSiteButton: z.string().min(1, "El texto del botón es requerido."),
  unsubscribeCloseButton: z.string().min(1, "El texto del botón es requerido."),
});

type SubscriptionSettingsFormData = z.infer<typeof subscriptionSettingsSchema>;
type AlertAction = 'delete' | 'pause' | 'activate';

export default function SuscripcionesPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [alertAction, setAlertAction] = useState<AlertAction | null>(null);

  const form = useForm<SubscriptionSettingsFormData>({
    resolver: zodResolver(subscriptionSettingsSchema),
    defaultValues: {
      welcomeEmailSubject: "",
      welcomeEmailBody: "",
      newsletterEmailSubject: "",
      newsletterEmailBody: "",
      unsubscribeTitle: "",
      unsubscribeDescription: "",
      unsubscribeBackToSiteButton: "",
      unsubscribeCloseButton: "",
    },
  });

  useEffect(() => {
    async function loadInitialTemplates() {
      setIsLoading(true);
      try {
        const templates = await getEmailTemplates();
        form.reset(templates);
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la información de suscripciones." });
      }
    }
    
    loadInitialTemplates();

    const unsubscribe = onSubscribersSnapshot((subs) => {
        setSubscribers(subs);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast, form]);


  const onSaveTemplates = async (data: SubscriptionSettingsFormData) => {
    setIsSaving(true);
    try {
      await saveEmailTemplates(data);
      toast({ title: "Éxito", description: "Las plantillas de correo se han guardado." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la configuración." });
    } finally {
      setIsSaving(false);
    }
  };

  const onSendNewsletter = async () => {
    setIsSending(true);
    try {
        const host = window.location.origin;
        const response = await fetch('/api/subscribe/send-newsletter', { 
            method: 'POST' ,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ host })
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.message);
      
      toast({ title: "Éxito", description: `${data.message}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: `No se pudo enviar el newsletter: ${error.message}` });
    } finally {
      setIsSending(false);
    }
  };
  
  const handleActionRequest = (subscriber: Subscriber, action: AlertAction) => {
    setSelectedSubscriber(subscriber);
    setAlertAction(action);
    setIsAlertOpen(true);
  }

  const handleConfirmAction = async () => {
    if (!selectedSubscriber || !alertAction) return;

    try {
        if (alertAction === 'delete') {
            await deleteSubscriber(selectedSubscriber.email);
            toast({ title: "Éxito", description: "El suscriptor ha sido eliminado."});
        } else {
            const newStatus = alertAction === 'pause' ? 'paused' : 'active';
            await updateSubscriberStatus(selectedSubscriber.email, newStatus);
            toast({ title: "Éxito", description: `El estado del suscriptor ha sido actualizado.`});
        }
        // No need to fetch manually, snapshot listener will update the state
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la acción.' });
    } finally {
        setIsAlertOpen(false);
        setSelectedSubscriber(null);
        setAlertAction(null);
    }
  };
  
  const getAlertContent = () => {
    if (!alertAction || !selectedSubscriber) return { title: '', description: '' };
    switch (alertAction) {
        case 'delete': return { title: '¿Eliminar Suscriptor?', description: `¿Estás seguro de que quieres eliminar a ${selectedSubscriber.email} de la lista? Esta acción no se puede deshacer.` };
        case 'pause': return { title: '¿Pausar Suscriptor?', description: `¿Estás seguro de que quieres pausar a ${selectedSubscriber.email}? No recibirá más correos hasta que lo reactives.` };
        case 'activate': return { title: '¿Reactivar Suscriptor?', description: `¿Estás seguro de que quieres reactivar a ${selectedSubscriber.email}? Volverá a recibir correos.` };
    }
  };
  
  const formatSubscriptionDate = (timestamp: number) => {
      const date = new Date(timestamp);
      const formattedDate = format(date, "P", { locale: es }); // P -> 9/8/2025
      const formattedTime = format(date, "pp", { locale: es }); // pp -> 1:43:37 PM
      return `${formattedDate}, ${formattedTime}`
          .replace('AM', 'a. m.')
          .replace('PM', 'p. m.');
  };

  const statusMap: {[key in Subscriber['status']]: {text: string, variant: 'default' | 'secondary' | 'destructive'}} = {
    active: { text: 'Activo', variant: 'default' },
    paused: { text: 'Pausado', variant: 'secondary' },
    unsubscribed: { text: 'Desuscrito', variant: 'destructive'},
  }

  const renderTemplateFields = (
    type: 'welcome' | 'newsletter',
    title: string,
    description: string
  ) => (
     <div className="space-y-4">
        <div className="text-xs text-muted-foreground">Variables: <code className="bg-muted p-0.5 rounded-sm mx-0.5">{'{siteName}'}</code> <code className="bg-muted p-0.5 rounded-sm mx-0.5">{'{unsubscribeUrl}'}</code></div>
        <div className="space-y-2">
            <Label htmlFor={`${type}-subject`}>Asunto</Label>
            <Input id={`${type}-subject`} {...form.register(type === 'welcome' ? 'welcomeEmailSubject' : 'newsletterEmailSubject')} />
            {form.formState.errors[type === 'welcome' ? 'welcomeEmailSubject' : 'newsletterEmailSubject'] && <p className="text-sm text-destructive">{form.formState.errors[type === 'welcome' ? 'welcomeEmailSubject' : 'newsletterEmailSubject']?.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor={`${type}-body`}>Cuerpo del Email (soporta HTML)</Label>
            <Textarea id={`${type}-body`} {...form.register(type === 'welcome' ? 'welcomeEmailBody' : 'newsletterEmailBody')} rows={12} />
            {form.formState.errors[type === 'welcome' ? 'welcomeEmailBody' : 'newsletterEmailBody'] && <p className="text-sm text-destructive">{form.formState.errors[type === 'welcome' ? 'welcomeEmailBody' : 'newsletterEmailBody']?.message}</p>}
        </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Skeleton className="h-8 w-1/2" />
        <Card><CardHeader><Skeleton className="h-8 w-1/4" /></CardHeader>
          <CardContent className="space-y-6"><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Suscripciones</h2>
      </div>
      
       <form onSubmit={form.handleSubmit(onSaveTemplates)}>
        <Card>
            <CardHeader>
                <CardTitle>Plantillas y Contenidos</CardTitle>
                <CardDescription>Personaliza los correos electrónicos y las páginas relacionadas con las suscripciones.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="multiple" defaultValue={['item-1']} className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg font-medium">Correos Electrónicos</AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {renderTemplateFields('welcome', 'Email de Bienvenida', 'Este correo se envía automáticamente cuando un usuario se suscribe.')}
                                {renderTemplateFields('newsletter', 'Plantilla de Newsletter', 'Usa esta plantilla para tus campañas de email marketing.')}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-lg font-medium">Página de Desuscripción</AccordionTrigger>
                        <AccordionContent className="pt-4 space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="unsubscribeTitle">Título</Label>
                                <Input id="unsubscribeTitle" {...form.register("unsubscribeTitle")} />
                                {form.formState.errors.unsubscribeTitle && <p className="text-sm text-destructive">{form.formState.errors.unsubscribeTitle.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unsubscribeDescription">Descripción</Label>
                                <Textarea id="unsubscribeDescription" {...form.register("unsubscribeDescription")} rows={4} />
                                 <p className="text-xs text-muted-foreground">Variable disponible: <code className="bg-muted p-0.5 rounded-sm mx-0.5">{'{siteName}'}</code></p>
                                {form.formState.errors.unsubscribeDescription && <p className="text-sm text-destructive">{form.formState.errors.unsubscribeDescription.message}</p>}
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unsubscribeBackToSiteButton">Texto Botón "Volver"</Label>
                                    <Input id="unsubscribeBackToSiteButton" {...form.register("unsubscribeBackToSiteButton")} />
                                    {form.formState.errors.unsubscribeBackToSiteButton && <p className="text-sm text-destructive">{form.formState.errors.unsubscribeBackToSiteButton.message}</p>}
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="unsubscribeCloseButton">Texto Botón "Cerrar"</Label>
                                    <Input id="unsubscribeCloseButton" {...form.register("unsubscribeCloseButton")} />
                                    {form.formState.errors.unsubscribeCloseButton && <p className="text-sm text-destructive">{form.formState.errors.unsubscribeCloseButton.message}</p>}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                <div className="pt-6 mt-6 border-t flex justify-end gap-4">
                    <Button type="button" variant="secondary" onClick={onSendNewsletter} disabled={isSending}>
                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {isSending ? "Enviando..." : "Enviar Newsletter a Activos"}
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </CardContent>
        </Card>
        </form>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Lista de Suscriptores</CardTitle>
          <CardDescription>
            Aquí están todos los correos que se han registrado en tu boletín. Actualmente tienes {subscribers.length} suscriptores.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Fecha de Suscripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full"/></TableCell></TableRow>)
                ) : subscribers.length > 0 ? (
                    subscribers.map(sub => {
                      const statusInfo = statusMap[sub.status];
                      return (
                         <TableRow key={sub.id}>
                            <TableCell className="font-medium">{sub.email}</TableCell>
                            <TableCell><Badge variant={statusInfo.variant}>{statusInfo.text}</Badge></TableCell>
                            <TableCell className="text-right">{formatSubscriptionDate(sub.createdAt)}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {sub.status === 'active' && <DropdownMenuItem onClick={() => handleActionRequest(sub, 'pause')}><Pause className="mr-2 h-4 w-4"/> Pausar</DropdownMenuItem>}
                                        {sub.status === 'paused' && <DropdownMenuItem onClick={() => handleActionRequest(sub, 'activate')}><Play className="mr-2 h-4 w-4"/> Reactivar</DropdownMenuItem>}
                                        <DropdownMenuItem onClick={() => handleActionRequest(sub, 'delete')} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                         </TableRow>
                      )
                    })
                ) : (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">No hay suscriptores todavía.</TableCell></TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{getAlertContent().title}</AlertDialogTitle>
                <AlertDialogDescription>{getAlertContent().description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmAction}>Continuar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
