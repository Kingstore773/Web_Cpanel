import axios from 'axios';
import config from './config.js';

class PterodactylAPI {
  constructor() {
    this.baseURL = `https://${config.PANEL_DOMAIN}/api`;
    this.apiKey = config.PANEL_API_KEY;
    this.clientKey = config.PANEL_CLIENT_API_KEY;
  }

  async makeRequest(endpoint, method = 'GET', data = null, isClient = false) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const apiKey = isClient ? this.clientKey : this.apiKey;
      
      const options = {
        method,
        url,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: config.API_TIMEOUT
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.data = data;
      }

      const response = await axios(options);
      return response.data;
    } catch (error) {
      console.error('Pterodactyl API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.errors?.[0]?.detail || error.message);
    }
  }

  // User Management
  async createUser(email, username, firstName, lastName, password, isAdmin = false) {
    const data = {
      email,
      username,
      first_name: firstName,
      last_name: lastName,
      language: 'en',
      password,
      root_admin: isAdmin
    };

    return await this.makeRequest('/application/users', 'POST', data);
  }

  async getUser(userId) {
    return await this.makeRequest(`/application/users/${userId}`);
  }

  async getUsers(page = 1) {
    return await this.makeRequest(`/application/users?page=${page}`);
  }

  async getAllUsers() {
    let allUsers = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const response = await this.getUsers(currentPage);
      allUsers = allUsers.concat(response.data);
      
      totalPages = response.meta.pagination.total_pages;
      currentPage++;
    }

    return allUsers;
  }

  async deleteUser(userId) {
    return await this.makeRequest(`/application/users/${userId}`, 'DELETE');
  }

  // Server Management
  async createServer(name, description, userId, eggId, dockerImage, startup, environment, limits, featureLimits) {
    const data = {
      name,
      description,
      user: parseInt(userId),
      egg: parseInt(eggId),
      docker_image: dockerImage,
      startup,
      environment,
      limits,
      feature_limits: featureLimits,
      deploy: {
        locations: [parseInt(config.PANEL_LOCATION_ID)],
        dedicated_ip: false,
        port_range: []
      }
    };

    return await this.makeRequest('/application/servers', 'POST', data);
  }

  async getServer(serverId) {
    return await this.makeRequest(`/application/servers/${serverId}`);
  }

  async getServers(page = 1) {
    return await this.makeRequest(`/application/servers?page=${page}`);
  }

  async getAllServers() {
    let allServers = [];
    let currentPage = 1;
    let totalPages = 1;

    while (currentPage <= totalPages) {
      const response = await this.getServers(currentPage);
      allServers = allServers.concat(response.data);
      
      totalPages = response.meta.pagination.total_pages;
      currentPage++;
    }

    return allServers;
  }

  async deleteServer(serverId) {
    return await this.makeRequest(`/application/servers/${serverId}`, 'DELETE');
  }

  async suspendServer(serverId) {
    return await this.makeRequest(`/application/servers/${serverId}/suspend`, 'POST');
  }

  async unsuspendServer(serverId) {
    return await this.makeRequest(`/application/servers/${serverId}/unsuspend`, 'POST');
  }

  // Egg Management
  async getEggInfo(nestId, eggId) {
    return await this.makeRequest(`/application/nests/${nestId}/eggs/${eggId}`);
  }

  async getNests() {
    return await this.makeRequest('/application/nests');
  }

  // Node Management
  async getNodes() {
    return await this.makeRequest('/application/nodes');
  }

  async getNode(nodeId) {
    return await this.makeRequest(`/application/nodes/${nodeId}`);
  }

  // Location Management
  async getLocations() {
    return await this.makeRequest('/application/locations');
  }

  // Client API
  async getClientServers() {
    return await this.makeRequest('/client', 'GET', null, true);
  }

  async getClientServer(serverId) {
    return await this.makeRequest(`/client/servers/${serverId}`, 'GET', null, true);
  }

  async sendPowerAction(serverId, action) {
    return await this.makeRequest(`/client/servers/${serverId}/power`, 'POST', { signal: action }, true);
  }

  async getServerResources(serverId) {
    return await this.makeRequest(`/client/servers/${serverId}/resources`, 'GET', null, true);
  }

  // Utility Methods
  async getServerStatus(serverId) {
    try {
      const server = await this.getClientServer(serverId);
      return server.attributes.status;
    } catch (error) {
      return 'offline';
    }
  }

  async getServerUtilization(serverId) {
    try {
      const resources = await this.getServerResources(serverId);
      return resources.attributes;
    } catch (error) {
      return null;
    }
  }
}

export default new PterodactylAPI();