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
        updateAdminGameweekSelectors();
        return allGameweeks;
    } catch (error) {
        console.error('Error loading gameweeks:', error);
        return [31];
    }
}

export async function loadMatches(gameweek) {
    const container = document.getElementById('matches-list');
    if (!container) {
        console.error('❌ matches-list container not found');
        return;
    }
    
    container.innerHTML = '<div style="padding:20px;text-align:center;">Loading Gameweek ' + gameweek + '...</div>';
    
    try {
        console.log('🔍 Loading matches for GW' + gameweek);
        
        const matchesRef = collection(db, 'matches');
        
        // Simple query - filter by gameweek only
        const q = query(
            matchesRef,
            where('gameweek', '==', parseInt(gameweek))
            // Removed orderBy to avoid index requirement
        );
        
        const querySnapshot = await getDocs(q);
        
        console.log('✅ Found', querySnapshot.size, 'matches for GW' + gameweek);
        
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = `
                <div style="padding:20px;background:#fff3cd;border-radius:8px;text-align:center;">
                    ⚠️ No matches for Gameweek ${gameweek}<br><br>
                    💡 Use ◀ ▶ arrows to switch gameweeks<br>
                    💡 Or add matches from Admin panel
                </div>
            `;
            return;
        }
        
        // Display each match
        querySnapshot.forEach((docSnap) => {
            const match = docSnap.data();
            const matchId = docSnap.id;
            
            console.log('Match:', match.homeTeam, 'vs', match.awayTeam);
            
            const card = createMatchCard(match, matchId);
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('❌ Error loading matches:', error);
        
        container.innerHTML = `
            <div style="padding:20px;background:#f8d7da;color:#721c24;border-radius:8px;">
                ❌ Error: ${error.message}<br><br>
                <strong>Troubleshooting:</strong><br>
                1. Open in desktop browser<br>
                2. Press F12 → Console tab<br>
                3. Check for red errors<br>
                4. Verify Firestore rules allow read
            </div>
        `;
    }
}

function createMatchCard(match, matchId) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.style.cssText = 'background:white;border-radius:12px;padding:15px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);cursor:pointer;';
    
    // Handle kickoff time
    let kickoffDisplay = 'TBD';
    if (match.kickoffTime) {
        try {
            const date = match.kickoffTime.toDate 
                ? match.kickoffTime.toDate() 
                : new Date(match.kickoffTime);
            kickoffDisplay = date.toLocaleDateString() + ' ' + 
                date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
        } catch(e) {
            kickoffDisplay = 'Date error';
        }
    }
    
    const isFinished = match.status === 'finished';
    
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:12px;color:#666;">
            <span>📅 ${kickoffDisplay}</span>
            ${isFinished ? '<span style="color:#2e7d32;font-weight:bold;">✅ Finished</span>' : ''}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-weight:bold;font-size:16px;">
            <span style="text-align:left;flex:1;">${match.homeTeam}</span>
            <span style="color:#666;padding:0 10px;">
                ${isFinished ? `<strong>${match.realHomeScore ?? 0} - ${match.realAwayScore ?? 0}</strong>` : 'VS'}
            </span>
            <span style="text-align:right;flex:1;">${match.awayTeam}</span>
        </div>
        <div style="margin-top:12px;font-size:13px;color:#666;display:flex;justify-content:space-between;align-items:center;">
            <span>📍 ${match.stadium || 'TBD'}</span>
            <span style="background:${isFinished ? '#d4edda' : '#2481cc'};color:${isFinished ? '#155724' : 'white'};padding:4px 12px;border-radius:12px;font-size:11px;font-weight:bold;">
                ${isFinished ? 'Finished' : 'Predict'}
            </span>
        </div>
    `;
    
    // Add click handler for predictions (only if not finished)
    if (!isFinished) {
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
