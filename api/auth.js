import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../utils/config.js';
import settingsDB from '../utils/database.js';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        const { username, password } = req.body;

        try {
            // Get admin credentials from database
            const adminCredentials = settingsDB.getAdminCredentials();

            // Simple authentication (in production, use bcrypt for passwords)
            if (username === adminCredentials.username && password === adminCredentials.password) {
                const token = jwt.sign(
                    { 
                        username, 
                        isAdmin: true,
                        app: config.APP_NAME
                    }, 
                    config.JWT_SECRET, 
                    { expiresIn: config.JWT_EXPIRES_IN }
                );

                res.setHeader('Set-Cookie', cookie.serialize('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV !== 'development',
                    sameSite: 'lax',
                    maxAge: 86400, // 24 hours
                    path: '/'
                }));

                return res.status(200).json({ 
                    success: true, 
                    message: 'Login successful',
                    user: { 
                        username, 
                        isAdmin: true,
                        app: config.APP_NAME
                    }
                });
            } else {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid username or password' 
                });
            }
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    } else if (req.method === 'DELETE') {
        // Logout
        res.setHeader('Set-Cookie', cookie.serialize('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'lax',
            expires: new Date(0),
            path: '/'
        }));

        return res.status(200).json({ 
            success: true, 
            message: 'Logout successful' 
        });
    } else if (req.method === 'GET') {
        // Verify token
        const cookies = cookie.parse(req.headers.cookie || '');
        const token = cookies.token;

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        try {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            return res.status(200).json({ 
                success: true, 
                user: decoded 
            });
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
    } else {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }
}