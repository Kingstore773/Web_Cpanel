import fs from 'fs';
import path from 'path';

// Simple JSON-based database for settings
class SettingsDB {
    constructor() {
        this.dbPath = path.join(process.cwd(), 'data', 'settings.json');
        this.ensureDBExists();
    }

    ensureDBExists() {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(this.dbPath)) {
            const defaultSettings = {
                panel: {
                    domain: 'server-panel-v2.kingstoree.web.id',
                    api_key: 'ptla_cnddSfUY8dudg6I4UymKG6jLi1skB0HApATJjO2rqBv',
                    client_key: 'ptlc_Uj5Km1vc9bKvQpyqRlLV7W0CRWUYy9YAcXCjBTGEAuC',
                    nest_id: '5',
                    location_id: '1'
                },
                eggs: {
                    python: "16",
                    nodejs: "15",
                    minecraft: "1",
                    discord: "2",
                    website: "3",
                    php: "4",
                    java: "5"
                },
                resources: {
                    "1gb": {"ram": 1000, "disk": 1000, "cpu": 40, "price": 15000},
                    "2gb": {"ram": 2000, "disk": 1000, "cpu": 60, "price": 25000},
                    "3gb": {"ram": 3000, "disk": 2000, "cpu": 80, "price": 35000},
                    "4gb": {"ram": 4000, "disk": 2000, "cpu": 100, "price": 45000},
                    "5gb": {"ram": 5000, "disk": 3000, "cpu": 120, "price": 55000},
                    "6gb": {"ram": 6000, "disk": 3000, "cpu": 140, "price": 65000},
                    "7gb": {"ram": 7000, "disk": 4000, "cpu": 160, "price": 75000},
                    "8gb": {"ram": 8000, "disk": 4000, "cpu": 180, "price": 85000},
                    "9gb": {"ram": 9000, "disk": 5000, "cpu": 200, "price": 95000},
                    "10gb": {"ram": 10000, "disk": 5000, "cpu": 220, "price": 105000},
                    "unlimited": {"ram": 0, "disk": 0, "cpu": 0, "price": 200000}
                },
                admin: {
                    username: "admin",
                    password: "admin001" // Will be hashed in production
                },
                website: {
                    name: "King Store Cpanel Private",
                    version: "1.0.0"
                }
            };
            this.saveSettings(defaultSettings);
        }
    }

    getSettings() {
        try {
            const data = fs.readFileSync(this.dbPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading settings:', error);
            return null;
        }
    }

    saveSettings(settings) {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(settings, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        return this.saveSettings(updatedSettings);
    }

    getPanelConfig() {
        const settings = this.getSettings();
        return settings?.panel || {};
    }

    getEggs() {
        const settings = this.getSettings();
        return settings?.eggs || {};
    }

    getResources() {
        const settings = this.getSettings();
        return settings?.resources || {};
    }

    getAdminCredentials() {
        const settings = this.getSettings();
        return settings?.admin || {};
    }
}

export default new SettingsDB();