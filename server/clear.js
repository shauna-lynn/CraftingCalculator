const db = require('./db');

function clearAll(){
  const d = db.open();
  d.exec('DELETE FROM recipe_ingredients; DELETE FROM recipes; DELETE FROM ingredients; DELETE FROM queue;');
}

module.exports = { clearAll };

