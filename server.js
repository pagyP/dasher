const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'services.json');

// Trust proxy when behind reverse proxy (nginx, Traefik, etc.)
app.set('trust proxy', true);

const AUTH_ENABLED = process.env.AUTH_ENABLED === 'true';
const AUTH_USERNAME = process.env.AUTH_USERNAME || 'admin';
const AUTH_PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH || bcrypt.hashSync('admin', 10);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dasher-secret-change-this';

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true
  }
}));

// CSRF protection
const csrfProtection = csrf({ cookie: true });

app.use(express.static('public'));

function requireAuth(req, res, next) {
  if (!AUTH_ENABLED || req.session.authenticated) {
    return next();
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      // Create initial data file if it doesn't exist
      await fs.writeFile(DATA_FILE, JSON.stringify({ services: [], categories: [] }, null, 2));
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Get CSRF token for login
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Login
app.post('/api/login', csrfProtection, async (req, res) => {
  const { username, password } = req.body || {};

  if (!AUTH_ENABLED) {
    return res.json({ success: true });
  }

  if (username === AUTH_USERNAME && await bcrypt.compare(password || '', AUTH_PASSWORD_HASH)) {
    req.session.authenticated = true;
    req.session.save((err) => {
      if (err) return res.status(500).json({ error: 'Failed to save session' });
      res.json({ success: true });
    });
    return;
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Auth status
app.get('/api/auth-status', (req, res) => {
  res.json({
    authEnabled: AUTH_ENABLED,
    authenticated: !AUTH_ENABLED || req.session.authenticated || false
  });
});

// Get all services
app.get('/api/services', requireAuth, async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read services' });
  }
});

// Save services
app.post('/api/services', csrfProtection, requireAuth, async (req, res) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save services' });
  }
});

// Start server
ensureDataDir().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dasher running on http://0.0.0.0:${PORT}`);
  });
});
