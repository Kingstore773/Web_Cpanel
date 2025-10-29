import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../utils/config.js';
import pterodactyl from '../utils/pterodactyl.js';
import { generatePassword, capitalize, validateEmail } from '../utils/helpers.js';

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
            // Get all users
            const { page = 1, search, role } = req.query;

            try {
                let users = await pterodactyl.getAllUsers();
                
                // Apply filters if provided
                if (role) {
                    if (role === 'admin') {
                        users = users.filter(user => user.attributes.root_admin);
                    } else if (role === 'user') {
                        users = users.filter(user => !user.attributes.root_admin);
                    }
                }

                if (search) {
                    const searchLower = search.toLowerCase();
                    users = users.filter(user => 
                        user.attributes.username.toLowerCase().includes(searchLower) ||
                        user.attributes.email.toLowerCase().includes(searchLower) ||
                        user.attributes.first_name.toLowerCase().includes(searchLower)
                    );
                }

                // Format user data for response
                const formattedUsers = users.map(user => {
                    const attributes = user.attributes;
                    
                    return {
                        id: attributes.id,
                        uuid: attributes.uuid,
                        username: attributes.username,
                        email: attributes.email,
                        firstName: attributes.first_name,
                        lastName: attributes.last_name,
                        language: attributes.language,
                        rootAdmin: attributes.root_admin,
                        role: attributes.root_admin ? 'Administrator' : 'User',
                        roleColor: attributes.root_admin ? 'purple' : 'blue',
                        createdAt: attributes.created_at,
                        updatedAt: attributes.updated_at,
                        // Additional computed fields
                        initial: attributes.first_name ? attributes.first_name.charAt(0).toUpperCase() : 
                                attributes.username ? attributes.username.charAt(0).toUpperCase() : 'U'
                    };
                });

                // Sort by creation date (newest first)
                formattedUsers.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );

                // Pagination
                const pageSize = 20;
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedUsers = formattedUsers.slice(startIndex, endIndex);

                const response = {
                    success: true,
                    data: {
                        users: paginatedUsers,
                        pagination: {
                            current: parseInt(page),
                            total: Math.ceil(formattedUsers.length / pageSize),
                            count: paginatedUsers.length,
                            totalItems: formattedUsers.length
                        },
                        stats: {
                            total: formattedUsers.length,
                            admins: formattedUsers.filter(u => u.rootAdmin).length,
                            users: formattedUsers.filter(u => !u.rootAdmin).length
                        }
                    }
                };

                return res.status(200).json(response);

            } catch (error) {
                console.error('Error fetching users:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch users: ' + error.message
                });
            }

        } else if (req.method === 'POST') {
            // Create new user
            const { username, email, firstName, lastName, isAdmin = false } = req.body;

            // Validation
            if (!username || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Username and email are required'
                });
            }

            if (!validateEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            if (username.length < 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be at least 3 characters long'
                });
            }

            try {
                // Generate secure password
                const password = generatePassword(12);
                const userFirstName = firstName || capitalize(username);
                const userLastName = lastName || 'User';

                // Create user in Pterodactyl
                const userResult = await pterodactyl.createUser(
                    email,
                    username,
                    userFirstName,
                    userLastName,
                    password,
                    isAdmin
                );

                const userData = userResult.attributes;

                return res.status(201).json({
                    success: true,
                    message: `User created successfully as ${isAdmin ? 'Administrator' : 'User'}`,
                    data: {
                        user: {
                            id: userData.id,
                            username: userData.username,
                            email: userData.email,
                            firstName: userData.first_name,
                            lastName: userData.last_name,
                            rootAdmin: userData.root_admin,
                            role: userData.root_admin ? 'Administrator' : 'User'
                        },
                        credentials: {
                            password: password,
                            note: 'Save this password securely. It will not be shown again.'
                        },
                        timestamps: {
                            created: userData.created_at
                        }
                    }
                });

            } catch (error) {
                console.error('Error creating user:', error);
                
                // Handle duplicate username/email
                if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                    return res.status(409).json({
                        success: false,
                        message: 'Username or email already exists'
                    });
                }

                return res.status(500).json({
                    success: false,
                    message: 'Failed to create user: ' + error.message
                });
            }

        } else if (req.method === 'DELETE') {
            // Delete user
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            try {
                // Get user details before deletion
                const user = await pterodactyl.getUser(userId);
                const userAttributes = user.attributes;

                // Delete the user
                await pterodactyl.deleteUser(userId);

                return res.status(200).json({
                    success: true,
                    message: 'User deleted successfully',
                    data: {
                        userId: userId,
                        username: userAttributes.username,
                        email: userAttributes.email
                    }
                });

            } catch (error) {
                console.error('Error deleting user:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete user: ' + error.message
                });
            }

        } else if (req.method === 'PUT') {
            // Update user (basic implementation - Pterodactyl API has limited update capabilities)
            const { userId } = req.query;
            const { email, firstName, lastName, isAdmin } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // Note: Pterodactyl API doesn't support direct user updates easily
            // This would require a more complex implementation
            return res.status(501).json({
                success: false,
                message: 'User update functionality not yet implemented'
            });

        } else {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('Users API error:', error);
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
}