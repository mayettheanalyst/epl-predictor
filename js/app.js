import { db } from './firebase-config.js';
import { getTelegramUser, initializeUser, createUser, getUserData } from './auth.js';
import { loadMatches, loadGameweeks, currentGameweek } from './matches.js';
import { loadLeaderboard } from './leaderboard.js';
import { loadProfile } from './profile.js';
import { initializeAdmin } from './admin.js';

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
let currentGameweekNum = 1;

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
    await loadGameweeks();
    await loadMatches(currentGameweekNum);
    await loadLeaderboard(currentGameweekNum);
    await loadProfile(userId);
    initializeAdmin();
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
    document.getElementById('current-gameweek').textContent = `Gameweek ${currentGameweekNum}`;
    document.getElementById('leaderboard-gameweek').textContent = `Gameweek ${currentGameweekNum}`;
    loadMatches(currentGameweekNum);
    loadLeaderboard(currentGameweekNum);
}

// Start the app
initializeApp();