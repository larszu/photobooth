// auth.js - Authentifizierungs-Modul für Photobooth Admin
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// Konfiguration
const JWT_SECRET = process.env.JWT_SECRET || 'photobooth-secret-2025';
const SALT_ROUNDS = 10;
const SESSION_DURATION = '24h';

// Benutzer-Datei
const USERS_FILE = path.join(process.cwd(), 'users.json');

// Standard-Admin-Benutzer erstellen
function initializeUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUser = {
      username: 'admin',
      password: bcrypt.hashSync('photobooth2025', SALT_ROUNDS),
      role: 'admin',
      created: new Date().toISOString()
    };
    
    const users = { admin: defaultUser };
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('🔐 Standard-Admin-Benutzer erstellt (admin/photobooth2025)');
  }
}

// Benutzer laden
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('❌ Fehler beim Laden der Benutzer:', error);
  }
  return {};
}

// Login-Funktion
export async function login(username, password) {
  try {
    const users = loadUsers();
    const user = users[username];
    
    if (!user) {
      return { success: false, message: 'Benutzername oder Passwort falsch' };
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return { success: false, message: 'Benutzername oder Passwort falsch' };
    }
    
    const token = jwt.sign(
      { 
        username: user.username, 
        role: user.role,
        loginTime: Date.now()
      },
      JWT_SECRET,
      { expiresIn: SESSION_DURATION }
    );
    
    console.log(`✅ Benutzer ${username} erfolgreich angemeldet`);
    
    return {
      success: true,
      token,
      user: {
        username: user.username,
        role: user.role
      }
    };
    
  } catch (error) {
    console.error('❌ Login-Fehler:', error);
    return { success: false, message: 'Interner Server-Fehler' };
  }
}

// Token validieren
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Middleware für geschützte Routen
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.session?.token || 
                req.cookies?.authToken;
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Anmeldung erforderlich',
      code: 'NO_TOKEN'
    });
  }
  
  const verification = verifyToken(token);
  
  if (!verification.valid) {
    return res.status(401).json({ 
      success: false, 
      message: 'Ungültiger oder abgelaufener Token',
      code: 'INVALID_TOKEN'
    });
  }
  
  req.user = verification.user;
  next();
}

// Auth-Status prüfen
export function getAuthStatus(req) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.session?.token || 
                req.cookies?.authToken;
  
  if (!token) {
    return { authenticated: false };
  }
  
  const verification = verifyToken(token);
  
  if (!verification.valid) {
    return { authenticated: false };
  }
  
  return {
    authenticated: true,
    user: {
      username: verification.user.username,
      role: verification.user.role,
      loginTime: verification.user.loginTime
    }
  };
}

// Initialization
initializeUsers();

console.log('🔐 Auth-Modul geladen');
console.log('📋 Standard-Zugangsdaten: admin/photobooth2025');
