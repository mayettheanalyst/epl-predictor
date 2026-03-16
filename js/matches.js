import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs, getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export let currentGameweek = 1;
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
        return [];
    }
}

export async function loadMatches(gameweek) {
    const container = document.getElementById('matches-list');
    
    container.innerHTML = '<div class="loading">Loading Gameweek ' + gameweek + '...</div>';
    
    try {
        console.log('🔍 Attempting to load matches for GW' + gameweek);
        
        const matchesRef = collection(db, 'matches');
        
        // Try query with orderBy
        const q = query(
            matchesRef,
            where('gameweek', '==', parseInt(gameweek)),
            orderBy('kickoffTime', 'asc')
        );
        
        console.log('📊 Running query...');
        const querySnapshot = await getDocs(q);
        
        console.log('✅ Query successful! Found', querySnapshot.size, 'matches');
        
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
        
        const userId = window.telegramUserId;
        console.log('User ID:', userId);
        
        querySnapshot.forEach((docSnap) => {
            const match = docSnap.data();
            const matchId = docSnap.id;
            
            console.log('Loading match:', match.homeTeam, 'vs', match.awayTeam);
            
            const card = createMatchCard(match, matchId, null);
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('❌ Full error:', error);
        
        let errorMessage = error.message;
        let solution = '';
        
        // Check for specific errors
        if (error.message.includes('index')) {
            errorMessage = 'Missing Firestore Index';
            solution = 'Click the link in browser console to create the index';
        } else if (error.message.includes('permission')) {
            errorMessage = 'Permission Denied';
            solution = 'Update Firestore Rules to allow read access';
        } else if (error.message.includes('kickoffTime')) {
            errorMessage = 'Invalid kickoffTime field';
            solution = 'Check that kickoffTime is a timestamp in Firebase';
        }
        
        container.innerHTML = `
            <div class="message error show" style="padding: 20px; text-align: left;">
                <strong style="color: #721c24; display: block; margin-bottom: 10px; font-size: 16px;">
                    ❌ Error Loading Matches
                </strong>
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0; font-family: monospace; font-size: 12px;">
                    ${errorMessage}
                </div>
                <div style="margin-top: 10px; font-size: 14px;">
                    <strong>💡 Solution:</strong><br>
                    ${solution || 'Check browser console for details'}
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f5c6cb; font-size: 13px;">
                    <strong>Debug Info:</strong><br>
                    Gameweek: ${gameweek}<br>
                    Error Code: ${error.code || 'N/A'}<br>
                    <small>To see full error details, open this app in a desktop browser and press F12</small>
                </div>
            </div>
        `;
    }
}

function createMatchCard(match, matchId, prediction) {
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
                window.openPredictionModal(match, matchId, prediction);
            }
        });
    }
    
    return card;
}

export async function getUserPrediction(userId, matchId) {
    try {
        if (!userId) return null;
        const predictionsRef = collection(db, 'predictions');
        const q = query(
            predictionsRef,
            where('userId', '==', userId),
            where('matchId', '==', matchId)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
        }
        return null;
    } catch (error) {
        console.error('Error getting prediction:', error);
        return null;
    }
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
