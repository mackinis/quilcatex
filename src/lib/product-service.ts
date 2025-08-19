
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
    DocumentData
} from 'firebase/firestore';

export interface Product {
    id?: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    promotionCode?: string;
    allowRatings: boolean;
    stock: number;
    paused: boolean;
    createdAt?: number;
}

const productsCollectionRef = collection(db, 'products');

// Create a new product
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    try {
        const docRef = await addDoc(productsCollectionRef, {
            ...productData,
            createdAt: serverTimestamp(),
        });
        return { id: docRef.id, ...productData };
    } catch (error) {
        console.error("Error adding product: ", error);
        throw new Error("Could not add product.");
    }
};

// Get all products
export const getProducts = async (): Promise<Product[]> => {
    try {
        const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const products: Product[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            products.push({
                id: doc.id,
                name: data.name,
                description: data.description,
                price: data.price,
                imageUrl: data.imageUrl,
                stock: data.stock,
                paused: data.paused,
                allowRatings: data.allowRatings,
                createdAt: data.createdAt?.toMillis() || Date.now()
            });
        });
        return products;
    } catch (error) {
        console.error("Error getting products: ", error);
        throw new Error("Could not get products.");
    }
};

// Update a product
export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
    try {
        const productDocRef = doc(db, 'products', productId);
        await updateDoc(productDocRef, updates);
    } catch (error) {
        console.error("Error updating product: ", error);
        throw new Error("Could not update product.");
    }
};

// Delete a product
export const deleteProduct = async (productId: string): Promise<void> => {
    try {
        const productDocRef = doc(db, 'products', productId);
        await deleteDoc(productDocRef);
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw new Error("Could not delete product.");
    }
};
