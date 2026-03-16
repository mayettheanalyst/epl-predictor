import { db } from './firebase-config.js';
import { checkAdminPassword, setAdminSession, clearAdminSession } from './auth.js';
import { addMatches, updateMatchResults, loadMatches } from './matches.js';
import { collection, query, where, getDocs, updateDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let matchCounter = 0;

// Initialize admin panel
export function initializeAdmin() {
    // Check if already logged in
    if (checkAdminPassword('')) {
        showAdminDashboard();
    }
    
    // Admin login
    document.getElementById('admin-login-btn')?.addEventListener('click', handleAdminLogin);
    
    // Admin logout
    document.getElementById('admin-logout-btn')?.addEventListener('click', handleAdminLogout);
    
    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            if (tabName === 'enter-results') {
                loadAdminMatchesForResults();
            } else if (tabName === 'payments') {
                loadPaymentsList();
            }
        });
    });
    
    // Add matches
    document.getElementById('add-match-btn')?.addEventListener('click', addMatchInputCard);
    document.getElementById('save-all-matches')?.addEventListener('click', saveAllMatches);
    
    // Save results
    document.getElementById('save-all-results')?.addEventListener('click', saveAllResults);
    
    // Gameweek selectors
    document.getElementById('admin-results-gameweek')?.addEventListener('change', loadAdminMatchesForResults);
    document.getElementById('admin-payments-gameweek')?.addEventListener('change', loadPaymentsList);
    
    // Initialize
    initAddMatchesPage();
}

function handleAdminLogin() {
    const password = document.getElementById('admin-password-input').value;
    const messageEl = document.getElementById('admin-login-message');
    
    if (checkAdminPassword(password)) {
        setAdminSession(true);
        messageEl.textContent = '✅ Login successful!';
        messageEl.className = 'message success show';
        setTimeout(() => {
            showAdminDashboard();
            messageEl.classList.remove('show');
        }, 1000);
    } else {
        messageEl.textContent = '❌ Incorrect password';
        messageEl.className = 'message error show';
    }
}

function handleAdminLogout() {
    clearAdminSession();
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-password-input').value = '';
}

function showAdminDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
}

// Add Matches Functions
function initAddMatchesPage() {
    const container = document.getElementById('matches-to-add');
    if (container) {
        container.innerHTML = '';
        matchCounter = 0;
        addMatchInputCard();
    }
}

function addMatchInputCard() {
    matchCounter++;
    const container = document.getElementById('matches-to-add');
    
    const card = document.createElement('div');
    card.className = 'match-input-card';
    card.dataset.matchIndex = matchCounter;
    
    card.innerHTML = `
        <button class="remove-match" onclick="window.removeMatchCard(${matchCounter})">&times;</button>
        <div class="match-input-fields">
            <div class="input-group">
                <label>Home Team</label>
                <input type="text" class="home-team" placeholder="e.g., Burnley">
            </div>
            <div class="vs-divider">VS</div>
            <div class="input-group">
                <label>Away Team</label>
                <input type="text" class="away-team" placeholder="e.g., Bournemouth">
            </div>
        </div>
        <div class="input-group" style="margin-bottom: 10px;">
            <label>Stadium (optional)</label>
            <input type="text" class="stadium" placeholder="e.g., Turf Moor">
        </div>
        <div class="datetime-group">
            <div class="input-group">
                <label>Date</label>
                <input type="date" class="match-date">
            </div>
            <div class="input-group">
                <label>Time</label>
                <input type="time" class="match-time">
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

window.removeMatchCard = function(index) {
    const cards = document.querySelectorAll('.match-input-card');
    if (cards.length > 1) {
        cards.forEach(card => {
            if (parseInt(card.dataset.matchIndex) === index) {
                card.remove();
            }
        });
    } else {
        alert('You need at least one match!');
    }
};

async function saveAllMatches() {
    const cards = document.querySelectorAll('.match-input-card');
    const matches = [];
    const messageEl = document.getElementById('add-matches-message');
    const gameweek = parseInt(document.getElementById('admin-gameweek').value);
    const season = document.getElementById('admin-season').value;
    
    cards.forEach(card => {
        const homeTeam = card.querySelector('.home-team').value.trim();
        const awayTeam = card.querySelector('.away-team').value.trim();
        const stadium = card.querySelector('.stadium').value.trim();
        const date = card.querySelector('.match-date').value;
        const time = card.querySelector('.match-time').value;
        
        if (homeTeam && awayTeam && date && time) {
            matches.push({
                homeTeam,
                awayTeam,
                stadium,
                kickoffTime: `${date} ${time}`
            });
        }
    });
    
    if (matches.length === 0) {
        messageEl.textContent = '❌ Please fill in at least one complete match';
        messageEl.className = 'message error show';
        return;
    }
    
    try {
        await addMatches(matches, gameweek, season);
        
        messageEl.textContent = `✅ Added ${matches.length} matches successfully!`;
        messageEl.className = 'message success show';
        
        // Notify users via bot (you'll need to trigger this from backend)
        // await notifyUsersNewGameweek(gameweek);
        
        setTimeout(() => {
            initAddMatchesPage();
        }, 2000);
    } catch (error) {
        messageEl.textContent = '❌ Error saving matches';
        messageEl.className = 'message error show';
    }
}

// Enter Results Functions
async function loadAdminMatchesForResults() {
    const gameweek = document.getElementById('admin-results-gameweek').value;
    const grid = document.getElementById('admin-matches-grid');
    
    if (!gameweek) {
        grid.innerHTML = '<div class="message">Select a gameweek to enter results</div>';
        return;
    }
    
    grid.innerHTML = '<div class="loading">Loading matches...</div>';
    
    try {
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('gameweek', '==', parseInt(gameweek)));
        const querySnapshot = await getDocs(q);
        
        grid.innerHTML = '';
        
        if (querySnapshot.empty) {
            grid.innerHTML = '<div class="message">No matches found for this gameweek</div>';
            return;
        }
        
        querySnapshot.forEach(docSnap => {
            const match = docSnap.data();
            const card = createAdminMatchCard(match, docSnap.id);
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading matches:', error);
        grid.innerHTML = '<div class="message error show">Error loading matches</div>';
    }
}

function createAdminMatchCard(match, matchId) {
    const card = document.createElement('div');
    card.className = 'admin-match-card';
    card.dataset.matchId = matchId;
    
    const kickoff = match.kickoffTime?.toDate ? match.kickoffTime.toDate() : new Date(match.kickoffTime);
    
    card.innerHTML = `
        <div class="admin-match-header">
            <div class="admin-match-info">
                <h3>${match.homeTeam} vs ${match.awayTeam}</h3>
                <div class="admin-match-meta">
                    📅 ${kickoff.toLocaleDateString()} | 🕐 ${kickoff.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
            <span class="admin-match-status status-scheduled">Scheduled</span>
        </div>
        <div class="admin-match-teams">
            <div class="admin-team-name home">${match.homeTeam}</div>
            <div class="admin-vs">VS</div>
            <div class="admin-team-name away">${match.awayTeam}</div>
        </div>
        <div class="admin-score-inputs">
            <div class="admin-score-input">
                <label>${match.homeTeam}</label>
                <input type="number" class="admin-home-input" min="0" max="20" value="${match.realHomeScore || 0}">
            </div>
            <div style="font-weight: bold; color: var(--text-secondary);">-</div>
            <div class="admin-score-input">
                <label>${match.awayTeam}</label>
                <input type="number" class="admin-away-input" min="0" max="20" value="${match.realAwayScore || 0}">
            </div>
        </div>
    `;
    
    return card;
}

async function saveAllResults() {
    const cards = document.querySelectorAll('.admin-match-card');
    const results = [];
    const messageEl = document.getElementById('admin-results-message');
    
    cards.forEach(card => {
        const matchId = card.dataset.matchId;
        const homeScore = parseInt(card.querySelector('.admin-home-input').value);
        const awayScore = parseInt(card.querySelector('.admin-away-input').value);
        
        results.push({
            matchId,
            homeScore,
            awayScore
        });
    });
    
    if (results.length === 0) {
        messageEl.textContent = '❌ No matches to update';
        messageEl.className = 'message error show';
        return;
    }
    
    if (!confirm(`Are you sure you want to save results for ${results.length} matches? This will calculate points for all predictions.`)) {
        return;
    }
    
    try {
        await updateMatchResults(results);
        
        // Calculate points for all predictions
        await calculateAllPoints(results);
        
        messageEl.textContent = `✅ Updated ${results.length} match results and calculated points!`;
        messageEl.className = 'message success show';
        
        setTimeout(() => {
            loadAdminMatchesForResults();
        }, 2000);
    } catch (error) {
        messageEl.textContent = '❌ Error saving results';
        messageEl.className = 'message error show';
    }
}

// Calculate points for all predictions
async function calculateAllPoints(results) {
    const { collection, query, where, getDocs, updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    for (const result of results) {
        const predictionsRef = collection(db, 'predictions');
        const q = query(predictionsRef, where('matchId', '==', result.matchId));
        const querySnapshot = await getDocs(q);
        
        for (const predDoc of querySnapshot.docs) {
            const pred = predDoc.data();
            const points = calculatePoints(pred.predHome, pred.predAway, result.homeScore, result.awayScore);
            
            await updateDoc(doc(db, 'predictions', predDoc.id), {
                points
            });
            
            // Update user total points
            await updateUserTotalPoints(pred.userId, points);
        }
    }
}

function calculatePoints(predHome, predAway, realHome, realAway) {
    if (predHome === realHome && predAway === realAway) {
        return 5;
    }
    
    const predDiff = predHome - predAway;
    const realDiff = realHome - realAway;
    
    if ((predDiff > 0 && realDiff > 0) ||
        (predDiff < 0 && realDiff < 0) ||
        (predDiff === 0 && realDiff === 0)) {
        return 3;
    }
    
    return 0;
}

async function updateUserTotalPoints(userId, newPoints) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const user = userSnap.data();
            const totalPoints = (user.totalPoints || 0) + newPoints;
            
            // Update wins/losses based on points
            let totalWins = user.totalWins || 0;
            let totalLosses = user.totalLosses || 0;
            
            if (newPoints >= 3) {
                totalWins++;
            } else {
                totalLosses++;
            }
            
            await updateDoc(userRef, {
                totalPoints,
                totalWins,
                totalLosses
            });
        }
    } catch (error) {
        console.error('Error updating user points:', error);
    }
}

// Payments Functions
async function loadPaymentsList() {
    const gameweek = document.getElementById('admin-payments-gameweek').value;
    const container = document.getElementById('payments-list');
    
    if (!gameweek) {
        container.innerHTML = '<div class="message">Select a gameweek to view payments</div>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading users...</div>';
    
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        container.innerHTML = '';
        
        querySnapshot.forEach(docSnap => {
            const user = docSnap.data();
            const item = createPaymentItem(user, docSnap.id);
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading payments:', error);
        container.innerHTML = '<div class="message error show">Error loading users</div>';
    }
}

function createPaymentItem(user, userId) {
    const item = document.createElement('div');
    item.className = 'payment-item';
    
    item.innerHTML = `
        <div class="payment-user">
            <div class="payment-user-name">${user.displayName || 'Unknown'}</div>
            <div class="payment-user-username">@${user.username || userId}</div>
        </div>
        <div class="payment-checkbox">
            <input type="checkbox" id="paid-${userId}" ${user.isPaid ? 'checked' : ''} onchange="window.togglePayment('${userId}', this.checked)">
            <label for="paid-${userId}">Paid</label>
        </div>
    `;
    
    return item;
}

window.togglePayment = async function(userId, isPaid) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isPaid,
            paidAt: isPaid ? new Date().toISOString() : null
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        alert('Error updating payment status');
    }
};