// Auth-Modul für Photobooth
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../users.json');

// Hilfsfunktionen
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  
  // Default admin user
  return {
    admin: {
      username: 'admin',
      password: hashPassword('photobooth'),
      role: 'admin',
      tokens: []
    }
  };
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

// Auth Middleware
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.session.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Nicht autorisiert' 
    });
  }
  
  const users = loadUsers();
  const user = Object.values(users).find(u => u.tokens.includes(token));
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Ungültiger Token' 
    });
  }
  
  req.user = user;
  next();
}

// Login
export function login(req, res) {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Benutzername und Passwort erforderlich' 
    });
  }
  
  const users = loadUsers();
  const user = users[username];
  
  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ 
      success: false, 
      message: 'Ungültige Anmeldedaten' 
    });
  }
  
  const token = generateToken();
  user.tokens.push(token);
  saveUsers(users);
  
  req.session.token = token;
  
  res.json({ 
    success: true, 
    message: 'Erfolgreich angemeldet',
    token: token,
    user: {
      username: user.username,
      role: user.role
    }
  });
}

// Token verification
export function verifyToken(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.session.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Kein Token vorhanden' 
    });
  }
  
  const users = loadUsers();
  const user = Object.values(users).find(u => u.tokens.includes(token));
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Ungültiger Token' 
    });
  }
  
  res.json({ 
    success: true,
    user: {
      username: user.username,
      role: user.role
    }
  });
}

// Auth status
export function getAuthStatus(req, res) {
  const token = req.session.token;
  
  if (!token) {
    return res.json({ 
      success: true,
      authenticated: false 
    });
  }
  
  const users = loadUsers();
  const user = Object.values(users).find(u => u.tokens.includes(token));
  
  if (!user) {
    return res.json({ 
      success: true,
      authenticated: false 
    });
  }
  
  res.json({ 
    success: true,
    authenticated: true,
    user: {
      username: user.username,
      role: user.role
    }
  });
}

// Change password
export function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const token = req.session.token;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Nicht angemeldet' 
    });
  }
  
  const users = loadUsers();
  const user = Object.values(users).find(u => u.tokens.includes(token));
  
  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Ungültiger Token' 
    });
  }
  
  if (user.password !== hashPassword(currentPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Aktuelles Passwort ist falsch' 
    });
  }
  
  user.password = hashPassword(newPassword);
  saveUsers(users);
  
  res.json({ 
    success: true, 
    message: 'Passwort erfolgreich geändert' 
  });
}
