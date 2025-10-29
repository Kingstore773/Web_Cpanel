// King Store Cpanel Private - Panel Creation JavaScript

class PanelCreator {
    constructor() {
        this.form = document.getElementById('createPanelForm');
        this.preview = document.getElementById('panelPreview');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.setupEventListeners();
            this.updatePreview();
        }
    }

    setupEventListeners() {
        // Real-time form validation and preview updates
        const inputs = this.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
            input.addEventListener('change', () => this.updatePreview());
        });

        // Package selection
        const packageSelect = document.getElementById('package');
        if (packageSelect) {
            packageSelect.addEventListener('change', (e) => this.updatePackageDetails(e.target.value));
        }

        // Egg selection
        const eggSelect = document.getElementById('egg');
        if (eggSelect) {
            eggSelect.addEventListener('change', (e) => this.updateEggDetails(e.target.value));
        }
    }

    updatePackageDetails(packageType) {
        const packageDetails = document.getElementById('packageDetails');
        const packages = {
            '1gb': { ram: '1GB', disk: '1GB', cpu: '40%', price: 'Rp 15.000' },
            '2gb': { ram: '2GB', disk: '1GB', cpu: '60%', price: 'Rp 25.000' },
            '3gb': { ram: '3GB', disk: '2GB', cpu: '80%', price: 'Rp 35.000' },
            '4gb': { ram: '4GB', disk: '2GB', cpu: '100%', price: 'Rp 45.000' },
            '5gb': { ram: '5GB', disk: '3GB', cpu: '120%', price: 'Rp 55.000' },
            'unlimited': { ram: 'Unlimited', disk: 'Unlimited', cpu: 'Unlimited', price: 'Rp 200.000' }
        };

        const pkg = packages[packageType];
        if (pkg && packageDetails) {
            packageDetails.innerHTML = `
                <div class="package-features">
                    <div class="feature">
                        <span class="feature-label">RAM:</span>
                        <span class="feature-value">${pkg.ram}</span>
                    </div>
                    <div class="feature">
                        <span class="feature-label">Disk:</span>
                        <span class="feature-value">${pkg.disk}</span>
                    </div>
                    <div class="feature">
                        <span class="feature-label">CPU:</span>
                        <span class="feature-value">${pkg.cpu}</span>
                    </div>
                    <div class="feature">
                        <span class="feature-label">Price:</span>
                        <span class="feature-value price">${pkg.price}</span>
                    </div>
                </div>
            `;
        }
    }

    updateEggDetails(eggType) {
        const eggDetails = document.getElementById('eggDetails');
        const eggs = {
            'python': { 
                name: 'Python Application',
                description: 'Perfect for Python web applications, bots, and scripts',
                version: 'Python 3.11',
                features: ['Web Applications', 'Bots', 'Automation Scripts']
            },
            'nodejs': { 
                name: 'Node.js Application',
                description: 'Ideal for Node.js applications, APIs, and real-time apps',
                version: 'Node.js 20',
                features: ['APIs', 'Real-time Apps', 'Web Services']
            },
            'minecraft': { 
                name: 'Minecraft Server',
                description: 'Dedicated Minecraft game server with Java support',
                version: 'Java 17',
                features: ['Game Server', 'Mod Support', 'Multiplayer']
            },
            'discord': { 
                name: 'Discord Bot',
                description: 'Specialized environment for Discord bot development',
                version: 'Node.js 18',
                features: ['Bot Hosting', 'Real-time Events', 'API Integration']
            }
        };

        const egg = eggs[eggType];
        if (egg && eggDetails) {
            eggDetails.innerHTML = `
                <div class="egg-info">
                    <h4>${egg.name}</h4>
                    <p class="egg-description">${egg.description}</p>
                    <div class="egg-version">Version: ${egg.version}</div>
                    <div class="egg-features">
                        ${egg.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }

    updatePreview() {
        if (!this.preview) return;

        const formData = new FormData(this.form);
        const username = formData.get('username') || 'username';
        const email = formData.get('email') || 'user@example.com';
        const packageType = formData.get('package') || '1gb';
        const eggType = formData.get('egg') || 'nodejs';

        const packageNames = {
            '1gb': '1GB Package',
            '2gb': '2GB Package', 
            '3gb': '3GB Package',
            '4gb': '4GB Package',
            '5gb': '5GB Package',
            'unlimited': 'Unlimited Package'
        };

        const eggNames = {
            'python': 'Python App',
            'nodejs': 'Node.js App',
            'minecraft': 'Minecraft Server',
            'discord': 'Discord Bot'
        };

        this.preview.innerHTML = `
            <div class="preview-card">
                <div class="preview-header">
                    <h3>Panel Preview</h3>
                    <div class="status-badge creating">Creating</div>
                </div>
                <div class="preview-content">
                    <div class="preview-field">
                        <label>Username:</label>
                        <span>${username}</span>
                    </div>
                    <div class="preview-field">
                        <label>Email:</label>
                        <span>${email}</span>
                    </div>
                    <div class="preview-field">
                        <label>Package:</label>
                        <span>${packageNames[packageType] || packageType}</span>
                    </div>
                    <div class="preview-field">
                        <label>Application:</label>
                        <span>${eggNames[eggType] || eggType}</span>
                    </div>
                    <div class="preview-field">
                        <label>Password:</label>
                        <span class="password-field">••••••••</span>
                    </div>
                </div>
                <div class="preview-footer">
                    <div class="preview-note">
                        ⚡ Panel will be ready in 1-2 minutes
                    </div>
                </div>
            </div>
        `;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            package: formData.get('package'),
            egg: formData.get('egg')
        };

        // Validation
        if (!this.validateForm(data)) {
            return;
        }

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="loading-spinner"></div> Creating Panel...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/panel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(result.data);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('Create panel error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateForm(data) {
        // Clear previous errors
        this.clearErrors();

        let isValid = true;

        // Username validation
        if (!data.username) {
            this.showError('username', 'Username is required');
            isValid = false;
        } else if (data.username.length < 3) {
            this.showError('username', 'Username must be at least 3 characters');
            isValid = false;
        } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
            this.showError('username', 'Username can only contain letters, numbers, and underscores');
            isValid = false;
        }

        // Email validation
        if (!data.email) {
            this.showError('email', 'Email is required');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            this.showError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Package validation
        if (!data.package) {
            this.showError('package', 'Please select a package');
            isValid = false;
        }

        // Egg validation
        if (!data.egg) {
            this.showError('egg', 'Please select an application type');
            isValid = false;
        }

        return isValid;
    }

    showError(field, message) {
        const input = this.form.querySelector(`[name="${field}"]`);
        const formGroup = input.closest('.form-group');
        
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        input.classList.add('error');
    }

    clearErrors() {
        const errors = this.form.querySelectorAll('.error-message');
        const inputs = this.form.querySelectorAll('.error');
        
        errors.forEach(error => error.remove());
        inputs.forEach(input => input.classList.remove('error'));
    }

    showSuccess(panelData) {
        const successHTML = `
            <div class="success-card">
                <div class="success-header">
                    <div class="success-icon">✅</div>
                    <h3>Panel Created Successfully!</h3>
                </div>
                <div class="success-content">
                    <div class="success-field">
                        <label>Panel URL:</label>
                        <a href="${panelData.panel.url}" target="_blank">${panelData.panel.url}</a>
                    </div>
                    <div class="success-field">
                        <label>Username:</label>
                        <span>${panelData.user.username}</span>
                    </div>
                    <div class="success-field">
                        <label>Password:</label>
                        <span class="password-display">${panelData.user.password}</span>
                        <button class="btn-copy" onclick="copyToClipboard('${panelData.user.password}')">📋</button>
                    </div>
                    <div class="success-field">
                        <label>Server ID:</label>
                        <span>${panelData.server.id}</span>
                    </div>
                    <div class="success-note">
                        💡 Save these credentials securely. The password won't be shown again.
                    </div>
                </div>
                <div class="success-actions">
                    <button class="btn btn-primary" onclick="window.location.href='/admin/servers'">
                        🖥️ View Servers
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.success-card').remove(); document.getElementById('createPanelForm').reset(); updatePreview();">
                        ➕ Create Another
                    </button>
                </div>
            </div>
        `;

        this.preview.innerHTML = successHTML;
        this.form.reset();
        this.updatePreview();
    }

    showError(message) {
        const errorHTML = `
            <div class="error-card">
                <div class="error-header">
                    <div class="error-icon">❌</div>
                    <h3>Creation Failed</h3>
                </div>
                <div class="error-content">
                    <p>${message}</p>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="this.closest('.error-card').remove()">
                        Try Again
                    </button>
                </div>
            </div>
        `;

        this.preview.innerHTML = errorHTML;
    }
}

// Utility function to copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Password copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy password', 'error');
    });
}

// Show alert function
function showAlert(message, type) {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 300px;
    `;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    // Remove after 3 seconds
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PanelCreator();
});

// Export for global access
window.PanelCreator = PanelCreator;
window.copyToClipboard = copyToClipboard;
window.showAlert = showAlert;