import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export let currentGameweek = 31;
let allGameweeks = [];

export async function loadGameweeks() {
    try {
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, orderBy('gameweek', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const gameweeks = new Set();
        querySnapshot.forEach((doc) => {
            gameweeks.add(doc.data().gameweek);
        });
        
        allGameweeks = Array.from(gameweeks).sort((a, b) => a - b);
        
        if (allGameweeks.length > 0) {
            currentGameweek = Math.max(...allGameweeks);
        }
        
        updateAdminGameweekSelectors();
        return allGameweeks;
    } catch (error) {
        console.error('Error loading gameweeks:', error);
        return [31]; // Fallback
    }
}

export async function loadMatches(gameweek) {
    const container = document.getElementById('matches-list');
    
    if (!container) {
        console.error('❌ Matches container not found!');
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading Gameweek ' + gameweek + '...</div>';
    
    try {
        const matchesRef = collection(db, 'matches');
        const q = query(
            matchesRef,
            where('gameweek', '==', parseInt(gameweek)),
            orderBy('kickoffTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="message">
                    ⚠️ No matches found for Gameweek ${gameweek}<br><br>
                    💡 Add matches from Admin panel
                </div>
            `;
            return;
        }
        
        querySnapshot.forEach((docSnap) => {
            const match = docSnap.data();
            const matchId = docSnap.id;
            
            const card = createMatchCard(match, matchId);
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('❌ Error loading matches:', error);
        
        container.innerHTML = `
            <div class="message error show">
                ❌ Error loading matches<br>
                <small>${error.message}</small><br><br>
                <strong>Common fixes:</strong><br>
                1. Check Firestore Rules allow read access<br>
                2. Check browser console for details<br>
                3. Verify match data in Firebase
            </div>
        `;
    }
}

function createMatchCard(match, matchId) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    let kickoffDate;
    if (match.kickoffTime?.toDate) {
        kickoffDate = match.kickoffTime.toDate();
    } else if (match.kickoffTime) {
        kickoffDate = new Date(match.kickoffTime);
    } else {
        kickoffDate = new Date();
    }
    
    const now = new Date();
    const hasStarted = now > kickoffDate;
    const isFinished = match.status === 'finished';
    
    if (isFinished) {
        card.classList.add('finished');
    }
    
    card.innerHTML = `
        <div class="match-header">
            <span>📅 ${kickoffDate.toLocaleDateString()}</span>
            <span>🕐 ${kickoffDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="match-teams">
            <div class="team home">${match.homeTeam}</div>
            <div class="vs">${isFinished ? `<span class="match-score">${match.realHomeScore ?? 0} - ${match.realAwayScore ?? 0}</span>` : 'VS'}</div>
            <div class="team away">${match.awayTeam}</div>
        </div>
        <div class="match-info">
            <div class="stadium">📍 ${match.stadium || 'TBD'}</div>
            ${isFinished ? '<span class="prediction-badge done">Finished</span>' : 
              hasStarted ? '<span class="prediction-badge live">Live</span>' :
              '<span class="prediction-badge">Predict</span>'}
        </div>
    `;
    
    if (!isFinished && !hasStarted) {
        card.addEventListener('click', () => {
            if (window.openPredictionModal) {
                window.openPredictionModal(match, matchId, null);
            }
        });
    }
    
    return card;
}

async function updateAdminGameweekSelectors() {
    const selectors = [
        document.getElementById('admin-results-gameweek'),
        document.getElementById('admin-payments-gameweek')
    ];
    
    selectors.forEach(selector => {
        if (selector) {
            selector.innerHTML = '<option value="">Select Gameweek...</option>';
            allGameweeks.forEach(gw => {
                const option = document.createElement('option');
                option.value = gw;
                option.textContent = `Gameweek ${gw}`;
                selector.appendChild(option);
            });
        }
    });
}
