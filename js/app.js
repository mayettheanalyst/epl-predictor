import { db } from './firebase-config.js';
import { getTelegramUser, initializeUser, createUser, getUserData } from './auth.js';
import { loadMatches, loadGameweeks } from './matches.js';
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

// Store userId globally
window.telegramUserId = userId;

// Global state
let currentUser = null;
let currentGameweekNum = 31; // Set to current gameweek manually

// Initialize App
async function initializeApp() {
    try {
        console.log('🚀 Initializing app...');
        
        // Hide loading screen immediately
        document.getElementById('loading-screen').classList.remove('active');
        
        if (!userId) {
            console.warn('⚠️ No Telegram user ID');
            document.getElementById('login-screen').innerHTML = `
                <div class="login-container">
                    <h1>⚽ EPL Predictor</h1>
                    <p style="color: var(--danger);">⚠️ This app only works inside Telegram!</p>
                    <p>Please open this app from your Telegram bot.</p>
                    <button onclick="window.location.reload()" class="btn-primary">Try Again</button>
                </div>
            `;
            document.getElementById('login-screen').classList.add('active');
            return;
        }

        console.log('✅ User ID:', userId);
        
        // Check if user exists
        currentUser = await initializeUser(userId);
        
        if (!currentUser) {
            console.log('📝 New user - showing registration');
            document.getElementById('login-screen').classList.add('active');
            document.getElementById('login-btn').addEventListener('click', handleRegistration);
        } else {
            console.log('✅ Existing user - loading app');
            document.getElementById('main-app').classList.add('active');
            
            // Load all data with error handling
            try {
                await loadGameweeks();
                console.log('✅ Gameweeks loaded');
            } catch (err) {
                console.error('❌ Error loading gameweeks:', err);
            }
            
            try {
                await loadMatches(currentGameweekNum);
                console.log('✅ Matches loaded for GW' + currentGameweekNum);
            } catch (err) {
                console.error('❌ Error loading matches:', err);
            }
            
            try {
                await loadLeaderboard(currentGameweekNum);
                console.log('✅ Leaderboard loaded');
            } catch (err) {
                console.error('❌ Error loading leaderboard:', err);
            }
            
            try {
                await loadProfile(userId);
                console.log('✅ Profile loaded');
            } catch (err) {
                console.error('❌ Error loading profile:', err);
            }
            
            try {
                initializeAdmin();
                console.log('✅ Admin initialized');
            } catch (err) {
                console.error('❌ Error initializing admin:', err);
            }
            
            // Update gameweek display
            updateGameweekDisplay();
        }
        
    } catch (error) {
        console.error('🚨 Fatal initialization error:', error);
        // Show error to user
        document.getElementById('loading-screen').innerHTML = `
            <div class="login-container">
                <h1>⚽ EPL Predictor</h1>
                <p style="color: var(--danger);">❌ Error loading app</p>
                <p style="font-size: 12px; color: #666;">${error.message}</p>
                <button onclick="window.location.reload()" class="btn-primary">Try Again</button>
            </div>
        `;
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
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-app').classList.add('active');
        initializeApp();
    } catch (error) {
        alert('Error creating profile. Please try again.');
        console.error(error);
    }
}

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

// Start the app
console.log(' Starting EPL Predictor...');
initializeApp();
