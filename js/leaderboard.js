import { db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Load leaderboard for specific gameweek
export async function loadLeaderboard(gameweek) {
    const container = document.getElementById('leaderboard-list');
    container.innerHTML = '<div class="loading">Loading leaderboard...</div>';
    
    try {
        // Get all matches for this gameweek
        const matchesRef = collection(db, 'matches');
        const matchesQuery = query(matchesRef, where('gameweek', '==', gameweek));
        const matchesSnapshot = await getDocs(matchesQuery);
        
        const matchIds = [];
        matchesSnapshot.forEach(doc => {
            matchIds.push(doc.id);
        });
        
        if (matchIds.length === 0) {
            container.innerHTML = '<div class="message">No matches for this gameweek yet.</div>';
            return;
        }
        
        // Get all predictions for these matches
        const predictionsRef = collection(db, 'predictions');
        const predictionsQuery = query(predictionsRef, where('matchId', 'in', matchIds));
        const predictionsSnapshot = await getDocs(predictionsQuery);
        
        // Calculate points for each user
        const userScores = {};
        
        for (const predDoc of predictionsSnapshot.docs) {
            const pred = predDoc.data();
            const match = await getMatchData(pred.matchId);
            
            if (match && match.status === 'finished') {
                const points = calculatePoints(
                    pred.predHome,
                    pred.predAway,
                    match.realHomeScore,
                    match.realAwayScore
                );
                
                if (!userScores[pred.userId]) {
                    userScores[pred.userId] = {
                        userId: pred.userId,
                        displayName: pred.displayName || 'Unknown',
                        totalPoints: 0,
                        predictions: 0
                    };
                }
                
                userScores[pred.userId].totalPoints += points;
                userScores[pred.userId].predictions += 1;
            }
        }
        
        // Convert to array and sort
        const leaderboard = Object.values(userScores).sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            return a.predictions - b.predictions; // Fewer predictions = better rank (tiebreaker)
        });
        
        // Display leaderboard
        container.innerHTML = '';
        
        if (leaderboard.length === 0) {
            container.innerHTML = '<div class="message">No predictions yet for this gameweek.</div>';
            return;
        }
        
        leaderboard.forEach((entry, index) => {
            const item = createLeaderboardItem(entry, index);
            container.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        container.innerHTML = '<div class="message error show">Error loading leaderboard</div>';
    }
}

// Get match data
async function getMatchData(matchId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const matchRef = doc(db, 'matches', matchId);
        const matchSnap = await getDoc(matchRef);
        
        if (matchSnap.exists()) {
            return matchSnap.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting match data:', error);
        return null;
    }
}

// Calculate points
function calculatePoints(predHome, predAway, realHome, realAway) {
    // Exact score = 5 points
    if (predHome === realHome && predAway === realAway) {
        return 5;
    }
    
    // Correct outcome = 3 points
    const predDiff = predHome - predAway;
    const realDiff = realHome - realAway;
    
    if ((predDiff > 0 && realDiff > 0) ||
        (predDiff < 0 && realDiff < 0) ||
        (predDiff === 0 && realDiff === 0)) {
        return 3;
    }
    
    return 0;
}

// Create leaderboard item element
function createLeaderboardItem(entry, index) {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    
    let rankClass = '';
    let rankEmoji = '';
    
    if (index === 0) { rankClass = 'gold'; rankEmoji = '🥇'; }
    else if (index === 1) { rankClass = 'silver'; rankEmoji = '🥈'; }
    else if (index === 2) { rankClass = 'bronze'; rankEmoji = '🥉'; }
    
    item.innerHTML = `
        <div class="rank ${rankClass}">${rankEmoji || index + 1}</div>
        <div class="user-info">
            <div class="user-name">${entry.displayName}</div>
            <div class="user-stats">${entry.predictions} predictions</div>
        </div>
        <div class="user-points">${entry.totalPoints} pts</div>
    `;
    
    return item;
}