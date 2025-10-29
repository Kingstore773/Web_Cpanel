import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../utils/config.js';
import pterodactyl from '../utils/pterodactyl.js';

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
            // Get admin dashboard stats
            try {
                const [users, servers, nodes] = await Promise.all([
                    pterodactyl.getAllUsers(),
                    pterodactyl.getAllServers(),
                    pterodactyl.getNodes()
                ]);

                const activeServers = servers.filter(server => {
                    return server.attributes.status === 'running' || server.attributes.status === 'starting';
                }).length;

                const stats = {
                    totalUsers: users.length,
                    totalServers: servers.length,
                    activeServers: activeServers,
                    totalNodes: nodes.data?.length || 0,
                    systemStatus: 'online',
                    lastUpdated: new Date().toISOString()
                };

                return res.status(200).json({ 
                    success: true, 
                    data: stats 
                });
            } catch (error) {
                console.error('Error fetching admin stats:', error);
                
                // Return fallback stats if API is unavailable
                const fallbackStats = {
                    totalUsers: 0,
                    totalServers: 0,
                    activeServers: 0,
                    totalNodes: 0,
                    systemStatus: 'offline',
                    lastUpdated: new Date().toISOString()
                };

                return res.status(200).json({ 
                    success: true, 
                    data: fallbackStats 
                });
            }
        } else {
            return res.status(405).json({ 
                success: false, 
                message: 'Method not allowed' 
            });
        }
    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(401).json({ 
            success: false, 
            message: error.message 
        });
    }
}