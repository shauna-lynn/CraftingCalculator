// Extracted from index.html inline <script>
// We'll move all app JS here and update index.html to reference js/app.js.
// Phase 1: Move the small glue helpers and bootstrap; keep the rest inline until verified.

(function(){
  // Glue functions that call the helper after all scripts load
  window.syncAllRecipesIntoIngredients = function(){
    if (window.syncHelpers) {
      window.syncHelpers.syncAllRecipesIntoIngredients(window.recipes || {}, window.ingredients || {});
    }
  };

  window.syncRecipeIntoIngredients = function(name){
    if (window.syncHelpers) {
      window.syncHelpers.syncRecipeIntoIngredients(window.recipes || {}, window.ingredients || {}, name);
    }
  };
})();

// Remaining application script stays inline for now and will be migrated into js/app.js incrementally.
        // Global variables
        let recipes = {};

        let ingredients = {};
        let craftingQueue = [];
        let editingRecipeName = null;
        let editingIngredientName = null;

        const STORAGE_KEY = 'craftingCalculatorRecipes';
        const recipeNotesInput = document.getElementById('recipe-notes');
        const recipeStackSizeInput = document.getElementById('recipe-stack-size');
        const recipeIngredientsPreview = document.getElementById('recipe-ingredients-preview');

        const INGREDIENTS_KEY = 'craftingCalculatorIngredients';
        const QUEUE_KEY = 'craftingCalculatorQueue';

        const RECIPE_CATEGORIES_KEY = 'craftingCalculatorRecipeCategories';
        let recipeCategories = [];

        // DOM elements
        const ingredientsContainer = document.getElementById('ingredients-container');
        const toggleRecipeFormBtn = document.getElementById('toggle-recipe-form');
        const recipeForm = document.getElementById('recipe-form');
        const recipeFormHome = document.querySelector('.recipe-form-container');
        const saveRecipeBtn = document.getElementById('save-recipe');
        const cancelRecipeBtn = document.getElementById('cancel-recipe');
        const addIngredientBtn = document.getElementById('add-ingredient');
        const queueItemsDiv = document.getElementById('queue-items');
        const queueResultsDiv = document.getElementById('queue-results');
        const queueFab = document.getElementById('queue-fab');
        const queueDrawer = document.getElementById('queue-drawer');
        const queueDrawerClose = document.getElementById('queue-drawer-close');
        const queueCountBadge = document.getElementById('queue-count');
        // Control body class to show/hide FAB based on DB loaded state
        function setDbUiLoaded(loaded) {
            try {
                const on = !!loaded;
                document.body.classList.toggle('has-db', on);
                if (queueFab) {
                    // Force visibility using !important to override any stylesheet conflicts
                    queueFab.style.setProperty('display', on ? 'flex' : 'none', 'important');
                    queueFab.style.visibility = on ? 'visible' : 'hidden';
                    queueFab.style.opacity = on ? '1' : '0';
                    queueFab.style.pointerEvents = on ? 'auto' : 'none';
                    queueFab.setAttribute('aria-hidden', on ? 'false' : 'true');
                    queueFab.setAttribute('aria-expanded', 'false');
                }
                if (!on && queueDrawer) {
                    queueDrawer.style.display = 'none';
                    queueDrawer.setAttribute('aria-hidden', 'true');
                }
            } catch {}
        }
            // Event delegation for showing nested sub-recipes in the queue results
            if (queueResultsDiv) {
                const toggleSubRecipe = (triggerEl) => {
                    const targetId = triggerEl?.dataset?.target;
                    // Prefer the immediate sibling sub-card to avoid ID lookups failing
                    let target = triggerEl?.nextElementSibling;
                    if (!(target && target.classList && target.classList.contains('sub-card'))) {
                        target = targetId ? document.getElementById(targetId) : null;
                    }
                    if (target) {
                        const willShow = (target.style.display === 'none' || !target.style.display);
                        target.style.display = willShow ? 'block' : 'none';
                        // ARIA state
                        const expanded = !willShow ? 'false' : 'true';
                        triggerEl.setAttribute('aria-expanded', expanded);
                    }
                };

                // Mouse/touch
                queueResultsDiv.addEventListener('click', (evt) => {
                    const trigger = evt.target.closest('.sub-recipe-trigger');
                    if (!trigger) return;
                    evt.preventDefault();
                    evt.stopPropagation();
                    toggleSubRecipe(trigger);
                });
                // Keyboard support
                queueResultsDiv.addEventListener('keydown', (evt) => {

                    if (evt.key !== 'Enter' && evt.key !== ' ') return;
                    const trigger = evt.target.closest('.sub-recipe-trigger');
                    if (!trigger) return;
                    evt.preventDefault();
                    toggleSubRecipe(trigger);
                });
            }

// Queue badge updater (global)
window.updateQueueBadge = function updateQueueBadge() {
    try {
        if (!queueCountBadge) return;
        const count = (craftingQueue || []).reduce((sum, q) => sum + (parseInt(q.quantity) || 0), 0);
        queueCountBadge.textContent = String(count);
        queueCountBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    } catch (e) { /* no-op */ }
};

        // Legacy top-bar selectors and buttons removed from UI
        const itemSelect = null;
        const editRecipeBtn = null;
        const deleteRecipeBtn = null;
        const duplicateRecipeBtn = null;
        const completeAllBtn = null;
        const uncompleteAllBtn = null;
        const calculateQueueBtn = null;
        const clearQueueBtn = null;

            // Database ID handling
            const userIdDisplay = document.getElementById('user-id');
            const toggleUserBtn = document.getElementById('toggle-user');

            function getUserId() { return (localStorage.getItem('userId') || 'public'); }
            function setUserId(id) { const v = (id || 'public').trim() || 'public'; localStorage.setItem('userId', v); return v; }

            function userHeaders() { return { 'X-User-Id': getUserId() }; }


        const categoryList = document.getElementById('category-list');
        const recipeCategoryInput = document.getElementById('recipe-category');
        const employeePercentageInput = document.getElementById('employee-percentage');

        // Bulk edit elements (ingredients)
        let openBulkBtn, clearSelectionBtn, selectAllCheckbox, bulkPanel;
        let bulkPriceInput, bulkStackInput, applyBulkBtn, closeBulkBtn;
        let bulkCategoryInput, bulkCategoryList, bulkNotesInput;
        // Bulk edit elements (recipes)
        let openBulkRecipesBtn, clearSelectionRecipesBtn, selectAllRecipesCheckbox, bulkRecipesPanel;
        let bulkRecipePriceInput, applyBulkRecipesBtn, closeBulkRecipesBtn;
        let bulkRecipeCategoryInput, bulkRecipeCategoryList;

        // Ingredient management elements
        const toggleCategoryFormBtn = document.getElementById('toggle-category-form');

        const categoryForm = document.getElementById('category-form');
        const saveCategoryBtn = document.getElementById('save-category');
        const cancelCategoryBtn = document.getElementById('cancel-category');
        // Recipe category management elements

        const recipeCategoriesPanel = document.getElementById('recipe-categories-panel');
        const newRecipeCategoryNameInput = document.getElementById('new-recipe-category-name');
        const saveRecipeCategoryBtn = document.getElementById('save-recipe-category');
        const closeRecipeCategoriesBtn = document.getElementById('close-recipe-categories');
        const recipeCategoriesListDiv = document.getElementById('recipe-categories-list');

            // Initialize Database ID UI (toggle load/unload)
            (function initUserUi(){
                const current = localStorage.getItem('userId') || '';
                const dbStatus = document.getElementById('db-status');
                function refreshToggleUi(){
                    const id = localStorage.getItem('userId') || '';
                    const isLoaded = !!(id && id !== 'public');
                    if (toggleUserBtn) toggleUserBtn.textContent = isLoaded ? 'Unload' : 'Load';
                    if (userIdDisplay) userIdDisplay.textContent = isLoaded ? id : '(none)';
                    if (dbStatus) dbStatus.textContent = '';
                    setDbUiLoaded(isLoaded);
                }
                if (userIdDisplay) userIdDisplay.textContent = current || '(none)';
                refreshToggleUi();

                toggleUserBtn?.addEventListener('click', async () => {
                    const id = localStorage.getItem('userId') || '';
                    const isLoaded = !!(id && id !== 'public');
                    if (!isLoaded) {
                        const inputId = prompt('Enter a Database ID to load:');
                        const final = setUserId((inputId || '').trim());
                        await reloadAllDataForUser(final);
                    } else {
                        if (!confirm('Unload will remove the locally stored Database ID so you can choose another. It will NOT delete the database.')) return;
                        localStorage.removeItem('userId');
                        location.reload();
                        return;
                    }
                    refreshToggleUi();
                });
            })();

            async function reloadAllDataForUser(){
                try {
                    setDbUiLoaded(true);
                    await loadRecipes();
                    await loadIngredients();
                    await loadQueue();
                    renderRecipesList();
                    renderIngredients();
                    renderQueue();
                    window.updateQueueBadge?.();
                    displayQueueResultsByItem?.();
                } catch (e) {
                    console.warn('reloadAllDataForUser error', e);
                }
            }



            // Ensure FAB visibility finalizer on full window load
            window.addEventListener('load', () => {
                try {
                    const id = localStorage.getItem('userId') || '';
                    setDbUiLoaded(!!(id && id !== 'public'));
                } catch {}
            });


        const newCategoryNameInput = document.getElementById('new-category-name');
        const ingredientForm = document.getElementById('ingredient-form');
        const saveIngredientBtn = document.getElementById('save-ingredient');
        const cancelIngredientBtn = document.getElementById('cancel-ingredient');

            // Startup UserID modal behavior
            const userModal = document.getElementById('user-modal');
            const startupUserId = document.getElementById('startup-user-id');
            const startupLoadBtn = document.getElementById('startup-load');
            const startupCreateBtn = document.getElementById('startup-create');


            function showUserModal() { if (userModal) { userModal.style.display = 'flex'; setTimeout(() => startupUserId?.focus(), 0); } }
            function hideUserModal() { if (userModal) { userModal.style.display = 'none'; } }
            function isUserSet() { const id = localStorage.getItem('userId'); return !!id && id !== 'public'; }

            async function handleLoadStartup() {
                const id = (startupUserId?.value || '').trim();
                if (!id) { alert('Enter a User ID'); return; }
                const finalId = setUserId(id);
                hideUserModal();
                setDbUiLoaded(true);
                if (userIdDisplay) userIdDisplay.textContent = finalId;
                await reloadAllDataForUser(finalId);
            }

            async function handleCreateStartup() {
                // Generate a short ID (max 6 chars)
                const generated = Math.random().toString(36).slice(2,8);
                const finalId = setUserId(generated);
                if (userIdDisplay) userIdDisplay.textContent = finalId;
                // initialize empty datasets for new user
                await fetch('/api/recipes/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify({}) });
                await fetch('/api/ingredients/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify({}) });
                await fetch('/api/queue/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify([]) });
                hideUserModal();
                setDbUiLoaded(true);
                await reloadAllDataForUser(finalId);
            }

            startupLoadBtn?.addEventListener('click', handleLoadStartup);
            startupCreateBtn?.addEventListener('click', handleCreateStartup);



            // If modal was shown (no user set), defer loading until user chooses
            if (!isUserSet()) {
                const proceed = async () => {
                    // After user selection, run the normal bootstrap once
                    await loadRecipes();
                    loadQueue();
                    await loadIngredients();

                    initializeTheme();
                    // Run reconciliation pass and initialize UI like normal
                    try {
                        const recipeNames = new Set(Object.keys(recipes || {}));
                        let changed = false;
                        Object.keys(ingredients || {}).forEach(name => { if (recipeNames.has(name)) { delete ingredients[name]; changed = true; } });
                        if (changed) { await saveIngredients(); }
                    } catch {}
                    initializeEventListeners();
                    initializeDropdowns();
                    loadRecipeCategories();
                    renderRecipesList();
                    document.getElementById('recipe-search')?.addEventListener('input', renderRecipesList);
                    document.getElementById('add-selected-to-queue')?.addEventListener('click', function(){
                        const selected = Array.from(document.querySelectorAll('.recipe-select:checked')).map(cb => cb.dataset.recipe);
                        if (selected.length === 0) { alert('Select at least one recipe'); return; }
                        const qty = parseInt(document.getElementById('bulk-queue-quantity')?.value) || 1;
                        selected.forEach(name => { craftingQueue.push({ id: Date.now() + Math.random(), item: name, quantity: qty, completed: false, collapsed: true }); });
                        saveQueue();
                        renderQueue();
                        window.updateQueueBadge?.();

                        document.querySelectorAll('.recipe-select:checked').forEach(cb => cb.checked = false);
                    });
                    initializeBulkEdit();
                    setDbUiLoaded(true);
                };
                // On load click, use the entered database ID
                startupLoadBtn?.addEventListener('click', proceed, { once: true });
                // On create click, proceed after generation handled in handler
                startupCreateBtn?.addEventListener('click', proceed, { once: true });
            }

        const ingredientCategoryContainer = document.getElementById('ingredient-category-container');
        const ingredientCategoryInput = document.getElementById('ingredient-category');
        const ingredientFormTitle = document.getElementById('ingredient-form-title');
        const ingredientNameInput = document.getElementById('ingredient-name');
        const ingredientPriceInput = document.getElementById('ingredient-price');
        const ingredientStackSizeInput = document.getElementById('ingredient-stack-size');
        const ingredientNoteInput = document.getElementById('ingredient-note');
        // Simple store for recipe categories (separate from ingredients)
        function saveRecipeCategories() {
            try { localStorage.setItem(RECIPE_CATEGORIES_KEY, JSON.stringify(Array.from(new Set(recipeCategories)).sort())); } catch (e) {}
        }
        function loadRecipeCategories() {
            try {
                const saved = localStorage.getItem(RECIPE_CATEGORIES_KEY);
                recipeCategories = saved ? JSON.parse(saved) : [];
            } catch (e) { recipeCategories = []; }
        }

        const ingredientsList = document.getElementById('ingredients-list');
        const ingredientSearch = document.getElementById('ingredient-search');
        const importIngredientsBtn = document.getElementById('import-ingredients');
        const exportIngredientsBtn = document.getElementById('export-ingredients');

        const clearIngredientsBtn = document.getElementById('clear-ingredients');
        const importIngredientsFile = document.getElementById('import-ingredients-file');

        // Import/Export elements
        const importCompleteBtn = document.getElementById('import-complete');
        const exportCompleteBtn = document.getElementById('export-complete');
        const importCompleteFile = document.getElementById('import-complete-file');



        // Initialize application
        document.addEventListener('DOMContentLoaded', async function() {
            // Ensure a user is selected before hitting the API (explicit check, desktop-safe)
            const storedUser = localStorage.getItem('userId');
            if (!storedUser || storedUser === 'public') {
                const overlay = document.getElementById('user-modal');
                if (overlay) overlay.style.display = 'flex';
                setDbUiLoaded(false);
                return; // halt init until user chooses
            }
            setDbUiLoaded(true);
            await loadRecipes();
            loadQueue();
            await loadIngredients();

            initializeTheme();

            // After loading data, reconcile: remove ingredients that duplicate recipe names
            try {
                const recipeNames = new Set(Object.keys(recipes || {}));
                let changed = false;
                Object.keys(ingredients || {}).forEach(name => {
                    if (recipeNames.has(name)) { delete ingredients[name]; changed = true; }
                });
                if (changed) { await saveIngredients(); }
            } catch {}



            initializeEventListeners();
            initializeDropdowns();
            // Load recipe categories and initialize recipes list UI


            loadRecipeCategories();
            renderRecipesList();
            document.getElementById('recipe-search')?.addEventListener('input', renderRecipesList);
            // Add selected recipes to queue uses its own quantity input now
            document.getElementById('add-selected-to-queue')?.addEventListener('click', function(){
                const selected = Array.from(document.querySelectorAll('.recipe-select:checked')).map(cb => cb.dataset.recipe);
                if (selected.length === 0) { alert('Select at least one recipe'); return; }
                const qty = parseInt(document.getElementById('bulk-queue-quantity')?.value) || 1;
                selected.forEach(name => {
                    craftingQueue.push({ id: Date.now() + Math.random(), item: name, quantity: qty, completed: false, collapsed: true });
                });
                saveQueue();
                renderQueue();
                window.updateQueueBadge?.();
                // Auto-calculate after adding

                document.querySelectorAll('.recipe-select:checked').forEach(cb => cb.checked = false);
            });




            initializeBulkEdit();
        });

        // Section navigation
        function showSection(sectionName) {
            // Hide all sections
            document.querySelectorAll('.section-content').forEach(section => {
                section.style.display = 'none';
            });

            // Remove active class from all nav buttons
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected section
            document.getElementById(sectionName + '-section').style.display = 'block';

            // Highlight the correct nav button by matching onclick arg
            document.querySelectorAll('.navigation .nav-btn').forEach(btn => {
                const oc = btn.getAttribute('onclick') || '';
                if (oc.includes(`showSection('${sectionName}')`)) {


                    btn.classList.add('active');
                }
            });
        }

        // Theme management (locked to dark mode)
        function initializeTheme() {
            // Always enforce dark mode
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        }

        function updateThemeButtons() { /* no-op: appearance controls removed */ }

        // Storage functions
        async function saveRecipes() {
            const sortedRecipes = sortObjectAlphabetically(recipes);
            recipes = sortedRecipes;
            await fetch('/api/recipes/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify(sortedRecipes) });
            // Auto-refresh UI after recipe changes
            try { renderRecipesList && renderRecipesList(); } catch {}
            // Inline per-item details; no separate results pane to refresh
        }

        async function loadRecipes() {
            try {
                const resp = await fetch('/api/recipes/getAll', { headers: userHeaders() });
                if (resp.ok) {
                    const data = await resp.json();
                    recipes = data.recipes || {};
                } else {


                    recipes = {};
                }
            } catch (e) {
                recipes = {};
            }
        }

        async function saveIngredients() {
            const sorted = sortObjectAlphabetically(ingredients);
            ingredients = sorted;
            await fetch('/api/ingredients/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify(sorted) });
            // Auto-refresh UI after ingredient changes
            try { renderIngredients && renderIngredients(); } catch {}
            // Inline per-item details; no separate results pane to refresh
        }

        async function loadIngredients() {
            try {
                const resp = await fetch('/api/ingredients/getAll', { headers: userHeaders() });
                if (resp.ok) {
                    const data = await resp.json();
                    ingredients = data.ingredients || {};
                } else {
                    ingredients = {};
                }
            } catch (e) {
                ingredients = {};
            }
            renderIngredients();
        }

        async function saveQueue() {
            await fetch('/api/queue/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify(craftingQueue) });
        }

        async function loadQueue() {
            try {
                const resp = await fetch('/api/queue/getAll', { headers: userHeaders() });
                if (resp.ok) {
                    const data = await resp.json();
                    craftingQueue = data.queue || [];
                } else {
                    craftingQueue = [];
                }
            } catch (e) {
                craftingQueue = [];
            }
            renderQueue();
            window.updateQueueBadge?.();
            // results are shown inline under each queue item
        }

        // Helper functions
        function sortObjectAlphabetically(obj) {
            return Object.keys(obj).sort().reduce((result, key) => {
                result[key] = obj[key];
                return result;
            }, {});
        }

        // Initialize event listeners
        function initializeEventListeners() {


            // Recipe management
            if (toggleRecipeFormBtn) toggleRecipeFormBtn.addEventListener('click', toggleRecipeForm);
            if (cancelRecipeBtn) cancelRecipeBtn.addEventListener('click', hideRecipeForm);
            if (saveRecipeBtn) saveRecipeBtn.addEventListener('click', saveRecipe);
            if (addIngredientBtn) addIngredientBtn.addEventListener('click', addIngredientRow);
            // Legacy edit/delete/duplicate controls removed

            // Queue: always visible now (no toggle button)
            // addToQueueBtn removed with top form
            // Queue auto-calculates; no buttons to wire up

            // Category management
            if (toggleCategoryFormBtn) toggleCategoryFormBtn.addEventListener('click', toggleCategoryForm);

            if (cancelIngredientBtn) cancelIngredientBtn.addEventListener('click', hideCategoryForm);
            if (saveIngredientBtn) saveIngredientBtn.addEventListener('click', saveIngredient);

            // Ingredient management

            if (saveIngredientBtn) saveIngredientBtn.addEventListener('click', saveIngredient);
            if (ingredientSearch) ingredientSearch.addEventListener('input', renderIngredients);
            if (importIngredientsBtn) importIngredientsBtn.addEventListener('click', importIngredients);
            if (exportIngredientsBtn) exportIngredientsBtn.addEventListener('click', exportIngredients);
            if (clearIngredientsBtn) clearIngredientsBtn.addEventListener('click', clearIngredients);

            // Recalculate profits when employee percentage changes
            if (employeePercentageInput) {
                const rerender = () => { try { renderQueue(); } catch(e){} };
                employeePercentageInput.addEventListener('input', rerender);
                employeePercentageInput.addEventListener('change', rerender);
            }




            // Import/Export events
            if (importCompleteBtn) importCompleteBtn.addEventListener('click', importComplete);
            if (exportCompleteBtn) exportCompleteBtn.addEventListener('click', exportComplete);

            // Settings: Reconcile duplicates button (inline summary instead of alert)
            const reconcileBtn = document.getElementById('reconcile-duplicates');
            if (reconcileBtn) reconcileBtn.addEventListener('click', async () => {
                const recipeNames = new Set(Object.keys(recipes || {}));
                let removed = 0;
                Object.keys(ingredients || {}).forEach(name => {
                    if (recipeNames.has(name)) { delete ingredients[name]; removed++; }
                });
                await saveIngredients();
                renderIngredients && renderIngredients();
                const status = document.getElementById('db-status');
                if (status) {
                    status.textContent = removed > 0
                        ? `Reconciled: removed ${removed} ingredient(s) that duplicated recipe names.`
                        : 'Reconciled: no duplicates found.';
                }
            });

            // Ingredients bulk actions to mirror recipes behavior
            const openBulkIngredientsBtn = document.getElementById('open-bulk-edit');
            const deleteSelectedIngredientsBtn = document.getElementById('delete-selected-ingredients');
            const clearSelectionIngredientsBtn = document.getElementById('clear-selection');
            const selectAllIngredientsCheckbox = document.getElementById('select-all-ingredients');
            const bulkIngredientsPanel = document.getElementById('bulk-edit-panel');
            const applyBulkIngredientsBtn = document.getElementById('apply-bulk');
            const closeBulkIngredientsBtn = document.getElementById('close-bulk');

            if (openBulkIngredientsBtn) openBulkIngredientsBtn.addEventListener('click', () => {
                const selected = Array.from(document.querySelectorAll('.ingredient-select:checked'));
                if (selected.length === 1) {
                    const name = selected[0].dataset.name;
                    const ing = ingredients[name] || {};
                    if (ingredientCategoryInput) ingredientCategoryInput.value = ing.category || '';
                    if (ingredientNameInput) ingredientNameInput.value = name || '';
                    if (ingredientPriceInput) ingredientPriceInput.value = (typeof ing.price === 'number') ? ing.price : '';
                    if (ingredientStackSizeInput) ingredientStackSizeInput.value = ing.stackSize || '';
                    if (ingredientNoteInput) ingredientNoteInput.value = ing.note || '';
                    editingIngredientName = name;
                    showCategoryForm();
                    document.getElementById('ingredient-name')?.focus();
                } else if (selected.length > 1) {
                    if (bulkIngredientsPanel) bulkIngredientsPanel.style.display = 'block';
                } else {
                    if (bulkIngredientsPanel) bulkIngredientsPanel.style.display = 'block';
                }
            });
            if (closeBulkIngredientsBtn) closeBulkIngredientsBtn.addEventListener('click', () => { if (bulkIngredientsPanel) bulkIngredientsPanel.style.display = 'none'; });
            if (applyBulkIngredientsBtn) applyBulkIngredientsBtn.addEventListener('click', applyBulkEdit);
            if (clearSelectionIngredientsBtn) clearSelectionIngredientsBtn.addEventListener('click', () => {
                document.querySelectorAll('.ingredient-select').forEach(cb => cb.checked = false);
                const selAll = document.getElementById('select-all-ingredients'); if (selAll) selAll.checked = false;
            });
            if (selectAllIngredientsCheckbox) selectAllIngredientsCheckbox.addEventListener('change', (e) => {
                const checked = e.target.checked; document.querySelectorAll('.ingredient-select').forEach(cb => cb.checked = checked);
            });
            // Queue drawer listeners
            if (queueFab) {
                queueFab.addEventListener('click', () => {
                    if (!queueDrawer || !queueFab) return;
                    const open = queueDrawer.style.display !== 'none' && queueDrawer.style.display !== '';
                    if (open) {
                        queueDrawer.style.display = 'none';
                        queueDrawer.setAttribute('aria-hidden', 'true');
                        queueFab.setAttribute('aria-expanded', 'false');
                    } else {
                        queueDrawer.style.display = 'flex';
                        queueDrawer.setAttribute('aria-hidden', 'false');
                        queueFab.setAttribute('aria-expanded', 'true');
                    }
                });
            }
            if (queueDrawerClose) {
                queueDrawerClose.addEventListener('click', () => {
                    if (!queueDrawer || !queueFab) return;
                    // Move focus out of the drawer before hiding to avoid ARIA warning
                    if (queueDrawer.contains(document.activeElement)) {
                        try { document.activeElement.blur(); } catch {}
                    }
                    queueDrawer.style.display = 'none';
                    queueDrawer.setAttribute('aria-hidden', 'true');
                    queueFab.setAttribute('aria-expanded', 'false');
                    // Return focus to the FAB for accessibility
                    try { queueFab.focus(); } catch {}
                });
            }
            // Close on Escape when open
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (!queueDrawer || !queueFab) return;
                    if (queueDrawer.contains(document.activeElement)) {
                        try { document.activeElement.blur(); } catch {}
                    }
                    queueDrawer.style.display = 'none';
                    queueDrawer.setAttribute('aria-hidden', 'true');
                    queueFab.setAttribute('aria-expanded', 'false');
                    try { queueFab.focus(); } catch {}
                }
            });

            if (deleteSelectedIngredientsBtn) deleteSelectedIngredientsBtn.addEventListener('click', () => {
                const selected = Array.from(document.querySelectorAll('.ingredient-select:checked')).map(cb => cb.dataset.name);
                if (selected.length === 0) { alert('Select at least one ingredient to delete.'); return; }
                if (!confirm(`Delete ${selected.length} ingredient(s)? This cannot be undone.`)) return;
                selected.forEach(name => { delete ingredients[name]; });
                saveIngredients();
                renderIngredients();
            });

            // Item selection (legacy, only if itemSelect exists)
            if (itemSelect) {
                itemSelect.addEventListener('input', function() {
                    updateAutocomplete(this.value);
                });

                itemSelect.addEventListener('change', function() {
                    const isRecipeSelected = this.value !== '' && recipes[this.value];
                    if (editRecipeBtn) editRecipeBtn.disabled = !isRecipeSelected;
                    if (deleteRecipeBtn) deleteRecipeBtn.disabled = !isRecipeSelected;
                    if (duplicateRecipeBtn) duplicateRecipeBtn.disabled = !isRecipeSelected;
                });
            }



            // Hide dropdowns when clicking outside
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.searchable-dropdown')) {
                    document.querySelectorAll('.autocomplete-list').forEach(list => {
                        list.style.display = 'none';
                    });
                }
            });
        }

        function initializeDropdowns() {
            // Initialize ingredient dropdown
            setTimeout(() => {
                const initialDropdownContainer = document.querySelector('.ingredient-dropdown');
                if (initialDropdownContainer) {
                    setupIngredientDropdown(initialDropdownContainer);
                }

                // Initialize category dropdown
                const categoryContainer = document.querySelector('.category-dropdown');
                if (categoryContainer) {
                    setupCategoryDropdown(recipeCategoryInput, categoryList);
                }

                // Initialize ingredient category dropdown
                setupIngredientCategoryDropdown();



                // Add remove functionality to initial remove button
                const initialRemoveBtn = document.querySelector('.remove-ingredient');
                if (initialRemoveBtn) {
                    initialRemoveBtn.addEventListener('click', function() {
                        const row = this.closest('.ingredient-row');
                        if (row && document.querySelectorAll('.ingredient-row').length > 1) {
                            row.remove();
                        } else if (row) {
                            // Clear the inputs instead of removing the row
                            row.querySelector('.ingredient-name').value = '';
                            row.querySelector('.ingredient-amount').value = '';
                        }
                    });
                }
            }, 100);


        }

        // Recipe functions
        async function saveRecipe() {
            const recipeName = document.getElementById('recipe-name').value.trim();
            const outputQty = parseInt(document.getElementById('recipe-output').value);
            const sellingPrice = parseFloat(document.getElementById('recipe-price').value) || 0;
            const stackSize = parseInt(document.getElementById('recipe-stack-size')?.value) || null;
            const notes = (document.getElementById('recipe-notes')?.value || '').trim();

            if (!recipeName) {
                alert('Please enter a recipe name');
                return;
            }

            if (isNaN(outputQty) || outputQty <= 0) {
                alert('Please enter a valid output quantity');
                return;
            }

            const recipeIngredients = {};


            let valid = true;

            // Collect all ingredients
            document.querySelectorAll('.ingredient-row').forEach(row => {
                const name = row.querySelector('.ingredient-name').value;
                const amount = parseInt(row.querySelector('.ingredient-amount').value);

                if (!name || isNaN(amount) || amount <= 0) {
                    valid = false;
                    return;
                }

                recipeIngredients[name] = amount;
            });

            if (!valid || Object.keys(recipeIngredients).length === 0) {
                alert('Please add valid ingredients');
                return;
            }

            const category = document.getElementById('recipe-category').value.trim() || 'Uncategorized';

            // Auto-create any ingredient entries that are used in this recipe but not yet in the ingredients list
            Object.keys(recipeIngredients).forEach(ingName => {
                // Skip category placeholders like [Crops]
                if (!ingName) return;
                const isCategoryPlaceholder = ingName.startsWith('[') && ingName.endsWith(']');
                if (!isCategoryPlaceholder && !ingredients[ingName] && !recipes[ingName]) {
                    ingredients[ingName] = {
                        category: 'Uncategorized',
                        price: 0,
                        stackSize: 50,
                        note: ''
                    };
                }
            });


            // If editing and name changed, delete the old recipe
            if (editingRecipeName && editingRecipeName !== recipeName) {
                delete recipes[editingRecipeName];
                // Also remove stale ingredient entry for old name to avoid price drift
                if (ingredients[editingRecipeName]) { delete ingredients[editingRecipeName]; await saveIngredients(); }
            }

            // Save recipe with category and price
            recipes[recipeName] = {
                ingredients: sortObjectAlphabetically(recipeIngredients),
                outputQty: outputQty,
                category: category,
                sellingPrice: sellingPrice,
                stackSize: stackSize,
                notes: notes
            };
            // Ensure recipe names are not duplicated as ingredients
            if (ingredients[recipeName]) { delete ingredients[recipeName]; }
            await saveIngredients();

            // Save to DB and refresh UI
            await saveRecipes();

            // Clear editing state
            editingRecipeName = null;

            // Clear form (guard if form is not present, e.g., modal closed during save)
            const rc = document.getElementById('recipe-category'); if (rc) rc.value = '';
            const rn = document.getElementById('recipe-name'); if (rn) rn.value = '';
            const ro = document.getElementById('recipe-output'); if (ro) ro.value = '';
            const rp = document.getElementById('recipe-price'); if (rp) rp.value = '';
            const rs = document.getElementById('recipe-stack-size'); if (rs) rs.value = '';
            const rnotes = document.getElementById('recipe-notes'); if (rnotes) rnotes.value = '';
            try { resetIngredientsContainer && resetIngredientsContainer(); } catch(e) {}

            alert(`Recipe for ${recipeName} saved!`);

            // Hide form after saving
            hideRecipeForm();
        }

        function resetIngredientsContainer() {
            ingredientsContainer.innerHTML = `
                <div class="ingredient-row">
                    <div class="searchable-dropdown ingredient-dropdown">
                        <input type="text" class="ingredient-name" placeholder="Type to search or click to browse..." autocomplete="off">
                        <div class="autocomplete-list ingredient-list"></div>
                    </div>
                    <input type="number" class="ingredient-amount" placeholder="Amount" min="1">
                    <button class="remove-ingredient icon-btn danger-btn">✕</button>
                </div>
            `;

            // Setup the dropdown and add remove functionality
            const newRow = ingredientsContainer.querySelector('.ingredient-row');
            setupIngredientDropdown(newRow.querySelector('.ingredient-dropdown'));
            newRow.querySelector('.remove-ingredient').addEventListener('click', function() {
                if (document.querySelectorAll('.ingredient-row').length > 1) {
                    newRow.remove();
                } else {
                    // Clear the inputs instead of removing the row
                    newRow.querySelector('.ingredient-name').value = '';
                    newRow.querySelector('.ingredient-amount').value = '';
                }
            });
        }

        function addIngredientRow() {
            const newRow = document.createElement('div');
            newRow.className = 'ingredient-row';
            newRow.innerHTML = `
                <div class="searchable-dropdown ingredient-dropdown">
                    <input type="text" class="ingredient-name" placeholder="Type to search or click to browse..." autocomplete="off">
                    <div class="autocomplete-list ingredient-list"></div>

                </div>
                <input type="number" class="ingredient-amount" placeholder="Amount" min="1">
                <button class="remove-ingredient icon-btn danger-btn">✕</button>
            `;
            ingredientsContainer.appendChild(newRow);

            // Setup the new dropdown
            setupIngredientDropdown(newRow.querySelector('.ingredient-dropdown'));

            // Add remove functionality to the new button
            newRow.querySelector('.remove-ingredient').addEventListener('click', function() {
                newRow.remove();
            });
        }

        // Legacy edit-by-top-selector function removed
        function editRecipe() {}

        // Legacy basic edit/delete/duplicate handlers removed with old top selector UI
        function deleteRecipe() {}
        async function duplicateRecipe() {}

        function exportRecipes() {
            if (Object.keys(recipes).length === 0) {
                alert('No recipes to export');
                return;
            }

            const recipesJSON = JSON.stringify(recipes, null, 2);
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

        function importRecipes() {
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

                    // Remove any ingredients that now have a corresponding recipe name
                    try { Object.keys(importedRecipes).forEach(name => { if (ingredients[name]) delete ingredients[name]; }); } catch {}

                    // Persist changes
                    saveIngredients();
                    saveRecipes();

                    // Refresh the Recipes list UI immediately
                    renderRecipesList();

                    alert('Recipes imported successfully!');
                } catch (error) {
                    alert('Error importing recipes: Invalid JSON file');
                    console.error(error);
                }
            };

            reader.readAsText(file);
        }

        function clearRecipeBook() {
            if (confirm('Are you sure you want to clear all recipes and start a new recipe book?')) {
                // Clear recipes
                recipes = {};

                // Clear localStorage
                localStorage.removeItem(STORAGE_KEY);

                // Clear form
                const rn = document.getElementById('recipe-name'); if (rn) rn.value = '';
                const ro = document.getElementById('recipe-output'); if (ro) ro.value = '';
                const rp = document.getElementById('recipe-price'); if (rp) rp.value = '';
                const rc = document.getElementById('recipe-category'); if (rc) rc.value = '';
                try { resetIngredientsContainer && resetIngredientsContainer(); } catch(e) {}

                alert('Recipe book cleared. You can now start fresh!');
            }
        }

        // Calculation functions (legacy single-item calculation removed)

        function calculateCategoryIngredientCost(ingredientName, amount) {
            // Check if this is a category (wrapped in brackets)
            if (ingredientName.startsWith('[') && ingredientName.endsWith(']')) {
                const categoryName = ingredientName.slice(1, -1); // Remove brackets

                // Find all ingredients in this category
                const ingredientsInCategory = Object.keys(ingredients).filter(name => {
                    const ingredient = ingredients[name];
                    return (ingredient.category || 'Uncategorized') === categoryName;
                });

                if (ingredientsInCategory.length > 0) {
                    // Calculate average price of ingredients in category
                    // (prices for recipes are already craft cost per unit after sync)
                    let totalPrice = 0;
                    let priceCount = 0;

                    ingredientsInCategory.forEach(name => {
                        if (ingredients[name] && typeof ingredients[name].price === 'number') {
                            totalPrice += ingredients[name].price;
                            priceCount++;
                        }
                    });

                    if (priceCount > 0) {
                        const averagePrice = totalPrice / priceCount;
                        return amount * averagePrice;
                    }
                }
            } else {
                // Regular ingredient or recipe fallback
                if (ingredients[ingredientName] && typeof ingredients[ingredientName].price === 'number') {
                    return amount * ingredients[ingredientName].price;
                }
                // If this name refers to a recipe, use its craft cost per unit
                if (recipes[ingredientName]) {
                    try {
                        const output = Math.max(1, (recipes[ingredientName].outputQty || 1));
                        const req = calculateItemRequirements(ingredientName, output);
                        const perUnit = output > 0 ? ((req.totalCost || 0) / output) : 0;
                        return amount * perUnit;
                    } catch (e) {}
                }
            }

            return 0;
        }

        function calculateItemRequirements(item, quantity) {
            if (!recipes[item]) {
                return { ingredients: {}, totalCost: 0 };
            }

            const result = { ingredients: {}, totalCost: 0 };
            const recipeData = recipes[item];
            const recipeIngredients = recipeData.ingredients;
            const outputQty = Math.max(1, (recipeData.outputQty || 1));

            // Calculate how many recipe runs are needed
            const recipesNeeded = Math.ceil(quantity / outputQty);

            for (const [ingredient, amount] of Object.entries(recipeIngredients)) {
                const totalAmount = amount * recipesNeeded;

                // Add ingredient to result (keep category names as-is)
                if (result.ingredients[ingredient]) {
                    result.ingredients[ingredient] += totalAmount;
                } else {
                    result.ingredients[ingredient] = totalAmount;
                }

                // Calculate cost (use average price for categories)
                result.totalCost += calculateCategoryIngredientCost(ingredient, totalAmount);
            }

            return result;
        }

            // Build a nested HTML list recursively for a recipe ingredient until base ingredients
            function buildNestedRecipeList(name, amount) {
                const stackInfo = getStackInfo(name, amount);
                // Base ingredient or category token
                if (!recipes[name]) {
                    return `<li><div class="ingredient-line">${amount}x ${stackInfo.displayName}</div></li>`;
                }
                // Immediate children required for the requested amount of this recipe
                const req = calculateItemRequirements(name, amount);

                const children = Object.entries(req.ingredients || {})
                    .sort(([a],[b]) => a.localeCompare(b))
                    .map(([child, amt]) => buildNestedRecipeList(child, amt))
                    .join('') || '<li style="opacity:0.7;">No ingredients</li>';
                const notes = recipes[name].notes ? `<div class=\"nested-notes\">${recipes[name].notes}</div>` : '';
                // Minimalist inline toggle: click the line to reveal a simple list
                return `
<li>
  <div class=\"ingredient-line sub-recipe-trigger\" role=\"button\" tabindex=\"0\" aria-expanded=\"false\">${amount}x ${stackInfo.displayName} <span class=\"recipe-badge\">recipe</span></div>
  <div class=\"sub-card\" style=\"display:none;\">
    <ul class=\"nested-ingredients\">${children}</ul>
    ${notes}
  </div>
</li>`;
            }


        // Helper function to calculate stack information
        function getStackInfo(ingredientName, amount) {
            let stackSize = null; // unknown by default
            const ingObj = ingredients[ingredientName];
            if (!ingredientName.startsWith('[') && !ingredientName.endsWith(']')) {
                if (ingObj && !isNaN(parseInt(ingObj.stackSize))) {
                    stackSize = parseInt(ingObj.stackSize);
                } else {
                    stackSize = amount; // if unknown, treat as single stack to avoid NaN; we'll show fallback text
                }
            }
            let displayName = ingredientName;

            // Check if this is a category ingredient
            if (ingredientName.startsWith('[') && ingredientName.endsWith(']')) {
                const categoryName = ingredientName.slice(1, -1);
                displayName = categoryName;

                // Find ingredients in this category and get the minimum stack size
                const ingredientsInCategory = Object.keys(ingredients).filter(name => {
                    const ingredient = ingredients[name];
                    return (ingredient.category || 'Uncategorized') === categoryName;
                });

                if (ingredientsInCategory.length > 0) {
                    stackSize = Math.min(...ingredientsInCategory.map(name =>
                        ingredients[name].stackSize || 50
                    ));
                }
            } else {
                // Regular ingredient
                if (ingredients[ingredientName]) {
                    const s = parseInt(ingredients[ingredientName].stackSize);
                    stackSize = isNaN(s) ? amount : s;
                }
            }

            const stacks = Math.ceil(amount / stackSize);
            const remainder = amount % stackSize;

            return {
                displayName,
                amount,
                stackSize,
                stacks,
                remainder,
                stackText: stacks > 1 ?
                    `${stacks} stacks${remainder > 0 ? ` (${remainder} in last stack)` : ''}` :
                    `${amount} items`
            };
        }



        // Autocomplete functions
        function updateAutocomplete(searchTerm = '', showAll = false) {
            const autocompleteList = document.getElementById('autocomplete-list');
            autocompleteList.innerHTML = '';

            if (!searchTerm.trim() && !showAll) {
                autocompleteList.style.display = 'none';
                return;
            }

            // Get all categories
            const categories = new Set();
            Object.values(recipes).forEach(recipe => {
                categories.add(recipe.category || 'Uncategorized');
            });

            // Sort categories
            const sortedCategories = Array.from(categories).sort();

            // Create items for each category
            sortedCategories.forEach(category => {
                const recipeNames = Object.keys(recipes).filter(name => {
                    const recipe = recipes[name];
                    const recipeCategory = recipe.category || 'Uncategorized';
                    return recipeCategory === category &&
                           (showAll ||
                            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            recipeCategory.toLowerCase().includes(searchTerm.toLowerCase()));
                }).sort();

                if (recipeNames.length > 0) {
                    // Add category header
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'autocomplete-category';
                    categoryDiv.textContent = category;
                    autocompleteList.appendChild(categoryDiv);

                    // Add recipes for this category
                    recipeNames.forEach(name => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'autocomplete-item category-item';
                        itemDiv.textContent = name;
                        itemDiv.addEventListener('click', () => selectItem(name));
                        autocompleteList.appendChild(itemDiv);
                    });
                }
            });

            if (autocompleteList.children.length > 0) {
                autocompleteList.style.display = 'block';
            } else {
                autocompleteList.style.display = 'none';
            }
        }

        // Legacy top selector helper removed (selectItem no longer used)

        // Queue functions (legacy addToQueue via top form removed)

        function calculateQueue() {
            if (craftingQueue.length === 0) {
                alert('Queue is empty');
                return;
            }

            // Render new grouped-by-item format
            renderQueue(); // results render inline per item now
        }

        function calculateQueueRequirements() {
            const totalRequirements = { ingredients: {}, totalCost: 0 };

            // Only calculate for uncompleted items
            const uncompletedItems = craftingQueue.filter(item => !item.completed);

            uncompletedItems.forEach(queueItem => {
                const itemRequirements = calculateItemRequirements(queueItem.item, queueItem.quantity);

                // Merge requirements
                for (const [ingredient, amount] of Object.entries(itemRequirements.ingredients)) {
                    if (totalRequirements.ingredients[ingredient]) {
                        totalRequirements.ingredients[ingredient] += amount;
                    } else {
                        totalRequirements.ingredients[ingredient] = amount;
                    }
                }

                // Add costs
                totalRequirements.totalCost += itemRequirements.totalCost;
            });

            return totalRequirements;
        }

        function displayQueueResults(requirements) {
            queueResultsDiv.innerHTML = '';

            if (Object.keys(requirements.ingredients).length === 0) {
                queueResultsDiv.innerHTML = '<p>No materials needed</p>';
                return;
            }

            // Add cost information
            const costInfo = document.createElement('div');
            costInfo.className = 'cost-info';

            // Calculate total selling price and profit for queue
            let totalSellValue = 0;
            const uncompletedItems = craftingQueue.filter(item => !item.completed);
            const employeePercentage = employeePercentageInput ? (parseFloat(employeePercentageInput.value) || 0) : 0;

            uncompletedItems.forEach(queueItem => {
                const recipe = recipes[queueItem.item];
                if (recipe && recipe.sellingPrice) {
                    totalSellValue += recipe.sellingPrice * queueItem.quantity;
                }
            });

            const grossProfit = totalSellValue - requirements.totalCost;
            const employeeCost = employeePercentage > 0 ? (Math.max(grossProfit, 0) * employeePercentage / 100) : 0;
            const netProfit = grossProfit - employeeCost;
            const profitMargin = totalSellValue > 0 ? (netProfit / totalSellValue * 100).toFixed(1) : 0;

            if (totalSellValue > 0) {
                let costHTML = `
                    <div class="cost-section">
                        <div class="cost-row revenue">
                            <span>Revenue:</span>
                            <span class="cost-value">$${totalSellValue.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="cost-section">
                        <div class="cost-section-title">Expenses:</div>
                        <div class="cost-row expense">
                            <span>Material Cost:</span>
                            <span class="cost-value">-$${requirements.totalCost.toFixed(2)}</span>
                        </div>
                `;

                if (employeePercentage > 0 && employeeCost > 0) {
                    costHTML += `
                        <div class="cost-row expense">
                            <span>Employee Cost (${employeePercentage}%):</span>
                            <span class="cost-value">-$${employeeCost.toFixed(2)}</span>
                        </div>
                    `;
                }

                const totalExpenses = requirements.totalCost + employeeCost;
                costHTML += `
                        <div class="cost-row expense-total">
                            <span>Total Expenses:</span>
                            <span class="cost-value">-$${totalExpenses.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="cost-section">
                        <div class="cost-row ${netProfit >= 0 ? 'profit' : 'loss'} final-result">
                            <span>${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}:</span>
                            <span class="cost-value">${netProfit >= 0 ? '$' : '-$'}${Math.abs(netProfit).toFixed(2)} (${profitMargin}%)</span>
                        </div>
                        ${(netProfit < 0) ? `
                        <div class="cost-row suggestion" title="Employee cost applies only to profit; at break even it is $0">
                            <span>Suggested Selling Price to break even:</span>
                            <span class="cost-value">$${requirements.totalCost.toFixed(2)}</span>
                        </div>
                        <div class="cost-row suggestion">
                            <span>Break-even total expenses:</span>
                            <span class="cost-value">$${requirements.totalCost.toFixed(2)}</span>
                        </div>` : ''}
                    </div>
                `;

                costInfo.innerHTML = costHTML;
            } else {
                costInfo.innerHTML = `
                    <div class="cost-section">
                        <div class="cost-row expense">
                            <span>Material Cost:</span>
                            <span class="cost-value">$${requirements.totalCost.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            }

            queueResultsDiv.appendChild(costInfo);

            // Add materials list
            const header = document.createElement('h3');
            header.textContent = 'Required Materials:';
            queueResultsDiv.appendChild(header);

            const list = document.createElement('ul');

            // Sort ingredients alphabetically
            const sortedIngredients = Object.keys(requirements.ingredients).sort();

            for (const ingredient of sortedIngredients) {
                const amount = requirements.ingredients[ingredient];
                const item = document.createElement('li');
                const stackInfo = getStackInfo(ingredient, amount);

                // Check if this is a category ingredient
                if (ingredient.startsWith('[') && ingredient.endsWith(']')) {
                    const cost = calculateCategoryIngredientCost(ingredient, amount);

                    if (cost > 0) {
                        item.innerHTML = `
                            <div class="ingredient-line">
                                <span>${stackInfo.displayName}: ${amount}</span>
                                <span class="ingredient-cost">$${cost.toFixed(2)} (avg)</span>
                            </div>
                        `;
                    } else {
                        item.innerHTML = `
                            <div class="ingredient-line">${stackInfo.displayName}: ${amount}</div>
                        `;
                    }
                } else {
                    // Regular ingredient or recipe: compute cost using helper (handles both)
                    const cost = calculateCategoryIngredientCost(ingredient, amount);
                    if (cost > 0) {
                        item.innerHTML = `
                            <div class="ingredient-line">
                                <span>${stackInfo.displayName}: ${amount}</span>
                                <span class="ingredient-cost">$${cost.toFixed(2)}</span>
                            </div>
                        `;
                    } else {
                        item.innerHTML = `
                            <div class="ingredient-line">${stackInfo.displayName}: ${amount}</div>
                        `;
                    }
                }

                list.appendChild(item);
            }

            queueResultsDiv.appendChild(list);
        }


            // New: display queue results grouped by item (sorted by item name) with cost/profit summary
            function displayQueueResultsByItem() {
                queueResultsDiv.innerHTML = '';
                if (!craftingQueue || craftingQueue.length === 0) {
                    queueResultsDiv.innerHTML = '<p>No materials needed</p>';
                    return;
                }

                // Prepare data
                const sortedQueue = [...craftingQueue].sort((a, b) => (a.item || '').localeCompare(b.item || ''));

                // Overall totals (interpret queued quantity in terms of full stacks of the product)
                let totalMaterialCost = 0;
                let totalSellValue = 0;
                sortedQueue.forEach(q => {
                    const recipe = recipes[q.item] || {};
                    const unitsRequested = Math.max(1, q.quantity);

                    const req = calculateItemRequirements(q.item, unitsRequested);
                    totalMaterialCost += (req.totalCost || 0);

                    if (recipe && recipe.sellingPrice) totalSellValue += (recipe.sellingPrice * unitsRequested);
                });

                // Overall summary block
                const employeePercentage = employeePercentageInput ? (parseFloat(employeePercentageInput.value) || 0) : 0;
                const grossProfit = totalSellValue - totalMaterialCost;
                const employeeCost = employeePercentage > 0 ? (Math.max(grossProfit, 0) * employeePercentage / 100) : 0;
                const netProfit = grossProfit - employeeCost;
                const profitMargin = totalSellValue > 0 ? ((netProfit / totalSellValue) * 100).toFixed(1) : 0;

                const costInfo = document.createElement('div');
                // Collect per-recipe cost blocks to append at the end (Option B)
                const perRecipeCostBlocks = [];

                costInfo.className = 'cost-info';
                if (totalSellValue > 0) {
                    let costHTML = `
                        <div class="cost-section">
                            <div class="cost-row revenue">
                                <span>Revenue:</span>
                                <span class="cost-value">$${totalSellValue.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="cost-section">
                            <div class="cost-section-title">Expenses:</div>
                            <div class="cost-row expense">
                                <span>Material Cost:</span>
                                <span class="cost-value">-$${totalMaterialCost.toFixed(2)}</span>
                            </div>
                    `;
                    if (employeePercentage > 0 && employeeCost > 0) {
                        costHTML += `
                            <div class="cost-row expense">
                                <span>Employee Cost (${employeePercentage}%):</span>
                                <span class="cost-value">-$${employeeCost.toFixed(2)}</span>
                            </div>
                        `;
                    }
                    const totalExpenses = totalMaterialCost + employeeCost;
                    costHTML += `
                            <div class="cost-row expense-total">
                                <span>Total Expenses:</span>
                                <span class="cost-value">-$${totalExpenses.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="cost-section">
                            <div class="cost-row ${netProfit >= 0 ? 'profit' : 'loss'} final-result">
                                <span>${netProfit >= 0 ? 'Net Profit' : 'Net Loss'}:</span>
                                <span class="cost-value">${netProfit >= 0 ? '$' : '-$'}${Math.abs(netProfit).toFixed(2)} (${profitMargin}%)</span>
                            </div>
                            ${(netProfit < 0) ? `
                            <div class="cost-row suggestion" title="Employee cost applies only to profit; at break even it is $0">
                                <span>Suggested Selling Price to break even:</span>
                                <span class="cost-value">$${totalMaterialCost.toFixed(2)}</span>
                            </div>
                            <div class="cost-row suggestion">
                                <span>Break-even total expenses:</span>
                                <span class="cost-value">$${totalMaterialCost.toFixed(2)}</span>
                            </div>` : ''}
                        </div>
                    `;
                    costInfo.innerHTML = costHTML;

                    // Append per-recipe cost blocks (Option B)
                    if (perRecipeCostBlocks.length) {
                        costInfo.innerHTML += perRecipeCostBlocks.join('\n');
                    }

                } else {
                    costInfo.innerHTML = `
                        <div class="cost-section">
                            <div class="cost-row expense">
                                <span>Material Cost:</span>
                                <span class="cost-value">$${totalMaterialCost.toFixed(2)}</span>
                            </div>
                        </div>
                    `;
                    if (perRecipeCostBlocks.length) {
                        costInfo.innerHTML += perRecipeCostBlocks.join('\n');
                    }
                }

                // Per-item breakdown
                sortedQueue.forEach(q => {
                    const section = document.createElement('details');
                    section.className = 'collapsible-section queue-result-section';
                    section.open = !(q && q.collapsed);

                    const summary = document.createElement('summary');
                    summary.textContent = `${q.item} x${q.quantity}`;
                    section.appendChild(summary);

                    // Persist collapsed state per queue item
                    section.addEventListener('toggle', () => {
                        q.collapsed = !section.open;
                        saveQueue();
                    });

                    const recipe = recipes[q.item] || {};
                    const stackSize = recipe.stackSize || 50;

                    // Card body container to style like a card
                    const card = document.createElement('div');
                    card.className = 'queue-card';
                    // Queued quantity (exact items requested)
                    const unitsRequested = Math.max(1, q.quantity);


                        // Compute stacks required for the requested quantity
                        const stacksNeeded = Math.ceil(unitsRequested / stackSize);
                        const fullStacks = Math.floor(unitsRequested / stackSize);
                        const remainder = unitsRequested % stackSize;
                        // Update summary to include stacks info
                        try {
                            summary.textContent = `${q.item} x${unitsRequested}  b7 ${stacksNeeded} stack${stacksNeeded === 1 ? '' : 's'}`;
                        } catch {}
                        summary.textContent = `${q.item} x${unitsRequested} - ${stacksNeeded} stack${stacksNeeded === 1 ? '' : 's'}`;

                        // Show a small line in the card with stack detail
                        const stacksInfo = document.createElement('div');
                        stacksInfo.className = 'queue-stack-info';
                        stacksInfo.textContent = (remainder === 0)
                            ? `Stacks required: ${stacksNeeded} (size ${stackSize})`
                            : `Stacks required: ${stacksNeeded} (full ${fullStacks} + partial ${remainder}/${stackSize})`;
                        card.appendChild(stacksInfo);


                    // Build materials per stack dropdown
                    const perStackDetails = document.createElement('details');
                    perStackDetails.className = 'sub-recipe';
                    perStackDetails.open = false;
                    const perStackSummary = document.createElement('summary');
                    perStackSummary.className = 'stack-summary';
                    perStackSummary.textContent = `View Stack (${stackSize}) Recipe`;
                    perStackDetails.appendChild(perStackSummary);

                    const reqPerStack = calculateItemRequirements(q.item, stackSize);
                    const list = document.createElement('ul');
                    list.className = 'nested-ingredients';
                    const ingredientNames = Object.keys(reqPerStack.ingredients).sort();
                    ingredientNames.forEach(name => {
                        const amount = reqPerStack.ingredients[name];

                        // Build full nested tree for this ingredient recursively
                        const html = buildNestedRecipeList(name, amount);
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = html;
                        const li = wrapper.firstElementChild;
                        // Wire toggles for all triggers within this subtree (works before insertion)
                        li.querySelectorAll('.sub-recipe-trigger').forEach((triggerEl) => {
                            const targetEl = li.querySelector('#' + triggerEl.dataset.target);
                            if (targetEl) {
                                triggerEl.addEventListener('click', () => {
                                    targetEl.style.display = (targetEl.style.display === 'none' || !targetEl.style.display) ? 'block' : 'none';
                                });
                            }
                        });
                        list.appendChild(li);
                    });

                    // Place list inside a sub-card to match recipe card styling
                    const perStackCard = document.createElement('div');
                    perStackCard.className = 'sub-card';
                    list.classList.add('nested-ingredients');
                    perStackCard.appendChild(list);
                    perStackDetails.appendChild(perStackCard);

                    // Total materials for the exact quantity (stays above)
                    const reqForQuantity = calculateItemRequirements(q.item, unitsRequested);
                    const ingNames2 = Object.keys(reqForQuantity.ingredients).sort();









                    const breakdownList = document.createElement('ul');
                    breakdownList.className = 'nested-ingredients';
                    ingNames2.forEach(name => {
                        const amount = reqForQuantity.ingredients[name];
                        // Include both base ingredients and sub-recipes
                        const html = buildNestedRecipeList(name, amount);
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = html;
                        const li = wrapper.firstElementChild;
                        li.querySelectorAll('.sub-recipe-trigger').forEach((triggerEl) => {
                            const targetEl = li.querySelector('#' + triggerEl.dataset.target);
                            if (targetEl) {
                                triggerEl.addEventListener('click', () => {
                                    targetEl.style.display = (targetEl.style.display === 'none' || !targetEl.style.display) ? 'block' : 'none';
                                });
                            }
                        });
                        breakdownList.appendChild(li);
                    });
                    card.appendChild(breakdownList);
                    // Append per-stack dropdown to the very bottom of the card
                    card.appendChild(perStackDetails);

                    // Cost lines moved to bottom-most cost summary card; no per-item inline cost rows





                    // Build small cost block for this recipe (Option B) and store for later append
                    const reqPerStackForCost = calculateItemRequirements(q.item, stackSize);
                    const reqForQuantityForCost = calculateItemRequirements(q.item, unitsRequested);
                    perRecipeCostBlocks.push(`
                        <div class="cost-section">
                            <div class="cost-section-title">${q.item} Cost</div>
                            <div class="cost-row"><span>Material Cost per Stack:</span><span class="cost-value">$${(reqPerStackForCost.totalCost || 0).toFixed(2)}</span></div>
                            <div class="cost-row"><span>Material Cost for ${unitsRequested} item${unitsRequested === 1 ? '' : 's'}:</span><span class="cost-value">$${(reqForQuantityForCost.totalCost || 0).toFixed(2)}</span></div>
                        </div>
                    `);

                    section.appendChild(card);


                    queueResultsDiv.appendChild(section);
                });

                // Append summary as the last/bottom card
                queueResultsDiv.appendChild(costInfo);
            }

        function renderQueue() {
            queueItemsDiv.innerHTML = '';

            if (craftingQueue.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-queue';
                emptyState.innerHTML = `
                    <div class="empty-icon">📋</div>
                    <p>Your queue is empty</p>
                    <p class="empty-hint">Select a recipe and click "Add to Queue"</p>
                `;
                queueItemsDiv.appendChild(emptyState);
                window.updateQueueBadge?.();
                return;
            }

            craftingQueue.forEach((queueItem, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'queue-item';
                itemDiv.dataset.index = index;
                if (queueItem.completed) {
                    itemDiv.classList.add('queue-item-complete');
                }

                itemDiv.innerHTML = `
                    <div class="queue-item-info">
                        <input type="number" class="queue-quantity" value="${queueItem.quantity}" min="1">
                        <span class="queue-item-title">${queueItem.item}</span>
                        <img src="img/delete.png" class="queue-item-delete icon-img icon-delete" alt="Delete" style="margin-left:auto; width:18px; height:18px; cursor:pointer;" />
                    </div>
                `;

                // Quantity input handlers (typed)
                (function(){
                    const qtyInput = itemDiv.querySelector('.queue-quantity');
                    if (!qtyInput) return;
                    const apply = () => {
                        let newQty = parseInt(qtyInput.value);
                        if (!Number.isFinite(newQty) || newQty <= 0) {
                            qtyInput.value = craftingQueue[index].quantity;
                            return false;
                        }
                        craftingQueue[index].quantity = newQty;
                        saveQueue();
                        window.updateQueueBadge?.();
                        renderQueue();
                        return true;
                    };
                    qtyInput.addEventListener('change', apply);
                    qtyInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') { e.preventDefault(); apply(); }
                    });
                })();

                // Build details (stacks + ingredients) under this item
                (function(){
                    const detailsWrap = document.createElement('div');
                    detailsWrap.className = 'queue-item-details';

                    const recipe = recipes[queueItem.item] || {};
                    const stackSize = recipe.stackSize || 50;
                    const unitsRequested = Math.max(1, queueItem.quantity);


                    // Per-stack recipe collapsible (moved to appear directly under the recipe name)
                    const perStackDetails = document.createElement('details');
                    perStackDetails.className = 'sub-recipe';
                    perStackDetails.open = false;
                    const perStackSummary = document.createElement('summary');
                    perStackSummary.className = 'stack-summary';
                    perStackSummary.textContent = `View Stack (${stackSize}) Recipe`;
                    perStackDetails.appendChild(perStackSummary);

                    const reqPerStack = calculateItemRequirements(queueItem.item, stackSize);
                    const list = document.createElement('ul');
                    list.className = 'nested-ingredients';
                    Object.keys(reqPerStack.ingredients).sort().forEach(name => {
                        const amount = reqPerStack.ingredients[name];
                        const html = buildNestedRecipeList(name, amount);
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = html;
                        const li = wrapper.firstElementChild;
                        li.querySelectorAll('.sub-recipe-trigger').forEach((triggerEl) => {
                            const toggle = () => {
                                const card = triggerEl.nextElementSibling;
                                if (card) {
                                    card.style.display = (card.style.display === 'none' || !card.style.display) ? 'block' : 'none';
                                }
                            };
                            triggerEl.addEventListener('click', toggle);
                            triggerEl.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
                            });
                        });
                        list.appendChild(li);
                    });
                    const perStackCard = document.createElement('div');
                    perStackCard.className = 'sub-card';
                    list.classList.add('nested-ingredients');
                    perStackCard.appendChild(list);
                    perStackDetails.appendChild(perStackCard);



                    // Stacks info
                    const stacksNeeded = Math.ceil(unitsRequested / stackSize);
                    const fullStacks = Math.floor(unitsRequested / stackSize);
                    const remainder = unitsRequested % stackSize;
                    const stacksInfo = document.createElement('div');
                    stacksInfo.className = 'queue-stack-info';
                    stacksInfo.textContent = (remainder === 0)
                        ? `Stacks required: ${stacksNeeded} (size ${stackSize})`
                        : `Stacks required: ${stacksNeeded} (full ${fullStacks} + partial ${remainder}/${stackSize})`;


                    // Total materials for the exact quantity
                    const reqForQuantity = calculateItemRequirements(queueItem.item, unitsRequested);
                    const breakdownList = document.createElement('ul');
                    breakdownList.className = 'nested-ingredients';
                    Object.keys(reqForQuantity.ingredients).sort().forEach(name => {
                        const amount = reqForQuantity.ingredients[name];
                        const html = buildNestedRecipeList(name, amount);
                        const wrapper = document.createElement('div');
                        wrapper.innerHTML = html;
                        const li = wrapper.firstElementChild;
                        li.querySelectorAll('.sub-recipe-trigger').forEach((triggerEl) => {
                            const toggle = () => {
                                const card = triggerEl.nextElementSibling;
                                if (card) {
                                    card.style.display = (card.style.display === 'none' || !card.style.display) ? 'block' : 'none';
                                }
                            };
                            triggerEl.addEventListener('click', toggle);
                            triggerEl.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
                            });
                        });
                        breakdownList.appendChild(li);
                    });
                    detailsWrap.appendChild(breakdownList);
                    // Order: per-item recipe first, then stack recipe, then stacks info line
                    // (breakdownList already appended above)
                    detailsWrap.appendChild(perStackDetails);
                    detailsWrap.appendChild(stacksInfo);
                    // Per-item cost breakdown (revenue, materials, employee, net)
                    (function(){
                        const sellPricePerUnit = (recipes[queueItem.item] && parseFloat(recipes[queueItem.item].sellingPrice)) || 0;
                        const revenue = sellPricePerUnit * unitsRequested;
                        const materialsCost = (reqForQuantity && typeof reqForQuantity.totalCost === 'number') ? reqForQuantity.totalCost : 0;
                        const employeePct = employeePercentageInput ? (parseFloat(employeePercentageInput.value) || 0) : 0;
                        const gross = revenue - materialsCost;
                        const employeeCost = (gross > 0 && employeePct > 0) ? (gross * employeePct / 100) : 0;

                        const net = gross - employeeCost;
                        const margin = revenue > 0 ? ((net / revenue) * 100).toFixed(1) : null;

                        const costBlock = document.createElement('div');
                        costBlock.className = 'queue-cost-block';
                        let html = `<div class="qc-row revenue"><span>Revenue:</span><span class="val">$${revenue.toFixed(2)}</span></div>`;
                        html += `<div class="qc-row expense"><span>Materials:</span><span class="val">-$${materialsCost.toFixed(2)}</span></div>`;
                        if (employeeCost > 0) { html += `<div class="qc-row expense"><span>Employee (${employeePct}%):</span><span class="val">-$${employeeCost.toFixed(2)}</span></div>`; }

                        html += `<div class="qc-row final ${net >= 0 ? 'profit' : 'loss'}"><span>${net >= 0 ? 'Net Profit' : 'Net Loss'}${margin !== null ? ` (${margin}%)` : ''}:</span><span class="val">${net >= 0 ? '$' : '-$'}${Math.abs(net).toFixed(2)}</span></div>`;
                        costBlock.innerHTML = html;
                        detailsWrap.appendChild(costBlock);
                    })();



                    itemDiv.appendChild(detailsWrap);
                })();

                // Remove button
                const removeBtn = itemDiv.querySelector('.queue-item-delete');
                removeBtn.addEventListener('click', function() {
                    craftingQueue.splice(index, 1);
                    saveQueue();
                    renderQueue();
                    window.updateQueueBadge?.();

                });


                // Allow clicking the recipe name to collapse/expand its details
                (function(){
                    const titleEl = itemDiv.querySelector('.queue-item-title');
                    const detailsEl = itemDiv.querySelector('.queue-item-details');
                    if (!detailsEl) return;
                    if (queueItem && queueItem.collapsed !== false) { detailsEl.style.display = 'none'; }
                    if (titleEl) {
                        titleEl.style.cursor = 'pointer';
                        titleEl.addEventListener('click', () => {
                            const hidden = detailsEl.style.display === 'none';
                            detailsEl.style.display = hidden ? '' : 'none';
                            queueItem.collapsed = !hidden;
                            saveQueue();
                        });
                    }
                })();



                queueItemsDiv.appendChild(itemDiv);
            });

            window.updateQueueBadge?.();
        }

        function clearQueue() {
            if (confirm('Are you sure you want to clear the queue?')) {
                craftingQueue = [];
                saveQueue();
                renderQueue();

                window.updateQueueBadge?.();
            }
        }



        function completeAll() {
            if (craftingQueue.length === 0) {
                alert('Queue is empty');
                return;
            }

            craftingQueue.forEach(item => {
                item.completed = true;
            });

            saveQueue();
            renderQueue();

            window.updateQueueBadge?.();
        }

        function uncompleteAll() {
            if (craftingQueue.length === 0) {
                alert('Queue is empty');
                return;
            }

            craftingQueue.forEach(item => {
                item.completed = false;
            });

            saveQueue();
            renderQueue();

            const requirements = calculateQueueRequirements();
            displayQueueResults(requirements);
            window.updateQueueBadge?.();
        }

        // Ingredient management functions
        async function saveIngredient() {
            const category = ingredientCategoryInput.value.trim() || 'Uncategorized';
            const name = ingredientNameInput.value.trim();
            const price = parseFloat(ingredientPriceInput.value);
            const stackSize = parseInt(ingredientStackSizeInput.value);
            const note = ingredientNoteInput.value.trim();

            if (!name) {
                alert('Please enter an ingredient name');
                return;
            }

            if (isNaN(price) || price < 0) {
                alert('Please enter a valid price');
                return;
            }

            if (ingredientStackSizeInput.value !== '' && (isNaN(stackSize) || stackSize < 1 || stackSize > 200)) {
                alert('Please enter a valid stack size (1-200)');
                return;
            }

            // If editing and name changed, delete the old ingredient
            if (editingIngredientName && editingIngredientName !== name) {
                delete ingredients[editingIngredientName];
            }

            ingredients[name] = {
                category: category,
                price: price,
                stackSize: (isNaN(stackSize) ? null : stackSize),
                note: note
            };

            await saveIngredients();

            // Clear editing state
            editingIngredientName = null;

            alert(`Ingredient "${name}" saved!`);

            // Hide all forms after saving
            hideAllIngredientForms();
        }

        function renderIngredients() {
            ingredientsList.innerHTML = '';

            const searchTerm = ingredientSearch.value.toLowerCase();

            // Get all categories
            const categories = new Set();
            Object.values(ingredients).forEach(ingredient => {
                categories.add(ingredient.category || 'Uncategorized');
            });

            // Sort categories
            const sortedCategories = Array.from(categories).sort();

            let hasResults = false;

            // Create sections for each category
            sortedCategories.forEach(category => {
                const categoryIngredients = Object.keys(ingredients).filter(name => {
                    const ingredient = ingredients[name];
                    const ingredientCategory = ingredient.category || 'Uncategorized';
                    return ingredientCategory === category &&
                           (name.toLowerCase().includes(searchTerm) ||
                            ingredientCategory.toLowerCase().includes(searchTerm));
                }).sort();

                if (categoryIngredients.length > 0) {
                    hasResults = true;

                    // Create category section
                    const categorySection = document.createElement('div');
                    categorySection.className = 'ingredient-category-section';

                    // Add category header with controls
                    const categoryHeader = document.createElement('div');
                    categoryHeader.className = 'ingredient-category-header';
                    categoryHeader.innerHTML = `
                        <span>${category}<span class="category-count">(${categoryIngredients.length})</span></span>
                        <div class="category-controls">

                            <img src="img/selectall.png" class="category-select-all icon-img icon-selectall" data-category="${category}" alt="Select All" style="width:18px; height:18px; cursor:pointer;" />
                            <span class="category-toggle">▶</span>
                        </div>
                    `;



                    // Add click handler for collapse/expand
                    categoryHeader.addEventListener('click', function(e) {
                        // Don't toggle if clicking buttons
                        if (e.target.classList.contains('category-select-all')) return;

                        const toggle = this.querySelector('.category-toggle');
                        const ingredientsContainer = this.parentElement.querySelector('.category-ingredients');

                        if (ingredientsContainer.classList.contains('expanded')) {
                            ingredientsContainer.classList.remove('expanded');
                            toggle.classList.add('collapsed');
                            toggle.textContent = '▶';
                        } else {
                            ingredientsContainer.classList.add('expanded');
                            toggle.classList.remove('collapsed');
                            toggle.textContent = '▼';
                        }
                    });





                    categorySection.appendChild(categoryHeader);

                    // Create ingredient form container for this category
                    const categoryFormContainer = document.createElement('div');
                    categoryFormContainer.className = 'category-form-container';
                    categoryFormContainer.id = `form-container-${category.replace(/\s+/g, '-').toLowerCase()}`;
                    categoryFormContainer.style.display = 'none';
                    categorySection.appendChild(categoryFormContainer);

                    // Create ingredients container
                    const ingredientsContainer = document.createElement('div');
                    ingredientsContainer.className = 'category-ingredients';

                    // Add ingredients for this category
                    categoryIngredients.forEach(name => {
                        const ingredient = ingredients[name];
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'ingredient-item';

                        itemDiv.innerHTML = `
                            <div class="ingredient-info">
                                <input type="checkbox" class="ingredient-select" data-name="${name}">
                                <span class="ingredient-name">${name}</span>
                                <span class="ingredient-price">$${ingredient.price.toFixed(2)}</span>
                                <span class="ingredient-stack-size">Stack: ${ingredient.stackSize || 50}</span>
                                ${ingredient.note ? `<span class="ingredient-note-display">${ingredient.note}</span>` : ''}
                            </div>
                            <div class="ingredient-actions">
                                <button class="edit-ingredient small-btn icon-only" title="Edit"><img src="img/edit.png" alt="Edit" class="icon-img"/></button>
                                <button class="delete-ingredient small-btn icon-only danger-btn" title="Delete"><img src="img/delete.png" alt="Delete" class="icon-img"/></button>
                            </div>
                        `;

                        // Selection change updates bulk button
                        const checkbox = itemDiv.querySelector('.ingredient-select');
                        checkbox.addEventListener('change', function() {
                            console.log('Checkbox changed:', this.checked, this.getAttribute('data-name'));
                            updateBulkEditEnablement();
                            updateSelectAllCheckbox();
                        });

                        // Add edit button event listener
                        itemDiv.querySelector('.edit-ingredient').addEventListener('click', function() {
                            // Set editing state
                            editingIngredientName = name;

                            // Show the form for editing in the category
                            showIngredientFormForEditing(ingredient, name, ingredient.category || 'Uncategorized');
                        });

                        // Add delete button event listener
                        itemDiv.querySelector('.delete-ingredient').addEventListener('click', async function() {
                            if (confirm(`Are you sure you want to delete "${name}"?`)) {
                                delete ingredients[name];
                                await saveIngredients();
                            }
                        });

                        ingredientsContainer.appendChild(itemDiv);
                    });

                    categorySection.appendChild(ingredientsContainer);
                    ingredientsList.appendChild(categorySection);
                }
            });

            if (!hasResults) {
                ingredientsList.innerHTML = '<p class="empty-list">No ingredients found</p>';
            }

            // Update bulk edit button state after rendering
            updateBulkEditEnablement();
            updateSelectAllCheckbox();
        }

        function exportIngredients() {
            if (Object.keys(ingredients).length === 0) {
                alert('No ingredients to export');
                return;
            }

            const ingredientsJSON = JSON.stringify(ingredients, null, 2);
            const blob = new Blob([ingredientsJSON], {type: 'application/json'});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'ingredients.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function importIngredients() {
            if (!importIngredientsFile.files.length) {
                alert('Please select a file to import');
                return;
            }

            const file = importIngredientsFile.files[0];
            const reader = new FileReader();

            reader.onload = async function(e) {
                try {
                    const importedIngredients = JSON.parse(e.target.result);

                    // Merge imported ingredients with existing ones
                    Object.assign(ingredients, importedIngredients);

                    // Persist and auto-refresh
                    await saveIngredients();

                    alert('Ingredients imported successfully!');
                } catch (error) {
                    alert('Error importing ingredients: Invalid JSON file');
                    console.error(error);
                }
            };

            reader.readAsText(file);
        }

        async function clearIngredients() {
            if (confirm('Are you sure you want to clear all ingredients?')) {
                ingredients = {};
                await saveIngredients();
                // UI will auto-refresh via saveIngredients()
                alert('All ingredients cleared!');
            }
        }

        // Dropdown setup functions
        function setupIngredientDropdown(container) {
            if (!container) return;

            const inputElement = container.querySelector('.ingredient-name');
            const toggleElement = container.querySelector('.ingredient-toggle');
            const listElement = container.querySelector('.ingredient-list');

            if (!inputElement || !listElement) return;

            // Input event for typing
            inputElement.addEventListener('input', function() {
                const searchTerm = this.value;
                updateIngredientAutocomplete(inputElement, listElement, searchTerm);
            });
            inputElement.addEventListener('blur', function(){
                markUnknownIngredient(inputElement);
            });
            // Also open list on focus to allow browsing (helps on mobile)
            inputElement.addEventListener('focus', function(){
                updateIngredientAutocomplete(inputElement, listElement, '', true);
            });

            // Toggle button for showing all
            if (toggleElement) {
                toggleElement.addEventListener('click', function() {
                    if (listElement.style.display === 'block') {
                        listElement.style.display = 'none';
                    } else {
                        updateIngredientAutocomplete(inputElement, listElement, '', true);
                        inputElement.focus();
                    }
                });
            }
        function markUnknownIngredient(){ /* no-op: unknown marker removed */ }


            // Keyboard navigation
            inputElement.addEventListener('keydown', function(e) {
                if (listElement.style.display === 'block') {
                    const items = listElement.querySelectorAll('.autocomplete-item');
                    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                        if (items[selectedIndex]) {
                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                        if (items[selectedIndex]) {
                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const selectedItem = listElement.querySelector('.autocomplete-item.selected');
                        if (selectedItem && selectedItem.textContent !== 'No ingredients found') {
                            selectIngredient(inputElement, listElement, selectedItem.textContent);
                        }
                    } else if (e.key === 'Escape') {
                        listElement.style.display = 'none';
                    }
                }
            });
        }

        function updateIngredientAutocomplete(inputElement, listElement, searchTerm = '', showAll = false) {
            listElement.innerHTML = '';

            if (!searchTerm.trim() && !showAll) {
                listElement.style.display = 'none';
                return;
            }

            // Build a combined list: ingredients and recipes
            const cats = new Set();
            Object.values(ingredients).forEach(ing => cats.add(ing.category || 'Uncategorized'));
            Object.values(recipes).forEach(r => cats.add(r.category || 'Uncategorized'));
            const sortedCategories = Array.from(cats).sort();
            let hasResults = false;

            sortedCategories.forEach(category => {
                const ingredientNames = Object.keys(ingredients).filter(name => {
                    const ing = ingredients[name];
                    const ingCat = ing.category || 'Uncategorized';
                    return ingCat === category && (showAll || name.toLowerCase().includes(searchTerm.toLowerCase()) || ingCat.toLowerCase().includes(searchTerm.toLowerCase()));
                }).sort();
                const recipeNames = Object.keys(recipes).filter(name => {
                    const r = recipes[name];
                    const rCat = r.category || 'Uncategorized';
                    return rCat === category && (showAll || name.toLowerCase().includes(searchTerm.toLowerCase()) || rCat.toLowerCase().includes(searchTerm.toLowerCase()));
                }).sort();

                const totalCount = ingredientNames.length + recipeNames.length;

                if (totalCount > 0) {
                    hasResults = true;

                    // Category header (selects entire category)
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'autocomplete-category selectable-category';
                    categoryDiv.innerHTML = `${category} <span class="category-hint">(Select entire category)</span>`;
                    categoryDiv.addEventListener('click', () => selectIngredient(inputElement, listElement, `[${category}]`));
                    listElement.appendChild(categoryDiv);

                    // Ingredients first
                    ingredientNames.forEach(name => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'autocomplete-item category-item';
                        itemDiv.textContent = name;
                        itemDiv.addEventListener('click', () => selectIngredient(inputElement, listElement, name));
                        listElement.appendChild(itemDiv);
                    });

                    // Then recipes
                    recipeNames.forEach(name => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'autocomplete-item category-item';
                        itemDiv.textContent = `${name} (R)`;
                        itemDiv.addEventListener('click', () => selectIngredient(inputElement, listElement, name));
                        listElement.appendChild(itemDiv);
                    });
                }
            });

            if (!hasResults) {
                listElement.innerHTML = '<div class="autocomplete-item">No ingredients or recipes found</div>';
            }

            // Decide whether to show dropdown above the input (mobile keyboard-safe)
            const rect = inputElement.getBoundingClientRect();
            const availableAbove = rect.top;
            listElement.classList.add('above');
            const maxH = Math.max(80, Math.min(240, availableAbove - 12));
            listElement.style.maxHeight = maxH + 'px';
            listElement.style.display = 'block';
        }

        function selectIngredient(inputElement, listElement, ingredientName) {
            inputElement.value = ingredientName;
            listElement.style.display = 'none';

            // Trigger change event without reopening the dropdown
            inputElement.dispatchEvent(new Event('change'));
        }

        function setupCategoryDropdown(inputElement, listElement) {
            if (!inputElement || !listElement) return;

            // Input event for typing
            inputElement.addEventListener('input', function() {
                const searchTerm = this.value;
                updateCategoryAutocomplete(inputElement, listElement, searchTerm);
            });

            // Also open list on focus to allow browsing
            inputElement.addEventListener('focus', function() {
                updateCategoryAutocomplete(inputElement, listElement, '', true);
            });

            // Keyboard navigation
            inputElement.addEventListener('keydown', function(e) {
                if (listElement.style.display === 'block') {
                    const items = listElement.querySelectorAll('.autocomplete-item');
                    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                        if (items[selectedIndex]) {
                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                        if (items[selectedIndex]) {
            // Merge categories from saved list as suggestions
            const extra = (recipeCategories || []).filter(cat => cat && !filteredCategories.includes(cat));
            extra.forEach(categoryName => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'autocomplete-item';
                itemDiv.textContent = categoryName;
                itemDiv.addEventListener('click', () => selectCategory(inputElement, listElement, categoryName));
                listElement.appendChild(itemDiv);
            });

                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const selectedItem = listElement.querySelector('.autocomplete-item.selected');
                        if (selectedItem && selectedItem.textContent !== 'No categories found') {
                            selectCategory(inputElement, listElement, selectedItem.textContent);
                        }
                    } else if (e.key === 'Escape') {
                        listElement.style.display = 'none';
                    }
                }
            });
        }

        function updateCategoryAutocomplete(inputElement, listElement, searchTerm = '', showAll = false) {
            listElement.innerHTML = '';

            if (!searchTerm.trim() && !showAll) {
                listElement.style.display = 'none';
                return;
            }

            // Get all existing categories from recipes
            const categories = new Set();
            Object.values(recipes).forEach(recipe => {
                categories.add(recipe.category || 'Uncategorized');
            });

            // Filter categories based on search term
            const filteredCategories = Array.from(categories)
                .filter(category => showAll || category.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort();

            if (filteredCategories.length > 0) {
                filteredCategories.forEach(categoryName => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'autocomplete-item';
                    itemDiv.textContent = categoryName;
                    itemDiv.addEventListener('click', () => selectCategory(inputElement, listElement, categoryName));
                    listElement.appendChild(itemDiv);
                });
            } else {
                listElement.innerHTML = '<div class="autocomplete-item">No categories found</div>';
            }

            // Flip above if there's not enough space below (mobile keyboard-safe)
            const rect = inputElement.getBoundingClientRect();
            const availableAbove = rect.top;
            listElement.classList.add('above');
            const maxH = Math.max(80, Math.min(240, availableAbove - 12));
            listElement.style.maxHeight = maxH + 'px';
            listElement.style.display = 'block';
        }

        function selectCategory(inputElement, listElement, categoryName) {
            inputElement.value = categoryName;
            listElement.style.display = 'none';

            // Trigger change event without reopening the dropdown
            inputElement.dispatchEvent(new Event('change'));
        }

        function setupIngredientCategoryDropdown() {
            const categoryInput = document.getElementById('ingredient-category');
            const categoryList = document.getElementById('ingredient-category-list');

            if (!categoryInput || !categoryList) return;

            // Input event for typing
            categoryInput.addEventListener('input', function() {
                const searchTerm = this.value;
                updateIngredientCategoryAutocomplete(categoryInput, categoryList, searchTerm);
            });

            // Also open list on focus to allow browsing
            categoryInput.addEventListener('focus', function() {
                updateIngredientCategoryAutocomplete(categoryInput, categoryList, '', true);
            });

            // Keyboard navigation
            categoryInput.addEventListener('keydown', function(e) {
                if (categoryList.style.display === 'block') {
                    const items = categoryList.querySelectorAll('.autocomplete-item');
                    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                        if (items[selectedIndex]) {
                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                        if (items[selectedIndex]) {
                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const selectedItem = categoryList.querySelector('.autocomplete-item.selected');
                        if (selectedItem && selectedItem.textContent !== 'No categories found') {
                            selectIngredientCategory(categoryInput, categoryList, selectedItem.textContent);
                        }
                    } else if (e.key === 'Escape') {
                        categoryList.style.display = 'none';
                    }
                }
            });
        }

        function updateIngredientCategoryAutocomplete(inputElement, listElement, searchTerm = '', showAll = false) {
            listElement.innerHTML = '';

            if (!searchTerm.trim() && !showAll) {
                listElement.style.display = 'none';
                return;
            }

            // Get all existing categories from ingredients
            const categories = new Set();
            Object.values(ingredients).forEach(ingredient => {
                categories.add(ingredient.category || 'Uncategorized');
            });

            // Filter categories based on search term
            const filteredCategories = Array.from(categories)
                .filter(category => showAll || category.toLowerCase().includes(searchTerm.toLowerCase()))
                .sort();

            if (filteredCategories.length > 0) {
                filteredCategories.forEach(categoryName => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'autocomplete-item';
                    itemDiv.textContent = categoryName;
                    itemDiv.addEventListener('click', () => selectIngredientCategory(inputElement, listElement, categoryName));
                    listElement.appendChild(itemDiv);
                });
            } else {
                listElement.innerHTML = '<div class="autocomplete-item">No categories found</div>';
            }

            // Flip above if there's not enough space below (mobile keyboard-safe)
            const rect = inputElement.getBoundingClientRect();
            const availableAbove = rect.top;
            listElement.classList.add('above');
            const maxH = Math.max(80, Math.min(240, availableAbove - 12));
            listElement.style.maxHeight = maxH + 'px';
            listElement.style.display = 'block';
        }

        function selectIngredientCategory(inputElement, listElement, categoryName) {
            inputElement.value = categoryName;
            listElement.style.display = 'none';

            // Trigger change event without reopening the dropdown
            inputElement.dispatchEvent(new Event('change'));
        }

            // Generic setup for ingredient category dropdown on arbitrary inputs (e.g., bulk edit)
            function setupIngredientCategoryDropdownForElements(inputElement, listElement) {
                if (!inputElement || !listElement) return;

                // Input event for typing
                inputElement.addEventListener('input', function() {
                    const searchTerm = this.value;
                    updateIngredientCategoryAutocomplete(inputElement, listElement, searchTerm);
                });

                // Also open list on focus to allow browsing
                inputElement.addEventListener('focus', function() {
                    updateIngredientCategoryAutocomplete(inputElement, listElement, '', true);
                });

                // Keyboard navigation
                inputElement.addEventListener('keydown', function(e) {
                    if (listElement.style.display === 'block') {
                        const items = listElement.querySelectorAll('.autocomplete-item');
                        let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                            selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                            if (items[selectedIndex]) {
                                items[selectedIndex].classList.add('selected');
                                items[selectedIndex].scrollIntoView({ block: 'nearest' });
                            }
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                            selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                            if (items[selectedIndex]) {
                                items[selectedIndex].classList.add('selected');
                                items[selectedIndex].scrollIntoView({ block: 'nearest' });
                            }
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            const selectedItem = listElement.querySelector('.autocomplete-item.selected');
                            if (selectedItem && selectedItem.textContent !== 'No categories found') {
                                selectIngredientCategory(inputElement, listElement, selectedItem.textContent);
                            }
                        } else if (e.key === 'Escape') {
                            listElement.style.display = 'none';
                        }
                    }
                });
            }




        function openRecipeCategoryCreator() {
            // Stay in Calculator section and open the recipe form with focus on category
            showSection('calculator');
            if (recipeForm && recipeForm.style.display === 'none') {
                showRecipeForm();
            }
            if (recipeCategoryInput) {
                recipeCategoryInput.value = '';
                recipeCategoryInput.focus();
                // Show all existing categories so user can pick or type a new one
                if (categoryList) updateCategoryAutocomplete(recipeCategoryInput, categoryList, '', true);
            }
            // Optional: bring the form into view
            document.getElementById('recipe-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }



        function toggleCategoryForm() {
            if (categoryForm.style.display === 'none') {
                showCategoryForm();
            } else {
                hideCategoryForm();
            }
        }

        function showCategoryForm() {
            categoryForm.style.display = 'block';
            toggleCategoryFormBtn.textContent = 'Hide Form';
        }

        function hideCategoryForm() {
            categoryForm.style.display = 'none';
            toggleCategoryFormBtn.textContent = 'New Ingredient';
            clearCategoryForm();
        }

        function clearCategoryForm() {
            ingredientCategoryInput.value = '';
            ingredientNameInput.value = '';
            ingredientPriceInput.value = '';
            ingredientStackSizeInput.value = 50;
            ingredientNoteInput.value = '';
        }

        function saveCategory() {
            const categoryName = newCategoryNameInput.value.trim();
            if (!categoryName) {
                alert('Please enter a category name');
                return;
            }

            // Check if category already exists
            const existingCategories = new Set();
            Object.values(ingredients).forEach(ingredient => {
                existingCategories.add(ingredient.category || 'Uncategorized');
            });

            if (existingCategories.has(categoryName)) {
                alert('Category already exists');
                return;
            }

            // Create a placeholder ingredient to establish the category
            const placeholderName = `${categoryName} - Example Item`;
            ingredients[placeholderName] = {
                category: categoryName,
                price: 0,
                stackSize: 50,
                note: 'Delete this example item and add your own ingredients to this category'
            };

            saveIngredients();
            renderIngredients();
            hideCategoryForm();
            alert(`Category "${categoryName}" created!`);
        }

        function showIngredientFormForCategory(category) {
            // Hide any existing forms
            hideAllIngredientForms();

            // Find the form container for this category
            const formContainerId = `form-container-${category.replace(/\s+/g, '-').toLowerCase()}`;
            const formContainer = document.getElementById(formContainerId);

            if (formContainer) {
                // Create the form HTML
                formContainer.innerHTML = `
                    <div class="ingredient-form">
                        <h3>Add Ingredient to ${category}</h3>
                        <div class="form-row">
                            <input type="text" id="ingredient-category-${formContainerId}" value="${category}" readonly>
                            <input type="text" id="ingredient-name-${formContainerId}" placeholder="Ingredient name">
                        </div>
                        <div class="form-row">
                            <input type="number" id="ingredient-price-${formContainerId}" placeholder="Price per unit" min="0" step="0.01">
                            <input type="number" id="ingredient-stack-size-${formContainerId}" placeholder="Stack Size" min="1" max="200">
                        </div>
                        <div class="form-row">
                            <textarea id="ingredient-note-${formContainerId}" placeholder="Notes (optional)" rows="2"></textarea>
                        </div>
                        <div class="btn-group">
                            <button onclick="saveIngredientFromCategory('${formContainerId}', '${category}')" class="primary-btn">Save Ingredient</button>
                            <button onclick="hideIngredientFormInCategory('${formContainerId}')" class="danger-btn">Cancel</button>
                        </div>
                    </div>
                `;
                formContainer.style.display = 'block';

                // Focus on the name input
                const nameInput = document.getElementById(`ingredient-name-${formContainerId}`);
                if (nameInput) nameInput.focus();
            }
        }

        function showIngredientFormForEditing(ingredient, ingredientName, category) {
            // Hide any existing forms
            hideAllIngredientForms();

            // Find the form container for this category
            const formContainerId = `form-container-${category.replace(/\s+/g, '-').toLowerCase()}`;
            const formContainer = document.getElementById(formContainerId);

            if (formContainer) {
                // Get all available categories for dropdown
                const categories = new Set();
                Object.values(ingredients).forEach(ing => {
                    categories.add(ing.category || 'Uncategorized');
                });
                const categoryOptions = Array.from(categories).sort();

                // Create the form HTML with dropdown
                formContainer.innerHTML = `
                    <div class="ingredient-form">
                        <h3>Edit Ingredient</h3>
                        <div class="form-row">
                            <div class="searchable-dropdown category-dropdown">
                                <input type="text" id="ingredient-category-${formContainerId}" placeholder="Type to search categories or click to browse..." autocomplete="off" value="${category}">
                                <div id="ingredient-category-list-${formContainerId}" class="autocomplete-list"></div>
                            </div>
                            <input type="text" id="ingredient-name-${formContainerId}" placeholder="Ingredient name" value="${ingredientName}">
                        </div>
                        <div class="form-row">
                            <input type="number" id="ingredient-price-${formContainerId}" placeholder="Price per unit" min="0" step="0.01" value="${ingredient.price || ''}">
                            <input type="number" id="ingredient-stack-size-${formContainerId}" placeholder="Stack Size" min="1" max="200" value="${ingredient.stackSize || ''}">
                        </div>
                        <div class="form-row">
                            <textarea id="ingredient-note-${formContainerId}" placeholder="Notes (optional)" rows="2">${ingredient.note || ''}</textarea>
                        </div>
                        <div class="btn-group">
                            <button onclick="saveIngredientFromCategory('${formContainerId}', '${category}', '${ingredientName}')" class="primary-btn">Save Changes</button>
                            <button onclick="hideIngredientFormInCategory('${formContainerId}')" class="danger-btn">Cancel</button>
                        </div>
                    </div>
                `;
                formContainer.style.display = 'block';

                // Setup dropdown functionality for editing
                setupCategoryDropdownForForm(formContainerId, categoryOptions);

                // Focus on the name input
                const nameInput = document.getElementById(`ingredient-name-${formContainerId}`);
                if (nameInput) nameInput.focus();
            }
        }

        function hideAllIngredientForms() {
            // Hide all category form containers
            document.querySelectorAll('.category-form-container').forEach(container => {
                container.style.display = 'none';
                container.innerHTML = '';
            });
        }

        function hideIngredientFormInCategory(formContainerId) {
            const formContainer = document.getElementById(formContainerId);
            if (formContainer) {
                formContainer.style.display = 'none';
                formContainer.innerHTML = '';
            }
            editingIngredientName = null;
        }

        async function saveIngredientFromCategory(formContainerId, _unusedCategory, editingName = null) {
            const nameInput = document.getElementById(`ingredient-name-${formContainerId}`);
            const categoryInput = document.getElementById(`ingredient-category-${formContainerId}`);
            const priceInput = document.getElementById(`ingredient-price-${formContainerId}`);
            const stackInput = document.getElementById(`ingredient-stack-size-${formContainerId}`);
            const noteInput = document.getElementById(`ingredient-note-${formContainerId}`);

            const name = nameInput.value.trim();
            const selectedCategory = categoryInput.value.trim();
            const price = parseFloat(priceInput.value) || 0;
            const stackSize = parseInt(stackInput.value);
            const note = noteInput.value.trim();

            if (!name) {
                alert('Please enter an ingredient name');
                return;
            }

            // Check for duplicate names (except when editing the same ingredient)
            if (editingName !== name && ingredients[name]) {
                alert('An ingredient with this name already exists');
                return;
            }

            // If editing, remove the old entry
            if (editingName && editingName !== name) {
                delete ingredients[editingName];
            }

            // Save the ingredient
            ingredients[name] = {
                category: selectedCategory || 'Uncategorized',
                price: price,
                stackSize: (isNaN(stackSize) ? null : stackSize),
                note: note
            };

            await saveIngredients();
            // UI will auto-refresh via saveIngredients()
            hideIngredientFormInCategory(formContainerId);

            alert(`Ingredient "${name}" saved!`);
            editingIngredientName = null;
        }

        function setupCategoryDropdownForForm(formContainerId, categoryOptions) {
            const categoryInput = document.getElementById(`ingredient-category-${formContainerId}`);
            const categoryList = document.getElementById(`ingredient-category-list-${formContainerId}`);

            if (!categoryInput || !categoryList) return;

            // Input event for typing
            categoryInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const filteredOptions = categoryOptions.filter(cat =>
                    cat.toLowerCase().includes(searchTerm)
                );
                updateCategoryDropdownList(categoryList, filteredOptions, categoryInput);
            });



            // Keyboard navigation
            categoryInput.addEventListener('keydown', function(e) {
                if (categoryList.style.display === 'block') {
                    const items = categoryList.querySelectorAll('.autocomplete-item');
                    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));

                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
                        if (items[selectedIndex]) {
                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (selectedIndex >= 0) items[selectedIndex].classList.remove('selected');
                        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
                        if (items[selectedIndex]) {
                            items[selectedIndex].classList.add('selected');
                            items[selectedIndex].scrollIntoView({ block: 'nearest' });
                        }
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        const selectedItem = categoryList.querySelector('.autocomplete-item.selected');
                        if (selectedItem && selectedItem.textContent !== 'No categories found') {
                            categoryInput.value = selectedItem.textContent;
                            categoryList.style.display = 'none';
                        }
                    } else if (e.key === 'Escape') {
                        categoryList.style.display = 'none';
                    }
                }
            });
        }

        function updateCategoryDropdownList(listElement, options, inputElement) {
            listElement.innerHTML = '';

            if (options.length === 0) {
                const noResultsItem = document.createElement('div');
                noResultsItem.className = 'autocomplete-item';
                noResultsItem.textContent = 'No categories found';
                listElement.appendChild(noResultsItem);
            } else {
                options.forEach(option => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.textContent = option;
                    item.addEventListener('click', function() {
                        inputElement.value = option;
                        listElement.style.display = 'none';
                    });
                    listElement.appendChild(item);
                });
            }

            listElement.style.display = 'block';
        }

        // Recipe form toggle functions
        function toggleRecipeForm() {
            if (recipeForm.style.display === 'none') {
                showRecipeForm();
            } else {
                hideRecipeForm();
            }
        }

        function showRecipeForm(targetRowEl) {
            // If a target row is provided, move the form under that row; else return to home container
            const container = document.createElement('div');
            container.className = 'inline-recipe-form-container';
            container.appendChild(recipeForm);
            recipeForm.style.display = 'block';
            toggleRecipeFormBtn.textContent = 'Hide Form';
            if (targetRowEl) {
                // Insert after the row's details block if present, else after the row
                const details = targetRowEl.querySelector('.recipe-details');
                if (details && details.parentElement === targetRowEl) {
                    details.insertAdjacentElement('afterend', container);
                } else {
                    targetRowEl.insertAdjacentElement('afterend', container);
                }
            } else if (recipeFormHome) {
                recipeFormHome.appendChild(recipeForm);
            }
        }

        function hideRecipeForm() {
            recipeForm.style.display = 'none';
            toggleRecipeFormBtn.textContent = 'New Recipe';
            clearRecipeForm();
            editingRecipeName = null;
            // Move form back to its home container
            if (recipeFormHome) recipeFormHome.appendChild(recipeForm);
            // Remove any inline container wrappers
            document.querySelectorAll('.inline-recipe-form-container').forEach(c => c.remove());
        }

        function clearRecipeForm() {
            const rc = document.getElementById('recipe-category'); if (rc) rc.value = '';
            const rn = document.getElementById('recipe-name'); if (rn) rn.value = '';
            const ro = document.getElementById('recipe-output'); if (ro) ro.value = '';
            const rp = document.getElementById('recipe-price'); if (rp) rp.value = '';
            try { resetIngredientsContainer && resetIngredientsContainer(); } catch(e) {}
        }

        // Queue form toggle functions
        // Queue is always visible now; toggling functions are no-ops for backward compatibility
        function toggleQueueForm() {}
        function showQueueForm() {}
        function hideQueueForm() {}

        // Complete backup/restore functions
        function exportComplete() {
            const completeData = {
                recipes: recipes,
                ingredients: ingredients,
                queue: craftingQueue,
                exportDate: new Date().toISOString(),
                version: "1.0"
            };

            const dataJSON = JSON.stringify(completeData, null, 2);
            const blob = new Blob([dataJSON], {type: 'application/json'});
        function renderRecipeCategoriesList() {
            if (!recipeCategoriesListDiv) return;
            const cats = Array.from(new Set([
                ...recipeCategories,
                ...Object.values(recipes).map(r => r.category || 'Uncategorized')
            ])).filter(c => c && c !== 'Uncategorized').sort();
            recipeCategoriesListDiv.innerHTML = cats.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span>${c}</span>
                <button class="danger-btn" data-remove-recipe-cat="${c}">Remove</button>
            </div>`).join('') || '<div style="opacity:0.7;">No categories yet</div>';
        }
        document.addEventListener('click', function(e){
            if (e.target && e.target.matches('button[data-remove-recipe-cat]')) {
                const name = e.target.getAttribute('data-remove-recipe-cat');
                recipeCategories = recipeCategories.filter(c => c !== name);
                saveRecipeCategories();
                renderRecipeCategoriesList();
            }
        });

            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `crafting-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function importComplete() {
            if (!importCompleteFile.files.length) {
                alert('Please select a file to import');
                return;
            }

            const file = importCompleteFile.files[0];
            const reader = new FileReader();

            reader.onload = async function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);

                    // Validate the structure
                    if (!importedData.recipes || !importedData.ingredients) {
                        alert('Invalid backup file format');
                        return;
                    }

                    // Import all data
                    if (importedData.recipes) {
                        recipes = importedData.recipes;
                        saveRecipes();
                    }

                    if (importedData.ingredients) {
                        ingredients = importedData.ingredients;
                    }

                    // Reconcile duplicates: if a name exists as a recipe, remove from ingredients
                    try {
                        const recipeNames = new Set(Object.keys(recipes || {}));
                        let changed = false;
                        Object.keys(ingredients || {}).forEach(name => {
                            if (recipeNames.has(name)) { delete ingredients[name]; changed = true; }
                        });
                        if (changed) { await saveIngredients(); } else { await saveIngredients(); }
                    } catch {}


                    if (importedData.queue) {
                        craftingQueue = importedData.queue;
                        saveQueue();
                        renderQueue();
                        calculateQueue();
                    }

                    alert('Complete backup imported successfully!');
                } catch (error) {
                    alert('Error importing backup: Invalid JSON file');
                    console.error(error);
                }
            };

            reader.readAsText(file);
        }
        // Recipes list rendering (category-collapsible with checkboxes)
        function renderRecipesList() {
            const container = document.getElementById('recipes-list');
            if (!container) return;
            const searchTerm = (document.getElementById('recipe-search')?.value || '').toLowerCase();
            container.innerHTML = '';

            const categories = new Set();
            Object.values(recipes).forEach(r => categories.add(r.category || 'Uncategorized'));
            const sortedCategories = Array.from(categories).sort();

            sortedCategories.forEach(category => {
                const recipeNames = Object.keys(recipes)
                    .filter(name => {
                        const r = recipes[name];
                        const c = r.category || 'Uncategorized';
                        return c === category && (name.toLowerCase().includes(searchTerm) || c.toLowerCase().includes(searchTerm));
                    })
                    .sort();

                if (recipeNames.length === 0) return;

                const section = document.createElement('div');
                section.className = 'ingredient-category-section';

                const header = document.createElement('div');
                header.className = 'ingredient-category-header';
                header.innerHTML = `
                    <span>${category}<span class="category-count">(${recipeNames.length})</span></span>
                    <div class="category-controls">
                        <button class="category-add-recipe small-btn icon-only" data-category="${category}" title="Add Recipe"><img src="img/add.png" alt="Add" class="icon-img icon-add"/></button>
                        <img src="img/selectall.png" class="category-select-all-recipes icon-img icon-selectall" data-category="${category}" alt="Select All" style="width:18px; height:18px; cursor:pointer;" />
                    </div>
                `;
                header.addEventListener('click', function(e) {
                    if (e.target.classList.contains('category-select-all-recipes')) return;
                    if (e.target.closest && e.target.closest('.category-add-recipe')) return;
                    const list = this.parentElement.querySelector('.category-ingredients');
                    if (list) list.classList.toggle('expanded');
                });
                section.appendChild(header);

                const items = document.createElement('div');
                items.className = 'category-ingredients';

                recipeNames.forEach(name => {
                    const row = document.createElement('div');
                    row.className = 'ingredient-item';
                    const r = recipes[name];
                        const reqForCost = calculateItemRequirements(name, r.outputQty || 1);
                        const craftCostPerCraft = (reqForCost.totalCost || 0);
                        const craftCostPerUnit = craftCostPerCraft / (r.outputQty || 1);

                    row.innerHTML = `
                        <div class="recipe-top">
                            <div class="left">
                                <input type="checkbox" class="recipe-select" data-recipe="${name}">
                                <span class="ingredient-name">${name}</span>
                                <span class="recipe-meta">Output: ${r.outputQty}${r.stackSize ? ` | Stack: ${r.stackSize}` : ''}</span>
                            </div>
                            <div class="right">
                                ${r.sellingPrice ? `<span class=\"ingredient-price\">$${(r.sellingPrice || 0).toFixed(2)}</span>` : ''}
                                <span class=\"craft-cost\">$${craftCostPerUnit.toFixed(2)}</span>
                                <button class=\"add-recipe-to-queue small-btn icon-only\" title=\"Add to Queue\"><img src=\"img/queue.png\" alt=\"Add to Queue\" class=\"icon-img icon-queue\"/></button>
                                <button class=\"edit-recipe-row small-btn icon-only\" title=\"Edit\"><img src=\"img/edit.png\" alt=\"Edit\" class=\"icon-img icon-edit\"/></button>
                                <button class=\"delete-recipe-row small-btn icon-only danger-btn\" title=\"Delete\"><img src=\"img/delete.png\" alt=\"Delete\" class=\"icon-img icon-delete\"/></button>
                            </div>
                        </div>
                        <div class="recipe-details">
                            <div class="label">Ingredients:</div>
                            <div class="value">
                                <ul class="recipe-ingredients-list">
                                    ${Object.entries(r.ingredients || {}).map(([n,a]) => {
                                        const price = (ingredients[n]?.price ?? null);
                                        const isRecipeIngredient = !!recipes[n];
                                        const needsPrice = !isRecipeIngredient && (price === null || price === undefined || isNaN(price) || Number(price) === 0);
                                        return `<li>${a}x ${n}${needsPrice ? ' <span class=\"missing-price\">*</span>' : ''}</li>`;
                                    }).join('')}
                                </ul>
                            </div>
                            ${r.notes ? `<div class=\"label\">Notes:</div><div class=\"value\"><div class=\"ingredient-note-display\">${r.notes}</div></div>` : ''}
                        </div>
                    `;
                    items.appendChild(row);
                });

                section.appendChild(items);
                container.appendChild(section);
            });
        }

        // Delegated handler: select all recipes within a category
        document.addEventListener('click', function(e) {
            if (e.target && e.target.classList && e.target.classList.contains('category-select-all-recipes')) {
                const section = e.target.closest('.ingredient-category-section');
                if (!section) return;
                const boxes = section.querySelectorAll('.recipe-select');
                const allChecked = Array.from(boxes).every(b => b.checked);
                boxes.forEach(b => b.checked = !allChecked);
            }
        });


        // Global delegated handlers for robustness
        document.addEventListener('change', function(e) {
            // Select-all checkbox (works even if re-rendered)
            if (e.target && e.target.id === 'select-all-ingredients') {
                toggleSelectAllIngredients(e);
            }
            // Individual ingredient checkbox changed
            if (e.target && e.target.classList && e.target.classList.contains('ingredient-select')) {
                updateBulkEditEnablement();
                updateSelectAllCheckbox();
            }
        });

        document.addEventListener('click', function(e) {
            if (!e.target) return;
            const id = e.target.id;
            if (id === 'open-bulk-edit') {
                const panel = document.getElementById('bulk-edit-panel');
                if (panel) panel.style.display = 'block';
            } else if (id === 'close-bulk') {
                const panel = document.getElementById('bulk-edit-panel');
                if (panel) panel.style.display = 'none';
            } else if (id === 'apply-bulk') {
                applyBulkEdit();
            } else if (id === 'clear-selection') {
                clearIngredientSelections();
            } else if (id === 'collapse-all-ingredients') {
                // Collapse all ingredient categories
                document.querySelectorAll('#ingredients-list .ingredient-category-section').forEach(section => {
                    const container = section.querySelector('.category-ingredients');
                    const toggle = section.querySelector('.category-toggle');
                    if (container) container.classList.remove('expanded');
                    if (toggle) { toggle.classList.add('collapsed'); toggle.textContent = '▶'; }
                });
            } else if (id === 'collapse-all-recipes') {
                // Collapse all recipe categories
                document.querySelectorAll('#recipes-list .ingredient-category-section').forEach(section => {
                    const container = section.querySelector('.category-ingredients');
                    const toggle = section.querySelector('.category-toggle');
                    if (container) container.classList.remove('expanded');
                    if (toggle) { toggle.classList.add('collapsed'); toggle.textContent = '▶'; }
                });
            } else if (e.target.classList && e.target.classList.contains('category-select-all')) {
                // Toggle all checkboxes within the clicked category section
                const section = e.target.closest('.ingredient-category-section');
                if (section) {
                    const checkboxes = section.querySelectorAll('.ingredient-select');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => cb.checked = !allChecked);
                    updateBulkEditEnablement();
                    updateSelectAllCheckbox();
                }
            } else if (e.target.closest && e.target.closest('.category-add-recipe')) {
                const btn = e.target.closest('.category-add-recipe');
                const cat = btn?.dataset?.category || '';
                // Show inline form under the search area instead of opening a modal
                showRecipeForm();
                if (recipeCategoryInput) recipeCategoryInput.value = cat;
                const nameEl = document.getElementById('recipe-name'); if (nameEl) nameEl.focus();
                return;
            }
            });

        // Initialize bulk edit functionality (ingredients + recipes)
        function initializeBulkEdit() {
            // Ingredients bulk controls
            openBulkBtn = document.getElementById('open-bulk-edit');
            clearSelectionBtn = document.getElementById('clear-selection');
            // selectAllCheckbox removed in favor of icon button
            bulkPanel = document.getElementById('bulk-edit-panel');
            bulkPriceInput = document.getElementById('bulk-price');
            bulkStackInput = document.getElementById('bulk-stack');
            applyBulkBtn = document.getElementById('apply-bulk');
            closeBulkBtn = document.getElementById('close-bulk');
            bulkCategoryInput = document.getElementById('bulk-category');
            bulkCategoryList = document.getElementById('bulk-category-list');
            bulkNotesInput = document.getElementById('bulk-notes');

            // Recipes bulk controls
            openBulkRecipesBtn = document.getElementById('open-bulk-edit-recipes');
            clearSelectionRecipesBtn = document.getElementById('clear-selection-recipes');
            // Top-level Select All buttons (icon-only)
            document.getElementById('select-all-ingredients-btn')?.addEventListener('click', () => {
                const boxes = document.querySelectorAll('.ingredient-select');
                const allChecked = Array.from(boxes).every(b => b.checked);
                boxes.forEach(b => b.checked = !allChecked);
                updateBulkEditEnablement();
                updateSelectAllCheckbox();
            });
            document.getElementById('select-all-recipes-btn')?.addEventListener('click', () => {
                const boxes = document.querySelectorAll('.recipe-select');
                const allChecked = Array.from(boxes).every(b => b.checked);
                boxes.forEach(b => b.checked = !allChecked);
            });

            // selectAllRecipesCheckbox removed in favor of icon button
            bulkRecipesPanel = document.getElementById('bulk-edit-recipes-panel');
            bulkRecipePriceInput = document.getElementById('bulk-recipe-price');
            applyBulkRecipesBtn = document.getElementById('apply-bulk-recipes');
            closeBulkRecipesBtn = document.getElementById('close-bulk-recipes');
            bulkRecipeCategoryInput = document.getElementById('bulk-recipe-category');
            bulkRecipeCategoryList = document.getElementById('bulk-recipe-category-list');

            // Ingredients events
            if (openBulkBtn) openBulkBtn.addEventListener('click', () => { if (bulkPanel) bulkPanel.style.display = 'block'; });
            if (closeBulkBtn) closeBulkBtn.addEventListener('click', () => { if (bulkPanel) bulkPanel.style.display = 'none'; });
            if (applyBulkBtn) applyBulkBtn.addEventListener('click', applyBulkEdit);
            if (clearSelectionBtn) clearSelectionBtn.addEventListener('click', clearIngredientSelections);

            // Recipes events
            if (openBulkRecipesBtn) openBulkRecipesBtn.addEventListener('click', () => {
                const selected = Array.from(document.querySelectorAll('.recipe-select:checked'));
                if (selected.length <= 1) {
                    // Single edit: if one selected, open edit form for it; if none, prompt to select one
                    if (selected.length === 1) {
                        const name = selected[0].dataset.recipe;
                        if (recipes[name]) {
                            // Fill form for editing this recipe
                            showRecipeForm();
                            editingRecipeName = name;
                            document.getElementById('recipe-name').value = name;
                            const r = recipes[name];
                            document.getElementById('recipe-output').value = r.outputQty;
                            document.getElementById('recipe-price').value = r.sellingPrice || '';
                            document.getElementById('recipe-category').value = r.category || '';
                            const stackEl = document.getElementById('recipe-stack-size');
                            const notesEl = document.getElementById('recipe-notes');
                            if (stackEl) stackEl.value = r.stackSize || '';
                            if (notesEl) notesEl.value = r.notes || '';
                            // Load ingredient rows
                            ingredientsContainer.innerHTML = '';
                            Object.entries(r.ingredients || {}).forEach(([ing, amt]) => {
                                const row = document.createElement('div');
                                row.className = 'ingredient-row';
                                row.innerHTML = `
                                    <div class="searchable-dropdown ingredient-dropdown">
                                        <input type="text" class="ingredient-name" placeholder="Type to search or click to browse..." autocomplete="off" value="${ing}">
                                        <div class="autocomplete-list ingredient-list"></div>
                                    </div>
                                    <input type="number" class="ingredient-amount" placeholder="Amount" min="1" value="${amt}">
                                    <button class="remove-ingredient icon-btn danger-btn">✕</button>
                                `;
                                ingredientsContainer.appendChild(row);
                                setupIngredientDropdown(row.querySelector('.ingredient-dropdown'));
                                row.querySelector('.remove-ingredient').addEventListener('click', function(){ row.remove(); });
                            });
                            document.querySelector('#recipe-form')?.scrollIntoView({ behavior: 'smooth' });
                        }
                    } else {
                        alert('Select a recipe to edit. To bulk edit, select 2 or more.');
                    }
                } else {
                    if (bulkRecipesPanel) bulkRecipesPanel.style.display = 'block';
                }
            });
            if (closeBulkRecipesBtn) closeBulkRecipesBtn.addEventListener('click', () => { if (bulkRecipesPanel) bulkRecipesPanel.style.display = 'none'; });
            if (applyBulkRecipesBtn) applyBulkRecipesBtn.addEventListener('click', applyBulkEditRecipes);
            if (clearSelectionRecipesBtn) clearSelectionRecipesBtn.addEventListener('click', clearRecipeSelections);
            if (selectAllRecipesCheckbox) selectAllRecipesCheckbox.addEventListener('change', toggleSelectAllRecipes);

            // Delete selected recipes
            const deleteSelectedBtn = document.getElementById('delete-selected-recipes');
            if (deleteSelectedBtn) deleteSelectedBtn.addEventListener('click', () => {
                const selected = Array.from(document.querySelectorAll('.recipe-select:checked')).map(cb => cb.dataset.recipe);
                if (selected.length === 0) { alert('Select at least one recipe to delete.'); return; }
                if (!confirm(`Delete ${selected.length} recipe(s)? This cannot be undone.`)) return;
                selected.forEach(name => { delete recipes[name]; });
                saveRecipes();
                renderRecipesList();
            });

            // Per-row actions using event delegation (handle clicks on buttons or their inner icons)
            document.getElementById('recipes-list')?.addEventListener('click', (e) => {
                const row = e.target.closest('.ingredient-item');
                if (!row) return;
                const name = row.querySelector('.recipe-select')?.dataset.recipe;
                if (!name || !recipes[name]) return;

                const addBtn = e.target.closest('.add-recipe-to-queue');
                const editBtn = e.target.closest('.edit-recipe-row');
                const deleteBtn = e.target.closest('.delete-recipe-row');

                if (addBtn) {
                    // Add this recipe to the queue with quantity 1
                    craftingQueue.push({ id: Date.now(), item: name, quantity: 1, completed: false, collapsed: true });
                    saveQueue();
                    renderQueue();
                    window.updateQueueBadge?.();
                    // details render inline; no separate results
                    return;
                }

                if (editBtn) {
                    // Fill the form for editing this recipe and show it inline under the row
                    const targetRow = row;
                    showRecipeForm(targetRow);
                    editingRecipeName = name;
                    document.getElementById('recipe-name').value = name;
                    const r = recipes[name];
                    document.getElementById('recipe-output').value = r.outputQty;
                    document.getElementById('recipe-price').value = r.sellingPrice || '';
                    document.getElementById('recipe-category').value = r.category || '';
                    const stackEl = document.getElementById('recipe-stack-size');
                    const notesEl = document.getElementById('recipe-notes');
                    if (stackEl) stackEl.value = r.stackSize || '';
                    if (notesEl) notesEl.value = r.notes || '';
                    ingredientsContainer.innerHTML = '';
                    Object.entries(r.ingredients || {}).forEach(([ing, amt]) => {
                        const rowEl = document.createElement('div');
                        rowEl.className = 'ingredient-row';
                        rowEl.innerHTML = `
                            <div class="searchable-dropdown ingredient-dropdown">
                                <input type="text" class="ingredient-name" placeholder="Type to search or click to browse..." autocomplete="off" value="${ing}">
                                <div class="autocomplete-list ingredient-list"></div>
                            </div>
                            <input type="number" class="ingredient-amount" placeholder="Amount" min="1" value="${amt}">
                            <button class="remove-ingredient icon-btn danger-btn">✕</button>
                        `;
                        ingredientsContainer.appendChild(rowEl);
                        setupIngredientDropdown(rowEl.querySelector('.ingredient-dropdown'));
                        rowEl.querySelector('.remove-ingredient').addEventListener('click', function(){ rowEl.remove(); });
                    });
                    return;
                }

                if (deleteBtn) {
                    if (!confirm(`Delete recipe "${name}"? This cannot be undone.`)) return;
                    delete recipes[name];
                    saveRecipes();
                    renderRecipesList();
                }
            });

            // Initialize category dropdowns
            // Use ingredient categories for ingredient bulk edit dropdown
            if (bulkCategoryInput && bulkCategoryList) setupIngredientCategoryDropdownForElements(bulkCategoryInput, bulkCategoryList);
            // Use recipe categories for recipe bulk edit dropdown
            if (bulkRecipeCategoryInput && bulkRecipeCategoryList) setupCategoryDropdown(bulkRecipeCategoryInput, bulkRecipeCategoryList);
        }


        // Recipe bulk edit helpers
        function toggleSelectAllRecipes(e) {
            const checked = e.target.checked;
            document.querySelectorAll('.recipe-select').forEach(cb => cb.checked = checked);
        }
        function clearRecipeSelections() {
            document.querySelectorAll('.recipe-select').forEach(cb => cb.checked = false);
            const selAll = document.getElementById('select-all-recipes');
            if (selAll) selAll.checked = false;
        }
        function applyBulkEditRecipes() {
            const selected = Array.from(document.querySelectorAll('.recipe-select:checked')).map(cb => cb.dataset.recipe);
            if (selected.length === 0) { alert('Select at least one recipe'); return; }
            const newCategory = (document.getElementById('bulk-recipe-category')?.value || '').trim();
            const newPriceStr = document.getElementById('bulk-recipe-price')?.value;
            const hasPrice = newPriceStr !== undefined && newPriceStr !== null && newPriceStr !== '';
            const newPrice = hasPrice ? parseFloat(newPriceStr) : null;
            const newStackStr = document.getElementById('bulk-recipe-stack')?.value;
            const hasStack = newStackStr !== undefined && newStackStr !== null && newStackStr !== '';
            const newStack = hasStack ? parseInt(newStackStr) : null;
            const newNotes = document.getElementById('bulk-recipe-notes')?.value ?? '';
            selected.forEach(name => {
                const r = recipes[name];
                if (!r) return;
                if (newCategory) r.category = newCategory;
                if (hasPrice && !isNaN(newPrice)) r.sellingPrice = newPrice;
                if (hasStack && !isNaN(newStack)) r.stackSize = newStack;


                if (newNotes.trim()) r.notes = newNotes.trim();
            });
            saveRecipes();
            // UI auto-refresh via saveRecipes()/saveIngredients()
            const panel = document.getElementById('bulk-edit-recipes-panel');
            if (panel) panel.style.display = 'none';
            clearRecipeSelections();
            alert(`Updated ${selected.length} recipe(s).`);
        }

        // Bulk edit functions
            // DB export/import/clear handlers removed per project preference

            // One-time migration: localStorage -> DB
            document.getElementById('migrate-local-to-db')?.addEventListener('click', async () => {
                if (!confirm('Migrate localStorage data into the database? This will overwrite DB contents.')) return;
                try {
                    // Load from localStorage keys if present
                    const lsRecipes = localStorage.getItem(STORAGE_KEY);
                    const lsIngredients = localStorage.getItem(INGREDIENTS_KEY);
                    const lsQueue = localStorage.getItem(QUEUE_KEY);
                    const recipesObj = lsRecipes ? JSON.parse(lsRecipes) : {};
                    const ingredientsObj = lsIngredients ? JSON.parse(lsIngredients) : {};
                    const queueArr = lsQueue ? JSON.parse(lsQueue) : [];

                    // Send to API
                    await fetch('/api/recipes/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify(recipesObj) });
                    await fetch('/api/ingredients/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify(ingredientsObj) });
                    await fetch('/api/queue/setAll', { method: 'POST', headers: { 'Content-Type': 'application/json', ...userHeaders() }, body: JSON.stringify(queueArr) });

                    alert('Migration complete. The page will reload to use the database.');
                    location.reload();
                } catch (e) {
                    console.error(e);
                    alert('Migration failed: ' + e.message);
                }
            });

        function applyBulkEdit() {
            // Gather selected ingredient names
            const selectedCheckboxes = Array.from(document.querySelectorAll('.ingredient-select:checked'));
            const selectedNames = selectedCheckboxes.map(cb => cb.dataset.name || cb.getAttribute('data-name'));
            if (selectedNames.length === 0) { alert('Select at least one ingredient'); return; }

            const priceVal = bulkPriceInput ? bulkPriceInput.value : '';
            const stackVal = bulkStackInput ? bulkStackInput.value : '';
            const notesVal = bulkNotesInput ? bulkNotesInput.value.trim() : '';
            const newCategory = bulkCategoryInput ? bulkCategoryInput.value.trim() : '';

            // Validate inputs
            const updates = {};
            if (priceVal !== '') {
                const p = parseFloat(priceVal);
                if (isNaN(p) || p < 0) { alert('Enter a valid price'); return; }
                updates.price = p;
            }
            if (stackVal !== '') {
                const s = parseInt(stackVal, 10);
                if (isNaN(s) || s < 1 || s > 200) { alert('Enter a valid stack size (1-200)'); return; }
                updates.stackSize = s;
            }
            if (newCategory !== '') {
                updates.category = newCategory;
            }
            if (notesVal !== '') {
                updates.note = notesVal;
            }
            if (Object.keys(updates).length === 0) { alert('Enter at least one field to update'); return; }

            // Apply
            console.log('Bulk edit selected:', selectedNames);
            console.log('Bulk edit updates:', updates);
            selectedNames.forEach(name => {
                const before = { ...ingredients[name] };
                ingredients[name] = { ...ingredients[name], ...updates };
                console.log('Updated ingredient', name, { before, after: ingredients[name] });
            });
            saveIngredients();
            console.log('Ingredients saved');
            renderIngredients();
            console.log('Ingredients re-rendered');
            alert(`Updated ${selectedNames.length} ingredient(s).`);

            // Reset UI
            bulkPriceInput.value = '';
            bulkStackInput.value = '';
            bulkNotesInput.value = '';
            bulkCategoryInput.value = '';
            bulkPanel.style.display = 'none';
            clearIngredientSelections();

            // Auto-refresh the page so all UI state is clean
            setTimeout(() => {


                location.reload();
            }, 150);
        }

        function toggleSelectAllIngredients(e) {
            const checked = e.target.checked;
            const checkboxes = document.querySelectorAll('.ingredient-select');
            console.log('toggleSelectAllIngredients:', checked, 'found checkboxes:', checkboxes.length);
            checkboxes.forEach(cb => cb.checked = checked);
            updateBulkEditEnablement();
        }

        function clearIngredientSelections() {
            const checkboxes = document.querySelectorAll('.ingredient-select');
            console.log('clearIngredientSelections: found checkboxes:', checkboxes.length);
            checkboxes.forEach(cb => cb.checked = false);
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
            updateBulkEditEnablement();
        }

        function updateBulkEditEnablement() {
            const anySelected = document.querySelectorAll('.ingredient-select:checked').length > 0;
            console.log('updateBulkEditEnablement:', anySelected, 'openBulkBtn:', openBulkBtn);
            if (openBulkBtn) openBulkBtn.disabled = !anySelected;
        }

        function updateSelectAllCheckbox() {
            if (!selectAllCheckbox) return;
            const allCheckboxes = document.querySelectorAll('.ingredient-select');
            const checkedCheckboxes = document.querySelectorAll('.ingredient-select:checked');

            if (allCheckboxes.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (checkedCheckboxes.length === allCheckboxes.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else if (checkedCheckboxes.length > 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        }

// Open Add Recipe modal with frosted glass look, auto-filling category
function openAddRecipeModal(category){
    try {
        // Build overlay
        const overlay = document.createElement('div');
        overlay.className = 'glass-modal-overlay';
        overlay.setAttribute('role','dialog');
        overlay.setAttribute('aria-modal','true');

        const modal = document.createElement('div');
        modal.className = 'glass-modal';

        // Header
        const header = document.createElement('div');
        header.className = 'glass-modal-header';
        const title = document.createElement('div');
        title.className = 'glass-modal-title';
        title.textContent = `Add Recipe${category ? ` — ${category}` : ''}`;
        const closeBtn = document.createElement('button');
        closeBtn.className = 'icon-only small-btn glass-close-btn';
        closeBtn.innerHTML = '✕';
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Content wraps existing recipe form
        const content = document.createElement('div');
        content.className = 'glass-modal-content';

        // Actions
        const actions = document.createElement('div');
        actions.className = 'glass-modal-actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'small-btn';
        cancelBtn.textContent = 'Cancel';
        const saveBtn = document.createElement('button');
        saveBtn.className = 'small-btn primary-btn';
        saveBtn.textContent = 'Save Recipe';
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);

        modal.appendChild(header);
        modal.appendChild(content);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Mount the existing form inside content
        if (recipeForm) {
            content.appendChild(recipeForm);
            recipeForm.style.display = 'block';
        }
        // Pre-fill category
        if (recipeCategoryInput) {
            recipeCategoryInput.value = category || '';
        }
        // Focus name
        const nameEl = document.getElementById('recipe-name');
        if (nameEl) nameEl.focus();

        function cleanup(){
            try {
                // Ensure form is hidden and moved back to home container
                if (recipeForm && recipeFormHome && recipeForm.parentElement !== recipeFormHome) {
                    recipeFormHome.appendChild(recipeForm);
                }
                hideRecipeForm && hideRecipeForm();
            } catch (e) {}
            overlay.remove();
        }

        // Events
        closeBtn.addEventListener('click', cleanup);
        cancelBtn.addEventListener('click', cleanup);
        overlay.addEventListener('click', (e)=>{ if (e.target === overlay) cleanup(); });
        document.addEventListener('keydown', function escHandler(e){ if (e.key === 'Escape') { e.preventDefault(); cleanup(); document.removeEventListener('keydown', escHandler); } });
        saveBtn.addEventListener('click', async function(){
            try { await saveRecipe(); } catch(e) { console.warn(e); }
            // saveRecipe hides/moves the form; close modal
            if (document.body.contains(overlay)) overlay.remove();
        });

    } catch (e) {
        console.warn('openAddRecipeModal error', e);
    }
}
