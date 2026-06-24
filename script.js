/**
 * SIMULADOR DE CRECIMIENTO POBLACIONAL - MODELO LOGÍSTICO (PUEBLA)
 * Lógica matemática, control de gráficos (Chart.js), navegación y validaciones.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI Components
    initTabs();
    initHistoricalChart();
    initSimulator();
    initMapControls();
});

/* ==========================================================================
   TOAST NOTIFICATION MANAGER (Validaciones Estilizadas)
   ========================================================================== */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Fade out after 4 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}

/* ==========================================================================
   NAVIGATION TABS CONTROL
   ========================================================================== */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTabId = btn.getAttribute('data-tab');

            // Remove active states
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => {
                p.classList.remove('active');
            });

            // Set active states
            btn.classList.add('active');
            const targetPane = document.getElementById(targetTabId);
            targetPane.classList.add('active');

            // Handle MathJax rendering updates when shifting to Tab 3
            if (targetTabId === 'tab-math' && window.MathJax) {
                window.MathJax.typesetPromise();
            }

            // Adjust Canvas responsiveness on view shift
            if (targetTabId === 'tab-overview' && window.historicalChartInstance) {
                window.historicalChartInstance.resize();
            }
            if (targetTabId === 'tab-simulator' && window.simulatorChartInstance) {
                window.simulatorChartInstance.resize();
            }
        });
    });
}

/* ==========================================================================
   TAB 1: HISTORICAL VS PROJECTION CHART (Puebla 1950 - 2080)
   ========================================================================== */
window.historicalChartInstance = null;

function initHistoricalChart() {
    const ctx = document.getElementById('historicalChart');
    if (!ctx) return;

    // Census population data for Puebla (in millions)
    const historicalYears = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
    const historicalPop = [1.625, 1.974, 2.508, 3.279, 4.126, 5.070, 5.780, 6.583];

    // Model parameters fitted for Puebla historical trend (P0 = 1.62M in 1950, K = 9.8M, r = 0.034)
    const P0 = 1.625;
    const K = 9.800;
    const r = 0.034;
    const baseYear = 1950;

    // Generate logistic curve data from 1950 to 2080
    const projectionYears = [];
    const projectionPop = [];

    for (let year = 1950; year <= 2080; year += 5) {
        projectionYears.push(year);
        const t = year - baseYear;
        // Logistic Formula: P(t) = K / (1 + ((K - P0) / P0) * e^(-r*t))
        const p_t = K / (1 + ((K - P0) / P0) * Math.exp(-r * t));
        projectionPop.push(p_t);
    }

    // Chart.js Configuration
    window.historicalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: projectionYears,
            datasets: [
                {
                    label: 'Censo Histórico (INEGI)',
                    data: historicalYears.map((yr, idx) => ({ x: yr, y: historicalPop[idx] })),
                    backgroundColor: '#10B981',
                    borderColor: '#10B981',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false,
                    type: 'scatter',
                    zIndex: 10
                },
                {
                    label: 'Ajuste y Proyección Modelo Logístico',
                    data: projectionPop,
                    borderColor: '#6366F1',
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    fill: true,
                    tension: 0.35,
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#E5E7EB',
                        font: { family: 'Outfit', size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    padding: 12,
                    titleFont: { family: 'Outfit', size: 14, weight: 'bold' },
                    bodyFont: { family: 'Inter', size: 12 },
                    callbacks: {
                        label: function(context) {
                            return ` Población: ${context.parsed.y.toFixed(3)} Millones`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 1950,
                    max: 2080,
                    ticks: {
                        color: '#9CA3AF',
                        stepSize: 10,
                        callback: value => value.toString()
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                y: {
                    min: 0,
                    max: 11,
                    ticks: {
                        color: '#9CA3AF',
                        callback: value => value + ' M'
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    title: {
                        display: true,
                        text: 'Habitantes (Millones)',
                        color: '#9CA3AF',
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            }
        }
    });
}

/* ==========================================================================
   TAB 1: MAP INTERACTION CONTROLS
   ========================================================================== */
function initMapControls() {
    const btnHeatmap = document.getElementById('btn-toggle-heatmap');
    const btnMarkers = document.getElementById('btn-toggle-markers');
    const heatmapOverlay = document.getElementById('map-heatmap-overlay');
    const markersOverlay = document.getElementById('map-markers-overlay');

    if (!btnHeatmap || !btnMarkers) return;

    btnHeatmap.addEventListener('click', () => {
        btnHeatmap.classList.toggle('active');
        if (btnHeatmap.classList.contains('active')) {
            heatmapOverlay.classList.remove('display-none');
            // Allow CSS transition to trigger
            setTimeout(() => heatmapOverlay.classList.add('heatmap-active'), 50);
        } else {
            heatmapOverlay.classList.remove('heatmap-active');
            heatmapOverlay.classList.add('display-none');
        }
    });

    btnMarkers.addEventListener('click', () => {
        btnMarkers.classList.toggle('active');
        if (btnMarkers.classList.contains('active')) {
            markersOverlay.classList.remove('display-none');
            setTimeout(() => markersOverlay.classList.add('markers-active'), 50);
        } else {
            markersOverlay.classList.remove('markers-active');
            markersOverlay.classList.add('display-none');
        }
    });
}

/* ==========================================================================
   TAB 2: INTERACTIVE SIMULATOR (Calculators and Plots)
   ========================================================================== */
window.simulatorChartInstance = null;

function initSimulator() {
    const formForward = document.getElementById('form-forward');
    const formReverse = document.getElementById('form-reverse');
    
    if (!formForward || !formReverse) return;

    // Default calculations on startup
    calculateForwardAndRender();

    // Event listener: Forward calculator
    formForward.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateForwardAndRender();
    });

    // Event listener: Reverse calculator
    formReverse.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateReverse();
    });
}

/**
 * Validations helper
 * Checks fields values and applies warning visual indicators + notification popups
 */
function validateInputs(p0, k, r, t, target = null) {
    let isValid = true;
    
    // Clear previous states
    document.querySelectorAll('input').forEach(i => i.classList.remove('invalid'));

    if (p0 <= 0) {
        document.getElementById('input-p0').classList.add('invalid');
        showToast('La población inicial P0 debe ser un valor mayor a cero.', 'error');
        isValid = false;
    }
    if (k <= 0) {
        document.getElementById('input-k').classList.add('invalid');
        showToast('La capacidad de carga K debe ser mayor a cero.', 'error');
        isValid = false;
    }
    if (r <= 0 || r > 1) {
        document.getElementById('input-r').classList.add('invalid');
        showToast('La tasa de crecimiento r debe estar en formato decimal (ej: entre 0.001 y 1.0).', 'error');
        isValid = false;
    }
    if (t < 0) {
        document.getElementById('input-t').classList.add('invalid');
        showToast('El tiempo de proyección no puede ser negativo.', 'error');
        isValid = false;
    }
    
    // Cross-parameters validation
    if (p0 >= k) {
        document.getElementById('input-p0').classList.add('invalid');
        document.getElementById('input-k').classList.add('invalid');
        showToast('La población inicial P0 no puede ser mayor o igual a la capacidad de carga K.', 'error');
        isValid = false;
    }

    if (target !== null) {
        const inputTarget = document.getElementById('input-p-target');
        if (target <= p0) {
            inputTarget.classList.add('invalid');
            showToast('La población objetivo debe ser estrictamente mayor a la población inicial P0.', 'error');
            isValid = false;
        }
        if (target >= k) {
            inputTarget.classList.add('invalid');
            showToast('La población objetivo no puede alcanzar ni superar la capacidad de carga K (asíntota horizontal).', 'error');
            isValid = false;
        }
    }

    return isValid;
}

/**
 * Calculador Directo:
 * P(t) = K / (1 + ((K - P0) / P0) * e^(-r*t))
 */
function calculateForwardAndRender() {
    const p0 = parseFloat(document.getElementById('input-p0').value);
    const k = parseFloat(document.getElementById('input-k').value);
    const r = parseFloat(document.getElementById('input-r').value);
    const t = parseFloat(document.getElementById('input-t').value);

    // Validation
    if (!validateInputs(p0, k, r, t)) return;

    // Mathematical Calculation
    const exponentialFactor = Math.exp(-r * t);
    const p_t = k / (1 + ((k - p0) / p0) * exponentialFactor);

    // Show Results in UI
    const outputBox = document.getElementById('forward-output');
    outputBox.classList.remove('display-none');
    
    document.getElementById('result-p-t').innerText = p_t.toFixed(3);
    document.getElementById('result-years').innerText = t;
    
    // Relative growths
    const percentageGrow = ((p_t - p0) / p0) * 100;
    document.getElementById('result-percentage').innerText = percentageGrow.toFixed(1) + '%';
    
    const pctK = (p_t / k) * 100;
    document.getElementById('result-pct-k').innerText = pctK.toFixed(1) + '%';

    // Build the dynamic sigmoid projection chart
    updateSimulatorChart(p0, k, r, t, p_t);
    showToast('Proyección poblacional calculada con éxito.', 'success');
}

/**
 * Calculador Inverso:
 * t = -Math.log(((K / P_target) - 1) / ((K - P0) / P0)) / r
 */
function calculateReverse() {
    const p0 = parseFloat(document.getElementById('input-p0').value);
    const k = parseFloat(document.getElementById('input-k').value);
    const r = parseFloat(document.getElementById('input-r').value);
    const pTarget = parseFloat(document.getElementById('input-p-target').value);

    // Validation including the target value
    if (!validateInputs(p0, k, r, 0, pTarget)) return;

    // Mathematical Calculation
    const logNumerator = (k / pTarget) - 1;
    const logDenominator = (k - p0) / p0;
    const tTarget = -Math.log(logNumerator / logDenominator) / r;

    // Show Results in UI
    const outputBox = document.getElementById('reverse-output');
    outputBox.classList.remove('display-none');

    document.getElementById('result-t-target').innerText = tTarget.toFixed(2);
    showToast('Tiempo estimado para población objetivo calculado.', 'success');

    // Also update simulator chart to highlight this target projection
    updateSimulatorChart(p0, k, r, tTarget, pTarget);
}

/**
 * Update Simulator Chart
 * Renders the logistic growth sigmoidal curve and asymptote
 */
function updateSimulatorChart(p0, k, r, activeT, activeP) {
    const ctx = document.getElementById('simulatorChart');
    if (!ctx) return;

    // Determine planning window (X-axis limits)
    // We extend the plot to show asymptotes nicely: up to 2.5 times the target time, or at least 80 years
    const maxTimePlot = Math.max(activeT * 2, 80);
    const timeSteps = [];
    const populationCurve = [];
    const asymptoteLine = [];

    for (let time = 0; time <= maxTimePlot; time += maxTimePlot / 50) {
        timeSteps.push(parseFloat(time.toFixed(1)));
        const p_val = k / (1 + ((k - p0) / p0) * Math.exp(-r * time));
        populationCurve.push(p_val);
        asymptoteLine.push(k);
    }

    // Scatter points for visualization
    const scatterPoints = [
        { x: 0, y: p0, label: 'Inicio (P0)' },
        { x: activeT, y: activeP, label: 'Resultado (P(t))' }
    ];

    if (window.simulatorChartInstance) {
        window.simulatorChartInstance.destroy();
    }

    window.simulatorChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeSteps,
            datasets: [
                {
                    label: 'Capacidad de Carga K (Asíntota)',
                    data: asymptoteLine,
                    borderColor: 'rgba(239, 68, 68, 0.75)',
                    borderWidth: 2,
                    borderDash: [6, 6],
                    pointRadius: 0,
                    fill: false
                },
                {
                    label: 'Curva Sigmoidea de Población',
                    data: populationCurve,
                    borderColor: '#6366F1',
                    borderWidth: 3,
                    backgroundColor: 'rgba(99, 102, 241, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0
                },
                {
                    label: 'Puntos de Referencia',
                    data: scatterPoints,
                    backgroundColor: '#10B981',
                    borderColor: '#FFFFFF',
                    borderWidth: 1.5,
                    pointRadius: 7,
                    pointHoverRadius: 9,
                    type: 'scatter',
                    zIndex: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // We use our custom overlay legends to keep UI clean
                },
                tooltip: {
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            if (context.dataset.type === 'scatter') {
                                const pt = scatterPoints[context.dataIndex];
                                return ` ${pt.label}: t = ${context.parsed.x.toFixed(1)} años, P = ${context.parsed.y.toFixed(3)} M`;
                            }
                            return ` Año: ${context.parsed.x.toFixed(1)}, Población: ${context.parsed.y.toFixed(3)} M`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    max: parseFloat(maxTimePlot.toFixed(1)),
                    ticks: { color: '#9CA3AF' },
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    title: {
                        display: true,
                        text: 'Tiempo transcurrido (t en años)',
                        color: '#9CA3AF',
                        font: { family: 'Outfit', size: 12 }
                    }
                },
                y: {
                    min: 0,
                    max: parseFloat((k * 1.15).toFixed(1)), // Give 15% head room above carrying capacity
                    ticks: { color: '#9CA3AF' },
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    title: {
                        display: true,
                        text: 'Población (Millones)',
                        color: '#9CA3AF',
                        font: { family: 'Outfit', size: 12 }
                    }
                }
            }
        }
    });
}
