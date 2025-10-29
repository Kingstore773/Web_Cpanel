// Updated config that uses database settings
import settingsDB from './database.js';

const config = {
    // Get settings from database
    get PANEL_DOMAIN() { return settingsDB.getPanelConfig().domain; },
    get PANEL_API_KEY() { return settingsDB.getPanelConfig().api_key; },
    get PANEL_CLIENT_API_KEY() { return settingsDB.getPanelConfig().client_key; },
    get PANEL_NEST_ID() { return settingsDB.getPanelConfig().nest_id; },
    get PANEL_LOCATION_ID() { return settingsDB.getPanelConfig().location_id; },

    // Eggs Configuration - From database
    get PANEL_EGGS() { return settingsDB.getEggs(); },

    // Resource Packages - From database
    get PANEL_RESOURCES() { return settingsDB.getResources(); },

    // Website Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'king-store-cpanel-private-secret-key-2024',
    JWT_EXPIRES_IN: '24h',

    // Admin Configuration - From database
    get ADMIN_USERNAME() { return settingsDB.getAdminCredentials().username; },
    get ADMIN_PASSWORD() { return settingsDB.getAdminCredentials().password; },

    // App Configuration
    get APP_NAME() { 
        const settings = settingsDB.getSettings();
        return settings?.website?.name || "King Store Cpanel Private";
    },
    get APP_VERSION() { 
        const settings = settingsDB.getSettings();
        return settings?.website?.version || "1.0.0";
    },

    // API Configuration
    API_TIMEOUT: 30000,
    MAX_RETRIES: 3
};

export default config;