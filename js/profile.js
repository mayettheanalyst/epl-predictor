import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getUserData, updateUserData } from './auth.js';

// Load user profile
export async function loadProfile(userId) {
    try {
        const user = await getUserData(userId);
        
        if (user) {
            // Update profile display
            document.getElementById('profile-name').textContent = user.displayName || 'User';
            document.getElementById('profile-username').textContent = user.username ? `@${user.username}` : `User ${userId}`;
            document.getElementById('profile-avatar-letter').textContent = (user.displayName || 'U')[0].toUpperCase();
            document.getElementById('profile-favorite-team').textContent = user.favoriteTeam || 'Not set';
            document.getElementById('profile-wins').textContent = user.totalWins || 0;
            document.getElementById('profile-losses').textContent = user.totalLosses || 0;
            document.getElementById('profile-points').textContent = user.totalPoints || 0;
            
            // Payment status
            const paymentStatus = document.getElementById('profile-payment-status');
            if (user.isPaid) {
                paymentStatus.textContent = '✅ Paid';
                paymentStatus.className = 'status-paid';
            } else {
                paymentStatus.textContent = '❌ Not Paid';
                paymentStatus.className = 'status-pending';
            }
            
            // Join date
            if (user.createdAt) {
                const joinDate = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                document.getElementById('profile-join-date').textContent = joinDate.toLocaleDateString();
            }
            
            // Pre-fill edit form
            document.getElementById('edit-display-name').value = user.displayName || '';
            document.getElementById('edit-favorite-team').value = user.favoriteTeam || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Update user profile
export async function updateProfile(userId, data) {
    return await updateUserData(userId, data);
}

// Edit profile modal
document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    document.getElementById('edit-profile-modal').classList.add('active');
});

document.querySelectorAll('#edit-profile-modal .close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('edit-profile-modal').classList.remove('active');
    });
});

document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
    const displayName = document.getElementById('edit-display-name').value.trim();
    const favoriteTeam = document.getElementById('edit-favorite-team').value;
    const messageEl = document.getElementById('profile-message');
    
    if (!displayName) {
        messageEl.textContent = '❌ Display name is required';
        messageEl.className = 'message error show';
        return;
    }
    
    try {
        await updateProfile(userId, {
            displayName,
            favoriteTeam
        });
        
        messageEl.textContent = '✅ Profile updated successfully!';
        messageEl.className = 'message success show';
        
        setTimeout(() => {
            document.getElementById('edit-profile-modal').classList.remove('active');
            loadProfile(userId);
        }, 1500);
    } catch (error) {
        messageEl.textContent = '❌ Error updating profile';
        messageEl.className = 'message error show';
    }
});