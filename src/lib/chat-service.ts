
import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    onSnapshot, 
    query, 
    orderBy,
    doc,
    updateDoc,
    DocumentData,
    getDoc,
    where,
    deleteDoc,
    getDocs
} from 'firebase/firestore';

export interface UserInfo {
    name: string;
    email?: string;
    phone?: string;
}

export interface ChatSession {
    id: string;
    userInfo: UserInfo;
    createdAt: number;
    status: 'open' | 'closed';
    lastMessage: string;
    unread: boolean;
    updatedAt?: number;
    assistantName?: string;
}

export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'agent';
    senderName: string;
    createdAt: number; // Store as Unix timestamp
}

// Function to create a new chat session
export const createChatSession = async (userInfo: UserInfo, welcomeMessage: string, assistantName: string): Promise<string> => {
    try {
        const chatCollectionRef = collection(db, 'chats');
        const formattedWelcomeMessage = welcomeMessage.replace('{name}', userInfo.name);
        
        const docRef = await addDoc(chatCollectionRef, {
            userInfo,
            assistantName, // Save assistant name on session creation
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'open',
            lastMessage: formattedWelcomeMessage,
            unread: true, 
        });

        // Add initial welcome message from agent
        const messagesCollectionRef = collection(docRef, 'messages');
        await addDoc(messagesCollectionRef, {
            text: formattedWelcomeMessage,
            sender: 'agent',
            senderName: assistantName,
            createdAt: serverTimestamp(),
        });
        
        return docRef.id;
    } catch (error) {
        console.error("Error creating chat session: ", error);
        throw error;
    }
};

// Function to send a message
export const sendMessage = async (chatId: string, message: { text: string; sender: 'user' | 'agent', senderName: string }): Promise<void> => {
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        
        // First, verify the chat session exists before doing ANYTHING.
        const chatDocSnap = await getDoc(chatDocRef);
        if (!chatDocSnap.exists()) {
            console.warn(`Chat session ${chatId} does not exist. Message not sent.`);
            throw new Error('Chat session not found');
        }
        
        // If it exists, proceed with adding the message and updating the document.
        const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesCollectionRef, {
            ...message,
            createdAt: serverTimestamp(),
        });
        
        await updateDoc(chatDocRef, {
             lastMessage: message.text,
             updatedAt: serverTimestamp(),
             unread: true, 
        });

    } catch (error) {
        console.error("Error sending message: ", error);
        // Re-throw the error so the calling component can handle it (e.g., clear local state)
        throw error;
    }
};

// Function to listen for new messages in real-time
export const onMessagesSnapshot = (chatId: string, callback: (messages: Message[]) => void): (() => void) => {
    const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: Message[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                text: data.text,
                sender: data.sender,
                senderName: data.senderName,
                createdAt: data.createdAt?.toMillis() || Date.now()
            });
        });
        callback(messages);
    }, (error) => {
        console.error("Error listening to messages: ", error);
    });

    return unsubscribe; // Return the unsubscribe function
};

// Function for admin to listen to all chat sessions
export const onChatSessionsSnapshot = (callback: (sessions: ChatSession[]) => void): (() => void) => {
    const chatCollectionRef = collection(db, 'chats');
    const q = query(chatCollectionRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const sessions: ChatSession[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            sessions.push({
                id: doc.id,
                userInfo: data.userInfo,
                createdAt: data.createdAt?.toMillis() || Date.now(),
                status: data.status,
                lastMessage: data.lastMessage,
                unread: data.unread,
                updatedAt: data.updatedAt?.toMillis(),
                assistantName: data.assistantName
            });
        });
        callback(sessions);
    }, (error) => {
        console.error("Error listening to chat sessions: ", error);
    });

    return unsubscribe;
};

// Function for admin to mark a chat as read
export const markChatAsRead = async (chatId: string): Promise<void> => {
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        await updateDoc(chatDocRef, {
            unread: false
        });
    } catch (error) {
        // This might fail if doc is deleted simultaneously. It's a non-critical error.
        if ((error as any).code !== 'not-found') {
            console.error("Error marking chat as read: ", error);
        }
    }
}

export const getChatSession = async (chatId: string): Promise<ChatSession | null> => {
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        const docSnap = await getDoc(chatDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                userInfo: data.userInfo,
                createdAt: data.createdAt?.toMillis() || Date.now(),
                status: data.status,
                lastMessage: data.lastMessage,
                unread: data.unread,
                updatedAt: data.updatedAt?.toMillis(),
                assistantName: data.assistantName
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching chat session: ", error);
        return null;
    }
};

// Function to delete a chat session and its messages
export const deleteChatSession = async (chatId: string): Promise<void> => {
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        const messagesCollectionRef = collection(chatDocRef, 'messages');

        // Delete all messages in the subcollection
        const messagesSnapshot = await getDocs(messagesCollectionRef);
        const deletePromises = messagesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete the chat document itself
        await deleteDoc(chatDocRef);
    } catch (error) {
        console.error("Error deleting chat session: ", error);
        throw error;
    }
};
    
