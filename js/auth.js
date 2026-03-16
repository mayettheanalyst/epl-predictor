import { db } from './firebase-config.js';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 🔐 Admin Password (CHANGE THIS!)
const ADMIN_PASSWORD = "beza123";

// Get Telegram user data (called from app.js)
export function getTelegramUser() {
    const tg = window.Telegram.WebApp;
    const user = tg.initDataUnsafe?.user;
    
    if (!user) {
        return null;
    }
    
    return {
        id: user.id.toString(),
        username: user.username || null,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        languageCode: user.language_code || 'en'
    };
}

// Initialize or get user from Firestore
export async function initializeUser(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            // User exists, return their data
            return userSnap.data();
        } else {
            // New user - return null to show registration screen
            return null;
        }
    } catch (error) {
        console.error('Error initializing user:', error);
        throw error;
    }
}

// Create new user in Firestore
export async function createUser(userId, userData) {
    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            userId: userId,
            displayName: userData.displayName,
            username: userData.username,
            favoriteTeam: userData.favoriteTeam || '',
            totalPoints: 0,
            totalWins: 0,
            totalLosses: 0,
            isPaid: false,
            paidAt: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Get user data
export async function getUserData(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
}

// Update user data
export async function updateUserData(userId, data) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating user data:', error);
        throw error;
    }
}

// Admin authentication
export function checkAdminPassword(password) {
    return password === ADMIN_PASSWORD;
}

export function setAdminSession(isAdmin) {
    localStorage.setItem('isAdmin', isAdmin);
    localStorage.setItem('adminLoginTime', Date.now());
}

export function getAdminSession() {
    const isAdmin = localStorage.getItem('isAdmin');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (isAdmin === 'true' && loginTime) {
        const hoursSinceLogin = (Date.now() - parseInt(loginTime)) / (1000 * 60 * 60);
        if (hoursSinceLogin < 24) {
            return true;
        }
    }
    
    return false;
}

export function clearAdminSession() {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminLoginTime');
}