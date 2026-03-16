import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function loadGameweeks() {
    return [31]; // Simplified
}

export async function loadMatches(gameweek) {
    const container = document.getElementById('matches-list');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center;padding:20px;">Loading...</p>';
    
    try {
        const matchesRef = collection(db, 'matches');
        const q = query(
            matchesRef,
            where('gameweek', '==', parseInt(gameweek)),
            orderBy('kickoffTime', 'asc')
        );
        
        const snapshot = await getDocs(q);
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; background: #fff3cd; border-radius: 8px; margin: 10px;">
                    ⚠️ No matches for Gameweek ${gameweek}
                </div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const match = doc.data();
            const card = document.createElement('div');
            card.style.cssText = 'background: white; border-radius: 12px; padding: 15px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
            
            let kickoffDate;
            if (match.kickoffTime?.toDate) {
                kickoffDate = match.kickoffTime.toDate();
            } else {
                kickoffDate = new Date(match.kickoffTime || Date.now());
            }
            
            const isFinished = match.status === 'finished';
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 12px; color: #666;">
                    <span>📅 ${kickoffDate.toLocaleDateString()}</span>
                    <span>🕐 ${kickoffDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                    <span>${match.homeTeam}</span>
                    <span style="color: #666;">VS</span>
                    <span>${match.awayTeam}</span>
                </div>
                <div style="margin-top: 10px; font-size: 13px; color: #666; display: flex; justify-content: space-between;">
                    <span>📍 ${match.stadium || 'TBD'}</span>
                    <span style="background: ${isFinished ? '#d4edda' : '#2481cc'}; color: ${isFinished ? '#155724' : 'white'}; padding: 4px 10px; border-radius: 12px;">
                        ${isFinished ? 'Finished' : 'Predict'}
                    </span>
                </div>
            `;
            
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading matches:', error);
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; background: #f8d7da; color: #721c24; border-radius: 8px; margin: 10px;">
                ❌ Error loading matches<br>
                <small style="font-size: 12px;">${error.message}</small><br><br>
                <strong>Try:</strong><br>
                1. Open in desktop browser<br>
                2. Press F12 and check console<br>
                3. Check Firestore rules allow read
            </div>
        `;
    }
}
