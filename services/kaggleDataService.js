const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

class KaggleDataService {
    constructor() {
        this.data = [];
        this.lastLoaded = null;
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async loadData() {
        try {
            // Check if we have cached data
            if (this.data.length > 0 && this.lastLoaded && 
                (Date.now() - this.lastLoaded) < this.cacheTimeout) {
                return this.data;
            }

            const csvPath = path.join(__dirname, '../data/financials.csv');
            
            return new Promise((resolve, reject) => {
                const results = [];
                
                fs.createReadStream(csvPath)
                    .pipe(csv())
                    .on('data', (data) => {
                        // Convert string values to appropriate types
                        const processedData = {
                            symbol: data.Symbol,
                            name: data.Name,
                            sector: data.Sector,
                            price: parseFloat(data.Price) || 0,
                            peRatio: parseFloat(data['Price/Earnings']) || 0,
                            dividendYield: parseFloat(data['Dividend Yield']) || 0,
                            earningsPerShare: parseFloat(data['Earnings/Share']) || 0,
                            marketCap: parseFloat(data['Market Cap']) || 0,
                            ebitda: parseFloat(data.EBITDA) || 0,
                            priceSales: parseFloat(data['Price/Sales']) || 0,
                            priceBook: parseFloat(data['Price/Book']) || 0,
                            high52W: parseFloat(data['52 Week High']) || 0,
                            low52W: parseFloat(data['52 Week Low']) || 0,
                            secFilings: data['SEC Filings'] || '',
                            hasFinancialData: true
                        };
                        results.push(processedData);
                    })
                    .on('end', () => {
                        this.data = results;
                        this.lastLoaded = Date.now();
                        console.log(`Loaded ${results.length} companies from Kaggle financials dataset`);
                        resolve(results);
                    })
                    .on('error', (error) => {
                        console.error('Error reading CSV file:', error);
                        reject(error);
                    });
            });
        } catch (error) {
            console.error('Error in loadData:', error);
            throw error;
        }
    }

    async getCompanies(options = {}) {
        try {
            const data = await this.loadData();
            let filteredData = data;

            // Filter by sector if requested
            if (options.sector) {
                filteredData = filteredData.filter(company => company.sector === options.sector);
            }

            // Limit results if requested (for performance)
            if (options.limit) {
                filteredData = filteredData.slice(0, options.limit);
            }

            return filteredData.map(company => ({
                symbol: company.symbol,
                name: company.name,
                sector: company.sector,
                price: company.price,
                peRatio: company.peRatio,
                dividendYield: company.dividendYield,
                earningsPerShare: company.earningsPerShare,
                marketCap: company.marketCap,
                ebitda: company.ebitda,
                priceSales: company.priceSales,
                priceBook: company.priceBook,
                high52W: company.high52W,
                low52W: company.low52W,
                secFilings: company.secFilings,
                hasFinancialData: true, // All companies now have financial data
                change: (Math.random() - 0.5) * 10, // Simulate daily change
                changePercent: (Math.random() - 0.5) * 5 // Simulate daily change %
            }));
        } catch (error) {
            console.error('Error getting companies:', error);
            throw error;
        }
    }

    async getCompany(symbol) {
        try {
            const companies = await this.getCompanies();
            return companies.find(company => company.symbol === symbol);
        } catch (error) {
            console.error('Error getting company:', error);
            throw error;
        }
    }

    getSectors() {
        const sectors = [...new Set(this.data.map(company => company.sector))];
        return sectors.sort();
    }

    getMetrics() {
        return [
            'price',
            'peRatio', 
            'dividendYield',
            'earningsPerShare',
            'marketCap',
            'ebitda',
            'priceSales',
            'priceBook',
            'high52W',
            'low52W'
        ];
    }
}

module.exports = KaggleDataService;
