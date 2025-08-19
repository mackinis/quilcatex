
import { db } from './firebase';
import { 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    DocumentData, 
    doc, 
    getDoc, 
    updateDoc,
    where,
    deleteDoc,
} from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  name: string;
  lastname: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
  province: string;
  country: string;
  status: 'active' | 'suspended' | 'deleted';
  role?: string; // 'user' or role ID from roles collection
}

export type UpdatableUser = Omit<User, 'id' | 'email' | 'createdAt' | 'fullName' | 'status'> & { password?: string };

const usersCollectionRef = collection(db, 'users');

export const getUsers = async (): Promise<User[]> => {
  try {
    // Firestore does not support queries with multiple inequalities or combining orderBy with range/inequality on different fields.
    // So we fetch all non-deleted users and filter/sort in-code.
    const q = query(usersCollectionRef);
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc: DocumentData) => {
      const data = doc.data();
      // Filter out deleted users on the client side
      if (data.status !== 'deleted') {
        users.push({
          id: doc.id,
          email: data.email,
          fullName: `${data.name} ${data.lastname}`,
          createdAt: data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'N/A',
          name: data.name,
          lastname: data.lastname,
          phone: data.phone,
          address: data.address,
          zipCode: data.zipCode,
          city: data.city,
          province: data.province,
          country: data.country,
          status: data.status || 'active',
          role: data.role || 'user',
        });
      }
    });

    // Sort by creation date descending
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return users;
  } catch (error) {
    console.error("Error getting users: ", error);
    throw new Error("Could not get users.");
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
        const userDocRef = doc(db, 'users', email);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                email: data.email,
                fullName: `${data.name} ${data.lastname}`,
                createdAt: data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'N/A',
                name: data.name,
                lastname: data.lastname,
                phone: data.phone,
                address: data.address,
                zipCode: data.zipCode,
                city: data.city,
                province: data.province,
                country: data.country,
                status: data.status || 'active',
                role: data.role || 'user',
            }
        }
        return null;
    } catch (error) {
        console.error("Error getting user by email:", error);
        throw new Error("Could not get user data.");
    }
};

export const updateUser = async (email: string, userData: UpdatableUser): Promise<void> => {
    try {
        const userDocRef = doc(db, 'users', email);
        
        const dataToUpdate: { [key: string]: any } = { ...userData };

        if (userData.password) {
            dataToUpdate.password = await bcrypt.hash(userData.password, 10);
        } else {
            delete dataToUpdate.password;
        }

        await updateDoc(userDocRef, dataToUpdate);
    } catch (error) {
        console.error("Error updating user:", error);
        throw new Error("Could not update user data.");
    }
};

export const updateUserStatus = async (userId: string, status: 'active' | 'suspended'): Promise<void> => {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { status: status });
    } catch (error) {
        console.error("Error updating user status:", error);
        throw new Error("Could not update user status.");
    }
};

export const updateUserRole = async (userId: string, role: string): Promise<void> => {
    try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { role: role });
    } catch (error) {
        console.error("Error updating user role:", error);
        throw new Error("Could not update user role.");
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    try {
        const userDocRef = doc(db, 'users', userId);
        // Soft delete by changing status
        await updateDoc(userDocRef, { status: 'deleted' });
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Could not delete user.");
    }
};
