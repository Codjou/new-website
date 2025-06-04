// Met à jour l'année dans le footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// --- AJOUT: Logique de calcul ---

function calculateRow(row) {
    const quantiteTheoriqueInput = row.querySelector('.quantite-theorique');
    const quantiteProduiteInput = row.querySelector('.quantite-produite');
    const differenceCell = row.querySelector('.difference');
    const pourcentageCell = row.querySelector('.pourcentage');

    if (!quantiteTheoriqueInput || !quantiteProduiteInput || !differenceCell || !pourcentageCell) {
        console.error("Could not find required elements in row:", row);
        return;
    }

    const theorique = parseFloat(quantiteTheoriqueInput.value) || 0;
    const produite = parseFloat(quantiteProduiteInput.value) || 0;

    const difference = produite - theorique;
    
    // NEW CALCULATION: Percentage is (Quantité Produite / Quantité Théorique) * 100
    const pourcentage = theorique !== 0 ? (produite / theorique) * 100 : 0;

    differenceCell.textContent = difference > 0 ? `+${difference}` : difference.toString();

    if (theorique === 0) {
        pourcentageCell.textContent = produite > 0 ? '+∞%' : '0.00%';
    } else {
        pourcentageCell.textContent = `${pourcentage > 0 ? '+' : ''}${pourcentage.toFixed(2)}%`;
    }

    differenceCell.classList.remove('positive', 'negative', 'zero');
    pourcentageCell.classList.remove('positive', 'negative', 'zero', 'infinite');

    if (difference > 0) {
        differenceCell.classList.add('positive');
        pourcentageCell.classList.add('positive');
    } else if (difference < 0) {
        differenceCell.classList.add('negative');
        pourcentageCell.classList.add('negative');
    } else {
        differenceCell.classList.add('zero');
        pourcentageCell.classList.add('zero');
        pourcentageCell.textContent = '0.00%';
    }
}

function createNewProductRow(productName = '', lotNumber = '') {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>
            <input type="checkbox" class="row-selector">
        </td>
        <td>
            <div class="produit-container">
                <input type="text" value="${productName}" class="produit-input">
                <div class="action-buttons">
                    <button class="add-row-btn">➕</button>
                    <button class="delete-row-btn">➖</button>
                </div>
            </div>
        </td>
        <td>
            <input type="number" value="${lotNumber}" min="0">
        </td>
        <td><input type="number" value="0" class="quantite-theorique"></td>
        <td>kg</td>
        <td><input type="number" value="0" class="quantite-produite"></td>
        <td class="difference">0</td>
        <td class="pourcentage">0.00%</td>
    `;
    
    return row;
}

function initializeRowActions() {
    const tableBody = document.getElementById('product-table-body');

    tableBody.addEventListener('click', (event) => {
        const target = event.target;
        const row = target.closest('tr');

        // Modify add row functionality to show dialog
        if (target.classList.contains('add-row-btn')) {
            showAddRowDialog(row);
        }

        // Delete row functionality remains the same
        if (target.classList.contains('delete-row-btn')) {
            if (tableBody.children.length > 1) {
                row.remove();
                updateDeleteButtonStates();
                createTotalRow();
            }
        }
    });
}

function updateDeleteButtonStates() {
    const tableBody = document.getElementById('product-table-body');
    const deleteButtons = tableBody.querySelectorAll('.delete-row-btn');
    
    deleteButtons.forEach((btn, index) => {
        // Disable delete button for the first row (header row)
        btn.disabled = tableBody.children.length <= 1 || index === 0;
    });
}

function initializeCalculations() {
    document.querySelectorAll('tbody tr').forEach(row => {
        const inputs = row.querySelectorAll('input.quantite-theorique, input.quantite-produite');
        inputs.forEach(input => {
            input.addEventListener('input', () => calculateRow(row));
        });
        calculateRow(row);
    });
}

function createTotalRow() {
    const tableBody = document.getElementById('product-table-body');
    const productRows = {};

    // Aggregate data by product name
    tableBody.querySelectorAll('tr').forEach(row => {
        const productInput = row.querySelector('.produit-input');
        const lotInput = row.querySelector('input[type="number"]');
        const quantiteTheoriqueInput = row.querySelector('.quantite-theorique');
        const quantiteProduiteInput = row.querySelector('.quantite-produite');

        if (productInput && quantiteTheoriqueInput && quantiteProduiteInput) {
            const productName = productInput.value.trim();
            
            if (!productRows[productName]) {
                productRows[productName] = {
                    quantiteTheoriqueTotale: 0,
                    quantiteProduiteTotal: 0,
                    differenceTotal: 0,
                    batchCount: 0,
                    rows: []
                };
            }

            const theorique = parseFloat(quantiteTheoriqueInput.value) || 0;
            const produite = parseFloat(quantiteProduiteInput.value) || 0;
            const difference = produite - theorique;

            productRows[productName].quantiteTheoriqueTotale += theorique;
            productRows[productName].quantiteProduiteTotal += produite;
            productRows[productName].differenceTotal += difference;
            productRows[productName].batchCount++;
            productRows[productName].rows.push(row);
        }
    });

    // Remove existing total rows
    tableBody.querySelectorAll('tr.total-row').forEach(row => row.remove());

    // Create total rows for each unique product
    Object.entries(productRows).forEach(([productName, data]) => {
        if (data.batchCount >= 1) {
            const totalRow = document.createElement('tr');
            totalRow.classList.add('total-row');

            const pourcentageMoyen = data.quantiteTheoriqueTotale !== 0 
                ? (data.quantiteProduiteTotal / data.quantiteTheoriqueTotale) * 100 
                : 0;

            totalRow.innerHTML = `
                <td></td>
                <td>${productName}</td>
                <td>${data.batchCount}</td>
                <td class="quantite-theorique-total">${data.quantiteTheoriqueTotale.toFixed(2)}</td>
                <td>kg</td>
                <td class="quantite-produite-total">${data.quantiteProduiteTotal.toFixed(2)}</td>
                <td class="difference-total">${data.differenceTotal > 0 ? '+' : ''}${data.differenceTotal.toFixed(2)}</td>
                <td class="pourcentage-total">${pourcentageMoyen > 0 ? '+' : ''}${pourcentageMoyen.toFixed(2)}%</td>
            `;

            // Find the last row of this product group
            const lastProductRow = data.rows[data.rows.length - 1];
            
            // Position the total row after the last row of this product group
            lastProductRow.after(totalRow);
        }
    });
}

function showAddRowDialog(sourceRow) {
    // Create dialog container
    const dialogContainer = document.createElement('div');
    dialogContainer.classList.add('add-row-dialog');
    dialogContainer.innerHTML = `
        <div class="dialog-content">
            <input type="number" id="row-count-input" min="1" max="9999" value="1" class="dialog-input">
            <button id="confirm-add-rows">➕</button>
            <button id="cancel-add-rows" style="color: red;">✖</button>
        </div>
    `;

    // Updated positioning to end at the "Produit" field
    dialogContainer.style.cssText = `
        position: absolute;
        left: 0; /* Align with first column */
        bottom: 100%;
        z-index: 10;
        display: flex;
        justify-content: flex-start;
        width: calc(100% - 38px); /* Subtract width of first checkbox column */
    `;

    sourceRow.style.position = 'relative';

    // Updated styling for more compact dialog
    const dialogContent = dialogContainer.querySelector('.dialog-content');
    dialogContent.style.cssText = `
        display: flex;
        align-items: center;
        background-color: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 2px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        gap: 3px;
        width: auto; /* Change to auto width */
        max-width: 120px; /* Added max-width */
        box-sizing: border-box;
        height: 32px; /* Fixed height */
    `;

    // Styling input and buttons to be more compact
    const rowCountInput = dialogContainer.querySelector('#row-count-input');
    const confirmButton = dialogContainer.querySelector('#confirm-add-rows');
    const cancelButton = dialogContainer.querySelector('#cancel-add-rows');

    rowCountInput.style.cssText = `
        width: 60px; /* Increased width to accommodate more digits */
        height: 24px;
        text-align: center;
        border: 1px solid #ccc;
        border-radius: 3px;
        outline: none;
        font-size: 12px;
        padding: 0;
    `;

    [confirmButton, cancelButton].forEach(button => {
        button.style.cssText = `
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #ccc;
            border-radius: 3px;
            background-color: #fff;
            cursor: pointer;
            padding: 0;
            margin: 0;
            font-size: 12px;
        `;
    });

    cancelButton.style.cssText = `
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #ccc;
        border-radius: 3px;
        background-color: #fff;
        cursor: pointer;
        padding: 0;
        margin: 0;
        font-size: 12px;
        color: red;
    `;

    // Rest of the function remains the same
    sourceRow.appendChild(dialogContainer);

    function closeDialog() {
        sourceRow.removeChild(dialogContainer);
    }

    confirmButton.addEventListener('click', () => {
        const productInput = sourceRow.querySelector('.produit-input');
        const lotInput = sourceRow.querySelector('input[type="number"]');
        const rowCount = parseInt(rowCountInput.value) || 1;

        // Limit row count to 9999
        const limitedRowCount = Math.min(Math.max(rowCount, 1), 9999);

        // Add multiple rows based on input
        for (let i = 0; i < limitedRowCount; i++) {
            const newRow = createNewProductRow(productInput.value, '');
            sourceRow.after(newRow);
        }

        // Clean up
        closeDialog();

        // Reinitialize calculations and UI
        enhancedInitialization();
        updateDeleteButtonStates();
        createTotalRow();
    });

    cancelButton.addEventListener('click', closeDialog);

    // Close dialog when clicking outside
    document.addEventListener('click', function outsideClickListener(e) {
        if (!dialogContainer.contains(e.target) && e.target !== sourceRow.querySelector('.add-row-btn')) {
            closeDialog();
            document.removeEventListener('click', outsideClickListener);
        }
    });

    // Focus the input when dialog opens
    rowCountInput.select();
}

function updateMultiSelectActions() {
    const selectedRows = document.querySelectorAll('.row-selector:checked');
    const multiSelectContainer = document.querySelector('.multi-select-actions');
    
    if (selectedRows.length > 0) {
        multiSelectContainer.classList.add('active');
        
        // Find the first selected row
        const firstSelectedRow = selectedRows[0].closest('tr');
        const firstCheckboxCell = firstSelectedRow.querySelector('td:first-child');
        
        // Calculate position relative to viewport
        const tableRect = firstSelectedRow.closest('table').getBoundingClientRect();
        const cellRect = firstCheckboxCell.getBoundingClientRect();
        
        multiSelectContainer.style.left = `${cellRect.right + 10}px`; 
        multiSelectContainer.style.top = `${Math.min(cellRect.top, window.innerHeight - 50)}px`; 
    } else {
        multiSelectContainer.classList.remove('active');
        
        // Reset positioning
        multiSelectContainer.style.left = '';
        multiSelectContainer.style.top = '';
    }
}

function initializeMultiSelection() {
    const tableBody = document.getElementById('product-table-body');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    
    // Create multi-select actions container
    const multiSelectContainer = document.createElement('div');
    multiSelectContainer.classList.add('multi-select-actions');
    multiSelectContainer.innerHTML = `
        <button id="delete-selected-btn">Supprimer</button>
    `; 
    document.querySelector('main').insertBefore(multiSelectContainer, tableBody.closest('table'));

    // Select All checkbox functionality
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = tableBody.querySelectorAll('.row-selector');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            cb.closest('tr').classList.toggle('selected-row', e.target.checked);
        });
        updateMultiSelectActions();
    });

    // Individual row selection
    tableBody.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-selector')) {
            const row = e.target.closest('tr');
            row.classList.toggle('selected-row', e.target.checked);
            updateMultiSelectActions();
        }
    });

    // Multi-select action buttons
    document.getElementById('delete-selected-btn').addEventListener('click', deleteSelectedRows);
}

function deleteSelectedRows() {
    const selectedRows = document.querySelectorAll('.row-selector:checked');
    const tableBody = document.getElementById('product-table-body');
    
    // Prevent deleting all rows or the first row
    if (selectedRows.length === tableBody.children.length || 
        Array.from(selectedRows).some(cb => cb.closest('tr') === tableBody.children[0])) {
        alert('Vous ne pouvez pas supprimer la ligne d\'en-tête ou toutes les lignes.');
        return;
    }

    selectedRows.forEach(cb => {
        const row = cb.closest('tr');
        // Prevent deleting the first row
        if (row !== tableBody.children[0]) {
            row.remove();
        }
    });
    
    updateMultiSelectActions();
    updateDeleteButtonStates();
    createTotalRow();
}

function createBarChart() {
    // Remove any existing chart
    const existingChartContainer = document.getElementById('chart-container');
    if (existingChartContainer) {
        existingChartContainer.remove();
    }

    const mainSection = document.querySelector('main');
    const chartContainer = document.createElement('div');
    chartContainer.id = 'chart-container';
    chartContainer.style.cssText = `
        width: 100%;
        height: 400px;
        margin-top: 20px;
    `;

    const canvasElement = document.createElement('canvas');
    canvasElement.id = 'product-chart';
    chartContainer.appendChild(canvasElement);
    mainSection.appendChild(chartContainer);

    // Dynamically load Chart.js if not already loaded
    if (typeof Chart === 'undefined') {
        return loadChartJS().then(() => renderChart());
    } else {
        renderChart();
    }

    function renderChart() {
        const tableBody = document.getElementById('product-table-body');
        const productTotals = {};

        // Aggregate data by product name, excluding total rows
        tableBody.querySelectorAll('tr:not(.total-row)').forEach(row => {
            const productInput = row.querySelector('.produit-input');
            const quantiteTheoriqueInput = row.querySelector('.quantite-theorique');
            const quantiteProduiteInput = row.querySelector('.quantite-produite');

            if (productInput && quantiteTheoriqueInput && quantiteProduiteInput) {
                const productName = productInput.value.trim();
                const quantiteTheoriqueParsed = parseFloat(quantiteTheoriqueInput.value) || 0;
                const quantiteProduiteeParsed = parseFloat(quantiteProduiteInput.value) || 0;

                if (!productTotals[productName]) {
                    productTotals[productName] = {
                        quantiteTheoriqueTotale: quantiteTheoriqueParsed,
                        quantiteProduiteTotal: quantiteProduiteeParsed
                    };
                } else {
                    productTotals[productName].quantiteTheoriqueTotale += quantiteTheoriqueParsed;
                    productTotals[productName].quantiteProduiteTotal += quantiteProduiteeParsed;
                }
            }
        });

        // Prepare chart data
        const productNames = Object.keys(productTotals);
        const quantiteTheoriqueTotals = productNames.map(name => productTotals[name].quantiteTheoriqueTotale);
        const quantiteProduiteTotal = productNames.map(name => productTotals[name].quantiteProduiteTotal);

        // Create chart
        new Chart(canvasElement, {
            type: 'bar',
            data: {
                labels: productNames,
                datasets: [
                    {
                        label: 'Quantité Théorique',
                        data: quantiteTheoriqueTotals,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Quantité Produite',
                        data: quantiteProduiteTotal,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantité (kg)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Produits'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Comparaison Quantité Théorique vs Quantité Produite'
                    }
                }
            }
        });
    }
}

function loadChartJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function enhancedInitialization() {
    initializeCalculations();
    initializeRowActions();
    updateDeleteButtonStates();
    initializeMultiSelection();
    
    // Add event listener to recalculate totals and chart when inputs change
    document.getElementById('product-table-body').addEventListener('input', () => {
        createTotalRow();
        createBarChart();
    });

    // Initial chart creation
    createBarChart();
}

function setupFileImport() {
    // Create a hidden file input for Excel file selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls, .csv';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Find the "Ouvrir" menu item
    const ouvrirMenuItem = document.querySelector('.menu-item:first-child .dropdown li:nth-child(2) a');
    
    ouvrirMenuItem.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Check if SheetJS is available, if not, dynamically load it
            if (typeof XLSX === 'undefined') {
                await loadSheetJS();
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                const tableBody = document.getElementById('product-table-body');
                
                // Clear all existing rows
                tableBody.innerHTML = '';

                // Populate rows from the imported file
                for (let i = 1; i < data.length; i++) {
                    const row = createNewProductRow(
                        data[i][0] || '', // Product Name
                        data[i][1] || ''  // Lot Number
                    );
                    
                    // Set Theoretical Quantity
                    const theoreticalQuantityInput = row.querySelector('.quantite-theorique');
                    if (theoreticalQuantityInput && data[i][2]) {
                        theoreticalQuantityInput.value = data[i][2];
                    }

                    // Set Produced Quantity
                    const producedQuantityInput = row.querySelector('.quantite-produite');
                    if (producedQuantityInput && data[i][4]) {
                        producedQuantityInput.value = data[i][4];
                    }

                    tableBody.appendChild(row);
                }

                // If no data was imported, create a default first row
                if (tableBody.children.length === 0) {
                    const defaultRow = createNewProductRow('Exemple Produit', '000');
                    tableBody.appendChild(defaultRow);
                }

                // Reinitialize calculations and UI
                enhancedInitialization();
                createTotalRow();

                // More detailed confirmation message
                alert(`Fichier "${file.name}" importé avec succès. ${data.length - 1} produits ajoutés.`);
            };
            reader.readAsBinaryString(file);
        } catch (error) {
            console.error('Error importing Excel file:', error);
            alert('Erreur lors de l\'importation du fichier Excel.');
        }
    });
}

// Dynamically load SheetJS library
function loadSheetJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.5/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function setupAutocomplete() {
    const formeSuggestions = [
        'SECHE',
        'LIQUIDE',
        'SOLIDE',
        'GRANULÉE',
        'POUDRE'
    ];

    const productSuggestions = [
        'PARACETAMOL',
        'IBUPROFENE',
        'AMOXICILLINE',
        'ASPIRINE',
        'DOLIPRANE',
        'EFFERALGAN',
        'SMECTA',
        'AUGMENTIN',
        'CLAMOXYL',
        'NUROFEN'
    ];

    function createAutocompleteDropdown(input, isFormeInput = false) {
        const existingDropdown = input.parentElement.querySelector('.autocomplete-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        const dropdownContainer = document.createElement('div');
        dropdownContainer.classList.add('autocomplete-dropdown');
        dropdownContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            max-height: 200px;
            overflow-y: auto;
            background-color: white;
            border: 1px solid #ddd;
            border-top: none;
            z-index: 20;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        `;

        input.parentElement.style.position = 'relative';

        // Enhance column visibility for product inputs
        if (!isFormeInput) {
            const firstColumns = input.closest('tr').querySelectorAll('td:first-child, td:nth-child(2)');
            firstColumns.forEach(column => {
                column.style.zIndex = '21';
                column.style.backgroundColor = 'white';
            });
        }

        return dropdownContainer;
    }

    function showAllSuggestions(input, suggestions, isFormeInput = false) {
        const dropdownContainer = createAutocompleteDropdown(input, isFormeInput);
        
        suggestions.slice(0, 5).forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.textContent = suggestion;
            suggestionItem.style.cssText = `
                padding: 5px 10px;
                cursor: pointer;
                transition: background-color 0.2s;
            `;

            suggestionItem.addEventListener('mouseenter', () => {
                suggestionItem.style.backgroundColor = '#f0f0f0';
            });

            suggestionItem.addEventListener('mouseleave', () => {
                suggestionItem.style.backgroundColor = 'white';
            });

            suggestionItem.addEventListener('click', () => {
                input.value = suggestion;
                dropdownContainer.remove();
                
                // Reset column styles only for product inputs
                if (!isFormeInput) {
                    const firstColumns = input.closest('tr').querySelectorAll('td:first-child, td:nth-child(2)');
                    firstColumns.forEach(column => {
                        column.style.zIndex = ''; 
                    });
                }
            });

            dropdownContainer.appendChild(suggestionItem);
        });

        input.parentElement.appendChild(dropdownContainer);
    }

    function addAutocompleteToInput(input, suggestions, isFormeInput = false) {
        // Show suggestions when input is clicked
        input.addEventListener('click', () => {
            // If input is empty or contains text, show all suggestions
            showAllSuggestions(input, suggestions, isFormeInput);
        });

        // Input event to filter suggestions when typing
        input.addEventListener('input', () => {
            const searchTerm = input.value.trim().toLowerCase();
            const filteredSuggestions = suggestions.filter(suggestion => 
                suggestion.toLowerCase().startsWith(searchTerm)
            );

            const dropdownContainer = createAutocompleteDropdown(input, isFormeInput);
            
            if (filteredSuggestions.length > 0) {
                filteredSuggestions.slice(0, 5).forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.textContent = suggestion;
                    suggestionItem.style.cssText = `
                        padding: 5px 10px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    `;

                    suggestionItem.addEventListener('mouseenter', () => {
                        suggestionItem.style.backgroundColor = '#f0f0f0';
                    });

                    suggestionItem.addEventListener('mouseleave', () => {
                        suggestionItem.style.backgroundColor = 'white';
                    });

                    suggestionItem.addEventListener('click', () => {
                        input.value = suggestion;
                        dropdownContainer.remove();
                        
                        // Reset column styles only for product inputs
                        if (!isFormeInput) {
                            const firstColumns = input.closest('tr').querySelectorAll('td:first-child, td:nth-child(2)');
                            firstColumns.forEach(column => {
                                column.style.zIndex = ''; 
                            });
                        }
                    });

                    dropdownContainer.appendChild(suggestionItem);
                });

                input.parentElement.appendChild(dropdownContainer);
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
        const dropdowns = document.querySelectorAll('.autocomplete-dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.parentElement.contains(event.target)) {
                dropdown.remove();
                
                // Reset column styles
                const firstColumns = dropdown.closest('tr')?.querySelectorAll('td:first-child, td:nth-child(2)');
                if (firstColumns) {
                    firstColumns.forEach(column => {
                        column.style.zIndex = ''; 
                    });
                }
            }
        });
    });

    // Target the department input we created earlier
    const departmentInput = document.querySelector('input[placeholder="Forme"]');
    if (departmentInput) {
        addAutocompleteToInput(departmentInput, formeSuggestions, true);
    }

    // Add autocomplete to ALL product input fields
    function addProductAutocomplete() {
        const productInputs = document.querySelectorAll('.produit-input');
        productInputs.forEach(input => {
            addAutocompleteToInput(input, productSuggestions);
        });
    }

    // Initial autocomplete
    addProductAutocomplete();

    // Use MutationObserver to add autocomplete to newly added rows
    const tableBody = document.getElementById('product-table-body');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const productInput = node.querySelector('.produit-input');
                        if (productInput) {
                            addAutocompleteToInput(productInput, productSuggestions);
                        }
                    }
                });
            }
        });
    });

    observer.observe(tableBody, { 
        childList: true, 
        subtree: true 
    });
}

function saveTableData() {
    const tableBody = document.getElementById('product-table-body');
    const rows = Array.from(tableBody.querySelectorAll('tr:not(.total-row)'));

    const tableData = rows.map(row => {
        return {
            productName: row.querySelector('.produit-input')?.value || '',
            lotNumber: row.querySelector('input[type="number"]')?.value || '',
            quantiteTheorique: row.querySelector('.quantite-theorique')?.value || '0',
            quantiteProduite: row.querySelector('.quantite-produite')?.value || '0'
        };
    });

    try {
        localStorage.setItem('inventaireAnnuelData', JSON.stringify(tableData));
        
        // Use custom confirmation dialog with only OK button
        createCustomConfirmationDialog('Données enregistrées avec succès !', true);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        alert('Impossible d\'enregistrer les données. Vérifiez les autorisations de stockage.');
    }
}

function loadSavedTableData() {
    try {
        const savedData = localStorage.getItem('inventaireAnnuelData');
        if (savedData) {
            const tableData = JSON.parse(savedData);
            const tableBody = document.getElementById('product-table-body');
            
            // Clear existing rows
            tableBody.innerHTML = '';

            // Populate rows with saved data
            tableData.forEach(data => {
                const row = createNewProductRow(data.productName, data.lotNumber);
                
                // Set the values
                row.querySelector('.quantite-theorique').value = data.quantiteTheorique;
                row.querySelector('.quantite-produite').value = data.quantiteProduite;
                
                tableBody.appendChild(row);
            });

            // Reinitialize calculations and UI
            enhancedInitialization();
            createTotalRow();
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        alert('Impossible de charger les données enregistrées.');
    }
}

function exportTableToExcel() {
    const tableBody = document.getElementById('product-table-body');
    const rows = Array.from(tableBody.querySelectorAll('tr:not(.total-row)'));

    // Prepare data for export
    const exportData = rows.map(row => {
        return [
            row.querySelector('.produit-input')?.value || '',      // Product Name
            row.querySelector('input[type="number"]')?.value || '', // Lot Number
            row.querySelector('.quantite-theorique')?.value || '',  // Theoretical Quantity
            'kg', // Unit
            row.querySelector('.quantite-produite')?.value || '',   // Produced Quantity
            row.querySelector('.difference')?.textContent || '',    // Difference
            row.querySelector('.pourcentage')?.textContent || ''    // Percentage
        ];
    });

    // Add header row
    const headers = [
        'Produit', 
        'N° Lot', 
        'Quantité Théorique', 
        'Unité', 
        'Quantité Produite', 
        'Différence', 
        'Pourcentage'
    ];
    exportData.unshift(headers);

    try {
        // Check if SheetJS is available, if not, dynamically load it
        if (typeof XLSX === 'undefined') {
            return loadSheetJS().then(() => {
                createAndDownloadExcel(exportData);
            });
        }
        
        createAndDownloadExcel(exportData);
    } catch (error) {
        console.error('Error exporting Excel file:', error);
        alert('Erreur lors de l\'exportation du fichier Excel.');
    }
}

function createAndDownloadExcel(data) {
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire');
    
    // Generate Excel file
    const today = new Date();
    const filename = `Inventaire_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.xlsx`;
    
    // Download the file
    XLSX.writeFile(workbook, filename);
}

// Modify the existing script to add event listener for "Exporter"
function setupExportAction() {
    const exporterMenuItem = document.querySelector('.menu-item:first-child .dropdown li:nth-child(4) a');
    
    exporterMenuItem.addEventListener('click', (e) => {
        e.preventDefault();
        exportTableToExcel();
    });
}

function setupNewFileAction() {
    const nouveauMenuItem = document.querySelector('.menu-item:first-child .dropdown li:first-child a');
    
    nouveauMenuItem.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Use custom confirmation dialog
        const confirmed = await createCustomConfirmationDialog('Voulez-vous créer un nouveau modèle ? Les données non enregistrées seront perdues.');
        
        if (confirmed) {
            createDefaultTemplate();
        }
    });
}

function createDefaultTemplate() {
    const tableBody = document.getElementById('product-table-body');
    
    // Clear existing rows
    tableBody.innerHTML = '';

    // Add three default rows with 0 values
    const defaultProducts = [
        { name: 'Exemple Produit A', lot: '000', theorique: 0, produite: 0 },
        { name: 'Exemple Produit B', lot: '000', theorique: 0, produite: 0 },
        { name: 'Exemple Produit C', lot: '000', theorique: 0, produite: 0 }
    ];

    defaultProducts.forEach(product => {
        const row = createNewProductRow(product.name, product.lot);
        
        // Set the values to 0
        row.querySelector('.quantite-theorique').value = product.theorique;
        row.querySelector('.quantite-produite').value = product.produite;
        
        tableBody.appendChild(row);
    });

    // Reinitialize calculations and UI
    enhancedInitialization();
    createTotalRow();
}

function createCustomConfirmationDialog(message, isSimpleOkDialog = false) {
    // Create dialog container
    const dialogOverlay = document.createElement('div');
    dialogOverlay.classList.add('custom-dialog-overlay');
    dialogOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const dialogBox = document.createElement('div');
    dialogBox.style.cssText = `
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-width: 400px;
        width: 90%;
        text-align: center;
    `;

    // Modify button rendering based on dialog type
    const buttonHtml = isSimpleOkDialog 
        ? `
        <button id="dialog-ok" style="
            background-color: #3498db; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            cursor: pointer;
        ">OK</button>
        `
        : `
        <div style="display: flex; justify-content: center; gap: 10px;">
            <button id="dialog-ok" style="
                background-color: #3498db; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 4px; 
                cursor: pointer;
                margin-right: 10px;
            ">OK</button>
            <button id="dialog-cancel" style="
                background-color: #e74c3c; 
                color: white; 
                border: none; 
                padding: 10px 20px; 
                border-radius: 4px; 
                cursor: pointer;
            ">Annuler</button>
        </div>
        `;

    dialogBox.innerHTML = `
        <p style="margin-bottom: 20px; font-size: 16px;">${message}</p>
        ${buttonHtml}
    `;

    dialogOverlay.appendChild(dialogBox);
    document.body.appendChild(dialogOverlay);

    return new Promise((resolve) => {
        dialogBox.querySelector('#dialog-ok').addEventListener('click', () => {
            document.body.removeChild(dialogOverlay);
            resolve(true);
        });

        if (!isSimpleOkDialog) {
            dialogBox.querySelector('#dialog-cancel').addEventListener('click', () => {
                document.body.removeChild(dialogOverlay);
                resolve(false);
            });
        }

        // Close dialog if clicked outside
        dialogOverlay.addEventListener('click', (e) => {
            if (e.target === dialogOverlay) {
                document.body.removeChild(dialogOverlay);
                resolve(false);
            }
        });
    });
}

function printOrExportToPDF() {
    // Create a temporary print-specific stylesheet
    const printStyles = document.createElement('style');
    printStyles.textContent = `
        @media print {
            body * {
                visibility: hidden;
            }
            
            #chart-container, 
            main,
            main * {
                visibility: visible;
            }
            
            header, 
            footer {
                display: none !important;
            }
            
            main {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                overflow: visible !important;
            }
            
            table {
                display: table !important;
                max-height: none !important;
                overflow-x: visible !important;
                overflow-y: visible !important;
            }
            
            tr {
                display: table-row !important;
                visibility: visible !important;
            }
            
            #chart-container {
                margin-top: 20px;
                page-break-before: always;
            }
            
            /* Ensure all rows are visible, even hidden ones */
            tbody tr {
                display: table-row !important;
            }
        }
    `;
    
    document.head.appendChild(printStyles);
    
    // Trigger print dialog
    window.print();
    
    // Remove temporary print styles after printing
    setTimeout(() => {
        document.head.removeChild(printStyles);
    }, 100);
}

function setupAboutDialog() {
    const aproposMenuItem = document.querySelector('.menu-item:last-child .dropdown li:first-child a');
    
    aproposMenuItem.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Create dialog overlay
        const dialogOverlay = document.createElement('div');
        dialogOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        // Create dialog content
        const dialogBox = document.createElement('div');
        dialogBox.style.cssText = `
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 90%;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        `;

        // Title with Roboto Black 900
        const title = document.createElement('h1');
        title.textContent = 'BGL-INVENT';
        title.style.cssText = `
            font-family: 'Roboto', sans-serif;
            font-weight: 900;
            font-size: 2rem;
            margin: 0;
            color: #2c3e50;
        `;

        // Other details with Roboto Regular
        const details = [
            'Enregistré',
            'Copyright 2023–2025 BIOGALENIC Pharma',
            'Canal stable, Version: 0.0.1',
            'Développé par: AYMEN Chaiah Eloudjou'
        ];

        const detailsElements = details.map(text => {
            const detailElement = document.createElement('p');
            detailElement.textContent = text;
            detailElement.style.cssText = `
                font-family: 'Roboto', sans-serif;
                font-weight: 400;
                margin: 5px 0;
                color: #7f8c8d;
            `;
            return detailElement;
        });

        // Close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fermer';
        closeButton.style.cssText = `
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 15px;
        `;

        // Assemble dialog
        dialogBox.appendChild(title);
        detailsElements.forEach(element => dialogBox.appendChild(element));
        dialogBox.appendChild(closeButton);
        dialogOverlay.appendChild(dialogBox);
        document.body.appendChild(dialogOverlay);

        // Close functionality
        const closeDialog = () => {
            document.body.removeChild(dialogOverlay);
        };

        closeButton.addEventListener('click', closeDialog);
        dialogOverlay.addEventListener('click', (e) => {
            if (e.target === dialogOverlay) {
                closeDialog();
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    enhancedInitialization();
    setupFileImport();
    setupNewFileAction(); 
    setupExportAction(); 
    
    const enregistrerMenuItem = document.querySelector('.menu-item:first-child .dropdown li:nth-child(3) a');
    
    enregistrerMenuItem.addEventListener('click', (e) => {
        e.preventDefault();
        saveTableData();
    });

    loadSavedTableData();

    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        const menuTitle = item.querySelector('.menu-title');
        
        menuTitle.addEventListener('click', (e) => {
            e.preventDefault();
            
            menuItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            item.classList.toggle('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.taskbar')) {
            menuItems.forEach(item => {
                item.classList.remove('active');
            });
        }
    });

    const headerActions = document.querySelector('.header-actions');
    const searchContainer = document.createElement('div');
    searchContainer.classList.add('search-container');
    searchContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        margin-left: auto;
    `;

    const printIcon = document.createElement('div');
    printIcon.classList.add('print-icon');
    printIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#2c3e50" d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/>
            <circle cx="18" cy="10" r="1" fill="#2c3e50"/>
        </svg>
    `;
    printIcon.style.cssText = `
        cursor: pointer;
        transition: transform 0.2s ease;
        padding: 5px;
        border-radius: 4px;
    `;
    
    printIcon.addEventListener('click', printOrExportToPDF);
    printIcon.addEventListener('mouseenter', () => {
        printIcon.style.transform = 'scale(1.1)';
    });
    printIcon.addEventListener('mouseleave', () => {
        printIcon.style.transform = 'scale(1)';
    });

    const saveIcon = document.createElement('div');
    saveIcon.classList.add('save-icon');
    saveIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#2c3e50" d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
        </svg>
    `;
    saveIcon.style.cssText = `
        cursor: pointer;
        transition: transform 0.2s ease;
    `;
    
    saveIcon.addEventListener('click', saveTableData);
    saveIcon.addEventListener('mouseenter', () => {
        saveIcon.style.transform = 'scale(1.1)';
    });
    saveIcon.addEventListener('mouseleave', () => {
        saveIcon.style.transform = 'scale(1)';
    });

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Rechercher un produit';
    searchInput.style.cssText = `
        padding: 5px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        margin-right: 5px;
        width: 200px;
    `;

    const searchButton = document.createElement('button');
    searchButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="#2c3e50" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"/>
        </svg>
    `;
    searchButton.style.cssText = `
        background: none;
        border: 1px solid #2c3e50;
        cursor: pointer;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
    `;

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchButton);

    headerActions.appendChild(searchContainer);
    headerActions.appendChild(saveIcon);
    headerActions.appendChild(printIcon);

    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const tableBody = document.getElementById('product-table-body');
        const rows = tableBody.querySelectorAll('tr:not(.total-row)');

        let matchFound = false;

        rows.forEach(row => {
            const productInput = row.querySelector('.produit-input');
            if (productInput) {
                const productName = productInput.value.trim().toLowerCase();
                
                if (searchTerm === '' || productName.includes(searchTerm)) {
                    row.style.display = '';
                    if (searchTerm !== '') matchFound = true;
                } else {
                    row.style.display = 'none';
                }
            }
        });

        const totalRows = tableBody.querySelectorAll('tr.total-row');
        totalRows.forEach(row => {
            row.style.display = 'none';
        });

        if (searchTerm !== '' && !matchFound) {
            createCustomConfirmationDialog(`Aucun produit trouvé pour "${searchInput.value}"`, true);
        }
    }

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    searchButton.addEventListener('click', performSearch);

    searchInput.addEventListener('input', () => {
        if (searchInput.value.trim() === '') {
            const rows = document.querySelectorAll('#product-table-body tr');
            rows.forEach(row => {
                row.style.display = '';
            });
        }
    });

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = `
        position: absolute;
        top: 10px;
        left: 2rem;  
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: bold;
        z-index: 10;
    `;

    const mainTitle = document.createElement('div');
    mainTitle.textContent = 'BILAN ANNUEL DE LA PRODUCTION FORME';
    mainTitle.style.cssText = `
        font-size: 1.2rem;
        color: #2c3e50;
        text-align: left;
    `;

    const departmentContainer = document.createElement('div');
    departmentContainer.style.cssText = `
        display: flex;
        align-items: center;
        margin-left: 10px;
    `;

    const departmentInput = document.createElement('input');
    departmentInput.type = 'text';
    departmentInput.placeholder = 'Forme';  
    departmentInput.style.cssText = `
        width: 100%;
        padding: 0.4rem 0.6rem;
        border: 1px solid #d6dce3;
        border-radius: 6px;
        box-sizing: border-box;
        background-color: transparent;
        transition: all 0.3s ease;
        font-size: 0.95rem;
        max-width: 200px;
        text-align: left;
    `;

    departmentContainer.appendChild(departmentInput);

    const zoneText = document.createElement('div');
    zoneText.textContent = 'ZONE';
    zoneText.style.cssText = `
        font-size: 1.2rem;
        color: #2c3e50;
        text-align: left;
        margin: 0 10px;
        font-weight: bold;
    `;

    const counterBox = document.createElement('input');
    counterBox.id = 'product-counter';
    counterBox.type = 'number';
    counterBox.placeholder = 'Nombre';
    counterBox.style.cssText = `
        width: 100%;
        padding: 0.4rem 0.6rem;
        border: 1px solid #d6dce3;
        border-radius: 6px;
        box-sizing: border-box;
        background-color: transparent;
        transition: all 0.3s ease;
        font-size: 0.95rem;
        max-width: 80px;
        text-align: center;
    `;

    const exerciseText = document.createElement('div');
    exerciseText.textContent = 'EXERCICE:';
    exerciseText.style.cssText = `
        font-size: 1.2rem;
        color: #2c3e50;
        text-align: left;
        margin: 0 10px;
        font-weight: bold;
    `;

    const yearInput = document.createElement('input');
    yearInput.type = 'number';
    yearInput.placeholder = new Date().getFullYear();
    yearInput.value = new Date().getFullYear();
    yearInput.style.cssText = `
        width: 100%;
        padding: 0.4rem 0.6rem;
        border: 1px solid #d6dce3;
        border-radius: 6px;
        box-sizing: border-box;
        background-color: transparent;
        transition: all 0.3s ease;
        font-size: 0.95rem;
        max-width: 80px;
        text-align: center;
    `;

    titleContainer.appendChild(mainTitle);
    titleContainer.appendChild(departmentContainer);
    titleContainer.appendChild(zoneText);  
    titleContainer.appendChild(counterBox);  
    titleContainer.appendChild(exerciseText);  
    titleContainer.appendChild(yearInput);  

    const mainSection = document.querySelector('main');
    mainSection.appendChild(titleContainer);

    function updateProductCounter() {
        const tableBody = document.getElementById('product-table-body');
        const productRows = tableBody.querySelectorAll('tr:not(.total-row)');
        counterBox.value = productRows.length;
    }

    updateProductCounter();

    const tableBody = document.getElementById('product-table-body');
    const observer = new MutationObserver(updateProductCounter);
    observer.observe(tableBody, { 
        childList: true, 
        subtree: true 
    });

    console.log("Inventaire prêt avec calculs activés et totaux dynamiques.");
    
    createBarChart();
    
    setupAutocomplete();
    setupAboutDialog();
});