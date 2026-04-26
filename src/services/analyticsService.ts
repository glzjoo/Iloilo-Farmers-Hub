// src/services/analyticsService.ts
import {
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserCounts {
  farmers: number;
  consumers: number;
  total: number;
}

export interface MonthlyRegistration {
  month: string;
  users: number;
}

export interface DashboardStats {
  revenue: number;
  revenueChangePercent: number;
  ordersCount: number;
  ordersChangePercent: number;
  newCustomersThisMonth: number;
  newCustomersChangePercent: number;
  activeProducts: number;
  productsChangePercent: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Get total user counts split by Farmers and Consumers.
 */
export const getTotalUserCounts = async (): Promise<UserCounts> => {
  try {
    const [farmersSnap, consumersSnap] = await Promise.all([
      getDocs(collection(db, 'farmers')),
      getDocs(collection(db, 'consumers')),
    ]);

    return {
      farmers: farmersSnap.size,
      consumers: consumersSnap.size,
      total: farmersSnap.size + consumersSnap.size,
    };
  } catch (error) {
    console.error('Error fetching user counts:', error);
    return { farmers: 0, consumers: 0, total: 0 };
  }
};

/**
 * Get user registrations grouped by month for the current year.
 */
export const getMonthlyUserRegistrations = async (): Promise<MonthlyRegistration[]> => {
  try {
    const currentYear = new Date().getFullYear();
    const monthlyCounts = new Array(12).fill(0);

    // Query farmers and consumers for createdAt
    const collections = ['farmers', 'consumers'];

    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      snap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || data.createdAt;

        if (createdAt instanceof Date) {
          if (createdAt.getFullYear() === currentYear) {
            monthlyCounts[createdAt.getMonth()]++;
          }
        } else if (createdAt instanceof Timestamp) {
          const date = createdAt.toDate();
          if (date.getFullYear() === currentYear) {
            monthlyCounts[date.getMonth()]++;
          }
        }
      });
    }

    return monthlyCounts.map((count, idx) => ({
      month: MONTHS[idx],
      users: count,
    }));
  } catch (error) {
    console.error('Error fetching monthly registrations:', error);
    return MONTHS.map((month) => ({ month, users: 0 }));
  }
};

/**
 * Get dashboard bottom-card stats.
 * NOTE: Revenue and Orders require an `orders` collection OR updated Firestore rules
 * allowing admin to read conversations/messages. For now, products and new customers are real.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // 1. Active products (stock > 0)
    const productsSnap = await getDocs(collection(db, 'products'));
    let activeProducts = 0;
    productsSnap.forEach((doc) => {
      const stock = doc.data().stock;
      if (typeof stock === 'number' && stock > 0) {
        activeProducts++;
      }
    });

    // 2. New customers this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const consumersSnap = await getDocs(collection(db, 'consumers'));
    let newCustomers = 0;
    consumersSnap.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || data.createdAt;
      let date: Date | null = null;

      if (createdAt instanceof Date) date = createdAt;
      else if (createdAt instanceof Timestamp) date = createdAt.toDate();

      if (date && date >= startOfMonth) {
        newCustomers++;
      }
    });

    // 3. Revenue & Orders
    // TODO: Replace with real data. Options:
    //    A) Create an `orders` collection when orders are accepted
    //    B) Update Firestore rules to let admin read conversations/messages
    // For demo/thesis, returning realistic placeholder values:
    const revenue = 0;        // Replace with real aggregation
    const ordersCount = 0;    // Replace with real aggregation

    return {
      revenue,
      revenueChangePercent: 0,
      ordersCount,
      ordersChangePercent: 0,
      newCustomersThisMonth: newCustomers,
      newCustomersChangePercent: 0,
      activeProducts,
      productsChangePercent: 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      revenue: 0,
      revenueChangePercent: 0,
      ordersCount: 0,
      ordersChangePercent: 0,
      newCustomersThisMonth: 0,
      newCustomersChangePercent: 0,
      activeProducts: 0,
      productsChangePercent: 0,
    };
  }
};