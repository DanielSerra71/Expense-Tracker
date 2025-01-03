// Agregar al inicio del archivo
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrado');
            })
            .catch(error => {
                console.log('Error al registrar ServiceWorker:', error);
            });
    });
}

// Elementos del DOM principales
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const transactionsEl = document.getElementById('transactions');
const form = document.getElementById('form');
const themeToggle = document.querySelector('.theme-toggle');

// Elementos del formulario
const transactionTypeSelect = document.getElementById('transaction-type');
const presetSelect = document.getElementById('preset-transactions');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const savePresetBtn = document.getElementById('save-preset');
const transactionDateInput = document.getElementById('transaction-date');

// Elementos de filtros
const filterCategory = document.getElementById('filter-category');
const filterType = document.getElementById('filter-type');

// Agregar después de las declaraciones de variables existentes
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const currentMonthEl = document.getElementById('currentMonth');
const monthIncomeEl = document.getElementById('monthIncome');
const monthExpenseEl = document.getElementById('monthExpense');
const monthBalanceEl = document.getElementById('monthBalance');
const monthListEl = document.getElementById('monthList');

// Agregar al inicio del archivo con las otras constantes
const recurringModal = document.getElementById('recurringModal');
const remindersModal = document.getElementById('remindersModal');
const recurringForm = document.getElementById('recurringForm');
const recurringList = document.getElementById('recurringList');
const remindersList = document.getElementById('remindersList');
const addRecurringBtn = document.getElementById('addRecurringBtn');

let currentDate = new Date();

// Estado inicial
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Objeto para almacenar las transacciones preconfiguradas
const presetTransactions = {
    income: {
        'salary': { descriptionKey: 'salary', amount: 0, category: 'salary' },
        'freelance': { descriptionKey: 'freelance', amount: 0, category: 'business' },
        'investments': { descriptionKey: 'investments', amount: 0, category: 'investments' },
        'rent': { descriptionKey: 'rent', amount: 0, category: 'extras' },
        'bonus': { descriptionKey: 'bonus', amount: 0, category: 'salary' }
    },
    expense: {
        'rent-expense': { descriptionKey: 'rentExpense', amount: 0, category: 'housing' },
        'utilities': { descriptionKey: 'utilities', amount: 0, category: 'services' },
        'groceries': { descriptionKey: 'groceries', amount: 0, category: 'food' },
        'transport': { descriptionKey: 'transport', amount: 0, category: 'transport' },
        'internet': { descriptionKey: 'internet', amount: 0, category: 'services' },
        'entertainment': { descriptionKey: 'entertainment', amount: 0, category: 'entertainment' },
        'healthcare': { descriptionKey: 'healthcare', amount: 0, category: 'healthcare' },
        'clothing': { descriptionKey: 'clothing', amount: 0, category: 'shopping' },
        'restaurants': { descriptionKey: 'restaurants', amount: 0, category: 'food' }
    }
};

// Estructura de datos para pagos recurrentes
let recurringPayments = JSON.parse(localStorage.getItem('recurringPayments')) || [];
let reminders = JSON.parse(localStorage.getItem('reminders')) || [];

// Agregar esta función para inicializar la fecha de transacción
function initializeTransactionDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    transactionDateInput.value = formattedDate;
}

// Evento para cambiar las opciones disponibles según el tipo de transacción
transactionTypeSelect.addEventListener('change', function () {
    const type = this.value;
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

    // Mostrar/ocultar opciones relevantes en presets y categorías
    Array.from(presetSelect.options).forEach(option => {
        const isHeader = option.value.includes('-header');
        const isIncome = ['salary', 'freelance', 'investments', 'rent', 'bonus'].includes(option.value);
        const isExpense = ['rent-expense', 'utilities', 'groceries', 'transport', 'internet',
            'entertainment', 'healthcare', 'clothing', 'restaurants'].includes(option.value);

        if (isHeader) {
            option.style.display = !type ? 'none' :
                (type === 'income' && option.value.includes('income')) ||
                    (type === 'expense' && option.value.includes('expense')) ? '' : 'none';
        } else {
            option.style.display = !type ? 'none' :
                (type === 'income' && isIncome) ||
                    (type === 'expense' && isExpense) ? '' : 'none';
        }
    });

    // Actualizar las categorías
    Array.from(categorySelect.options).forEach(option => {
        const isHeader = option.value.includes('-header');
        const isIncome = ['salary', 'business', 'investments', 'extras'].includes(option.value);
        const isExpense = ['housing', 'food', 'transport', 'services', 'entertainment',
            'healthcare', 'education', 'shopping'].includes(option.value);

        if (isHeader) {
            option.style.display = !type ? 'none' :
                (type === 'income' && option.value.includes('income')) ||
                    (type === 'expense' && option.value.includes('expense')) ? '' : 'none';
        } else {
            option.style.display = !type ? 'none' :
                (type === 'income' && isIncome) ||
                    (type === 'expense' && isExpense) ? '' : 'none';
        }
    });

    // Resetear selecciones y actualizar traducciones
    presetSelect.value = '';
    categorySelect.value = '';
    updateCategoryLabels(currentLang);
});

// Evento para cargar preset seleccionado
presetSelect.addEventListener('change', function () {
    const selectedPreset = this.value;
    const type = transactionTypeSelect.value;
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

    if (selectedPreset && presetTransactions[type][selectedPreset]) {
        const preset = presetTransactions[type][selectedPreset];
        descriptionInput.value = translations[currentLang][preset.descriptionKey] || preset.descriptionKey;
        categorySelect.value = preset.category;
        if (preset.amount > 0) {
            amountInput.value = preset.amount;
        }
    }
});

// Guardar nuevo preset
savePresetBtn.addEventListener('click', function () {
    const type = transactionTypeSelect.value;
    if (!type) {
        alert('Por favor seleccione un tipo de transacción primero');
        return;
    }

    const description = descriptionInput.value.trim();
    if (!description) {
        alert('Por favor ingrese una descripción');
        return;
    }

    const presetId = description.toLowerCase().replace(/\s+/g, '-');
    const amount = parseFloat(amountInput.value) || 0;
    const category = categorySelect.value;

    // Agregar nuevo preset
    presetTransactions[type][presetId] = {
        description,
        amount,
        category
    };

    // Crear y agregar nueva opción al select
    const optgroup = document.getElementById(`${type}-presets`);
    const option = document.createElement('option');
    option.value = presetId;
    option.textContent = description;
    optgroup.appendChild(option);

    // Actualizar las categorías en pagos recurrentes si el modal está abierto
    if (recurringModal.classList.contains('show')) {
        updateRecurringCategories();
    }

    savePresetsToStorage();
    alert('Preset guardado correctamente');
});

// Función para formatear fecha
function formatMonth(date) {
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';
    return new Intl.DateTimeFormat(
        currentLang === 'es' ? 'es-ES' : 'en-US',
        { month: 'long', year: 'numeric' }
    ).format(date);
}

// Función para obtener el primer y último día del mes
function getMonthRange(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

// Función para actualizar el resumen del mes actual
function updateMonthlyStats() {
    const { start, end } = getMonthRange(currentDate);

    console.log('Fecha actual:', currentDate);
    console.log('Rango de fechas:', {
        start: start.toLocaleString(),
        end: end.toLocaleString()
    });

    // Filtrar transacciones del mes actual
    const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const isInRange = transactionDate >= start && transactionDate <= end;

        console.log('Evaluando transacción:', {
            fecha: transactionDate.toLocaleString(),
            descripcion: t.description,
            tipo: t.type,
            monto: t.amount,
            dentroDeMes: isInRange
        });

        return isInRange;
    });

    console.log('Transacciones encontradas para el mes:', monthTransactions);

    const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    console.log('Resumen calculado:', {
        ingresos: income,
        gastos: expense,
        balance: balance
    });

    // Actualizar los elementos del resumen mensual
    monthIncomeEl.innerText = `$${income.toFixed(2)}`;
    monthExpenseEl.innerText = `$${expense.toFixed(2)}`;
    monthBalanceEl.innerText = `$${balance.toFixed(2)}`;
    currentMonthEl.innerText = formatMonth(currentDate);
}

// Agregar esta función para renderizar los grupos de transacciones
function renderTransactionGroups(transactions) {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

    return `
        ${incomeTransactions.length ? `
            <div class="transaction-group">
                <h6 data-translate="income">${translations[currentLang].income}</h6>
                ${incomeTransactions.map(t => `
                    <div class="transaction-item plus">
                        <div class="transaction-info">
                            <span>${t.description}</span>
                            <span class="transaction-category">${translations[currentLang][t.category] || t.category}</span>
                        </div>
                        <span>+$${t.amount.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
        ${expenseTransactions.length ? `
            <div class="transaction-group">
                <h6 data-translate="expense">${translations[currentLang].expense}</h6>
                ${expenseTransactions.map(t => `
                    <div class="transaction-item minus">
                        <div class="transaction-info">
                            <span>${t.description}</span>
                            <span class="transaction-category">${translations[currentLang][t.category] || t.category}</span>
                        </div>
                        <span>-$${t.amount.toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

// Función para generar el historial mensual
function generateMonthlyHistory() {
    const monthlyGroups = {};
    let annualSummary = {
        income: 0,
        expense: 0
    };

    // Primero agrupar por mes y calcular el total anual
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
            console.error('Fecha inválida:', transaction);
            return;
        }

        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

        // Agrupar por mes
        if (!monthlyGroups[monthKey]) {
            monthlyGroups[monthKey] = {
                date: date,
                transactions: [],
                totals: {
                    income: 0,
                    expense: 0
                }
            };
        }

        monthlyGroups[monthKey].transactions.push(transaction);

        // Actualizar totales mensuales
        if (transaction.type === 'income') {
            monthlyGroups[monthKey].totals.income += transaction.amount;
        } else {
            monthlyGroups[monthKey].totals.expense += transaction.amount;
        }

        // Actualizar resumen anual para todos los meses
        if (transaction.type === 'income') {
            annualSummary.income += transaction.amount;
        } else {
            annualSummary.expense += transaction.amount;
        }
    });

    // Ordenar meses de más reciente a más antiguo
    const sortedMonths = Object.values(monthlyGroups).sort((a, b) => b.date - a.date);

    // Calcular balance anual total
    const totalBalance = annualSummary.income - annualSummary.expense;
    const isPositive = totalBalance >= 0;

    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

    // Crear el resumen anual con los totales acumulados y traducciones
    const annualSummaryHTML = `
        <div class="annual-summary">
            <h4 data-translate="annualSummary">${translations[currentLang].annualSummary}</h4>
            <div class="annual-stats">
                <div class="stat-item income">
                    <span class="stat-label" data-translate="totalIncome">${translations[currentLang].totalIncome}</span>
                    <span class="stat-value">+$${annualSummary.income.toFixed(2)}</span>
                </div>
                <div class="stat-item expense">
                    <span class="stat-label" data-translate="totalExpense">${translations[currentLang].totalExpense}</span>
                    <span class="stat-value">-$${annualSummary.expense.toFixed(2)}</span>
                </div>
                <div class="stat-item balance ${isPositive ? 'positive' : 'negative'}">
                    <span class="stat-label" data-translate="totalBalance">${translations[currentLang].totalBalance}</span>
                    <span class="stat-value">
                        ${isPositive ? '+' : '-'}$${Math.abs(totalBalance).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    `;

    monthListEl.innerHTML = annualSummaryHTML;

    // Mostrar el desglose mensual
    sortedMonths.forEach(monthData => {
        const monthEl = document.createElement('div');
        monthEl.className = 'month-item';
        monthEl.innerHTML = `
            <div class="month-header">
                <h5>${formatMonth(monthData.date)}</h5>
                <div>
                    <span class="income">+$${monthData.totals.income.toFixed(2)}</span>
                    <span class="expense">-$${monthData.totals.expense.toFixed(2)}</span>
                </div>
            </div>
            <div class="month-transactions">
                ${renderTransactionGroups(monthData.transactions)}
            </div>
        `;

        // Agregar evento para mostrar/ocultar detalles
        const header = monthEl.querySelector('.month-header');
        const details = monthEl.querySelector('.month-transactions');
        header.addEventListener('click', () => {
            details.classList.toggle('show');
        });

        monthListEl.appendChild(monthEl);
    });
}

// Event listeners para los botones de navegación de mes
prevMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    updateMonthlyStats();
    generateMonthlyHistory();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    updateMonthlyStats();
    generateMonthlyHistory();
});

function updateUI() {
    // Primero actualizar el balance general
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    // Actualizar los elementos del balance general
    balanceEl.innerText = `$${balance.toFixed(2)}`;
    incomeEl.innerText = `$${income.toFixed(2)}`;
    expenseEl.innerText = `$${expense.toFixed(2)}`;

    // Actualizar la lista de transacciones con filtros
    let filteredTransactions = filterTransactions(transactions);

    // Ordenar transacciones por fecha y luego por ID (más reciente primero)
    filteredTransactions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // Si las fechas son iguales, ordenar por ID (más reciente primero)
        if (dateA.getTime() === dateB.getTime()) {
            return b.id - a.id;
        }

        // Si las fechas son diferentes, ordenar por fecha
        return dateB - dateA;
    });

    transactionsEl.innerHTML = '';

    filteredTransactions.forEach(transaction => {
        const currentLang = document.documentElement.getAttribute('data-lang') || 'es';
        const li = document.createElement('li');
        li.classList.add('transaction-item', transaction.type === 'income' ? 'plus' : 'minus');

        // Traducir la categoría
        const translatedCategory = translations[currentLang][transaction.category] || transaction.category;

        li.innerHTML = `
            <div class="transaction-info">
                <span>${transaction.description}</span>
                <span class="transaction-category">${translatedCategory}</span>
                <span class="transaction-date">${new Date(transaction.date).toLocaleDateString(
            currentLang === 'es' ? 'es-ES' : 'en-US',
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        )}</span>
            </div>
            <div class="transaction-actions">
                <span class="transaction-amount ${transaction.type === 'income' ? 'plus' : 'minus'}">
                    ${transaction.type === 'income' ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
                </span>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editTransaction(${transaction.id})" title="${translations[currentLang].edit}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTransaction(${transaction.id})" title="${translations[currentLang].delete}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        transactionsEl.appendChild(li);
    });
}

function filterTransactions(transactions) {
    const categoryFilter = filterCategory.value;
    const typeFilter = filterType.value;
    const dateFilter = dateFilterType.value;
    let filteredTransactions = [...transactions];

    // Filtrar por fecha
    if (dateFilter !== 'all') {
        switch (dateFilter) {
            case 'custom':
                const start = new Date(startDate.value);
                const end = new Date(endDate.value);
                end.setHours(23, 59, 59, 999);

                filteredTransactions = filteredTransactions.filter(t => {
                    const date = new Date(t.date);
                    return date >= start && date <= end;
                });
                break;

            case 'month':
                const [year, month] = specificMonth.value.split('-');
                filteredTransactions = filteredTransactions.filter(t => {
                    const date = new Date(t.date);
                    return date.getFullYear() === parseInt(year) &&
                        date.getMonth() === parseInt(month) - 1;
                });
                break;

            case 'week':
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                filteredTransactions = filteredTransactions.filter(t => {
                    const date = new Date(t.date);
                    return date >= weekAgo;
                });
                break;

            case 'today':
                const today = new Date();
                filteredTransactions = filteredTransactions.filter(t => {
                    const date = new Date(t.date);
                    return date.toDateString() === today.toDateString();
                });
                break;
        }
    }

    // Filtrar por categoría y tipo
    return filteredTransactions.filter(transaction => {
        const matchesCategory = categoryFilter === 'todas' ||
            transaction.category === categoryFilter;

        const matchesType = typeFilter === 'todas' ||
            (typeFilter === 'ingreso' && transaction.type === 'income') ||
            (typeFilter === 'gasto' && transaction.type === 'expense');

        return matchesCategory && matchesType;
    });
}

function addTransaction(e) {
    e.preventDefault();

    const type = transactionTypeSelect.value;
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;

    // Corregir el manejo de la fecha
    const inputDate = transactionDateInput.value;
    const [year, month, day] = inputDate.split('-').map(num => parseInt(num));
    const transactionDate = new Date(year, month - 1, day);

    if (!type || !description || !amount || !category || !transactionDateInput.value) {
        alert('Por favor complete todos los campos');
        return;
    }

    transactionDate.setHours(12, 0, 0, 0);

    // Guardar la transacción usando el valor del select como clave para traducción
    const transaction = {
        id: Date.now(),
        type,
        description,
        amount: Math.abs(amount),
        category,
        date: transactionDate.toISOString()
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    updateUI();
    updateMonthlyStats();
    generateMonthlyHistory();

    form.reset();
    transactionTypeSelect.value = '';
    categorySelect.value = '';
    initializeTransactionDate();

    Array.from(categorySelect.getElementsByTagName('optgroup')).forEach(group => {
        group.style.display = 'none';
    });
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateUI();
    updateMonthlyStats();
    generateMonthlyHistory();
}

function savePresetsToStorage() {
    localStorage.setItem('presetTransactions', JSON.stringify(presetTransactions));
}

// Event Listeners
form.addEventListener('submit', addTransaction);
filterCategory.addEventListener('change', () => {
    updateUI();
    updateMonthlyStats();
    generateMonthlyHistory();
});

filterType.addEventListener('change', () => {
    updateUI();
    updateMonthlyStats();
    generateMonthlyHistory();
});

// Función para manejar el cambio de tema
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const icon = themeToggle.querySelector('i');

    // Cambiar el tema
    document.documentElement.setAttribute('data-theme', newTheme);

    // Cambiar el icono
    icon.classList.remove(currentTheme === 'dark' ? 'fa-sun' : 'fa-moon');
    icon.classList.add(currentTheme === 'dark' ? 'fa-moon' : 'fa-sun');

    // Guardar preferencia
    localStorage.setItem('theme', newTheme);
}

// Inicializar el tema basado en la preferencia guardada o del sistema
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    const icon = themeToggle.querySelector('i');

    document.documentElement.setAttribute('data-theme', theme);
    icon.classList.remove('fa-moon', 'fa-sun');
    icon.classList.add(theme === 'dark' ? 'fa-sun' : 'fa-moon');
}

// Agregar el event listener para el botón de tema
themeToggle.addEventListener('click', toggleTheme);

// Función para manejar el formulario de pagos recurrentes
function handleRecurringForm() {
    const form = document.getElementById('recurringForm');
    const modal = document.getElementById('recurringModal');
    const addButton = document.getElementById('addRecurringBtn');

    // Función para limpiar y cerrar el modal
    function closeAndResetModal() {
        modal.classList.remove('show');
        form.reset();
        document.getElementById('recurring-type').value = '';
        document.getElementById('recurring-category').innerHTML = `
            <option value="" data-translate="selectCategory">${translations[currentLang].selectCategory}</option>
        `;
        delete form.dataset.editId;
    }

    // Manejar apertura del modal
    addButton.addEventListener('click', () => {
        const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

        // Asegurarse de que el tipo esté vacío al inicio
        document.getElementById('recurring-type').value = '';

        // Reiniciar el select de categorías con la opción por defecto
        document.getElementById('recurring-category').innerHTML = `
            <option value="" data-translate="selectCategory">${translations[currentLang].selectCategory}</option>
        `;

        modal.classList.add('show');
    });

    // Event listener para el cambio de tipo
    document.getElementById('recurring-type').addEventListener('change', function () {
        updateRecurringCategories();
    });

    // Manejar el envío del formulario
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = {
            type: document.getElementById('recurring-type').value,
            description: document.getElementById('recurring-description').value.trim(),
            amount: parseFloat(document.getElementById('recurring-amount').value),
            category: document.getElementById('recurring-category').value,
            frequency: document.getElementById('recurring-frequency').value,
            day: parseInt(document.getElementById('recurring-day').value),
            reminderDays: parseInt(document.getElementById('recurring-reminder').value)
        };

        // Validar campos
        if (Object.values(formData).some(value => !value)) {
            alert('Por favor complete todos los campos correctamente');
            return;
        }

        if (formData.day < 1 || formData.day > 31) {
            alert('Por favor ingrese un día válido del mes (1-31)');
            return;
        }

        const payment = {
            ...formData,
            id: this.dataset.editId ? parseInt(this.dataset.editId) : Date.now(),
            lastExecuted: null
        };

        if (this.dataset.editId) {
            const index = recurringPayments.findIndex(p => p.id === parseInt(this.dataset.editId));
            if (index !== -1) {
                recurringPayments[index] = payment;
            }
        } else {
            recurringPayments.push(payment);
        }

        localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));
        updateRecurringList();

        // Cerrar y limpiar el modal
        closeAndResetModal();

        showNotification('Pago Recurrente', 'Se ha guardado correctamente el pago recurrente');
    });

    // Manejar cierre del modal con el botón de cerrar
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            closeAndResetModal();
        });
    });

    // Manejar cierre del modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAndResetModal();
        }
    });
}

// Modificar la función updateRecurringCategories
function updateRecurringCategories() {
    const recurringCategorySelect = document.getElementById('recurring-category');
    const type = document.getElementById('recurring-type').value;
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

    // Limpiar categorías existentes
    recurringCategorySelect.innerHTML = `
        <option value="" data-translate="selectCategory">${translations[currentLang].selectCategory}</option>
    `;

    if (!type) return; // Si no hay tipo seleccionado, no mostrar categorías

    // Agregar encabezado y opciones según el tipo
    if (type === 'income') {
        const incomeCategories = [
            { value: 'salary', key: 'salary' },
            { value: 'business', key: 'business' },
            { value: 'investments', key: 'investments' },
            { value: 'extras', key: 'extras' }
        ];

        // Agregar encabezado de ingresos
        const headerOption = document.createElement('option');
        headerOption.disabled = true;
        headerOption.style.fontWeight = 'bold';
        headerOption.style.backgroundColor = 'var(--bg-color)';
        headerOption.textContent = translations[currentLang].incomeCategories;
        recurringCategorySelect.appendChild(headerOption);

        // Agregar opciones de ingresos
        incomeCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = translations[currentLang][cat.key];
            recurringCategorySelect.appendChild(option);
        });
    } else if (type === 'expense') {
        const expenseCategories = [
            { value: 'housing', key: 'housing' },
            { value: 'food', key: 'food' },
            { value: 'transport', key: 'transport' },
            { value: 'services', key: 'services' },
            { value: 'entertainment', key: 'entertainment' },
            { value: 'healthcare', key: 'healthcare' },
            { value: 'education', key: 'education' },
            { value: 'shopping', key: 'shopping' }
        ];

        // Agregar encabezado de gastos
        const headerOption = document.createElement('option');
        headerOption.disabled = true;
        headerOption.style.fontWeight = 'bold';
        headerOption.style.backgroundColor = 'var(--bg-color)';
        headerOption.textContent = translations[currentLang].expenseCategories;
        recurringCategorySelect.appendChild(headerOption);

        // Agregar opciones de gastos
        expenseCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.value;
            option.textContent = translations[currentLang][cat.key];
            recurringCategorySelect.appendChild(option);
        });
    }
}

// Agregar event listener para actualizar categorías cuando cambia el tipo
document.getElementById('recurring-type').addEventListener('change', updateRecurringCategories);

// Modificar el DOMContentLoaded para usar la nueva función
document.addEventListener('DOMContentLoaded', function () {
    const savedPresets = localStorage.getItem('presetTransactions');
    if (savedPresets) {
        Object.assign(presetTransactions, JSON.parse(savedPresets));
    }

    // Inicializar el filtro de fecha en 'month' y establecer el mes actual
    const today = new Date();
    const currentMonthValue = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    dateFilterType.value = 'month';
    specificMonth.value = currentMonthValue;
    monthFilter.style.display = 'grid'; // Mostrar el selector de mes

    handleRecurringForm();
    initializeTheme();
    initializeTransactionDate();
    updateUI();
    updateMonthlyStats();
    generateMonthlyHistory();
    updateRecurringList();
    checkRecurringPayments();

    // Verificar pagos recurrentes cada día
    setInterval(checkRecurringPayments, 24 * 60 * 60 * 1000);
});

// Agregar esta función para actualizar la lista de pagos recurrentes
function updateRecurringList() {
    recurringList.innerHTML = '';

    recurringPayments.forEach(payment => {
        const div = document.createElement('div');
        div.className = 'recurring-item';
        div.innerHTML = `
            <div class="recurring-info">
                <h4>${payment.description}</h4>
                <p>
                    <span class="badge ${payment.type}">${payment.type === 'income' ? 'Ingreso' : 'Gasto'}</span>
                    <span class="badge">${payment.category}</span>
                </p>
                <p>Día ${payment.day} de cada mes</p>
                <p class="amount ${payment.type}">${payment.type === 'income' ? '+' : '-'}$${payment.amount.toFixed(2)}</p>
            </div>
            <div class="recurring-actions">
                <button class="btn-icon" onclick="editRecurringPayment(${payment.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteRecurringPayment(${payment.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        recurringList.appendChild(div);
    });
}

// Función para editar pagos recurrentes
function editRecurringPayment(id) {
    const payment = recurringPayments.find(p => p.id === id);
    if (!payment) return;

    const recurringForm = document.getElementById('recurringForm');
    const modal = document.getElementById('recurringModal');

    // Establecer el tipo y actualizar categorías
    document.getElementById('recurring-type').value = payment.type;
    updateRecurringCategories(); // Actualizar categorías antes de establecer el valor

    // Llenar el resto de los campos
    document.getElementById('recurring-description').value = payment.description;
    document.getElementById('recurring-amount').value = payment.amount;
    document.getElementById('recurring-category').value = payment.category;
    document.getElementById('recurring-frequency').value = payment.frequency;
    document.getElementById('recurring-day').value = payment.day;

    // Calcular días, horas y minutos desde reminderOffset
    const reminderDays = Math.floor(payment.reminderOffset / (24 * 60));
    const reminderHours = Math.floor((payment.reminderOffset % (24 * 60)) / 60);
    const reminderMinutes = payment.reminderOffset % 60;

    // Establecer los valores de recordatorio
    document.getElementById('recurring-reminder-days').value = reminderDays;
    document.getElementById('recurring-reminder-hours').value = reminderHours;
    document.getElementById('recurring-reminder-minutes').value = reminderMinutes;

    // Guardar el ID para la edición
    recurringForm.dataset.editId = id;

    // Mostrar el modal
    modal.classList.add('show');
}

// Agregar estilos para los badges
const style = document.createElement('style');
style.textContent += `
    .badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        margin-right: 5px;
        background: var(--bg-color);
    }

    .badge.income {
        color: var(--primary-color);
        background: rgba(46, 204, 113, 0.1);
    }

    .badge.expense {
        color: var(--danger-color);
        background: rgba(231, 76, 60, 0.1);
    }

    .btn-icon.delete {
        background: var(--danger-color);
    }

    .btn-icon.delete:hover {
        background: #c0392b;
    }

    .recurring-info h4 {
        margin: 0 0 8px 0;
    }

    .recurring-info p {
        margin: 4px 0;
    }

    .amount {
        font-weight: bold;
        font-size: 1.1rem;
    }

    .amount.income {
        color: var(--primary-color);
    }

    .amount.expense {
        color: var(--danger-color);
    }
`;
document.head.appendChild(style);

// Agregar función para eliminar pagos recurrentes
function deleteRecurringPayment(id) {
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';
    const payment = recurringPayments.find(p => p.id === id);

    showConfirmation(
        translations[currentLang].confirmDelete,
        payment.description,
        () => {
            recurringPayments = recurringPayments.filter(p => p.id !== id);
            localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));
            updateRecurringList();
            showNotification(
                translations[currentLang].recurringPayments,
                translations[currentLang].recurringPaymentDeleted
            );
        }
    );
}

// Agregar la función showConfirmation
function showConfirmation(message, itemName, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const confirmMsg = document.getElementById('confirmationMessage');
    const confirmBtn = document.getElementById('confirmAction');
    const cancelBtn = document.getElementById('cancelConfirmation');
    const closeBtn = modal.querySelector('.close-modal');

    confirmMsg.textContent = `${message}\n"${itemName}"`;
    modal.classList.add('show');

    // Manejar confirmación
    const handleConfirm = () => {
        onConfirm();
        modal.classList.remove('show');
        cleanup();
    };

    // Manejar cancelación
    const handleCancel = () => {
        modal.classList.remove('show');
        cleanup();
    };

    // Limpiar event listeners
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        closeBtn.removeEventListener('click', handleCancel);
        modal.removeEventListener('click', handleModalClick);
    };

    // Cerrar al hacer clic fuera del modal
    const handleModalClick = (e) => {
        if (e.target === modal) handleCancel();
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    closeBtn.addEventListener('click', handleCancel);
    modal.addEventListener('click', handleModalClick);
}

// Agregar estilos para el resumen anual
const annualStyles = `
    .annual-summary {
        background: var(--card-bg);
        padding: 20px;
        border-radius: var(--border-radius);
        margin-bottom: 20px;
        box-shadow: var(--box-shadow);
    }

    .annual-summary h4 {
        margin: 0 0 15px 0;
        color: var(--text-color);
        text-align: center;
    }

    .annual-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-radius: var(--border-radius);
        background: var(--bg-color);
    }

    .stat-item.income .stat-value {
        color: var(--primary-color);
    }

    .stat-item.expense .stat-value {
        color: var(--danger-color);
    }

    .stat-item.balance {
        font-weight: bold;
        transition: all 0.3s ease;
    }

    .stat-item.balance.positive {
        background: rgba(46, 204, 113, 0.1);
        border: 1px solid var(--primary-color);
    }

    .stat-item.balance.negative {
        background: rgba(231, 76, 60, 0.1);
        border: 1px solid var(--danger-color);
    }

    .stat-item.balance.positive .stat-value {
        color: var(--primary-color);
    }

    .stat-item.balance.negative .stat-value {
        color: var(--danger-color);
    }

    .stat-label {
        font-weight: 500;
    }

    .stat-value {
        font-weight: bold;
    }
`;

// Agregar los estilos al documento
style.textContent += annualStyles;

// Agregar event listeners para los filtros de fecha
dateFilterType.addEventListener('change', function () {
    customDateFilter.style.display = this.value === 'custom' ? 'grid' : 'none';
    monthFilter.style.display = this.value === 'month' ? 'grid' : 'none';
    updateUI();
});

startDate.addEventListener('change', () => updateUI());
endDate.addEventListener('change', () => updateUI());
specificMonth.addEventListener('change', () => updateUI());

// Agregar esta función para editar transacciones
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Llenar el formulario con los datos de la transacción
    transactionTypeSelect.value = transaction.type;
    descriptionInput.value = transaction.description;
    amountInput.value = transaction.amount;
    categorySelect.value = transaction.category;
    transactionDateInput.value = new Date(transaction.date).toISOString().split('T')[0];

    // Eliminar la transacción original para evitar duplicados
    deleteTransaction(id);
}

// Objeto con las traducciones
const translations = {
    es: {
        appTitle: "Control de Gastos",
        totalBalance: "Balance Total",
        income: "Ingresos",
        expense: "Gastos",
        monthlyHistory: "Historial por Mes",
        transactionHistory: "Historial de Transacciones",
        allCategories: "Todas las categorías",
        allTypes: "Todos los tipos",
        monthlySummary: "Resumen del Mes",
        monthlyIncome: "Ingresos del Mes",
        monthlyExpense: "Gastos del Mes",
        monthlyBalance: "Balance del Mes",
        newTransaction: "Nueva Transacción",
        transactionType: "Tipo de Transacción",
        selectType: "Seleccione tipo",
        description: "Descripción",
        amount: "Monto",
        date: "Fecha",
        category: "Categoría",
        selectCategory: "Seleccione categoría",
        addTransaction: "Agregar Transacción",
        frequentTransactions: "Transacciones Frecuentes",
        selectOrCreate: "Seleccione o cree nueva",
        frequentIncomes: "Ingresos Frecuentes",
        frequentExpenses: "Gastos Frecuentes",
        salary: "Salario",
        business: "Negocio",
        investments: "Inversiones",
        extras: "Extras",
        housing: "Vivienda",
        food: "Alimentación",
        transport: "Transporte",
        services: "Servicios",
        entertainment: "Entretenimiento",
        healthcare: "Salud",
        education: "Educación",
        shopping: "Compras",
        allHistory: "Todo el historial",
        customRange: "Rango personalizado",
        specificMonth: "Mes específico",
        lastWeek: "Última semana",
        today: "Hoy",
        to: "hasta",
        edit: "Editar",
        delete: "Eliminar",
        annualSummary: "Resumen Anual Total",
        totalIncome: "Ingresos Totales",
        totalExpense: "Gastos Totales",
        totalBalance: "Balance Total",
        enterPositiveAmount: "Ingrese el monto en positivo",
        selectDate: "Seleccione la fecha de la transacción",
        recurringPayments: "Pagos Recurrentes",
        newRecurringPayment: "Nuevo Pago Recurrente",
        configureRecurringPayment: "Configurar Pago Recurrente",
        frequency: "Frecuencia",
        monthly: "Mensual",
        biweekly: "Quincenal",
        weekly: "Semanal",
        dayOfMonth: "Día del mes",
        reminder: "Recordatorio (días antes)",
        save: "Guardar",
        pendingReminders: "Recordatorios Pendientes",
        confirmDelete: "¿Está seguro de que desea eliminar este pago recurrente?",
        recurringPaymentSaved: "Se ha guardado correctamente el pago recurrente",
        recurringPaymentDeleted: "El pago recurrente ha sido eliminado",
        incomeCategories: "Categorías de Ingresos",
        expenseCategories: "Categorías de Gastos",
        saveAsPreset: "Guardar como preset",
        confirmDeleteTransaction: "¿Está seguro de que desea eliminar esta transacción?",
        transactionDeleted: "Transacción eliminada correctamente",
        transactionAdded: "Transacción agregada correctamente",
        transactionEdited: "Transacción editada correctamente",
        close: "Cerrar",
        cancel: "Cancelar",
        loading: "Cargando...",
        noTransactions: "No hay transacciones para mostrar",
        filterByDate: "Filtrar por fecha",
        filterByType: "Filtrar por tipo",
        filterByCategory: "Filtrar por categoría",
        freelance: "Trabajo Freelance",
        rent: "Alquiler",
        bonus: "Bono",
        rentExpense: "Alquiler/Hipoteca",
        utilities: "Servicios (Luz/Agua/Gas)",
        groceries: "Supermercado",
        internet: "Internet/Teléfono",
        clothing: "Ropa",
        restaurants: "Restaurantes",
        expenseType: "Gasto",
        incomeType: "Ingreso",
        days: "días",
        hours: "horas",
        minutes: "minutos",
        selectValidDay: "Seleccione un día válido (1-31)",
        configureReminder: "Configura cuándo quieres recibir el recordatorio antes del pago",
        recurringPaymentReminder: "Recordatorio de Pago Recurrente",
        nextPayment: "Próximo pago",
        timeRemaining: "Tiempo restante",
        understood: "Entendido",
        recurringPaymentExecuted: "Se ha ejecutado el pago recurrente",
        confirmAction: "Confirmar Acción",
        confirm: "Confirmar",
        cancel: "Cancelar",
        copyright: "Todos los derechos reservados"
    },
    en: {
        appTitle: "Expense Tracker",
        totalBalance: "Total Balance",
        income: "Income",
        expense: "Expenses",
        monthlyHistory: "Monthly History",
        transactionHistory: "Transaction History",
        allCategories: "All categories",
        allTypes: "All types",
        monthlySummary: "Monthly Summary",
        monthlyIncome: "Monthly Income",
        monthlyExpense: "Monthly Expenses",
        monthlyBalance: "Monthly Balance",
        newTransaction: "New Transaction",
        transactionType: "Transaction Type",
        selectType: "Select type",
        description: "Description",
        amount: "Amount",
        date: "Date",
        category: "Category",
        selectCategory: "Select category",
        addTransaction: "Add Transaction",
        frequentTransactions: "Frequent Transactions",
        selectOrCreate: "Select or create new",
        frequentIncomes: "Frequent Incomes",
        frequentExpenses: "Frequent Expenses",
        salary: "Salary",
        business: "Business",
        investments: "Investments",
        extras: "Extras",
        housing: "Housing",
        food: "Food",
        transport: "Transport",
        services: "Services",
        entertainment: "Entertainment",
        healthcare: "Healthcare",
        education: "Education",
        shopping: "Shopping",
        allHistory: "All History",
        customRange: "Custom Range",
        specificMonth: "Specific Month",
        lastWeek: "Last Week",
        today: "Today",
        to: "to",
        edit: "Edit",
        delete: "Delete",
        annualSummary: "Annual Summary",
        totalIncome: "Total Income",
        totalExpense: "Total Expenses",
        totalBalance: "Total Balance",
        enterPositiveAmount: "Enter a positive amount",
        selectDate: "Select transaction date",
        recurringPayments: "Recurring Payments",
        newRecurringPayment: "New Recurring Payment",
        configureRecurringPayment: "Configure Recurring Payment",
        frequency: "Frequency",
        monthly: "Monthly",
        biweekly: "Biweekly",
        weekly: "Weekly",
        dayOfMonth: "Day of month",
        reminder: "Reminder (days before)",
        save: "Save",
        pendingReminders: "Pending Reminders",
        confirmDelete: "Are you sure you want to delete this recurring payment?",
        recurringPaymentSaved: "Recurring payment has been saved successfully",
        recurringPaymentDeleted: "Recurring payment has been deleted",
        incomeCategories: "Income Categories",
        expenseCategories: "Expense Categories",
        saveAsPreset: "Save as preset",
        confirmDeleteTransaction: "Are you sure you want to delete this transaction?",
        transactionDeleted: "Transaction deleted successfully",
        transactionAdded: "Transaction added successfully",
        transactionEdited: "Transaction edited successfully",
        close: "Close",
        cancel: "Cancel",
        loading: "Loading...",
        noTransactions: "No transactions to show",
        filterByDate: "Filter by date",
        filterByType: "Filter by type",
        filterByCategory: "Filter by category",
        freelance: "Freelance Work",
        rent: "Rent",
        bonus: "Bonus",
        rentExpense: "Rent/Mortgage",
        utilities: "Utilities (Power/Water/Gas)",
        groceries: "Groceries",
        internet: "Internet/Phone",
        clothing: "Clothing",
        restaurants: "Restaurants",
        expenseType: "Expense",
        incomeType: "Income",
        days: "days",
        hours: "hours",
        minutes: "minutes",
        selectValidDay: "Select a valid day (1-31)",
        configureReminder: "Configure when you want to receive the reminder before payment",
        recurringPaymentReminder: "Recurring Payment Reminder",
        nextPayment: "Next payment",
        timeRemaining: "Time remaining",
        understood: "Understood",
        recurringPaymentExecuted: "Recurring payment has been executed",
        confirmAction: "Confirm Action",
        confirm: "Confirm",
        cancel: "Cancel",
        copyright: "All rights reserved"
    }
};

// Función para cambiar el idioma
function toggleLanguage() {
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';
    const newLang = currentLang === 'es' ? 'en' : 'es';
    const langText = document.querySelector('.lang-text');

    document.documentElement.setAttribute('data-lang', newLang);
    langText.textContent = newLang.toUpperCase();
    localStorage.setItem('language', newLang);

    updateUILanguage(newLang);
}

// Función para actualizar el idioma en la UI
function updateUILanguage(lang) {
    // Actualizar elementos estáticos
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Actualizar elementos dinámicos
    updateUI();
    updateMonthlyStats();
    generateMonthlyHistory();

    // Actualizar opciones de selección
    updateSelectOptions(lang);
}

function updateSelectOptions(lang) {
    // Actualizar opciones de filtros y categorías
    const elements = document.querySelectorAll('option[data-translate], optgroup[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            if (element.tagName === 'OPTGROUP') {
                element.label = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Actualizar las categorías en el formulario principal y en pagos recurrentes
    updateCategoryLabels(lang);
}

function updateCategoryLabels(lang) {
    // Actualizar etiquetas de los optgroup
    document.querySelectorAll('optgroup').forEach(group => {
        if (group.getAttribute('data-translate')) {
            const key = group.getAttribute('data-translate');
            if (translations[lang][key]) {
                group.label = translations[lang][key];
            }
        }
    });

    // Actualizar opciones individuales
    document.querySelectorAll('option[data-translate]').forEach(option => {
        const key = option.getAttribute('data-translate');
        if (translations[lang][key]) {
            option.textContent = translations[lang][key];
        }
    });
}

// Función para inicializar el idioma
function initializeLanguage() {
    const savedLang = localStorage.getItem('language') || 'es';
    const langText = document.querySelector('.lang-text');

    document.documentElement.setAttribute('data-lang', savedLang);
    langText.textContent = savedLang.toUpperCase();
    updateUILanguage(savedLang);
}

// Agregar al DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    // ... código existente ...
    initializeLanguage();

    // Agregar event listener para el botón de idioma
    const languageToggle = document.querySelector('.language-toggle');
    languageToggle.addEventListener('click', toggleLanguage);
});

// Modificar la estructura de los pagos recurrentes
function saveRecurringPayment(e) {
    e.preventDefault();

    const recurringForm = document.getElementById('recurringForm');
    const type = document.getElementById('recurring-type').value;
    const description = document.getElementById('recurring-description').value.trim();
    const amount = parseFloat(document.getElementById('recurring-amount').value);
    const category = document.getElementById('recurring-category').value;
    const frequency = document.getElementById('recurring-frequency').value;
    const day = parseInt(document.getElementById('recurring-day').value);
    const reminderDays = parseInt(document.getElementById('recurring-reminder-days').value) || 0;
    const reminderHours = parseInt(document.getElementById('recurring-reminder-hours').value) || 0;
    const reminderMinutes = parseInt(document.getElementById('recurring-reminder-minutes').value) || 0;

    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

    // Validaciones
    if (!type || !description || !amount || !category || !frequency || !day) {
        alert(translations[currentLang].fillAllFields);
        return;
    }

    if (day < 1 || day > 31) {
        alert(translations[currentLang].selectValidDay);
        return;
    }

    // Convertir todo a minutos para almacenar
    const reminderOffset = (reminderDays * 24 * 60) + (reminderHours * 60) + reminderMinutes;

    const payment = {
        id: recurringForm.dataset.editId ? parseInt(recurringForm.dataset.editId) : Date.now(),
        type,
        description,
        amount: Math.abs(amount),
        category,
        frequency,
        day,
        reminderOffset,
        lastExecuted: null,
        reminderShown: false
    };

    if (recurringForm.dataset.editId) {
        const index = recurringPayments.findIndex(p => p.id === parseInt(recurringForm.dataset.editId));
        if (index !== -1) {
            recurringPayments[index] = payment;
        }
    } else {
        recurringPayments.push(payment);
    }

    localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));
    updateRecurringList();
    closeAndResetModal();

    alert(translations[currentLang].recurringPaymentSaved);
}

// Asegurarnos de que el formulario tenga el event listener correcto
document.getElementById('recurringForm').addEventListener('submit', saveRecurringPayment);

// Función para mostrar el tiempo restante de forma amigable
function formatTimeRemaining(minutes) {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} día${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hora${hours !== 1 ? 's' : ''}`);
    if (mins > 0) parts.push(`${mins} minuto${mins !== 1 ? 's' : ''}`);

    return parts.join(', ');
}

// Función para verificar recordatorios
function checkReminders() {
    const now = new Date();

    recurringPayments.forEach(payment => {
        const nextPaymentDate = calculateNextPaymentDate(payment);
        const reminderTime = new Date(nextPaymentDate.getTime() - (payment.reminderOffset * 60000));
        const timeUntilReminder = Math.floor((reminderTime - now) / 60000);

        if (timeUntilReminder > 0 && timeUntilReminder <= payment.reminderOffset) {
            // Mostrar recordatorio
            const timeRemaining = formatTimeRemaining(timeUntilReminder);
            showReminder(payment, timeRemaining);
        }
    });
}

// Función para mostrar recordatorios
function showReminder(payment, timeRemaining) {
    const reminderHTML = `
        <div class="reminder-item ${timeRemaining <= 60 ? 'urgent' : ''}">
            <div class="reminder-info">
                <h4>${payment.description}</h4>
                <p>Próximo pago: ${formatDate(calculateNextPaymentDate(payment))}</p>
                <p class="reminder-time">Tiempo restante: 
                    <span class="reminder-countdown">${timeRemaining}</span>
                </p>
            </div>
            <div class="reminder-actions">
                <button class="btn-submit" onclick="markReminderAsSeen(${payment.id})">
                    Entendido
                </button>
            </div>
        </div>
    `;

    document.getElementById('remindersList').innerHTML += reminderHTML;
}

// Verificar recordatorios cada minuto
setInterval(checkReminders, 60000);

// Función para calcular la próxima fecha de pago
function calculateNextPaymentDate(payment) {
    const now = new Date();
    const today = now.getDate();

    // Crear fecha para el día especificado en el mes actual
    let nextDate = new Date(now.getFullYear(), now.getMonth(), payment.day);

    // Si el día especificado ya pasó este mes, ir al próximo mes
    if (today > payment.day) {
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, payment.day);
    }

    return nextDate;
}

// Función para verificar y ejecutar pagos recurrentes
function checkRecurringPayments() {
    const now = new Date();
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';

    recurringPayments.forEach(payment => {
        const nextPaymentDate = calculateNextPaymentDate(payment);

        // Solo verificar si no se ha ejecutado hoy
        if (shouldExecutePayment(payment, nextPaymentDate)) {
            // Crear y ejecutar la transacción
            const transaction = {
                id: Date.now(),
                type: payment.type,
                description: payment.description,
                amount: payment.amount,
                category: payment.category,
                date: nextPaymentDate.toISOString(),
                isRecurring: true,
                recurringId: payment.id
            };

            // Actualizar la última ejecución ANTES de agregar la transacción
            payment.lastExecuted = nextPaymentDate.toISOString();
            localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));

            // Agregar la transacción
            transactions.push(transaction);
            localStorage.setItem('transactions', JSON.stringify(transactions));

            // Actualizar la UI
            updateUI();
            updateMonthlyStats();
            generateMonthlyHistory();

            // Mostrar notificación una sola vez
            showNotification(
                translations[currentLang].recurringPaymentReminder,
                `${translations[currentLang].recurringPaymentExecuted}: ${payment.description}`
            );
        }

        // Verificar recordatorios independientemente
        checkRemindersForPayment(payment, nextPaymentDate);
    });
}

// Función para determinar si se debe ejecutar el pago
function shouldExecutePayment(payment, nextPaymentDate) {
    const now = new Date();
    const lastExecuted = payment.lastExecuted ? new Date(payment.lastExecuted) : null;

    // Verificar si ya se ejecutó hoy
    if (lastExecuted) {
        const isSameDay = lastExecuted.getDate() === now.getDate() &&
            lastExecuted.getMonth() === now.getMonth() &&
            lastExecuted.getFullYear() === now.getFullYear();
        if (isSameDay) return false;
    }

    // Verificar si es el día de pago
    const isPaymentDay = nextPaymentDate.getDate() === now.getDate() &&
        nextPaymentDate.getMonth() === now.getMonth() &&
        nextPaymentDate.getFullYear() === now.getFullYear();

    // Solo ejecutar si es el día de pago y no se ha ejecutado hoy
    if (isPaymentDay) {
        payment.reminderShown = false;
        return true;
    }

    return false;
}

// Función para verificar recordatorios de un pago específico
function checkRemindersForPayment(payment, nextPaymentDate) {
    const now = new Date();
    const reminderTime = new Date(nextPaymentDate.getTime() - (payment.reminderOffset * 60000));
    const timeUntilReminder = Math.floor((reminderTime - now) / 60000);

    // Solo mostrar recordatorio si no se ha mostrado antes y estamos en el rango
    if (!payment.reminderShown && timeUntilReminder >= 0 && timeUntilReminder <= payment.reminderOffset) {
        showReminder(payment, timeUntilReminder);
        // Marcar el recordatorio como mostrado
        payment.reminderShown = true;
        localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));
    }
}

// Modificar la función showReminder para mostrar notificaciones del sistema
function showReminder(payment, timeUntilReminder) {
    const currentLang = document.documentElement.getAttribute('data-lang') || 'es';
    const timeRemaining = formatTimeRemaining(timeUntilReminder);

    // Mostrar notificación del sistema si está soportado
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(translations[currentLang].recurringPaymentReminder, {
                    body: `${payment.description}: ${timeRemaining}`,
                    icon: '/path/to/icon.png' // Agregar un ícono si lo tienes
                });
            }
        });
    }

    // También mostrar en la interfaz
    const reminderHTML = `
        <div class="reminder-item ${timeUntilReminder <= 60 ? 'urgent' : ''}">
            <div class="reminder-info">
                <h4>${payment.description}</h4>
                <p>${translations[currentLang].nextPayment}: ${formatDate(calculateNextPaymentDate(payment))}</p>
                <p class="reminder-time">${translations[currentLang].timeRemaining}: 
                    <span class="reminder-countdown">${timeRemaining}</span>
                </p>
            </div>
            <div class="reminder-actions">
                <button class="btn-submit" onclick="markReminderAsSeen(${payment.id})">
                    ${translations[currentLang].understood}
                </button>
            </div>
        </div>
    `;

    document.getElementById('remindersList').innerHTML += reminderHTML;
    remindersModal.classList.add('show');
}

// Iniciar la verificación de pagos recurrentes y recordatorios
setInterval(checkRecurringPayments, 60000); // Verificar cada minuto

// Reemplazar la función showNotification
function showNotification(title, message) {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = 'app-notification';

    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <div class="notification-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
    `;

    container.appendChild(notification);

    // Forzar un reflow para que la animación funcione
    notification.offsetHeight;

    // Mostrar la notificación
    notification.classList.add('show');

    // Eliminar la notificación después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, 3000);
}

// Actualizar el año automáticamente en el footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

// Agregar al inicio del archivo
window.addEventListener('load', () => {
    const logo = document.querySelector('.footer-logo img');
    console.log('Logo src:', logo.src);
    console.log('Logo complete:', logo.complete);
    console.log('Logo naturalWidth:', logo.naturalWidth);

    logo.onerror = () => {
        console.error('Error loading logo');
    };
});
