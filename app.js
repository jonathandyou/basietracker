const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

// API Routes

// Get all cats
app.get('/api/cats', (req, res) => {
  try {
    const cats = db.prepare('SELECT * FROM cats ORDER BY name').all();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new cat
app.post('/api/cats', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Cat name is required' });
    
    const stmt = db.prepare('INSERT INTO cats (name) VALUES (?)');
    const result = stmt.run(name);
    
    res.json({ id: result.lastInsertRowid, name });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      res.status(400).json({ error: 'Cat already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get sightings for a cat
app.get('/api/sightings/:catName', (req, res) => {
  try {
    const sightings = db.prepare(`
      SELECT * FROM sightings 
      WHERE cat_name = ? 
      ORDER BY seen_at DESC
    `).all(req.params.catName);
    res.json(sightings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all recent sightings
app.get('/api/sightings', (req, res) => {
  try {
    const sightings = db.prepare(`
      SELECT * FROM sightings 
      ORDER BY seen_at DESC 
      LIMIT 50
    `).all();
    res.json(sightings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a sighting
app.post('/api/sightings', upload.single('photo'), (req, res) => {
  try {
    const { cat_name, notes } = req.body;
    
    if (!cat_name) return res.status(400).json({ error: 'Cat name is required' });

    // Get last sighting to calculate time difference
    const lastSighting = db.prepare(`
      SELECT seen_at FROM sightings 
      WHERE cat_name = ? 
      ORDER BY seen_at DESC 
      LIMIT 1
    `).get(cat_name);

    let timeSinceLastSeen = null;
    if (lastSighting) {
      const lastTime = new Date(lastSighting.seen_at);
      const now = new Date();
      const diffMs = now - lastTime;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        timeSinceLastSeen = `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours % 24} hour${diffHours % 24 !== 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        timeSinceLastSeen = `${diffHours} hour${diffHours > 1 ? 's' : ''} ${diffMins % 60} min`;
      } else {
        timeSinceLastSeen = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
      }
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const stmt = db.prepare(`
      INSERT INTO sightings (cat_name, notes, photo_url, time_since_last_seen)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(cat_name, notes || null, photoUrl, timeSinceLastSeen);

    res.json({ 
      id: result.lastInsertRowid,
      cat_name,
      notes,
      photo_url: photoUrl,
      time_since_last_seen: timeSinceLastSeen,
      seen_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get feedings for a cat
app.get('/api/feedings/:catName', (req, res) => {
  try {
    const feedings = db.prepare(`
      SELECT * FROM feedings 
      WHERE cat_name = ? 
      ORDER BY fed_at DESC
    `).all(req.params.catName);
    res.json(feedings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all recent feedings
app.get('/api/feedings', (req, res) => {
  try {
    const feedings = db.prepare(`
      SELECT * FROM feedings 
      ORDER BY fed_at DESC 
      LIMIT 50
    `).all();
    res.json(feedings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a feeding
app.post('/api/feedings', (req, res) => {
  try {
    const { cat_name, food_type, amount, notes } = req.body;
    
    if (!cat_name) return res.status(400).json({ error: 'Cat name is required' });

    const stmt = db.prepare(`
      INSERT INTO feedings (cat_name, food_type, amount, notes)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(cat_name, food_type || null, amount || null, notes || null);

    res.json({ 
      id: result.lastInsertRowid,
      cat_name,
      food_type,
      amount,
      notes,
      fed_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const totalCats = db.prepare('SELECT COUNT(*) as count FROM cats').get().count;
    const totalSightings = db.prepare('SELECT COUNT(*) as count FROM sightings').get().count;
    const totalFeedings = db.prepare('SELECT COUNT(*) as count FROM feedings').get().count;
    
    const lastSighting = db.prepare(`
      SELECT s.*, c.name as cat_name 
      FROM sightings s 
      JOIN cats c ON s.cat_name = c.name 
      ORDER BY s.seen_at DESC 
      LIMIT 1
    `).get();

    const recentFeedings = db.prepare(`
      SELECT f.*, c.name as cat_name
      FROM feedings f
      JOIN cats c ON f.cat_name = c.name
      ORDER BY f.fed_at DESC
      LIMIT 5
    `).all();

    res.json({
      totalCats,
      totalSightings,
      totalFeedings,
      lastSighting,
      recentFeedings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`🐱 Basie Tracker running on http://localhost:${PORT}`);
});
