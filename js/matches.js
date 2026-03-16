import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function loadGameweeks() {
    return [31];
}

export async function loadMatches(gameweek) {
    const container = document.getElementById('matches-list');
    if (!container) {
        console.error('❌ Container not found');
        return;
    }
    
    container.innerHTML = '<div style="padding:20px;text-align:center;">Loading matches...</div>';
    
    try {
        console.log('🔍 Querying ALL matches (no filters)...');
        
        // NO filters, NO orderBy - just get everything
        const matchesRef = collection(db, 'matches');
        const snapshot = await getDocs(matchesRef);
        
        console.log('✅ Query successful! Total matches:', snapshot.size);
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div style="padding:20px;background:#fff3cd;border-radius:8px;text-align:center;">
                    ⚠️ Database is empty - No matches found<br><br>
                    Add matches from Admin panel
                </div>
            `;
            return;
        }
        
        // Show count
        const countDiv = document.createElement('div');
        countDiv.style.cssText = 'padding:10px;background:#d4edda;border-radius:8px;margin-bottom:15px;text-align:center;';
        countDiv.innerHTML = `✅ Found ${snapshot.size} match(es) in database`;
        container.appendChild(countDiv);
        
        // Display all matches
        snapshot.forEach((docSnap, index) => {
            const match = docSnap.data();
            const matchId = docSnap.id;
            
            console.log(`\n📊 Match #${index + 1}:`);
            console.log('  ID:', matchId);
            console.log('  Home:', match.homeTeam);
            console.log('  Away:', match.awayTeam);
            console.log('  Gameweek:', match.gameweek, '(type:', typeof match.gameweek + ')');
            console.log('  Status:', match.status);
            console.log('  Kickoff:', match.kickoffTime);
            console.log('---');
            
            const card = document.createElement('div');
            card.style.cssText = 'background:white;border-radius:12px;padding:15px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.1);';
            
            let kickoffDisplay = 'TBD';
            if (match.kickoffTime) {
                try {
                    const date = match.kickoffTime.toDate ? match.kickoffTime.toDate() : new Date(match.kickoffTime);
                    kickoffDisplay = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                } catch(e) {
                    kickoffDisplay = 'Invalid date';
                }
            }
            
            card.innerHTML = `
                <div style="font-weight:bold;margin-bottom:10px;">
                    ${match.homeTeam || 'Unknown'} vs ${match.awayTeam || 'Unknown'}
                </div>
                <div style="font-size:13px;color:#666;">
                    <div>📅 ${kickoffDisplay}</div>
                    <div>🏆 Gameweek: ${match.gameweek}</div>
                    <div>📍 ${match.stadium || 'TBD'}</div>
                    <div>📊 Status: ${match.status || 'unknown'}</div>
                </div>
            `;
            
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('❌ Error loading matches:', error);
        container.innerHTML = `
            <div style="padding:20px;background:#f8d7da;color:#721c24;border-radius:8px;">
                ❌ Error: ${error.message}<br><br>
                <strong>Check browser console (F12) for details</strong>
            </div>
        `;
    }
}
