import { db } from './firebase-config.js';
import { getTelegramUser, initializeUser, createUser, getUserData } from './auth.js';
import { loadMatches, loadGameweeks, currentGameweek } from './matches.js';
import { loadLeaderboard } from './leaderboard.js';
import { loadProfile } from './profile.js';
import { initializeAdmin } from './admin.js';
import { collection, query, where, orderBy, getDocs, limit } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Get Telegram user info
const telegramUser = getTelegramUser();
const userId = telegramUser?.id || null;
const username = telegramUser?.username || null;

// Store userId globally for other modules
window.telegramUserId = userId;

// Global state
let currentUser = null;
let currentGameweekNum = 1; // Will be auto-updated

// Auto-detect current gameweek (shows next upcoming or latest)
async function detectCurrentGameweek() {
    try {
        console.log('🔍 Auto-detecting current gameweek...');
        
        const now = new Date();
        
        // Try to find the next upcoming match
        const matchesRef = collection(db, 'matches');
        const upcomingQuery = query(
            matchesRef,
            where('status', '==', 'scheduled'),
            orderBy('kickoffTime', 'asc'),
            limit(1)
        );
        
        const upcomingSnapshot = await getDocs(upcomingQuery);
        
        if (!upcomingSnapshot.empty) {
            // Found upcoming match - use its gameweek
            const nextMatch = upcomingSnapshot.docs[0].data();
            currentGameweekNum = nextMatch.gameweek;
            console.log(`✅ Found upcoming match in Gameweek ${currentGameweekNum}`);
            return;
        }
        
        // No upcoming matches - find the latest gameweek with finished matches
        const allMatchesQuery = query(matchesRef, orderBy('gameweek', 'desc'));
        const allMatchesSnapshot = await getDocs(allMatchesQuery);
        
        if (!allMatchesSnapshot.empty) {
            const latestMatch = allMatchesSnapshot.docs[0].data();
            currentGameweekNum = latestMatch.gameweek;
            console.log(`✅ No upcoming matches, using latest Gameweek ${currentGameweekNum}`);
            return;
        }
        
        // No matches at all - default to 1
        currentGameweekNum = 1;
        console.log('✅ No matches found, defaulting to Gameweek 1');
        
    } catch (error) {
        console.error('❌ Error detecting gameweek:', error);
        currentGameweekNum = 1; // Fallback
    }
}

// Initialize App
async function initializeApp() {
    // Hide loading screen
    document.getElementById('loading-screen').classList.remove('active');
    
    if (!userId) {
        // Not opened from Telegram
        document.getElementById('login-screen').innerHTML = `
            <div class="login-container">
                <h1>⚽ EPL Predictor</h1>
                <p style="color: var(--danger);">⚠️ This app only works inside Telegram!</p>
                <p>Please open this app from your Telegram bot.</p>
                <button onclick="window.location.reload()" class="btn-primary">Try Again</button>
            </div>
        `;
        showScreen('login-screen');
        return;
    }

    try {
        // Check if user exists in database
        currentUser = await initializeUser(userId);
        
        // Auto-detect current gameweek BEFORE loading data
        await detectCurrentGameweek();
        
        if (!currentUser) {
            // New user - show registration screen
            showScreen('login-screen');
            document.getElementById('login-btn').addEventListener('click', handleRegistration);
        } else {
            // Existing user - show main app
            showScreen('main-app');
            loadInitialData();
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showMessage('Error loading app. Please try again.', 'error');
    }
}

// Handle new user registration
async function handleRegistration() {
    const displayName = document.getElementById('display-name-input').value.trim();
    const favoriteTeam = document.getElementById('favorite-team-select').value;
    
    if (!displayName) {
        alert('Please enter your display name');
        return;
    }
    
    try {
        await createUser(userId, {
            displayName,
            favoriteTeam,
            username: username || `user_${userId}`
        });
        
        currentUser = await getUserData(userId);
        showScreen('main-app');
        loadInitialData();
    } catch (error) {
        alert('Error creating profile. Please try again.');
        console.error(error);
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showMessage(text, type = 'info') {
    console.log(`[${type}] ${text}`);
}

async function loadInitialData() {
    console.log(`📅 Loading data for Gameweek ${currentGameweekNum}...`);
    
    await loadGameweeks();
    await loadMatches(currentGameweekNum);
    await loadLeaderboard(currentGameweekNum);
    await loadProfile(userId);
    initializeAdmin();
    
    // Update gameweek display
    updateGameweekDisplay();
}

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
        
        if (page === 'matches') loadMatches(currentGameweekNum);
        if (page === 'leaderboard') loadLeaderboard(currentGameweekNum);
        if (page === 'profile') loadProfile(userId);
    });
});

// Gameweek Navigation
document.getElementById('prev-gameweek')?.addEventListener('click', () => {
    if (currentGameweekNum > 1) {
        currentGameweekNum--;
        updateGameweekDisplay();
    }
});

document.getElementById('next-gameweek')?.addEventListener('click', () => {
    currentGameweekNum++;
    updateGameweekDisplay();
});

function updateGameweekDisplay() {
    const gwTitle = document.getElementById('current-gameweek');
    const lbTitle = document.getElementById('leaderboard-gameweek');
    
    if (gwTitle) gwTitle.textContent = `Gameweek ${currentGameweekNum}`;
    if (lbTitle) lbTitle.textContent = `Gameweek ${currentGameweekNum}`;
    
    loadMatches(currentGameweekNum);
    loadLeaderboard(currentGameweekNum);
}

// Start the app
initializeApp();
