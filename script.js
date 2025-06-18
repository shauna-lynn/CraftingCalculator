const STORAGE_KEY = 'recipeCalculatorData';
let recipes = {};

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const addIngredientBtn = document.getElementById('add-ingredient');
    const saveRecipeBtn = document.getElementById('save-recipe');
    const calculateBtn = document.getElementById('calculate');
    const exportBtn = document.getElementById('export-recipes');
    const importBtn = document.getElementById('import-recipes');
    const newRecipeBookBtn = document.getElementById('new-recipe-book');
    const importFile = document.getElementById('import-file');
    const ingredientsContainer = document.getElementById('ingredients-container');
    const itemSelect = document.getElementById('item-select');
    const resultsDiv = document.getElementById('results');

    // Add event listener for the new button
    newRecipeBookBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all recipes and start a new recipe book?')) {
            // Clear recipes
            recipes = {};
            
            // Clear localStorage
            localStorage.removeItem(STORAGE_KEY);
            
            // Update select options
            updateItemSelect();
            
            // Clear results
            resultsDiv.innerHTML = '';
            
            alert('Recipe book cleared. You can now start fresh!');
        }
    });
    
    // Load recipes from localStorage on startup
    loadRecipes();
    
    // Function to save recipes to localStorage
    function saveRecipes() {
        // Sort recipes alphabetically before saving
        const sortedRecipes = sortObjectAlphabetically(recipes);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedRecipes));
        recipes = sortedRecipes; // Update the recipes object with the sorted version
    }
    
    // Function to load recipes from localStorage
    function loadRecipes() {
        // Clear recipes object on startup instead of loading from localStorage
        recipes = {};
        updateItemSelect();
    }
    
    // Add new ingredient input row
    addIngredientBtn.addEventListener('click', function() {
        const newRow = document.createElement('div');
        newRow.className = 'ingredient-row';
        newRow.innerHTML = `
            <input type="text" class="ingredient-name" placeholder="Ingredient">
            <input type="number" class="ingredient-amount" placeholder="Amount" min="1">
            <button class="remove-ingredient">✕</button>
        `;
        ingredientsContainer.appendChild(newRow);
        
        // Add remove functionality to the new button
        newRow.querySelector('.remove-ingredient').addEventListener('click', function() {
            ingredientsContainer.removeChild(newRow);
        });
    });
    
    // Save recipe
    saveRecipeBtn.addEventListener('click', function() {
        const recipeName = document.getElementById('recipe-name').value.trim();
        const outputQty = parseInt(document.getElementById('recipe-output').value);
        
        if (!recipeName) {
            alert('Please enter a recipe name');
            return;
        }
        
        if (isNaN(outputQty) || outputQty <= 0) {
            alert('Please enter a valid output quantity');
            return;
        }
        
        const ingredients = {};
        let valid = true;
        
        // Collect all ingredients
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const name = row.querySelector('.ingredient-name').value.trim();
            const amount = parseInt(row.querySelector('.ingredient-amount').value);
            
            if (!name || isNaN(amount) || amount <= 0) {
                valid = false;
                return;
            }
            
            ingredients[name] = amount;
        });
        
        if (!valid || Object.keys(ingredients).length === 0) {
            alert('Please add valid ingredients');
            return;
        }
        
        // Save recipe with output quantity
        recipes[recipeName] = {
            ingredients: sortObjectAlphabetically(ingredients),
            outputQty: outputQty
        };
        
        // Save to localStorage with recipes sorted alphabetically
        saveRecipes();
        
        // Update select options
        updateItemSelect();
        
        // Clear form
        document.getElementById('recipe-name').value = '';
        document.getElementById('recipe-output').value = '1';
        ingredientsContainer.innerHTML = `
            <div class="ingredient-row">
                <input type="text" class="ingredient-name" placeholder="Ingredient">
                <input type="number" class="ingredient-amount" placeholder="Amount" min="1">
            </div>
        `;
        
        alert(`Recipe for ${recipeName} saved!`);
    });
    
    // Export recipes to JSON file
    exportBtn.addEventListener('click', function() {
        if (Object.keys(recipes).length === 0) {
            alert('No recipes to export');
            return;
        }
        
        const recipesJSON = JSON.stringify(recipes, null, 2);
        
        // Check if running in Electron
        if (window.require) {
            // Let Electron handle it via the menu
        } else {
            // Browser fallback
            const blob = new Blob([recipesJSON], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'recipes.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });
    
    // Import recipes from JSON file
    importBtn.addEventListener('click', function() {
        if (!importFile.files.length) {
            alert('Please select a file to import');
            return;
        }
        
        const file = importFile.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedRecipes = JSON.parse(e.target.result);
                
                // Merge imported recipes with existing ones
                Object.assign(recipes, importedRecipes);
                
                // Save to localStorage
                saveRecipes();
                
                // Update select options
                updateItemSelect();
                
                alert('Recipes imported successfully!');
            } catch (error) {
                alert('Error importing recipes: Invalid JSON file');
                console.error(error);
            }
        };
        
        reader.readAsText(file);
    });
    
    // Calculate requirements
    calculateBtn.addEventListener('click', function() {
        const selectedItem = itemSelect.value;
        const quantity = parseInt(document.getElementById('quantity').value);
        
        if (!selectedItem || isNaN(quantity) || quantity <= 0) {
            alert('Please select an item and enter a valid quantity');
            return;
        }
        
        const requirements = calculateRequirements(selectedItem, quantity);
        displayResults(requirements);
    });
    
    // Calculate required ingredients
    function calculateRequirements(item, quantity) {
        if (!recipes[item]) {
            return {};
        }
        
        const result = {};
        const recipeData = recipes[item];
        const ingredients = recipeData.ingredients;
        const outputQty = recipeData.outputQty;
        
        // Calculate how many recipe runs are needed
        const recipesNeeded = Math.ceil(quantity / outputQty);
        
        for (const [ingredient, amount] of Object.entries(ingredients)) {
            result[ingredient] = amount * recipesNeeded;
        }
        
        return result;
    }
    
    // Display calculation results
    function displayResults(requirements) {
        resultsDiv.innerHTML = '';
        
        if (Object.keys(requirements).length === 0) {
            resultsDiv.textContent = 'No recipe found for this item';
            return;
        }
        
        const list = document.createElement('ul');
        
        for (const [ingredient, amount] of Object.entries(requirements)) {
            const item = document.createElement('li');
            item.textContent = `${ingredient}: ${amount}`;
            list.appendChild(item);
        }
        
        resultsDiv.appendChild(list);
    }
    
    // Update item select dropdown
    function updateItemSelect() {
        // Keep the first option
        const firstOption = itemSelect.options[0];
        itemSelect.innerHTML = '';
        itemSelect.appendChild(firstOption);
        
        // Add all recipes as options
        for (const recipe in recipes) {
            const option = document.createElement('option');
            option.value = recipe;
            option.textContent = recipe;
            itemSelect.appendChild(option);
        }
    }

    // Helper function to sort object keys alphabetically
    function sortObjectAlphabetically(obj) {
        return Object.keys(obj).sort().reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
    }
});








