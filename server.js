const express = require('express');
const path = require('path');
const cors = require('cors');
const KaggleDataService = require('./services/kaggleDataService');
const MLService = require('./services/mlService');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Kaggle data service
const kaggleDataService = new KaggleDataService();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Swagger docs
try {
    const openApiSpec = JSON.parse(fs.readFileSync(require('path').join(__dirname, 'openapi.json'), 'utf8'));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    console.log('Swagger UI available at /docs');
} catch (e) {
    console.warn('OpenAPI spec not loaded:', e.message);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes for Kaggle financial data
app.get('/api/companies', async (req, res) => {
    try {
        const { sector, limit } = req.query;
        console.log('Fetching companies data from Kaggle financials dataset...');
        
        const options = {};
        if (sector) options.sector = sector;
        if (limit) options.limit = parseInt(limit);
        
        const companies = await kaggleDataService.getCompanies(options);
        res.json({
            success: true,
            data: companies,
            timestamp: new Date().toISOString(),
            count: companies.length,
            filters: { sector, limit }
        });
    } catch (error) {
        console.error('Error fetching companies data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch companies data',
            message: error.message
        });
    }
});

app.get('/api/company/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        console.log(`Fetching data for ${symbol} from Kaggle dataset...`);
        
        const company = await kaggleDataService.getCompany(symbol);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: company,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(`Error fetching data for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch company data',
            message: error.message
        });
    }
});

app.get('/api/sectors', async (req, res) => {
    try {
        const sectors = kaggleDataService.getSectors();
        res.json({
            success: true,
            data: sectors,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching sectors:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sectors',
            message: error.message
        });
    }
});

app.get('/api/metrics', async (req, res) => {
    try {
        const metrics = kaggleDataService.getMetrics();
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch metrics',
            message: error.message
        });
    }
});

// ML: clustering on selected metrics
app.post('/api/ml/cluster', async (req, res) => {
    try {
        const { features = ['peRatio','dividendYield','marketCap','priceSales','priceBook','ebitda'], k = 3, limit } = req.body || {};
        const companies = await kaggleDataService.getCompanies({ limit: limit ? parseInt(limit) : undefined });
        const X = MLService.buildFeatureMatrix(companies, features);
        const { centroids, labels, iterations } = MLService.kMeans(X, Math.max(1, parseInt(k) || 3));
        res.json({ success: true, data: { centroids, labels, iterations, features }, count: companies.length });
    } catch (error) {
        console.error('Error in /api/ml/cluster:', error);
        res.status(500).json({ success: false, error: 'Clustering failed', message: error.message });
    }
});

// ML: anomaly detection on a single metric via z-score
app.get('/api/ml/anomalies', async (req, res) => {
    try {
        const metric = req.query.metric || 'peRatio';
        const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 3.0;
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const companies = await kaggleDataService.getCompanies({ limit });
        const values = companies.map(c => Number.isFinite(c[metric]) ? Number(c[metric]) : 0);
        const result = MLService.detectAnomaliesZScore(values, threshold);
        // Attach company references for anomalies
        const anomalies = result.anomalies
            .map((a, idx) => ({ ...a, company: companies[idx] }))
            .filter(a => a.isAnomaly);
        res.json({ success: true, data: { metric, mean: result.mean, std: result.std, anomalies }, count: companies.length });
    } catch (error) {
        console.error('Error in /api/ml/anomalies:', error);
        res.status(500).json({ success: false, error: 'Anomaly detection failed', message: error.message });
    }
});

// ML: simple linear regression y ~ a + b*x between two metrics
app.get('/api/ml/regression', async (req, res) => {
    try {
        const xKey = req.query.x || 'marketCap';
        const yKey = req.query.y || 'peRatio';
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const companies = await kaggleDataService.getCompanies({ limit });
        const x = companies.map(c => Number.isFinite(c[xKey]) ? Number(c[xKey]) : 0);
        const y = companies.map(c => Number.isFinite(c[yKey]) ? Number(c[yKey]) : 0);
        const model = MLService.simpleLinearRegression(x, y);
        res.json({ success: true, data: { xKey, yKey, model }, count: companies.length });
    } catch (error) {
        console.error('Error in /api/ml/regression:', error);
        res.status(500).json({ success: false, error: 'Regression failed', message: error.message });
    }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const companies = await kaggleDataService.getCompanies();
        const sectors = [...new Set(companies.map(c => c.sector))];
        
        res.json({
            success: true,
            data: {
                totalCompanies: companies.length,
                sectors: sectors,
                sectorCount: sectors.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api/`);
    console.log('Using Kaggle financial dataset - 507 companies loaded');
});
