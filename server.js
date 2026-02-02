const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'services.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read services' });
  }
});

// Save services
app.post('/api/services', async (req, res) => {
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
