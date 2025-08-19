
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
    getDoc
} from 'firebase/firestore';
import { getPromotions, type Promotion } from './promotion-service';

export interface Product {
    id?: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    promotionCode?: string;
    promotionTitle?: string;
    promotionTitleColor?: string;
    promotionDiscountColor?: string;
    promotionTitleStyle?: 'ribbon' | 'star';
    promotionDiscountStyle?: 'ribbon' | 'star';
    allowRatings: boolean;
    overrideRating?: number | null;
    stock: number;
    paused: boolean;
    createdAt?: any;
    hasWeights: boolean;
    hasColors: boolean;
    hasTypes: boolean;
    hasUses: boolean;
    hasFormats: boolean;
    hasMeasures: boolean;
    availableWeights?: string[];
    availableColors?: string[];
    availableTypes?: string[];
    availableUses?: string[];
    availableFormats?: string[];
    availableMeasures?: string[];
    promotion?: Promotion | null;
}

const productsCollectionRef = collection(db, 'products');

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    try {
        const { promotion, ...dataToSave } = productData;
        
        const docRef = await addDoc(productsCollectionRef, {
            ...dataToSave,
            createdAt: serverTimestamp(),
        });
        const newProduct = await getDoc(docRef);
        const data = newProduct.data() as Product;
        return { 
            id: docRef.id, 
            ...data,
            createdAt: data.createdAt ? (data.createdAt as any).toMillis() : Date.now(),
        };
    } catch (error) {
        console.error("Error adding product: ", error);
        throw new Error("Could not add product.");
    }
};

export const getProducts = async (): Promise<Product[]> => {
    try {
        const promotions = await getPromotions();
        const promotionsMap = new Map(promotions.map(p => [p.code, p]));

        const q = query(productsCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const products: Product[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            const promotion = data.promotionCode ? promotionsMap.get(data.promotionCode) || null : null;
            
            const product: Product = {
                id: doc.id,
                name: data.name,
                description: data.description,
                price: data.price,
                imageUrl: data.imageUrl,
                stock: data.stock,
                paused: data.paused,
                allowRatings: data.allowRatings,
                overrideRating: data.overrideRating || null,
                createdAt: data.createdAt?.toMillis() || Date.now(),
                hasWeights: data.hasWeights || false,
                hasColors: data.hasColors || false,
                hasTypes: data.hasTypes || false,
                hasUses: data.hasUses || false,
                hasFormats: data.hasFormats || false,
                hasMeasures: data.hasMeasures || false,
                availableWeights: data.availableWeights || [],
                availableColors: data.availableColors || [],
                availableTypes: data.availableTypes || [],
                availableUses: data.availableUses || [],
                availableFormats: data.availableFormats || [],
                availableMeasures: data.availableMeasures || [],
                promotionCode: data.promotionCode,
                promotionTitle: data.promotionTitle,
                promotion: promotion,
            };

            if (promotion) {
                product.promotionTitleColor = promotion.promotionTitleColor;
                product.promotionDiscountColor = promotion.promotionDiscountColor;
                product.promotionTitleStyle = promotion.promotionTitleStyle;
                product.promotionDiscountStyle = promotion.promotionDiscountStyle;
            }

            products.push(product);
        });
        return products;
    } catch (error) {
        console.error("Error getting products: ", error);
        throw new Error("Could not get products.");
    }
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<Product> => {
    try {
        const productDocRef = doc(db, 'products', productId);
        // Explicitly remove the 'promotion' property from the object to be saved, as it's a client-side joined property.
        const { promotion, ...dataToUpdate } = updates;

        await updateDoc(productDocRef, dataToUpdate);
        const updatedDoc = await getDoc(productDocRef);
        const data = updatedDoc.data() as Product;
        return {
             id: updatedDoc.id,
            ...data,
             createdAt: data.createdAt ? (data.createdAt as any).toMillis() : Date.now(),
        }
    } catch (error) {
        console.error("Error updating product: ", error);
        throw new Error("Could not update product.");
    }
};

export const deleteProduct = async (productId: string): Promise<void> => {
    try {
        const productDocRef = doc(db, 'products', productId);
        await deleteDoc(productDocRef);
    } catch (error) {
        console.error("Error deleting product: ", error);
        throw new Error("Could not delete product.");
    }
};
