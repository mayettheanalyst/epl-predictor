import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export let currentGameweek = 1;
let allGameweeks = [];

// Load all gameweeks
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
        
        // Update admin gameweek selectors
        updateAdminGameweekSelectors();
        
        return allGameweeks;
    } catch (error) {
        console.error('Error loading gameweeks:', error);
        return [];
    }
}

// Load matches for a specific gameweek
export async function loadMatches(gameweek) {
    const container = document.getElementById('matches-list');
    container.innerHTML = '<div class="loading">Loading matches...</div>';
    
    try {
        const matchesRef = collection(db, 'matches');
        const q = query(
            matchesRef,
            where('gameweek', '==', gameweek),
            orderBy('kickoffTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = '<div class="message">No matches scheduled for this gameweek.</div>';
            return;
        }
        
        const userId = window.telegramUserId; // Get from global
        
        for (const docSnap of querySnapshot.docs) {
            const match = docSnap.data();
            const matchId = docSnap.id;
            
            // Check if user already predicted
            let userPrediction = null;
            if (userId) {
                userPrediction = await getUserPrediction(userId, matchId);
            }
            
            const card = createMatchCard(match, matchId, userPrediction);
            container.appendChild(card);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        container.innerHTML = '<div class="message error show">Error loading matches</div>';
    }
}

// Create match card element
function createMatchCard(match, matchId, prediction) {
    const card = document.createElement('div');
    card.className = 'match-card';
    
    const kickoff = match.kickoffTime?.toDate ? match.kickoffTime.toDate() : new Date(match.kickoffTime);
    const now = new Date();
    const hasStarted = now > kickoff;
    const isFinished = match.status === 'finished';
    
    if (isFinished) {
        card.classList.add('finished');
    } else if (prediction) {
        card.classList.add('predicted');
    }
    
    card.innerHTML = `
        <div class="match-header">
            <span>📅 ${kickoff.toLocaleDateString()}</span>
            <span>🕐 ${kickoff.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="match-teams">
            <div class="team home">${match.homeTeam}</div>
            <div class="vs">${isFinished ? `<span class="match-score">${match.realHomeScore} - ${match.realAwayScore}</span>` : 'VS'}</div>
            <div class="team away">${match.awayTeam}</div>
        </div>
        <div class="match-info">
            <div class="stadium">📍 ${match.stadium || 'TBD'}</div>
            ${isFinished ? '<span class="prediction-badge done">Finished</span>' : 
              hasStarted ? '<span class="prediction-badge live">Live</span>' :
              prediction ? '<span class="prediction-badge done">Predicted</span>' :
              '<span class="prediction-badge">Predict</span>'}
        </div>
    `;
    
    if (!isFinished && !hasStarted) {
        card.addEventListener('click', () => openPredictionModal(match, matchId, prediction));
    }
    
    return card;
}

// Get user's prediction for a match
export async function getUserPrediction(userId, matchId) {
    try {
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

// Save prediction
export async function savePrediction(userId, matchId, predHome, predAway) {
    try {
        const predictionsRef = collection(db, 'predictions');
        
        // Check if prediction already exists
        const existingPred = await getUserPrediction(userId, matchId);
        
        if (existingPred) {
            // Update existing prediction
            const predRef = doc(db, 'predictions', existingPred.id);
            await updateDoc(predRef, {
                predHome,
                predAway,
                submittedAt: new Date().toISOString()
            });
        } else {
            // Create new prediction
            await addDoc(predictionsRef, {
                userId,
                matchId,
                predHome,
                predAway,
                points: 0,
                submittedAt: new Date().toISOString()
            });
        }
        
        return true;
    } catch (error) {
        console.error('Error saving prediction:', error);
        throw error;
    }
}

// Add new matches (Admin)
export async function addMatches(matches, gameweek, season) {
    try {
        const matchesRef = collection(db, 'matches');
        const addedIds = [];
        
        for (const match of matches) {
            const docRef = await addDoc(matchesRef, {
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                kickoffTime: new Date(match.kickoffTime),
                stadium: match.stadium || '',
                gameweek: gameweek,
                season: season,
                status: 'scheduled',
                realHomeScore: null,
                realAwayScore: null,
                createdAt: new Date().toISOString()
            });
            addedIds.push(docRef.id);
        }
        
        return addedIds;
    } catch (error) {
        console.error('Error adding matches:', error);
        throw error;
    }
}

// Update match results (Admin)
export async function updateMatchResults(results) {
    try {
        for (const result of results) {
            const matchRef = doc(db, 'matches', result.matchId);
            await updateDoc(matchRef, {
                realHomeScore: result.homeScore,
                realAwayScore: result.awayScore,
                status: 'finished'
            });
        }
        return true;
    } catch (error) {
        console.error('Error updating results:', error);
        throw error;
    }
}

// Get matches for admin gameweek selector
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

// Open prediction modal (global function)
window.openPredictionModal = function(match, matchId, existingPrediction) {
    const modal = document.getElementById('prediction-modal');
    document.getElementById('modal-match-title').textContent = `${match.homeTeam} vs ${match.awayTeam}`;
    document.getElementById('modal-home-team').textContent = match.homeTeam;
    document.getElementById('modal-away-team').textContent = match.awayTeam;
    
    if (existingPrediction) {
        document.getElementById('pred-home').value = existingPrediction.predHome;
        document.getElementById('pred-away').value = existingPrediction.predAway;
    } else {
        document.getElementById('pred-home').value = 0;
        document.getElementById('pred-away').value = 0;
    }
    
    document.getElementById('prediction-message').classList.remove('show');
    modal.classList.add('active');
    
    // Store current match info for submission
    window.currentPredictionMatchId = matchId;
};

// Close modal
document.querySelector('.close-modal')?.addEventListener('click', () => {
    document.getElementById('prediction-modal').classList.remove('active');
});

// Submit prediction
document.getElementById('submit-prediction')?.addEventListener('click', async () => {
    const predHome = parseInt(document.getElementById('pred-home').value);
    const predAway = parseInt(document.getElementById('pred-away').value);
    const messageEl = document.getElementById('prediction-message');
    const userId = window.telegramUserId;
    
    if (!userId) {
        messageEl.textContent = '❌ Error: User not authenticated';
        messageEl.className = 'message error show';
        return;
    }
    
    try {
        await savePrediction(userId, window.currentPredictionMatchId, predHome, predAway);
        
        messageEl.textContent = '✅ Prediction saved successfully!';
        messageEl.className = 'message success show';
        
        setTimeout(() => {
            document.getElementById('prediction-modal').classList.remove('active');
            loadMatches(currentGameweek);
        }, 1500);
    } catch (error) {
        messageEl.textContent = '❌ Error saving prediction';
        messageEl.className = 'message error show';
    }
});
