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
        
        // Try WITHOUT orderBy first
        const q = query(
            matchesRef,
            where('gameweek', '==', 31)  // Hardcode to 31 for testing
        );
        
        console.log('🔍 Querying for GW31...');
        const snapshot = await getDocs(q);
        
        console.log('📊 Found:', snapshot.size, 'matches');
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            // Try querying ALL matches to see what's there
            const allMatches = await getDocs(matchesRef);
            console.log('Total matches in DB:', allMatches.size);
            allMatches.forEach(doc => {
                console.log('Match:', doc.data());
            });
            
            container.innerHTML = `
                <div style="padding: 20px; background: #fff3cd; border-radius: 8px;">
                    ⚠️ No matches for GW31<br><br>
                    Total matches in database: ${allMatches.size}<br><br>
                    <small>Check console (F12) to see all matches</small>
                </div>
            `;
            return;
        }
        
        // Display matches...
        snapshot.forEach(doc => {
            const match = doc.data();
            // ... rest of display code
        });
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div style="padding:20px;background:#f8d7da;border-radius:8px;">❌ ${error.message}</div>`;
    }
}
