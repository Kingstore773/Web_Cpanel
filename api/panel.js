import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import config from '../utils/config.js';
import pterodactyl from '../utils/pterodactyl.js';
import { capitalize, generatePassword, getEggDisplayName } from '../utils/helpers.js';

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

    if (req.method === 'POST') {
      const { username, email, package: pkg, egg } = req.body;

      // Validation
      if (!username || !email || !pkg || !egg) {
        return res.status(400).json({ 
          success: false, 
          message: 'All fields are required: username, email, package, egg' 
        });
      }

      if (username.length < 3) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username must be at least 3 characters long' 
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid email format' 
        });
      }

      // Generate secure password
      const password = generatePassword(12);
      const firstName = capitalize(username);

      // Create user in Pterodactyl
      const userResult = await pterodactyl.createUser(
        email, 
        username, 
        firstName, 
        'User', 
        password, 
        false
      );

      const userData = userResult.attributes;
      const userId = userData.id;

      // Get resource configuration
      const resource = config.PANEL_RESOURCES[pkg.toLowerCase()];
      if (!resource) {
        await pterodactyl.deleteUser(userId);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid package selected' 
        });
      }

      // Get egg configuration
      const eggId = config.PANEL_EGGS[egg.toLowerCase()];
      if (!eggId) {
        await pterodactyl.deleteUser(userId);
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid egg type selected' 
        });
      }

      // Get egg info for docker image and startup
      const eggInfo = await pterodactyl.getEggInfo(config.PANEL_NEST_ID, eggId);
      const eggData = eggInfo.attributes;

      // Set docker image and environment based on egg type
      let dockerImage = 'ghcr.io/parkervcp/yolks:nodejs_20';
      let environment = {
        "USER_UPLOAD": "0",
        "AUTO_UPDATE": "0"
      };

      switch (egg.toLowerCase()) {
        case 'python':
          dockerImage = 'ghcr.io/parkervcp/yolks:python_3.11';
          environment.PY_FILE = 'main.py';
          environment.REQUIREMENTS_FILE = 'requirements.txt';
          environment.CMD_RUN = 'python main.py';
          break;
        case 'nodejs':
          dockerImage = 'ghcr.io/parkervcp/yolks:nodejs_20';
          environment.INST = 'npm';
          environment.CMD_RUN = 'npm start';
          break;
        case 'minecraft':
          dockerImage = 'ghcr.io/pterodactyl/yolks:java_17';
          environment.SERVER_JARFILE = 'server.jar';
          environment.DL_PATH = '';
          break;
        case 'discord':
          dockerImage = 'ghcr.io/parkervcp/yolks:nodejs_18';
          environment.INST = 'npm';
          environment.CMD_RUN = 'npm start';
          break;
        case 'php':
          dockerImage = 'ghcr.io/parkervcp/yolks:php_8.2';
          environment.CMD_RUN = 'php index.php';
          break;
        case 'java':
          dockerImage = 'ghcr.io/pterodactyl/yolks:java_17';
          environment.BUILD_NUMBER = 'latest';
          break;
        default:
          dockerImage = eggData.docker_image || dockerImage;
      }

      // Get egg environment variables
      const eggVariables = eggData.relationships?.variables?.data || [];
      eggVariables.forEach(variable => {
        const varAttrs = variable.attributes;
        const varName = varAttrs.env_variable;
        const varDefault = varAttrs.default_value;
        if (varName && !environment[varName]) {
          environment[varName] = varDefault || '';
        }
      });

      // Create server
      const serverResult = await pterodactyl.createServer(
        `${firstName} Server`,
        `Panel created by King Store Cpanel Private on ${new Date().toLocaleDateString()}`,
        userId,
        eggId,
        dockerImage,
        eggData.startup,
        environment,
        {
          memory: resource.ram,
          swap: 0,
          disk: resource.disk,
          io: 500,
          cpu: resource.cpu
        },
        {
          databases: 5,
          backups: 5,
          allocations: 5
        }
      );

      const serverData = serverResult.attributes;

      // Prepare response data
      const resultData = {
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          password: password,
          createdAt: userData.created_at
        },
        server: {
          id: serverData.id,
          name: serverData.name,
          identifier: serverData.identifier,
          uuid: serverData.uuid,
          status: 'installing'
        },
        resources: {
          package: pkg.toUpperCase(),
          ram: resource.ram,
          disk: resource.disk,
          cpu: resource.cpu,
          price: resource.price
        },
        egg: {
          type: egg,
          displayName: getEggDisplayName(egg),
          id: eggId
        },
        panel: {
          url: `https://${config.PANEL_DOMAIN}`,
          adminUrl: `https://${config.PANEL_DOMAIN}/admin`
        },
        timestamps: {
          created: new Date().toISOString(),
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        }
      };

      return res.status(200).json({
        success: true,
        message: 'Panel created successfully',
        data: resultData
      });

    } else {
      return res.status(405).json({ 
        success: false, 
        message: 'Method not allowed' 
      });
    }
  } catch (error) {
    console.error('Create panel error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error' 
    });
  }
}