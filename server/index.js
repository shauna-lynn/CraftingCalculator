const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const db = require('./db');
const clearer = require('./clear');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static files (serve the app root)
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

// --------- API ---------
app.get('/api/recipes/getAll', (req, res) => {
  try { db.setUser(req.headers['x-user-id'] || 'public'); res.json({ recipes: db.getAllRecipes() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/recipes/setAll', (req, res) => {
  try { db.setUser(req.headers['x-user-id'] || 'public'); db.setAllRecipes(req.body || {}); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/ingredients/getAll', (req, res) => {
  try { db.setUser(req.headers['x-user-id'] || 'public'); res.json({ ingredients: db.getAllIngredients() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ingredients/setAll', (req, res) => {
  try { db.setUser(req.headers['x-user-id'] || 'public'); db.setAllIngredients(req.body || {}); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/queue/getAll', (req, res) => {
  try { db.setUser(req.headers['x-user-id'] || 'public'); res.json({ queue: db.getQueue() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/queue/setAll', (req, res) => {
  try { db.setUser(req.headers['x-user-id'] || 'public'); db.setQueue(req.body || []); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
// Clear DB
app.post('/api/db/clear', (req, res) => {
  try { clearer.clearAll(); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});


// Export DB
app.get('/api/db/export', (req, res) => {
  try {
    const buf = fs.readFileSync(db.DB_PATH);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="data.sqlite"');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Import DB
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/db/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    db.importDB(req.file.buffer);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
