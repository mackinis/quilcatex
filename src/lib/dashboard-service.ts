
import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DashboardStats {
    totalUsers: number;
    newUsersLast30Days: number;
    totalProducts: number;
    totalSubscribers: number;
    unreadChats: number;
    userChartData: { date: string; count: number }[];
    recentUsers: RecentUser[];
}

export interface RecentUser {
    id: string;
    fullName: string;
    email: string;
}

const usersCollectionRef = collection(db, 'users');
const productsCollectionRef = collection(db, 'products');
const chatsCollectionRef = collection(db, 'chats');
const subscriptionsCollectionRef = collection(db, 'subscriptions');


export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

        const allUsersQuery = query(usersCollectionRef);
        const newUsersQuery = query(usersCollectionRef, where('createdAt', '>=', thirtyDaysAgoTimestamp));
        const productsQuery = getDocs(productsCollectionRef);
        const unreadChatsQuery = query(chatsCollectionRef, where('unread', '==', true));
        const subscriptionsQuery = getDocs(subscriptionsCollectionRef);
        
        const [
            allUsersSnapshot,
            newUsersSnapshot,
            productsSnapshot,
            unreadChatsSnapshot,
            subscriptionsSnapshot,
        ] = await Promise.all([
            getDocs(allUsersQuery),
            getDocs(newUsersQuery),
            productsQuery,
            getDocs(unreadChatsQuery),
            subscriptionsQuery
        ]);
        
        const totalUsers = allUsersSnapshot.size;
        const newUsersLast30Days = newUsersSnapshot.size;
        const totalProducts = productsSnapshot.size;
        const unreadChats = unreadChatsSnapshot.size;
        const totalSubscribers = subscriptionsSnapshot.size;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const userDocs = allUsersSnapshot.docs
            .map(doc => ({ ...doc.data(), id: doc.id }))
            .filter(user => user.createdAt && (user.createdAt as Timestamp).toDate() >= sevenDaysAgo);

        const userChartData = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: format(date, 'dd MMM', { locale: es }),
                count: 0
            };
        }).reverse();
        
        userDocs.forEach(user => {
            if(user.createdAt){
                const registrationDate = format((user.createdAt as Timestamp).toDate(), 'dd MMM', { locale: es });
                const dayData = userChartData.find(d => d.date === registrationDate);
                if (dayData) {
                    dayData.count++;
                }
            }
        });
        
        const recentUsersQuery = query(usersCollectionRef, orderBy('createdAt', 'desc'), limit(5));
        const recentUsersSnapshot = await getDocs(recentUsersQuery);
        const recentUsers: RecentUser[] = recentUsersSnapshot.docs.map(doc => ({
            id: doc.id,
            fullName: `${doc.data().name} ${doc.data().lastname}`,
            email: doc.data().email,
        }));


        return {
            totalUsers,
            newUsersLast30Days,
            totalProducts,
            unreadChats,
            userChartData,
            recentUsers,
            totalSubscribers
        };

    } catch (error) {
        console.error("Error fetching dashboard stats: ", error);
        throw new Error("Could not fetch dashboard statistics.");
    }
};
