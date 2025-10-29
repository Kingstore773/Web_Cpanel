// Utility functions for King Store Cpanel Private

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatResourceSize(size) {
  if (size === 0) return "Unlimited";
  else if (size >= 1024) return `${size / 1024} GB`;
  else return `${size} MB`;
}

export function capitalize(text) {
  return text.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export function generatePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getEggDisplayName(eggKey) {
  const eggNames = {
    'python': 'Python Application',
    'nodejs': 'Node.js Application',
    'minecraft': 'Minecraft Server',
    'discord': 'Discord Bot',
    'website': 'Website',
    'php': 'PHP Application',
    'java': 'Java Application'
  };
  
  return eggNames[eggKey] || capitalize(eggKey);
}

export function getPackageDisplayName(pkgKey) {
  if (pkgKey === 'unlimited') return 'Unlimited Resources';
  return pkgKey.toUpperCase() + ' Package';
}