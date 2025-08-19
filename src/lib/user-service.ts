
import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, DocumentData } from 'firebase/firestore';

export interface User {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

const usersCollectionRef = collection(db, 'users');

export const getUsers = async (): Promise<User[]> => {
  try {
    const q = query(usersCollectionRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc: DocumentData) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        fullName: `${data.name} ${data.lastname}`,
        email: data.email,
        createdAt: data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString() : 'N/A',
      });
    });
    return users;
  } catch (error) {
    console.error("Error getting users: ", error);
    throw new Error("Could not get users.");
  }
};
