
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
    deleteDoc,
    DocumentData,
    getDoc,
    collectionGroup,
    where,
    onSnapshot
} from 'firebase/firestore';

export interface Review {
    id: string;
    productId: string;
    productName: string; // Denormalized for easy display in admin
    author: string;
    authorId?: string; // If the user is registered
    rating: number;
    text: string;
    status: 'pending' | 'approved' | 'rejected' | 'paused';
    createdAt: number;
}

export const addReview = async (productId: string, productName: string, reviewData: Partial<Omit<Review, 'id' | 'createdAt' | 'status' | 'productId' | 'productName'>>): Promise<void> => {
    try {
        const productRef = doc(db, 'products', productId);
        const reviewsCollectionRef = collection(productRef, 'reviews');
        
        const finalReviewData: any = {
            ...reviewData,
            productId,
            productName,
            status: 'pending',
            createdAt: serverTimestamp(),
        };
        
        if (reviewData.authorId === undefined) {
            delete finalReviewData.authorId;
        }

        await addDoc(reviewsCollectionRef, finalReviewData);

    } catch (error) {
        console.error("Error adding review: ", error);
        throw new Error("Could not add review.");
    }
};

export const onReviewsSnapshot = (callback: (reviews: Review[]) => void): (() => void) => {
    const reviewsQuery = query(collectionGroup(db, 'reviews'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(reviewsQuery, (querySnapshot) => {
        const reviews: Review[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            reviews.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis() || Date.now(),
            } as Review);
        });
        callback(reviews);
    }, (error) => {
        console.error("Error listening to reviews snapshot: ", error);
    });

    return unsubscribe;
};


export const onAllReviewsSnapshotForProduct = (productId: string, callback: (reviews: Review[]) => void): (() => void) => {
    const reviewsCollectionRef = collection(db, 'products', productId, 'reviews');
    const q = query(reviewsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const reviews: Review[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            reviews.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis() || Date.now(),
            } as Review);
        });
        callback(reviews);
    }, (error) => {
        console.error("Error listening to all reviews for product: ", error);
    });

    return unsubscribe;
};

export const onApprovedReviewsSnapshotForProduct = (productId: string, callback: (reviews: Review[]) => void): (() => void) => {
    const reviewsCollectionRef = collection(db, 'products', productId, 'reviews');
    const q = query(reviewsCollectionRef, where('status', '==', 'approved'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const reviews: Review[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            reviews.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis() || Date.now(),
            } as Review);
        });
        callback(reviews);
    }, (error) => {
        console.error("Error listening to approved reviews for product: ", error);
    });

    return unsubscribe;
};


export const updateReviewStatus = async (productId: string, reviewId: string, status: Review['status']): Promise<void> => {
    try {
        const reviewDocRef = doc(db, 'products', productId, 'reviews', reviewId);
        await updateDoc(reviewDocRef, { status });
    } catch (error) {
        console.error("Error updating review status: ", error);
        throw new Error("Could not update review status.");
    }
};

export const deleteReview = async (productId: string, reviewId: string): Promise<void> => {
    try {
        const reviewDocRef = doc(db, 'products', productId, 'reviews', reviewId);
        await deleteDoc(reviewDocRef);
    } catch (error) {
        console.error("Error deleting review: ", error);
        throw new Error("Could not delete review.");
    }
};
