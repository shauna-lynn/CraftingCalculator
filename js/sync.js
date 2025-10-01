// Recipe <-> Ingredient sync helpers
// Keeps ingredients entries for recipes up to date with craft cost per unit.

window.syncHelpers = (function(){
  function calculateCraftCostPerUnit(recipes, name){
    const r = recipes[name];
    if (!r) return 0;
    const output = r.outputQty || 1;
    try {
      const req = window.calculateItemRequirements ? window.calculateItemRequirements(name, output) : { totalCost: 0 };
      const total = (req && typeof req.totalCost === 'number') ? req.totalCost : 0;
      return total / output;
    } catch(e){
      return 0;
    }
  }

  function syncRecipeIntoIngredients(recipes, ingredients, name){
    const r = recipes[name];
    if (!r) return;
    const existing = ingredients[name] || {};
    const craftCost = calculateCraftCostPerUnit(recipes, name);
    ingredients[name] = {
      category: r.category || existing.category || 'Uncategorized',
      price: craftCost,
      stackSize: existing.stackSize || r.stackSize || 1,
      note: existing.note || r.notes || ''
    };
  }

  function syncAllRecipesIntoIngredients(recipes, ingredients){
    Object.keys(recipes || {}).forEach(n => syncRecipeIntoIngredients(recipes, ingredients, n));
  }

  return { syncRecipeIntoIngredients, syncAllRecipesIntoIngredients, calculateCraftCostPerUnit };
})();

