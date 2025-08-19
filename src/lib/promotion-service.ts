
import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    getDocs,
    query,
    orderBy,
    DocumentData,
    getDoc,
    doc,
    updateDoc,
    where,
    Timestamp,
    deleteDoc
} from 'firebase/firestore';

export interface Promotion {
    id?: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    value: number; 
    startDate: Date;
    endDate?: Date | null; // Can be null for indefinite promotions
    isIndefinite: boolean;
    paused: boolean;
    createdAt?: number;
    // Style fields
    promotionTitleColor?: string;
    promotionDiscountColor?: string;
    promotionTitleStyle?: 'ribbon' | 'star';
    promotionDiscountStyle?: 'ribbon' | 'star';
    promotionTitleTextColor?: string;
    promotionTitleTextSize?: number;
    promotionDiscountTextColor?: string;
    promotionDiscountTextSize?: number;
}

const promotionsCollectionRef = collection(db, 'promotions');

export const addPromotion = async (promotionData: Omit<Promotion, 'id' | 'createdAt'>): Promise<Promotion> => {
    try {
        const dataToSave: any = {
            ...promotionData,
            createdAt: serverTimestamp(),
        };
        // If indefinite, ensure endDate is null
        if (dataToSave.isIndefinite) {
            dataToSave.endDate = null;
        }

        const docRef = await addDoc(promotionsCollectionRef, dataToSave);
        const newPromotionDoc = await getDoc(docRef);
        const data = newPromotionDoc.data();
        if (!data) throw new Error("Document data not found after creation.");
        
        return { 
            id: docRef.id, 
            ...data,
            startDate: (data.startDate as Timestamp).toDate(),
            endDate: data.endDate ? (data.endDate as Timestamp).toDate() : null,
            createdAt: data.createdAt ? (data.createdAt as Timestamp).toMillis() : Date.now(),
        } as Promotion;
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
                discountType: data.discountType,
                value: data.value,
                startDate: data.startDate.toDate(),
                endDate: data.endDate ? data.endDate.toDate() : null,
                isIndefinite: data.isIndefinite || false,
                paused: data.paused || false,
                createdAt: data.createdAt?.toMillis() || Date.now(),
                promotionTitleColor: data.promotionTitleColor,
                promotionDiscountColor: data.promotionDiscountColor,
                promotionTitleStyle: data.promotionTitleStyle,
                promotionDiscountStyle: data.promotionDiscountStyle,
                promotionTitleTextColor: data.promotionTitleTextColor,
                promotionTitleTextSize: data.promotionTitleTextSize,
                promotionDiscountTextColor: data.promotionDiscountTextColor,
                promotionDiscountTextSize: data.promotionDiscountTextSize,
            });
        });
        return promotions;
    } catch (error) {
        console.error("Error getting promotions: ", error);
        throw new Error("Could not get promotions.");
    }
};

export const getActivePromotions = async (): Promise<Promotion[]> => {
    try {
        const now = new Date();
        const q = query(
            promotionsCollectionRef, 
            where('paused', '==', false),
            where('startDate', '<=', now),
        );
        const querySnapshot = await getDocs(q);
        const promotions: Promotion[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            // Client-side filter for endDate or if it's indefinite
            if (data.isIndefinite || (data.endDate && data.endDate.toDate() >= now)) {
                 promotions.push({
                    id: doc.id,
                    code: data.code,
                    discountType: data.discountType,
                    value: data.value,
                    startDate: data.startDate.toDate(),
                    endDate: data.endDate ? data.endDate.toDate() : null,
                    isIndefinite: data.isIndefinite,
                    paused: data.paused,
                    createdAt: data.createdAt?.toMillis() || Date.now(),
                    promotionTitleColor: data.promotionTitleColor,
                    promotionDiscountColor: data.promotionDiscountColor,
                    promotionTitleStyle: data.promotionTitleStyle,
                    promotionDiscountStyle: data.promotionDiscountStyle,
                    promotionTitleTextColor: data.promotionTitleTextColor,
                    promotionTitleTextSize: data.promotionTitleTextSize,
                    promotionDiscountTextColor: data.promotionDiscountTextColor,
                    promotionDiscountTextSize: data.promotionDiscountTextSize,
                });
            }
        });
        return promotions.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (error) {
        console.error("Error getting active promotions: ", error);
        throw new Error("Could not get active promotions.");
    }
};


export const updatePromotion = async (promotionId: string, updates: Partial<Promotion>): Promise<Promotion> => {
    try {
        const promotionDocRef = doc(db, 'promotions', promotionId);
        
        const dataToUpdate: any = { ...updates };
         // If indefinite, ensure endDate is null
        if (dataToUpdate.isIndefinite) {
            dataToUpdate.endDate = null;
        }

        await updateDoc(promotionDocRef, dataToUpdate);
        const updatedDoc = await getDoc(promotionDocRef);
        const data = updatedDoc.data();
         if (!data) throw new Error("Document data not found after update.");
        return {
            id: updatedDoc.id,
            ...data,
            startDate: (data.startDate as any).toDate(),
            endDate: data.endDate ? (data.endDate as any).toDate() : null,
            createdAt: data.createdAt ? (data.createdAt as any).toMillis() : Date.now(),
        } as Promotion;
    } catch (error) {
        console.error("Error updating promotion: ", error);
        throw new Error("Could not update promotion.");
    }
}

export const deletePromotion = async (promotionId: string): Promise<void> => {
    try {
        const promotionDocRef = doc(db, 'promotions', promotionId);
        await deleteDoc(promotionDocRef);
    } catch (error) {
        console.error("Error deleting promotion: ", error);
        throw new Error("Could not delete promotion.");
    }
};
