import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../utils/config.js';
import pterodactyl from '../utils/pterodactyl.js';
import settingsDB from '../utils/database.js';
import bcrypt from 'bcryptjs';

function verifyAdmin(req) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token;

    if (!token) {
        throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (!decoded.isAdmin) {
        throw new Error('Admin access required');
    }

    return decoded;
}

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        verifyAdmin(req);

        if (req.method === 'GET') {
            // Get all settings (without sensitive data)
            const settings = settingsDB.getSettings();
            
            // Don't expose API keys and passwords in response
            const safeSettings = {
                ...settings,
                panel: {
                    ...settings.panel,
                    api_key: '••••••••' + (settings.panel.api_key || '').slice(-4),
                    client_key: '••••••••' + (settings.panel.client_key || '').slice(-4)
                },
                admin: {
                    username: settings.admin?.username,
                    // Don't expose password
                }
            };

            return res.status(200).json({
                success: true,
                data: safeSettings
            });

        } else if (req.method === 'POST') {
            const { action, data, section } = req.body;

            if (action === 'update_settings') {
                // Update specific settings section
                if (!section || !data) {
                    return res.status(400).json({
                        success: false,
                        message: 'Section and data are required'
                    });
                }

                try {
                    const currentSettings = settingsDB.getSettings();
                    const updatedSettings = {
                        ...currentSettings,
                        [section]: {
                            ...currentSettings[section],
                            ...data
                        }
                    };

                    const success = settingsDB.saveSettings(updatedSettings);

                    if (success) {
                        return res.status(200).json({
                            success: true,
                            message: 'Settings updated successfully'
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to save settings'
                        });
                    }

                } catch (error) {
                    console.error('Error updating settings:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating settings: ' + error.message
                    });
                }

            } else if (action === 'update_egg') {
                // Update specific egg
                const { eggKey, eggId } = data;

                if (!eggKey || !eggId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Egg key and ID are required'
                    });
                }

                try {
                    const currentSettings = settingsDB.getSettings();
                    const updatedEggs = {
                        ...currentSettings.eggs,
                        [eggKey]: eggId
                    };

                    const updatedSettings = {
                        ...currentSettings,
                        eggs: updatedEggs
                    };

                    const success = settingsDB.saveSettings(updatedSettings);

                    if (success) {
                        return res.status(200).json({
                            success: true,
                            message: `Egg ${eggKey} updated successfully`
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update egg'
                        });
                    }

                } catch (error) {
                    console.error('Error updating egg:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating egg: ' + error.message
                    });
                }

            } else if (action === 'update_resource') {
                // Update resource package
                const { packageKey, resourceData } = data;

                if (!packageKey || !resourceData) {
                    return res.status(400).json({
                        success: false,
                        message: 'Package key and resource data are required'
                    });
                }

                try {
                    const currentSettings = settingsDB.getSettings();
                    const updatedResources = {
                        ...currentSettings.resources,
                        [packageKey]: resourceData
                    };

                    const updatedSettings = {
                        ...currentSettings,
                        resources: updatedResources
                    };

                    const success = settingsDB.saveSettings(updatedSettings);

                    if (success) {
                        return res.status(200).json({
                            success: true,
                            message: `Package ${packageKey} updated successfully`
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update package'
                        });
                    }

                } catch (error) {
                    console.error('Error updating resource:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating resource: ' + error.message
                    });
                }

            } else if (action === 'update_admin') {
                // Update admin credentials
                const { username, password, currentPassword } = data;

                if (!username) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username is required'
                    });
                }

                try {
                    const currentSettings = settingsDB.getSettings();

                    // Verify current password if changing credentials
                    if (password && currentPassword !== currentSettings.admin.password) {
                        return res.status(400).json({
                            success: false,
                            message: 'Current password is incorrect'
                        });
                    }

                    const updatedAdmin = {
                        username: username,
                        password: password || currentSettings.admin.password
                    };

                    const updatedSettings = {
                        ...currentSettings,
                        admin: updatedAdmin
                    };

                    const success = settingsDB.saveSettings(updatedSettings);

                    if (success) {
                        return res.status(200).json({
                            success: true,
                            message: 'Admin credentials updated successfully'
                        });
                    } else {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to update admin credentials'
                        });
                    }

                } catch (error) {
                    console.error('Error updating admin:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Error updating admin: ' + error.message
                    });
                }

            } else if (action === 'test_connection') {
                // Test Pterodactyl API connection
                try {
                    const users = await pterodactyl.getUsers();
                    return res.status(200).json({
                        success: true,
                        message: 'API connection successful',
                        data: {
                            usersCount: users.meta?.pagination?.total || 0,
                            panelUrl: `https://${config.PANEL_DOMAIN}`
                        }
                    });
                } catch (error) {
                    return res.status(500).json({
                        success: false,
                        message: 'API connection failed: ' + error.message
                    });
                }

            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Unknown action'
                });
            }

        } else {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('Settings API error:', error);
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
}