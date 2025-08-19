
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
    where
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
        const messagesCollectionRef = collection(db, 'chats', chatId, 'messages');
        await addDoc(messagesCollectionRef, {
            ...message,
            createdAt: serverTimestamp(),
        });
        
        // Update last message and unread status on the chat document
        const chatDocRef = doc(db, 'chats', chatId);
        await updateDoc(chatDocRef, {
             lastMessage: message.text,
             updatedAt: serverTimestamp(),
             // unread for user if agent sent, unread for admin if user sent
             unread: true, 
        });

    } catch (error) {
        console.error("Error sending message: ", error);
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
                updatedAt: data.updatedAt?.toMillis()
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
        console.error("Error marking chat as read: ", error);
        // Don't throw, as it might not be critical for user flow
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
                updatedAt: data.updatedAt?.toMillis()
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching chat session: ", error);
        return null;
    }
};

    