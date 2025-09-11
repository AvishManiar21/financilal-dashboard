// Financial Dashboard JavaScript
const lightVibrantPalette = ['#ff6361', '#bc5090', '#58508d', '#ffa600', '#0070c0', '#42a5f5', '#66bb6a', '#ffb74d'];
const darkVibrantPalette = ['#ff9c74', '#e63946', '#a8dadc', '#457b9d', '#f4a261', '#2a9d8f', '#e76f51', '#f77f00'];

let currentPalette = lightVibrantPalette;

let allCompanies = [];
let currentPage = 1;
let itemsPerPage = 20;
let totalPages = 1;

let availableMetrics = [
    { id: 'price', name: 'Price ($)' },
    { id: 'peRatio', name: 'P/E Ratio' },
    { id: 'dividendYield', name: 'Dividend Yield' },
    { id: 'marketCap', name: 'Market Cap' },
    { id: 'ebitda', name: 'EBITDA' },
    { id: 'priceSales', name: 'Price/Sales' },
    { id: 'priceBook', name: 'Price/Book' },
];

let userId = null;
let userWatchlist = [];
let sortColumn = null;
let sortDirection = 'asc';
let charts = {};
window.filteredCompanies = [];

// DOM Elements
let analysisModal, analysisTitle, analysisText, loadingSpinner, tableBody, watchlistTableBody;
let sectorFilter, companySearch, priceMaxInput, peMaxInput;
let avgPeEl, maxMarketCapEl, maxDividendYieldEl, avgPriceSalesEl, totalWatchlistValueEl;
let themeToggle, refreshData, dataStatus, lastUpdated, xAxisSelect, yAxisSelect, ratiosSection, ratiosList, swotSection, swotList;
// ML UI elements
let btnRunCluster, btnRunRegression, btnRunAnomalies, anomaliesListEl;
let paginationContainer, prevPageBtn, nextPageBtn, pageInfo;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        showLoadingState();
        initializeElements();
        setupEventListeners();
        loadKaggleData();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        hideLoadingState();
    }
});

function showLoadingState() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
}

function hideLoadingState() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
        loadingState.classList.add('hidden');
    }
}

// Load Kaggle data directly
async function loadKaggleData() {
    try {
        updateDataStatus('Loading Kaggle dataset...', 'loading');
        console.log('Loading Kaggle financial data...');
        const response = await fetch('/api/companies');
        const result = await response.json();
        
        if (result.success) {
            allCompanies = result.data;
            console.log(`Loaded ${allCompanies.length} companies from Kaggle financials dataset`);
            populateFilters();
            filterAndRender();
            hideLoadingState();
            updateDataStatus(`Loaded ${allCompanies.length} companies with financial data`, 'success');
            updateLastUpdated(result.timestamp);
            console.log('Dashboard initialized successfully with Kaggle financial data');
        } else {
            throw new Error(result.message || 'Failed to load data');
        }
    } catch (error) {
        console.error('Error loading Kaggle data:', error);
        updateDataStatus('Failed to load data', 'error');
        hideLoadingState();
    }
}

// Refresh Kaggle data
async function refreshKaggleData() {
    try {
        updateDataStatus('Refreshing data...', 'loading');
        refreshData.style.animation = 'spin 1s linear infinite';
        
        const response = await fetch('/api/companies');
        const result = await response.json();
        
        if (result.success) {
            allCompanies = result.data;
            populateFilters();
            filterAndRender();
            updateDataStatus('Data refreshed', 'success');
            updateLastUpdated(result.timestamp);
            console.log('Data refreshed successfully');
        } else {
            throw new Error(result.message || 'Failed to refresh data');
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
        updateDataStatus('Refresh failed', 'error');
    } finally {
        refreshData.style.animation = '';
    }
}

// Update data status indicator
function updateDataStatus(message, type) {
    if (dataStatus) {
        dataStatus.textContent = message;
        dataStatus.className = `status-${type}`;
    }
}

// Update last updated timestamp
function updateLastUpdated(timestamp) {
    if (lastUpdated && timestamp) {
        const date = new Date(timestamp);
        lastUpdated.textContent = `Last updated: ${date.toLocaleTimeString()}`;
    }
}


function initializeElements() {
    analysisModal = document.getElementById('analysis-modal');
    analysisTitle = document.getElementById('analysis-title');
    analysisText = document.getElementById('analysis-text');
    loadingSpinner = document.getElementById('loading-spinner');
    tableBody = document.getElementById('companies-table-body');
    watchlistTableBody = document.getElementById('watchlist-table-body');
    sectorFilter = document.getElementById('sectorFilter');
    companySearch = document.getElementById('companySearch');
    priceMaxInput = document.getElementById('priceMax');
    peMaxInput = document.getElementById('peMax');
    avgPeEl = document.getElementById('avg-pe');
    maxMarketCapEl = document.getElementById('max-market-cap');
    maxDividendYieldEl = document.getElementById('max-dividend-yield');
    avgPriceSalesEl = document.getElementById('avg-price-sales');
    totalWatchlistValueEl = document.getElementById('total-watchlist-value');
    themeToggle = document.getElementById('themeToggle');
    refreshData = document.getElementById('refreshData');
    dataStatus = document.getElementById('dataStatus');
    lastUpdated = document.getElementById('lastUpdated');
    xAxisSelect = document.getElementById('x-axis-select');
    yAxisSelect = document.getElementById('y-axis-select');
    ratiosSection = document.getElementById('ratios-section');
    ratiosList = document.getElementById('ratios-list');
    swotSection = document.getElementById('swot-section');
    swotList = document.getElementById('swot-list');
    paginationContainer = document.getElementById('pagination-container');
    prevPageBtn = document.getElementById('prev-page-btn');
    nextPageBtn = document.getElementById('next-page-btn');
    pageInfo = document.getElementById('page-info');
    // ML
    btnRunCluster = document.getElementById('btnRunCluster');
    btnRunRegression = document.getElementById('btnRunRegression');
    btnRunAnomalies = document.getElementById('btnRunAnomalies');
    anomaliesListEl = document.getElementById('anomaliesList');
    
    // Check if all required elements exist
    const requiredElements = [
        analysisModal, analysisTitle, analysisText, loadingSpinner, tableBody, watchlistTableBody,
        sectorFilter, companySearch, priceMaxInput, peMaxInput, avgPeEl, maxMarketCapEl,
        maxDividendYieldEl, avgPriceSalesEl, totalWatchlistValueEl, themeToggle, refreshData,
        dataStatus, lastUpdated, xAxisSelect, yAxisSelect, ratiosSection, ratiosList, swotSection, swotList
    ];
    
    const missingElements = requiredElements.filter(el => !el);
    if (missingElements.length > 0) {
        console.warn('Some required elements not found:', missingElements.length);
    }
}

function setupEventListeners() {
    sectorFilter.addEventListener('change', filterAndRender);
    companySearch.addEventListener('input', filterAndRender);
    priceMaxInput.addEventListener('input', filterAndRender);
    peMaxInput.addEventListener('input', filterAndRender);
    
    themeToggle.addEventListener('click', toggleTheme);
    refreshData.addEventListener('click', refreshKaggleData);
    
    window.toggleFavorite = toggleFavorite;
    window.sortTable = sortTable;
    window.analyzeCompany = analyzeCompany;
    window.closeModal = closeModal;
    window.clearFilters = clearFilters;
    window.updateDynamicCorrelationChart = updateDynamicCorrelationChart;

    // ML buttons
    btnRunCluster?.addEventListener('click', runClustering);
    btnRunRegression?.addEventListener('click', runRegression);
    btnRunAnomalies?.addEventListener('click', runAnomalies);
}

function populateFilters() {
    const sectors = [...new Set(allCompanies.map(c => c.sector))].sort();
    sectors.forEach(sector => {
        const option = document.createElement('option');
        option.value = sector;
        option.textContent = sector;
        sectorFilter.appendChild(option);
    });
    
    const selects = [xAxisSelect, yAxisSelect];
    selects.forEach(select => {
        select.innerHTML = '';
        availableMetrics.forEach(metric => {
            const option = document.createElement('option');
            option.value = metric.id;
            option.textContent = metric.name;
            select.appendChild(option);
        });
    });
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    currentPalette = isDark ? lightVibrantPalette : darkVibrantPalette;
    updateAllCharts(window.filteredCompanies);
}

function toggleFavorite(symbol) {
    const companyIndex = userWatchlist.findIndex(c => c.symbol === symbol);
    if (companyIndex > -1) {
        userWatchlist.splice(companyIndex, 1);
    } else {
        const company = allCompanies.find(c => c.symbol === symbol);
        if (company) {
            userWatchlist.push(company);
        }
    }
    renderWatchlist();
    filterAndRender();
}

function renderWatchlist() {
    watchlistTableBody.innerHTML = '';
    let totalValue = 0;
    if (userWatchlist.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="p-4 text-center">Your watchlist is empty. Add companies from the table below.</td>`;
        watchlistTableBody.appendChild(row);
    } else {
        userWatchlist.forEach(company => {
            const row = document.createElement('tr');
            row.className = 'border-b transition-all table-row-hover';
            const isFavorite = userWatchlist.some(fav => fav.symbol === company.symbol);
            const starIcon = isFavorite ? '⭐' : '☆';
            row.innerHTML = `
                <td class="p-4"><button onclick="window.toggleFavorite('${company.symbol}')">${starIcon}</button></td>
                <td class="p-4">${company.symbol}</td>
                <td class="p-4">${company.name}</td>
                <td class="p-4">${company.sector}</td>
                <td class="p-4">$${company.price.toFixed(2)}</td>
                <td class="p-4">${company.peRatio.toFixed(2)}</td>
                <td class="p-4">$${(company.marketCap / 1e9).toFixed(1)}B</td>
            `;
            watchlistTableBody.appendChild(row);
            totalValue += company.marketCap;
        });
    }
    totalWatchlistValueEl.textContent = `$${(totalValue / 1e9).toFixed(1)}B`;
}

function sortTable(column, type, listType = 'all') {
    let companiesToSort = (listType === 'all') ? window.filteredCompanies : userWatchlist;
    
    if (sortColumn === column) {
        sortDirection = (sortDirection === 'asc') ? 'desc' : 'asc';
    } else {
        sortDirection = 'asc';
        sortColumn = column;
    }
    
    companiesToSort.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];

        if (type === 'string') {
            return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (type === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
    });

    document.querySelectorAll('th span').forEach(span => span.textContent = '');
    const sortIcon = document.getElementById(`${column}-sort-icon`);
    if (sortIcon) {
        sortIcon.textContent = sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    
    if (listType === 'all') {
        renderTable(companiesToSort);
    } else {
        renderWatchlist();
    }
}

function analyzeCompany(symbol) {
    const company = allCompanies.find(c => c.symbol === symbol);
    if (!company) return;

    analysisTitle.textContent = `Analysis: ${company.name} (${company.symbol})`;
    analysisText.textContent = '';
    ratiosList.innerHTML = '';
    swotList.innerHTML = '';
    ratiosSection.style.display = 'none';
    swotSection.style.display = 'none';
    loadingSpinner.style.display = 'block';
    analysisModal.style.display = 'flex';

    // Real analysis with insights
    setTimeout(() => {
        // Calculate relative performance metrics
        const sectorCompanies = allCompanies.filter(c => c.sector === company.sector);
        const sectorAvgPE = sectorCompanies.reduce((sum, c) => sum + c.peRatio, 0) / sectorCompanies.length;
        const sectorAvgPriceSales = sectorCompanies.reduce((sum, c) => sum + c.priceSales, 0) / sectorCompanies.length;
        const sectorAvgDividend = sectorCompanies.reduce((sum, c) => sum + c.dividendYield, 0) / sectorCompanies.length;
        
        // Performance indicators
        const pePerformance = company.peRatio < sectorAvgPE ? 'Undervalued' : company.peRatio > sectorAvgPE * 1.5 ? 'Overvalued' : 'Fairly Valued';
        const dividendPerformance = company.dividendYield > sectorAvgDividend * 1.5 ? 'High Dividend' : company.dividendYield < sectorAvgDividend * 0.5 ? 'Low Dividend' : 'Average Dividend';
        const marketCapTier = company.marketCap > 200e9 ? 'Large Cap' : company.marketCap > 10e9 ? 'Mid Cap' : 'Small Cap';
        
        // Risk assessment
        const riskLevel = company.peRatio > 30 ? 'High' : company.peRatio < 15 ? 'Low' : 'Medium';
        const volatilityRisk = company.priceSales > 5 ? 'High' : company.priceSales < 2 ? 'Low' : 'Medium';
        
        // Investment recommendation
        let recommendation = 'Hold';
        let recommendationColor = 'yellow';
        if (company.peRatio < sectorAvgPE * 0.8 && company.dividendYield > sectorAvgDividend) {
            recommendation = 'Strong Buy';
            recommendationColor = 'green';
        } else if (company.peRatio < sectorAvgPE && company.dividendYield > 0) {
            recommendation = 'Buy';
            recommendationColor = 'green';
        } else if (company.peRatio > sectorAvgPE * 1.5) {
            recommendation = 'Sell';
            recommendationColor = 'red';
        }
        
        analysisText.innerHTML = `
            <div class="space-y-6">
                <!-- Company Overview -->
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h3 class="font-bold text-xl text-blue-900 mb-4 flex items-center">
                        <span class="mr-2">🏢</span> Company Overview
                    </h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Symbol:</strong> ${company.symbol}</div>
                        <div><strong>Sector:</strong> ${company.sector}</div>
                        <div><strong>Market Cap:</strong> $${(company.marketCap / 1e9).toFixed(1)}B (${marketCapTier})</div>
                        <div><strong>Current Price:</strong> $${company.price.toFixed(2)}</div>
                        <div><strong>52W High:</strong> $${company.high52W.toFixed(2)}</div>
                        <div><strong>52W Low:</strong> $${company.low52W.toFixed(2)}</div>
                    </div>
                </div>

                <!-- Financial Metrics -->
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h3 class="font-bold text-xl text-green-900 mb-4 flex items-center">
                        <span class="mr-2">📊</span> Financial Metrics
                    </h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>P/E Ratio:</strong> ${company.peRatio.toFixed(2)} (${pePerformance})</div>
                        <div><strong>Dividend Yield:</strong> ${(company.dividendYield * 100).toFixed(2)}% (${dividendPerformance})</div>
                        <div><strong>Price/Sales:</strong> ${company.priceSales.toFixed(2)}</div>
                        <div><strong>Price/Book:</strong> ${company.priceBook.toFixed(2)}</div>
                        <div><strong>EBITDA:</strong> $${(company.ebitda / 1e9).toFixed(2)}B</div>
                        <div><strong>Earnings/Share:</strong> $${company.earningsPerShare.toFixed(2)}</div>
                    </div>
                </div>

                <!-- Sector Comparison -->
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <h3 class="font-bold text-xl text-purple-900 mb-4 flex items-center">
                        <span class="mr-2">📈</span> Sector Comparison
                    </h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>P/E Ratio vs Sector Avg:</span>
                            <span class="${company.peRatio < sectorAvgPE ? 'text-green-600' : 'text-red-600'}">
                                ${company.peRatio.toFixed(2)} vs ${sectorAvgPE.toFixed(2)}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>Price/Sales vs Sector Avg:</span>
                            <span class="${company.priceSales < sectorAvgPriceSales ? 'text-green-600' : 'text-red-600'}">
                                ${company.priceSales.toFixed(2)} vs ${sectorAvgPriceSales.toFixed(2)}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>Dividend Yield vs Sector Avg:</span>
                            <span class="${company.dividendYield > sectorAvgDividend ? 'text-green-600' : 'text-red-600'}">
                                ${(company.dividendYield * 100).toFixed(2)}% vs ${(sectorAvgDividend * 100).toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Risk Assessment -->
                <div class="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                    <h3 class="font-bold text-xl text-orange-900 mb-4 flex items-center">
                        <span class="mr-2">⚠️</span> Risk Assessment
                    </h3>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span>Valuation Risk:</span>
                            <span class="px-2 py-1 rounded text-xs ${riskLevel === 'High' ? 'bg-red-100 text-red-800' : riskLevel === 'Low' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${riskLevel}
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span>Volatility Risk:</span>
                            <span class="px-2 py-1 rounded text-xs ${volatilityRisk === 'High' ? 'bg-red-100 text-red-800' : volatilityRisk === 'Low' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                ${volatilityRisk}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Investment Recommendation -->
                <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                    <h3 class="font-bold text-xl text-indigo-900 mb-4 flex items-center">
                        <span class="mr-2">💡</span> Investment Recommendation
                    </h3>
                    <div class="text-center">
                        <div class="inline-block px-6 py-3 rounded-lg bg-${recommendationColor}-100 text-${recommendationColor}-800 font-bold text-lg">
                            ${recommendation}
                        </div>
                        <p class="mt-2 text-sm text-gray-600">
                            Based on valuation metrics, sector comparison, and risk assessment
                        </p>
                    </div>
                </div>
            </div>
        `;
        loadingSpinner.style.display = 'none';
    }, 1000);
}

function closeModal() {
    analysisModal.style.display = 'none';
}

function clearFilters() {
    sectorFilter.value = '';
    companySearch.value = '';
    priceMaxInput.value = '';
    peMaxInput.value = '';
    filterAndRender();
}

function filterAndRender() {
    const sector = sectorFilter.value;
    const searchTerm = companySearch.value.toLowerCase();
    const priceMax = priceMaxInput.value;
    const peMax = peMaxInput.value;

    let filteredCompanies = allCompanies;

    if (sector) {
        filteredCompanies = filteredCompanies.filter(c => c.sector === sector);
    }
    if (searchTerm) {
        filteredCompanies = filteredCompanies.filter(c => c.symbol.toLowerCase().includes(searchTerm));
    }
    if (priceMax) {
        filteredCompanies = filteredCompanies.filter(c => c.price <= parseFloat(priceMax));
    }
    if (peMax) {
        filteredCompanies = filteredCompanies.filter(c => c.peRatio <= parseFloat(peMax));
    }

    window.filteredCompanies = filteredCompanies;
    currentPage = 1; // Reset to first page when filtering
    totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    
    renderTable(filteredCompanies);
    updatePagination();
    updateAllCharts(filteredCompanies);
}

function renderTable(companies) {
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedCompanies = companies.slice(startIndex, endIndex);
    
    if (paginatedCompanies.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="10" class="p-8 text-center text-gray-500">No companies found</td>`;
        tableBody.appendChild(row);
        return;
    }
    
    paginatedCompanies.forEach(company => {
        const row = document.createElement('tr');
        row.className = 'border-b transition-all table-row-hover';
        const isFavorite = userWatchlist.some(fav => fav.symbol === company.symbol);
        const starIcon = isFavorite ? '⭐' : '☆';
        row.innerHTML = `
            <td class="p-4"><button onclick="window.toggleFavorite('${company.symbol}')">${starIcon}</button></td>
            <td class="p-4">${company.symbol}</td>
            <td class="p-4">${company.name}</td>
            <td class="p-4">${company.sector}</td>
            <td class="p-4">$${company.price.toFixed(2)}</td>
            <td class="p-4">${company.peRatio.toFixed(2)}</td>
            <td class="p-4">${(company.dividendYield * 100).toFixed(2)}%</td>
            <td class="p-4">$${(company.marketCap / 1e9).toFixed(1)}B</td>
            <td class="p-4">$${(company.ebitda / 1e9).toFixed(2)}B</td>
            <td class="p-4">
                <button onclick="window.analyzeCompany('${company.symbol}')" class="bg-accent text-white py-1 px-3 rounded-full text-sm font-semibold hover:bg-opacity-80 transition">📊 Analyze</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateAllCharts(filteredCompanies) {
    try {
        window.filteredCompanies = filteredCompanies;
        
        // Optimize charts for large datasets - limit data points
        const chartData = filteredCompanies.length > 50 ? filteredCompanies.slice(0, 50) : filteredCompanies;
        
        updatePeRatioChart(chartData);
        updateMarketCapEBITDAChart(chartData);
        updateSectorChart(filteredCompanies); // Keep all data for sector distribution
        updatePriceRangeChart(chartData);
        updateBubbleChart(chartData);
        updateDynamicCorrelationChart(chartData);
        updateKPIs(filteredCompanies); // Keep all data for KPIs
        updateNormalizedComparisonChart(chartData);
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

// ML: Run clustering and render on clusterChart (2D projection using marketCap vs peRatio)
async function runClustering() {
    try {
        const payload = { features: ['peRatio','dividendYield','marketCap','priceSales','priceBook','ebitda'], k: 3, limit: 200 };
        const res = await fetch('/api/ml/cluster', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await res.json();
        if (!result.success) throw new Error(result.message || 'Clustering failed');

        // Use current filtered data (up to 200) for plotting
        const companies = window.filteredCompanies.slice(0, 200);
        const labels = result.data.labels;
        const colors = ['#2563EB','#10B981','#F59E0B','#EF4444','#8B5CF6'];
        const datasets = [0,1,2,3,4].map(i => ({ label: `Cluster ${i+1}`, data: [], backgroundColor: colors[i%colors.length] }));
        companies.forEach((c, idx) => {
            const clusterIdx = labels[idx] ?? 0;
            datasets[clusterIdx % datasets.length].data.push({ x: c.marketCap / 1e9, y: c.peRatio, name: c.name, symbol: c.symbol });
        });

        const ctx = document.getElementById('clusterChart')?.getContext('2d');
        if (!ctx) return;
        if (charts.cluster) charts.cluster.destroy();
        charts.cluster = new Chart(ctx, { type: 'scatter', data: { datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Market Cap ($B)' } }, y: { title: { display: true, text: 'P/E Ratio' } } } } });
    } catch (e) {
        console.error('runClustering error:', e);
    }
}

// ML: Run regression marketCap -> peRatio and draw best-fit line
async function runRegression() {
    try {
        const res = await fetch('/api/ml/regression?x=marketCap&y=peRatio&limit=200');
        const result = await res.json();
        if (!result.success) throw new Error(result.message || 'Regression failed');
        const a = result.data.model.a; // intercept
        const b = result.data.model.b; // slope

        const companies = window.filteredCompanies.slice(0, 200);
        const points = companies.map(c => ({ x: c.marketCap / 1e9, y: c.peRatio }));
        const xs = points.map(p => p.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const line = [ { x: minX, y: a + b * (minX * 1e9) }, { x: maxX, y: a + b * (maxX * 1e9) } ];

        const ctx = document.getElementById('regressionChart')?.getContext('2d');
        if (!ctx) return;
        if (charts.regression) charts.regression.destroy();
        charts.regression = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    { label: 'Companies', data: points, backgroundColor: currentPalette[4] },
                    { label: 'Best Fit', type: 'line', data: line, borderColor: '#111827', backgroundColor: '#111827', borderWidth: 2, pointRadius: 0 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { title: { display: true, text: 'Market Cap ($B)' } }, y: { title: { display: true, text: 'P/E Ratio' } } } }
        });
    } catch (e) {
        console.error('runRegression error:', e);
    }
}

// ML: Detect anomalies by P/E z-score and list them
async function runAnomalies() {
    try {
        const res = await fetch('/api/ml/anomalies?metric=peRatio&threshold=2.5&limit=300');
        const result = await res.json();
        if (!result.success) throw new Error(result.message || 'Anomalies failed');
        const anomalies = result.data.anomalies || [];
        if (!anomaliesListEl) return;
        anomaliesListEl.innerHTML = '';
        if (anomalies.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No anomalies detected at current threshold.';
            anomaliesListEl.appendChild(li);
            return;
        }
        anomalies.slice(0, 25).forEach(a => {
            const li = document.createElement('li');
            const c = a.company;
            li.textContent = `${c.symbol} (${c.name}) — P/E ${c.peRatio.toFixed(2)} (z=${a.z.toFixed(2)})`;
            anomaliesListEl.appendChild(li);
        });
    } catch (e) {
        console.error('runAnomalies error:', e);
    }
}

// Pagination functions
function updatePagination() {
    if (!paginationContainer) return;
    
    totalPages = Math.ceil(window.filteredCompanies.length / itemsPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, window.filteredCompanies.length);
    
    paginationContainer.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
                Showing ${startItem}-${endItem} of ${window.filteredCompanies.length} companies
            </div>
            <div class="flex items-center space-x-2">
                <button id="prev-page-btn" 
                        class="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        ${currentPage === 1 ? 'disabled' : ''}>
                    Previous
                </button>
                <span class="px-3 py-1 bg-primary text-white rounded-md">
                    ${currentPage} of ${totalPages}
                </span>
                <button id="next-page-btn" 
                        class="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        ${currentPage === totalPages ? 'disabled' : ''}>
                    Next
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners
    document.getElementById('prev-page-btn')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable(window.filteredCompanies);
            updatePagination();
        }
    });
    
    document.getElementById('next-page-btn')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTable(window.filteredCompanies);
            updatePagination();
        }
    });
}

function updateKPIs(companies) {
    const topPerformerEl = document.getElementById('top-performer');
    if (companies.length === 0) {
        avgPeEl.textContent = 'N/A';
        maxMarketCapEl.textContent = 'N/A';
        maxDividendYieldEl.textContent = 'N/A';
        avgPriceSalesEl.textContent = 'N/A';
        totalWatchlistValueEl.textContent = 'N/A';
        if (topPerformerEl) topPerformerEl.textContent = 'N/A';
        return;
    }
    
    // Average P/E Ratio
    const avgPe = companies.reduce((sum, c) => sum + c.peRatio, 0) / companies.length;
    avgPeEl.textContent = avgPe.toFixed(1);
    
    // Largest Market Cap
    const maxMarketCap = companies.reduce((max, c) => Math.max(max, c.marketCap), 0);
    const marketCapValue = maxMarketCap / 1e9;
    if (marketCapValue >= 1000) {
        maxMarketCapEl.textContent = `$${(marketCapValue / 1000).toFixed(1)}T`;
    } else {
        maxMarketCapEl.textContent = `$${marketCapValue.toFixed(1)}B`;
    }

    // Highest Dividend Yield
    const maxDividendYield = companies.reduce((max, c) => Math.max(max, c.dividendYield), 0);
    maxDividendYieldEl.textContent = `${(maxDividendYield * 100).toFixed(1)}%`;
    
    // Average Price/Sales
    const avgPriceSales = companies.reduce((sum, c) => sum + c.priceSales, 0) / companies.length;
    avgPriceSalesEl.textContent = avgPriceSales.toFixed(2);
    
    // Total Watchlist Value
    const totalWatchlistValue = userWatchlist.reduce((sum, c) => sum + c.marketCap, 0);
    const watchlistValue = totalWatchlistValue / 1e9;
    if (watchlistValue >= 1000) {
        totalWatchlistValueEl.textContent = `$${(watchlistValue / 1000).toFixed(1)}T`;
    } else {
        totalWatchlistValueEl.textContent = `$${watchlistValue.toFixed(1)}B`;
    }
    
    // Top Performer (closest to 52-week high)
    let topPerformer = companies.reduce((top, c) => {
        const currentDiff = c.high52 - c.price;
        const topDiff = top.high52 - top.price;
        return (currentDiff < topDiff) ? c : top;
    }, companies[0]);
    
    if (topPerformerEl) topPerformerEl.textContent = topPerformer.symbol;
}

// Chart functions (simplified versions)
function updatePeRatioChart(companies) {
    const canvas = document.getElementById('peRatioChart');
    if (!canvas) {
        console.warn('peRatioChart canvas not found');
        return;
    }
    
    const peRatioCtx = canvas.getContext('2d');
    if (charts.peRatio) {
        charts.peRatio.destroy();
    }
    
    try {
        charts.peRatio = new Chart(peRatioCtx, {
            type: 'bar',
            data: {
                labels: companies.map(c => c.symbol),
                datasets: [{
                    label: 'Price/Earnings Ratio',
                    data: companies.map(c => c.peRatio),
                    backgroundColor: currentPalette[0],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'P/E Ratio',
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating P/E ratio chart:', error);
    }
}

function updateMarketCapEBITDAChart(companies) {
    const marketCapEBITDACtx = document.getElementById('marketCapEBITDAChart').getContext('2d');
    if (charts.marketCapEBITDA) {
        charts.marketCapEBITDA.destroy();
    }
    const scatterData = companies.map(c => ({
        x: c.marketCap / 1e9,
        y: c.ebitda / 1e9,
        r: 8,
        name: c.name
    }));
    charts.marketCapEBITDA = new Chart(marketCapEBITDACtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Companies',
                data: scatterData,
                backgroundColor: currentPalette[1],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Market Cap ($B)',
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'EBITDA ($B)',
                    }
                }
            }
        }
    });
}

function updateSectorChart(companies) {
    const sectorCtx = document.getElementById('sectorChart').getContext('2d');
    if (charts.sector) {
        charts.sector.destroy();
    }
    const sectors = [...new Set(companies.map(c => c.sector))];
    const sectorData = sectors.map(sector => companies.filter(c => c.sector === sector).length);
    charts.sector = new Chart(sectorCtx, {
        type: 'doughnut',
        data: {
            labels: sectors,
            datasets: [{
                label: 'Number of Companies',
                data: sectorData,
                backgroundColor: currentPalette,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            },
            cutout: '60%'
        }
    });
}

function updatePriceRangeChart(companies) {
    const priceRangeCtx = document.getElementById('priceRangeChart').getContext('2d');
    if (charts.priceRange) {
        charts.priceRange.destroy();
    }
    
    // Limit to top 20 companies for better readability
    const topCompanies = companies.slice(0, 20);
    const priceLabels = topCompanies.map(c => c.symbol);
    const priceData = topCompanies.map(c => c.price);
    const low52Data = topCompanies.map(c => c.low52W);
    const high52Data = topCompanies.map(c => c.high52W);
    
    // Calculate price position within 52-week range
    const pricePositions = topCompanies.map(c => {
        const range = c.high52W - c.low52W;
        if (range === 0) return 0.5;
        return (c.price - c.low52W) / range;
    });
    
    charts.priceRange = new Chart(priceRangeCtx, {
        type: 'line',
        data: {
            labels: priceLabels,
            datasets: [{
                label: 'Current Price',
                data: priceData,
                borderColor: '#3B82F6',
                backgroundColor: '#3B82F620',
                borderWidth: 3,
                tension: 0.3,
                fill: false,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#3B82F6',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            },
            {
                label: '52 Week High',
                data: high52Data,
                borderColor: '#10B981',
                backgroundColor: '#10B98120',
                borderWidth: 2,
                borderDash: [8, 4],
                tension: 0.1,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#10B981',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            },
            {
                label: '52 Week Low',
                data: low52Data,
                borderColor: '#EF4444',
                backgroundColor: '#EF444420',
                borderWidth: 2,
                borderDash: [8, 4],
                tension: 0.1,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#EF4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverBackgroundColor: '#EF4444',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Company Symbol',
                        color: '#374151',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        color: '#E5E7EB',
                        lineWidth: 1
                    }
                },
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Price ($)',
                        color: '#374151',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        color: '#6B7280',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    },
                    grid: {
                        color: '#E5E7EB',
                        lineWidth: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: true,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            const company = topCompanies[context[0].dataIndex];
                            return `🏢 ${company.name} (${company.symbol})`;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            const company = topCompanies[context.dataIndex];
                            
                            if (datasetLabel === 'Current Price') {
                                const range = company.high52W - company.low52W;
                                const position = range > 0 ? ((value - company.low52W) / range * 100).toFixed(1) : 'N/A';
                                const performance = position > 80 ? '🟢 Near High' : 
                                                position > 50 ? '🟡 Mid Range' : '🔴 Near Low';
                                
                                return [
                                    `Current Price: $${value.toFixed(2)}`,
                                    `Position in 52W Range: ${position}% ${performance}`,
                                    `52W High: $${company.high52W.toFixed(2)}`,
                                    `52W Low: $${company.low52W.toFixed(2)}`
                                ];
                            } else if (datasetLabel === '52 Week High') {
                                return `52W High: $${value.toFixed(2)}`;
                            } else {
                                return `52W Low: $${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.3
                }
            }
        }
    });
}

function updateDynamicCorrelationChart(companies) {
    const chartCtx = document.getElementById('dynamicCorrelationChart').getContext('2d');
    if (charts.dynamicCorrelation) {
        charts.dynamicCorrelation.destroy();
    }

    const xAxisMetric = xAxisSelect.value;
    const yAxisMetric = yAxisSelect.value;
    
    const xAxisLabel = availableMetrics.find(m => m.id === xAxisMetric).name;
    const yAxisLabel = availableMetrics.find(m => m.id === yAxisMetric).name;

    const scatterData = companies.map(c => ({
        x: c[xAxisMetric],
        y: c[yAxisMetric],
        name: c.name,
        symbol: c.symbol
    }));

    charts.dynamicCorrelation = new Chart(chartCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Companies',
                data: scatterData,
                backgroundColor: currentPalette[3],
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xAxisLabel,
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel,
                    }
                }
            }
        }
    });
}

function updateBubbleChart(companies) {
    const bubbleCtx = document.getElementById('bubbleChart').getContext('2d');
    if (charts.bubble) {
        charts.bubble.destroy();
    }

    const maxDividend = Math.max(...companies.map(c => c.dividendYield));

    const bubbleData = companies.map(c => ({
        x: c.marketCap,
        y: c.peRatio,
        r: Math.max(5, (c.dividendYield / maxDividend) * 20),
        name: c.name,
        marketCap: c.marketCap,
        pe: c.peRatio,
        dividend: c.dividendYield
    }));

    charts.bubble = new Chart(bubbleCtx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Companies',
                data: bubbleData,
                backgroundColor: currentPalette.map((color, index) => currentPalette[index % currentPalette.length]),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Market Cap ($)',
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'P/E Ratio',
                    }
                }
            }
        }
    });
}

function updateNormalizedComparisonChart(companies) {
    const chartCtx = document.getElementById('normalizedComparisonChart').getContext('2d');
    if (charts.normalizedComparison) {
        charts.normalizedComparison.destroy();
    }

    // Limit to top 8 companies for better readability
    const topCompanies = companies.slice(0, 8);
    
    const metrics = [
        { key: 'peRatio', label: 'P/E Ratio', inverse: true, description: 'Lower is better' },
        { key: 'dividendYield', label: 'Dividend Yield', inverse: false, description: 'Higher is better' },
        { key: 'marketCap', label: 'Market Cap', inverse: false, description: 'Higher is better' },
        { key: 'priceSales', label: 'Price/Sales', inverse: true, description: 'Lower is better' },
        { key: 'priceBook', label: 'Price/Book', inverse: true, description: 'Lower is better' },
        { key: 'ebitda', label: 'EBITDA', inverse: false, description: 'Higher is better' }
    ];
    
    const labels = metrics.map(m => m.label);
    
    // Calculate normalized values for each metric
    const normalizedData = metrics.map(metric => {
        const values = topCompanies.map(c => c[metric.key]).filter(v => v > 0);
        if (values.length === 0) return { min: 0, max: 1, avg: 0.5 };
        
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const avgVal = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        return { min: minVal, max: maxVal, avg: avgVal };
    });
    
    const datasets = topCompanies.map((company, index) => {
        const data = metrics.map((metric, metricIndex) => {
            const value = company[metric.key];
            const { min, max } = normalizedData[metricIndex];
            
            if (value <= 0 || max === min) return 0.5;
            
            let normalizedValue = (value - min) / (max - min);
            
            // Apply inverse scaling for metrics where lower is better
            if (metric.inverse) {
                normalizedValue = 1 - normalizedValue;
            }
            
            return Math.max(0, Math.min(1, normalizedValue));
        });

        return {
            label: `${company.symbol}`,
            data: data,
            borderColor: currentPalette[index % currentPalette.length],
            backgroundColor: currentPalette[index % currentPalette.length] + '30',
            borderWidth: 2.5,
            pointBackgroundColor: currentPalette[index % currentPalette.length],
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: currentPalette[index % currentPalette.length],
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
            tension: 0.1
        };
    });

    // Add sector average line
    const averageData = metrics.map((metric, metricIndex) => {
        const { avg, min, max } = normalizedData[metricIndex];
        if (max === min) return 0.5;
        
        let normalizedAvg = (avg - min) / (max - min);
        if (metric.inverse) {
            normalizedAvg = 1 - normalizedAvg;
        }
        
        return Math.max(0, Math.min(1, normalizedAvg));
    });

    datasets.push({
        label: 'Sector Average',
        data: averageData,
        borderColor: '#6B7280',
        backgroundColor: '#6B728040',
        borderWidth: 3,
        borderDash: [8, 4],
        pointBackgroundColor: '#6B7280',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#6B7280',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        tension: 0.1
    });

    charts.normalizedComparison = new Chart(chartCtx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 1,
                    min: 0,
                    ticks: {
                        stepSize: 0.2,
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        },
                        color: '#6B7280',
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        backdropColor: 'rgba(255, 255, 255, 0.8)',
                        backdropPadding: 4
                    },
                    grid: {
                        color: '#E5E7EB',
                        lineWidth: 1
                    },
                    angleLines: {
                        color: '#E5E7EB',
                        lineWidth: 1
                    },
                    pointLabels: {
                        color: '#374151',
                        font: {
                            size: 13,
                            weight: 'bold'
                        },
                        padding: 18,
                        callback: function(label, index) {
                            const metric = metrics[index];
                            return `${label}\n(${metric.description})`;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        filter: function(legendItem, chartData) {
                            // Show only first 6 companies + average in legend
                            return legendItem.datasetIndex < 7;
                        },
                        generateLabels: function(chart) {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels;
                            const labels = original.call(this, chart);
                            
                            // Add custom styling for sector average
                            labels.forEach((label, index) => {
                                if (label.text === 'Sector Average') {
                                    label.fillStyle = '#6B7280';
                                    label.strokeStyle = '#6B7280';
                                    label.lineDash = [8, 4];
                                }
                            });
                            
                            return labels;
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#374151',
                    borderWidth: 1,
                    cornerRadius: 12,
                    displayColors: true,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 12,
                    callbacks: {
                        title: function(context) {
                            const dataset = context[0].dataset;
                            if (dataset.label === 'Sector Average') {
                                return '📊 Sector Average';
                            }
                            const company = topCompanies[context[0].datasetIndex];
                            return `🏢 ${company.name} (${company.symbol})`;
                        },
                        label: function(context) {
                            const metric = metrics[context.dataIndex];
                            const company = topCompanies[context.datasetIndex];
                            const originalValue = company[metric.key];
                            
                            let formattedValue;
                            if (metric.key === 'marketCap' || metric.key === 'ebitda') {
                                formattedValue = `$${(originalValue / 1e9).toFixed(2)}B`;
                            } else if (metric.key === 'dividendYield') {
                                formattedValue = `${(originalValue * 100).toFixed(2)}%`;
                            } else {
                                formattedValue = originalValue.toFixed(2);
                            }
                            
                            const normalizedPercent = (context.parsed.r * 100).toFixed(0);
                            const performance = context.parsed.r > 0.7 ? '🟢 Excellent' : 
                                             context.parsed.r > 0.4 ? '🟡 Good' : '🔴 Poor';
                            
                            return [
                                `${metric.label}: ${formattedValue}`,
                                `Normalized: ${normalizedPercent}% ${performance}`,
                                `(${metric.description})`
                            ];
                        }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.1
                }
            }
        }
    });
}
