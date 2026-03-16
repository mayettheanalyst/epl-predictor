import { getTelegramUser, initializeUser, createUser } from './auth.js';
import { loadMatches, loadGameweeks } from './matches.js';
import { loadLeaderboard } from './leaderboard.js';
import { loadProfile } from './profile.js';
import { initializeAdmin } from './admin.js';

// Initialize Telegram
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Get user info
const telegramUser = getTelegramUser();
const userId = telegramUser?.id || null;
const username = telegramUser?.username || null;

window.telegramUserId = userId;

// Set default gameweek to 31
let currentGameweekNum = 31;

// Initialize
async function init() {
    // Remove loading screen immediately
    document.getElementById('loading-screen')?.remove();
    
    if (!userId) {
        // Not in Telegram
        document.body.innerHTML = `
            <div style="padding: 40px; text-align: center; font-family: Arial;">
                <h1>⚽ EPL Predictor</h1>
                <p style="color: red;">⚠️ This app only works inside Telegram!</p>
                <p>Please open from your Telegram bot.</p>
            </div>
        `;
        return;
    }
    
    // Show main app
    document.getElementById('main-app').classList.add('active');
    
    // Load data
    try {
        await loadGameweeks();
        await loadMatches(currentGameweekNum);
        await loadLeaderboard(currentGameweekNum);
        await loadProfile(userId);
        initializeAdmin();
        
        // Update gameweek display
        document.getElementById('current-gameweek').textContent = `Gameweek ${currentGameweekNum}`;
        document.getElementById('leaderboard-gameweek').textContent = `Gameweek ${currentGameweekNum}`;
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const page = btn.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}-page`).classList.add('active');
    });
});

// Gameweek arrows
document.getElementById('prev-gameweek')?.addEventListener('click', () => {
    if (currentGameweekNum > 1) {
        currentGameweekNum--;
        document.getElementById('current-gameweek').textContent = `Gameweek ${currentGameweekNum}`;
        loadMatches(currentGameweekNum);
    }
});

document.getElementById('next-gameweek')?.addEventListener('click', () => {
    currentGameweekNum++;
    document.getElementById('current-gameweek').textContent = `Gameweek ${currentGameweekNum}`;
    loadMatches(currentGameweekNum);
});

// Start
init();
