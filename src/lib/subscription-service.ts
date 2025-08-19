
import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    getDocs,
    query,
    orderBy,
    doc,
    updateDoc,
    getDoc,
    DocumentData,
    setDoc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';

export interface EmailTemplates {
    welcomeEmailSubject: string;
    welcomeEmailBody: string;
    newsletterEmailSubject: string;
    newsletterEmailBody: string;
    unsubscribeTitle: string;
    unsubscribeDescription: string;
    unsubscribeBackToSiteButton: string;
    unsubscribeCloseButton: string;
}

export interface Subscriber {
    id: string;
    email: string;
    status: 'active' | 'paused' | 'unsubscribed';
    createdAt: number;
    unsubscribedAt?: number;
}

const templatesDocRef = doc(db, 'app-config', 'subscriptionTemplates');
const subscriptionsCollectionRef = collection(db, 'subscriptions');

// --- Template Management ---

export const getEmailTemplates = async (): Promise<EmailTemplates> => {
    try {
        const docSnap = await getDoc(templatesDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure defaults for new fields if they don't exist
            return {
                welcomeEmailSubject: data.welcomeEmailSubject || "¡Gracias por suscribirte a {siteName}!",
                welcomeEmailBody: data.welcomeEmailBody || "Hola,\n\nTe has suscrito a nuestro boletín. ¡Prepárate para recibir las últimas noticias y ofertas exclusivas!\n\nSi quieres darte de baja, haz clic aquí: {unsubscribeUrl}\n\nSaludos,\nEl equipo de {siteName}",
                newsletterEmailSubject: data.newsletterEmailSubject || "Novedades en {siteName}",
                newsletterEmailBody: data.newsletterEmailBody || "Hola,\n\nAquí tienes las últimas novedades de nuestra tienda...\n\n[Contenido del newsletter aquí]\n\nPara no recibir más correos, haz clic aquí: {unsubscribeUrl}\n\nSaludos,\nEl equipo de {siteName}",
                unsubscribeTitle: data.unsubscribeTitle || "Desuscripción Exitosa",
                unsubscribeDescription: data.unsubscribeDescription || "Has sido dado de baja de la lista de correo de {siteName}.\nYa no recibirás más correos nuestros.",
                unsubscribeBackToSiteButton: data.unsubscribeBackToSiteButton || "Volver a la página principal",
                unsubscribeCloseButton: data.unsubscribeCloseButton || "Cerrar página",
            };
        }
        // Return default values if document doesn't exist
        return {
            welcomeEmailSubject: "¡Gracias por suscribirte a {siteName}!",
            welcomeEmailBody: "Hola,\n\nTe has suscrito a nuestro boletín. ¡Prepárate para recibir las últimas noticias y ofertas exclusivas!\n\nSi quieres darte de baja, haz clic aquí: {unsubscribeUrl}\n\nSaludos,\nEl equipo de {siteName}",
            newsletterEmailSubject: "Novedades en {siteName}",
            newsletterEmailBody: "Hola,\n\nAquí tienes las últimas novedades de nuestra tienda...\n\n[Contenido del newsletter aquí]\n\nPara no recibir más correos, haz clic aquí: {unsubscribeUrl}\n\nSaludos,\nEl equipo de {siteName}",
            unsubscribeTitle: "Desuscripción Exitosa",
            unsubscribeDescription: "Has sido dado de baja de la lista de correo de {siteName}.\nYa no recibirás más correos nuestros.",
            unsubscribeBackToSiteButton: "Volver a la página principal",
            unsubscribeCloseButton: "Cerrar página",
        };
    } catch (error) {
        console.error("Error getting email templates: ", error);
        throw new Error("Could not get email templates.");
    }
};


export const saveEmailTemplates = async (templates: Partial<EmailTemplates>): Promise<void> => {
    try {
        await setDoc(templatesDocRef, templates, { merge: true });
    } catch (error) {
        console.error("Error saving email templates: ", error);
        throw new Error("Could not save email templates.");
    }
};


// --- Subscriber Management ---

export const addSubscriber = async (email: string): Promise<Subscriber | null> => {
    try {
        const subscriberDocRef = doc(db, 'subscriptions', email);
        const docSnap = await getDoc(subscriberDocRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status === 'unsubscribed') {
                throw new Error('Ud se ha desuscrito recientemente, para volver a suscribirse, contactese con suscripciones@quiltex.com.ar.');
            }
            return null; // Already subscribed and not 'unsubscribed'
        }

        const newSubscriber = {
            email,
            status: 'active',
            createdAt: serverTimestamp(),
        };

        await setDoc(subscriberDocRef, newSubscriber);
        
        // Return a representation of the new subscriber. The actual timestamp will be set by the server.
        return {
            id: subscriberDocRef.id,
            email: email,
            status: 'active',
            createdAt: Date.now(),
        };
    } catch (error) {
        console.error("Error adding subscriber: ", error);
        throw error; // Re-throw the error to be handled by the API route
    }
};

export const getSubscribers = async (): Promise<Subscriber[]> => {
    try {
        const q = query(subscriptionsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const subscribers: Subscriber[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            subscribers.push({
                id: doc.id,
                email: data.email,
                status: data.status || 'active',
                createdAt: data.createdAt?.toMillis() || Date.now(),
                unsubscribedAt: data.unsubscribedAt?.toMillis(),
            });
        });
        return subscribers;
    } catch (error) {
        console.error("Error getting subscribers: ", error);
        throw new Error("Could not get subscribers.");
    }
};

export const onSubscribersSnapshot = (callback: (subscribers: Subscriber[]) => void): (() => void) => {
    const q = query(subscriptionsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const subscribers: Subscriber[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            subscribers.push({
                id: doc.id,
                email: data.email,
                status: data.status || 'active',
                createdAt: data.createdAt?.toMillis() || Date.now(),
                unsubscribedAt: data.unsubscribedAt?.toMillis(),
            });
        });
        callback(subscribers);
    }, (error) => {
        console.error("Error listening to subscribers snapshot: ", error);
    });
    
    return unsubscribe;
}

export const onSubscribersCountSnapshot = (callback: (count: number) => void): (() => void) => {
    const q = query(subscriptionsCollectionRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        callback(querySnapshot.size);
    }, (error) => {
        console.error("Error listening to subscribers count: ", error);
    });
    return unsubscribe;
};


export const updateSubscriberStatus = async (email: string, status: Subscriber['status']): Promise<void> => {
    try {
        const subscriberDocRef = doc(db, 'subscriptions', email);
        const updateData: {status: Subscriber['status'], unsubscribedAt?: any} = { status };
        if (status === 'unsubscribed') {
            updateData.unsubscribedAt = serverTimestamp();
        }
        await updateDoc(subscriberDocRef, updateData);
    } catch (error) {
        console.error(`Error updating subscriber ${email} status:`, error);
        throw new Error("Could not update subscriber status.");
    }
};

export const deleteSubscriber = async (email: string): Promise<void> => {
    try {
        const subscriberDocRef = doc(db, 'subscriptions', email);
        await deleteDoc(subscriberDocRef);
    } catch (error) {
        console.error(`Error deleting subscriber ${email}:`, error);
        throw new Error("Could not delete subscriber.");
    }
}
