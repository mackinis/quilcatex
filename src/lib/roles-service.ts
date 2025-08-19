
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

export const PERMISSIONS = {
  dashboard: "Ver Panel Principal",
  appearance: "Modificar Apariencia",
  general: "Modificar Config. General",
  products: "Administrar Productos",
  promotions: "Administrar Promociones",
  users: "Administrar Usuarios",
  roles: "Administrar Roles",
  reviews: "Administrar Reseñas",
  suscripciones: "Administrar Suscripciones",
  header: "Modificar Header",
  hero: "Modificar Hero Banner",
  mapa: "Modificar Mapa",
  chats: "Configurar Chats",
  conversations: "Ver Conversaciones",
  emails: "Modificar Plantillas de Email",
  services_texts: "Modificar Textos de Servicios",
  footer_main: "Modificar Footer Principal",
  footer_copyright: "Modificar Footer Copyright",
};

export type PermissionKeys = keyof typeof PERMISSIONS;

export interface Role {
    id: string;
    name: string;
    permissions: { [key in PermissionKeys]?: boolean };
    createdAt: any;
}

const rolesCollectionRef = collection(db, 'roles');

export const addRole = async (roleData: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    try {
        const docRef = await addDoc(rolesCollectionRef, {
            ...roleData,
            createdAt: serverTimestamp(),
        });
        const newRoleDoc = await getDoc(docRef);
        const data = newRoleDoc.data();
        if (!data) throw new Error("Document data not found after creation.");
        return { id: docRef.id, ...data } as Role;
    } catch (error) {
        console.error("Error adding role: ", error);
        throw new Error("Could not add role.");
    }
};

export const getRoles = async (): Promise<Role[]> => {
    try {
        const q = query(rolesCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const roles: Role[] = [];
        querySnapshot.forEach((doc: DocumentData) => {
            const data = doc.data();
            roles.push({
                id: doc.id,
                name: data.name,
                permissions: data.permissions,
                createdAt: data.createdAt?.toMillis() || Date.now(),
            });
        });
        return roles;
    } catch (error) {
        console.error("Error getting roles: ", error);
        throw new Error("Could not get roles.");
    }
};

export const updateRole = async (roleId: string, updates: Partial<Role>): Promise<void> => {
    try {
        const roleDocRef = doc(db, 'roles', roleId);
        await updateDoc(roleDocRef, updates);
    } catch (error) {
        console.error("Error updating role: ", error);
        throw new Error("Could not update role.");
    }
};

export const deleteRole = async (roleId: string): Promise<void> => {
    try {
        const roleDocRef = doc(db, 'roles', roleId);
        await deleteDoc(roleDocRef);
    } catch (error) {
        console.error("Error deleting role: ", error);
        throw new Error("Could not delete role.");
    }
};
