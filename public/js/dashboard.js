// King Store Cpanel Private - Dashboard JavaScript

// Authentication check
async function checkAuth() {
    try {
        const response = await fetch('/api/auth', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (!result.success) {
            window.location.href = '/login';
            return;
        }

        // Update user info
        if (result.user) {
            document.getElementById('userName').textContent = result.user.username;
            document.getElementById('welcomeName').textContent = result.user.username;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            // Update stats
            document.getElementById('totalUsers').textContent = result.data.totalUsers || 0;
            document.getElementById('totalServers').textContent = result.data.totalServers || 0;
            document.getElementById('activeServers').textContent = result.data.activeServers || 0;
            document.getElementById('totalNodes').textContent = result.data.totalNodes || 0;
            
            // Update badge counts
            document.getElementById('usersCount').textContent = result.data.totalUsers || 0;
            document.getElementById('serversCount').textContent = result.data.totalServers || 0;
        } else {
            showAlert('Failed to load dashboard stats: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
        showAlert('Network error while loading stats', 'error');
    }
}

// Load recent activity
async function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    
    try {
        // Simulate loading recent activity
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-text">New panel created: testuser</div>
                    <div class="activity-time">2 minutes ago</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-text">User registration: john_doe</div>
                    <div class="activity-time">5 minutes ago</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-text">Server node-01 is now online</div>
                    <div class="activity-time">10 minutes ago</div>
                </div>
            </div>
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-text">System backup completed successfully</div>
                    <div class="activity-time">1 hour ago</div>
                </div>
            </div>
        `;
    } catch (error) {
        activityList.innerHTML = `
            <div class="activity-item">
                <div class="activity-content">
                    <div class="activity-text">Failed to load recent activity</div>
                    <div class="activity-time">Just now</div>
                </div>
            </div>
        `;
    }
}

// Check system status
async function checkSystemStatus() {
    try {
        const response = await fetch('/api/admin', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            document.getElementById('panelStatus').textContent = 'Online';
            document.querySelector('#panelStatus').closest('.status-item').querySelector('.status-indicator').className = 'status-indicator online';
        } else {
            throw new Error('Panel offline');
        }
    } catch (error) {
        document.getElementById('panelStatus').textContent = 'Offline';
        document.querySelector('#panelStatus').closest('.status-item').querySelector('.status-indicator').className = 'status-indicator offline';
    }

    // Simulate database and nodes status (in real app, these would be actual API calls)
    setTimeout(() => {
        document.getElementById('dbStatus').textContent = 'Connected';
        document.querySelector('#dbStatus').closest('.status-item').querySelector('.status-indicator').className = 'status-indicator online';
        
        document.getElementById('nodesStatus').textContent = '2 Nodes Online';
        document.querySelector('#nodesStatus').closest('.status-item').querySelector('.status-indicator').className = 'status-indicator online';
    }, 1000);
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button onclick="document.getElementById('${alertId}').remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit;">
                ×
            </button>
        </div>
    `;
    alert.id = alertId;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.getElementById(alertId)) {
            document.getElementById(alertId).remove();
        }
    }, 5000);
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/auth', {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();
        
        if (result.success) {
            window.location.href = '/login';
        } else {
            showAlert('Logout failed: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showAlert('Network error during logout', 'error');
    }
}

// Export functions for global access
window.checkAuth = checkAuth;
window.loadDashboardStats = loadDashboardStats;
window.loadRecentActivity = loadRecentActivity;
window.checkSystemStatus = checkSystemStatus;
window.showAlert = showAlert;
window.logout = logout;