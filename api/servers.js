import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../utils/config.js';
import pterodactyl from '../utils/pterodactyl.js';
import { formatResourceSize, formatDate } from '../utils/helpers.js';

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
            // Get all servers with optional filtering
            const { page = 1, status, search } = req.query;

            try {
                let servers = await pterodactyl.getAllServers();
                
                // Apply filters if provided
                if (status && status !== 'all') {
                    servers = servers.filter(server => 
                        server.attributes.status === status
                    );
                }

                if (search) {
                    const searchLower = search.toLowerCase();
                    servers = servers.filter(server => 
                        server.attributes.name.toLowerCase().includes(searchLower) ||
                        server.attributes.identifier.includes(search)
                    );
                }

                // Format server data for response
                const formattedServers = servers.map(server => {
                    const attributes = server.attributes;
                    const limits = attributes.limits || {};
                    
                    // Get server status with real-time check
                    let status = attributes.status;
                    let statusColor = 'gray';
                    
                    switch (status) {
                        case 'running':
                            statusColor = 'green';
                            break;
                        case 'offline':
                            statusColor = 'red';
                            break;
                        case 'starting':
                        case 'stopping':
                            statusColor = 'yellow';
                            break;
                        case 'installing':
                        case 'install_failed':
                            statusColor = 'blue';
                            break;
                        default:
                            statusColor = 'gray';
                    }

                    return {
                        id: attributes.id,
                        uuid: attributes.uuid,
                        identifier: attributes.identifier,
                        name: attributes.name,
                        description: attributes.description,
                        status: status,
                        statusColor: statusColor,
                        suspended: attributes.suspended,
                        limits: {
                            memory: limits.memory,
                            disk: limits.disk,
                            cpu: limits.cpu,
                            swap: limits.swap,
                            io: limits.io
                        },
                        featureLimits: {
                            databases: attributes.feature_limits?.databases || 0,
                            backups: attributes.feature_limits?.backups || 0,
                            allocations: attributes.feature_limits?.allocations || 0
                        },
                        user: attributes.user,
                        node: attributes.node,
                        allocation: attributes.allocation,
                        nest: attributes.nest,
                        egg: attributes.egg,
                        container: attributes.container,
                        createdAt: attributes.created_at,
                        updatedAt: attributes.updated_at
                    };
                });

                // Sort by creation date (newest first)
                formattedServers.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );

                // Pagination
                const pageSize = 20;
                const startIndex = (page - 1) * pageSize;
                const endIndex = startIndex + pageSize;
                const paginatedServers = formattedServers.slice(startIndex, endIndex);

                const response = {
                    success: true,
                    data: {
                        servers: paginatedServers,
                        pagination: {
                            current: parseInt(page),
                            total: Math.ceil(formattedServers.length / pageSize),
                            count: paginatedServers.length,
                            totalItems: formattedServers.length
                        },
                        stats: {
                            total: formattedServers.length,
                            running: formattedServers.filter(s => s.status === 'running').length,
                            offline: formattedServers.filter(s => s.status === 'offline').length,
                            suspended: formattedServers.filter(s => s.suspended).length
                        }
                    }
                };

                return res.status(200).json(response);

            } catch (error) {
                console.error('Error fetching servers:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch servers: ' + error.message
                });
            }

        } else if (req.method === 'DELETE') {
            // Delete server
            const { serverId } = req.query;

            if (!serverId) {
                return res.status(400).json({
                    success: false,
                    message: 'Server ID is required'
                });
            }

            try {
                // First, get server details to find associated user
                const server = await pterodactyl.getServer(serverId);
                const serverAttributes = server.attributes;
                const userId = serverAttributes.user;

                // Delete the server
                await pterodactyl.deleteServer(serverId);

                // Optionally delete the user as well
                // await pterodactyl.deleteUser(userId);

                return res.status(200).json({
                    success: true,
                    message: 'Server deleted successfully',
                    data: {
                        serverId: serverId,
                        serverName: serverAttributes.name,
                        userId: userId
                    }
                });

            } catch (error) {
                console.error('Error deleting server:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete server: ' + error.message
                });
            }

        } else if (req.method === 'POST') {
            // Power actions (start, stop, restart, kill)
            const { serverId, action } = req.body;

            if (!serverId || !action) {
                return res.status(400).json({
                    success: false,
                    message: 'Server ID and action are required'
                });
            }

            const validActions = ['start', 'stop', 'restart', 'kill'];
            if (!validActions.includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid action. Must be one of: ${validActions.join(', ')}`
                });
            }

            try {
                await pterodactyl.sendPowerAction(serverId, action);

                return res.status(200).json({
                    success: true,
                    message: `Server ${action} command sent successfully`,
                    data: {
                        serverId: serverId,
                        action: action,
                        timestamp: new Date().toISOString()
                    }
                });

            } catch (error) {
                console.error('Error sending power action:', error);
                return res.status(500).json({
                    success: false,
                    message: `Failed to ${action} server: ` + error.message
                });
            }

        } else {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('Servers API error:', error);
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
}