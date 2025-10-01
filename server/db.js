const path = require('path');
const Database = require('better-sqlite3');

let DB_PATH = path.join(__dirname, 'data.sqlite');
let db;

function open() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    initSchema();
  }
  return db;
}

function sanitizeUserId(userId) {
  const s = String(userId || 'public').toLowerCase();
  return s.replace(/[^a-z0-9_-]/g, '_');
}

function setUser(userId) {
  const safe = sanitizeUserId(userId);
  const newPath = path.join(__dirname, `data_${safe}.sqlite`);
  if (newPath !== DB_PATH) {
    if (db) { try { db.close(); } catch {} db = null; }
    DB_PATH = newPath;
  }
}

function initSchema() {
  const d = db;
  d.exec(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE COLLATE NOCASE,
      category TEXT,
      price REAL,
      stack_size INTEGER,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE COLLATE NOCASE,
      category TEXT,
      output_qty INTEGER,
      selling_price REAL,
      stack_size INTEGER,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      recipe_id INTEGER,
      ref_name TEXT,
      amount INTEGER,
      is_category INTEGER DEFAULT 0,
      PRIMARY KEY (recipe_id, ref_name),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY,
      recipe_name TEXT,
      quantity INTEGER,
      completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// Recipes
function getAllRecipes() {
  open();
  const list = db.prepare('SELECT * FROM recipes ORDER BY name').all();
  const ingStmt = db.prepare('SELECT ref_name, amount, is_category FROM recipe_ingredients WHERE recipe_id = ?');
  const out = {};
  for (const r of list) {
    const parts = ingStmt.all(r.id);
    const ingredients = {};
    for (const p of parts) ingredients[p.ref_name] = p.amount;
    out[r.name] = {
      ingredients,
      outputQty: r.output_qty || 1,
      category: r.category || 'Uncategorized',
      sellingPrice: r.selling_price || 0,
      stackSize: r.stack_size || 1,
      notes: r.notes || ''
    };
  }
  return out;
}

function setAllRecipes(recipesObj) {
  open();
  const tx = db.transaction(() => {
    db.exec('DELETE FROM recipe_ingredients');
    db.exec('DELETE FROM recipes');
    const insRecipe = db.prepare('INSERT INTO recipes (name, category, output_qty, selling_price, stack_size, notes) VALUES (?, ?, ?, ?, ?, ?)');
    const insPart = db.prepare('INSERT INTO recipe_ingredients (recipe_id, ref_name, amount, is_category) VALUES (?, ?, ?, ?)');

    for (const [name, r] of Object.entries(recipesObj || {})) {
      const info = insRecipe.run(name, r.category || 'Uncategorized', r.outputQty || 1, r.sellingPrice || 0, r.stackSize || 1, r.notes || '');
      const id = info.lastInsertRowid;
      for (const [ref, amt] of Object.entries(r.ingredients || {})) {
        const isCategory = ref.startsWith('[') && ref.endsWith(']') ? 1 : 0;
        insPart.run(id, ref, parseInt(amt) || 0, isCategory);
      }
    }
  });
  tx();
}

// Ingredients
function getAllIngredients() {
  open();
  const out = {};
  const rows = db.prepare('SELECT * FROM ingredients ORDER BY name').all();
  for (const r of rows) {
    out[r.name] = {
      category: r.category || 'Uncategorized',
      price: typeof r.price === 'number' ? r.price : null,
      stackSize: r.stack_size || 200,
      note: r.note || ''
    };
  }
  return out;
}

function setAllIngredients(ingredientsObj) {
  open();
  const tx = db.transaction(() => {
    db.exec('DELETE FROM ingredients');
    const ins = db.prepare('INSERT INTO ingredients (name, category, price, stack_size, note) VALUES (?, ?, ?, ?, ?)');
    for (const [name, i] of Object.entries(ingredientsObj || {})) {
      ins.run(name, i.category || 'Uncategorized', (typeof i.price === 'number' ? i.price : null), i.stackSize || 200, i.note || '');
    }
  });
  tx();
}

// Queue
function getQueue() {
  open();
  return db.prepare('SELECT id, recipe_name as item, quantity, completed FROM queue ORDER BY id').all();
}

function setQueue(queueList) {
  open();
  const tx = db.transaction(() => {
    db.exec('DELETE FROM queue');
    const ins = db.prepare('INSERT INTO queue (recipe_name, quantity, completed) VALUES (?, ?, ?)');
    for (const q of (queueList || [])) {
      ins.run(q.item, q.quantity || 1, q.completed ? 1 : 0);
    }
  });
  tx();
}

// Export/Import DB file
function exportDB() {
  open();
  return Buffer.from(db.serialize());
}

const fs = require('fs');
function importDB(buffer) {
  if (db) { db.close(); db = null; }
  fs.writeFileSync(DB_PATH, buffer);
  open();
}

module.exports = { open, getAllRecipes, setAllRecipes, getAllIngredients, setAllIngredients, getQueue, setQueue, exportDB, importDB, DB_PATH, setUser };
