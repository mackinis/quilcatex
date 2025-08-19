
import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    getDocs,
    query,
    orderBy,
    DocumentData
} from 'firebase/firestore';

export interface Promotion {
    id?: string;
    code: string;
    discount: number; // Percentage
    createdAt?: number;
}

const promotionsCollectionRef = collection(db, 'promotions');

export const addPromotion = async (promotionData: Omit<Promotion, 'id' | 'createdAt'>): Promise<Promotion> => {
    try {
        const docRef = await addDoc(promotionsCollectionRef, {
            ...promotionData,
            createdAt: serverTimestamp(),
        });
        return { id: docRef.id, ...promotionData };
    } catch (error) {
        console.error("Error adding promotion: ", error);
        throw new Error("Could not add promotion.");
    }
};

export const getPromotions = async (): Promise<Promotion[]> => {
    try {
        const q = query(promotionsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const promotions: Promotion[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            promotions.push({
                id: doc.id,
                code: data.code,
                discount: data.discount,
                createdAt: data.createdAt?.toMillis() || Date.now()
            });
        });
        return promotions;
    } catch (error) {
        console.error("Error getting promotions: ", error);
        throw new Error("Could not get promotions.");
    }
};
