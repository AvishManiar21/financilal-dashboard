const axios = require('axios');
const config = require('../config');

class FinancialDataService {
    constructor() {
        this.apiKey = config.alphaVantage.apiKey;
        this.baseUrl = config.alphaVantage.baseUrl;
        this.rateLimit = config.alphaVantage.rateLimit;
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Rate limiting to respect API limits
    async rateLimitCheck() {
        const now = Date.now();
        const timeDiff = now - this.lastRequestTime;
        
        if (timeDiff < 60000) { // Less than 1 minute
            if (this.requestCount >= this.rateLimit) {
                const waitTime = 60000 - timeDiff;
                console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                this.requestCount = 0;
                this.lastRequestTime = Date.now();
            }
        } else {
            this.requestCount = 0;
            this.lastRequestTime = now;
        }
        
        this.requestCount++;
    }

    // Get cached data if available and not expired
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    // Set data in cache
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Get company overview data
    async getCompanyOverview(symbol) {
        const cacheKey = `overview_${symbol}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            await this.rateLimitCheck();
            
            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'OVERVIEW',
                    symbol: symbol,
                    apikey: this.apiKey
                },
                timeout: config.alphaVantage.timeout
            });

            if (response.data['Error Message']) {
                throw new Error(response.data['Error Message']);
            }

            if (response.data['Note']) {
                throw new Error('API rate limit exceeded. Using demo data.');
            }

            const data = this.processOverviewData(response.data);
            this.setCachedData(cacheKey, data);
            return data;

        } catch (error) {
            console.error(`Error fetching overview for ${symbol}:`, error.message);
            return this.getDemoData(symbol);
        }
    }

    // Get real-time quote data
    async getQuote(symbol) {
        const cacheKey = `quote_${symbol}`;
        const cached = this.getCachedData(cacheKey);
        if (cached) return cached;

        try {
            await this.rateLimitCheck();
            
            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol,
                    apikey: this.apiKey
                },
                timeout: config.alphaVantage.timeout
            });

            if (response.data['Error Message']) {
                throw new Error(response.data['Error Message']);
            }

            if (response.data['Note']) {
                throw new Error('API rate limit exceeded. Using demo data.');
            }

            const data = this.processQuoteData(response.data, symbol);
            this.setCachedData(cacheKey, data);
            return data;

        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error.message);
            return this.getDemoData(symbol);
        }
    }

    // Process overview data from API
    processOverviewData(data) {
        return {
            symbol: data.Symbol,
            name: data.Name,
            sector: data.Sector,
            price: parseFloat(data.MarketCapitalization) / parseFloat(data.SharesOutstanding),
            pe: parseFloat(data.PERatio) || 0,
            dividend: parseFloat(data.DividendYield) || 0,
            marketCap: parseFloat(data.MarketCapitalization) || 0,
            ebitda: parseFloat(data.EBITDA) || 0,
            priceSales: parseFloat(data.PriceToSalesRatioTTM) || 0,
            priceBook: parseFloat(data.PriceToBookRatio) || 0,
            assets: parseFloat(data.TotalAssets) || 0,
            liabilities: parseFloat(data.TotalDebt) || 0,
            high52: parseFloat(data['52WeekHigh']) || 0,
            low52: parseFloat(data['52WeekLow']) || 0
        };
    }

    // Process quote data from API
    processQuoteData(data, symbol) {
        const quote = data['Global Quote'];
        if (!quote) return null;

        return {
            symbol: symbol,
            price: parseFloat(quote['05. price']) || 0,
            high52: parseFloat(quote['03. high']) || 0,
            low52: parseFloat(quote['04. low']) || 0,
            change: parseFloat(quote['09. change']) || 0,
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')) || 0
        };
    }

    // Get demo data when API fails
    getDemoData(symbol) {
        const demoData = {
            'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Information Technology', price: 175.43, pe: 28.5, dividend: 0.44, marketCap: 2750000000000, ebitda: 123000000000, priceSales: 7.2, priceBook: 39.8, assets: 352000000000, liabilities: 258000000000, high52: 198.23, low52: 164.08 },
            'MSFT': { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Information Technology', price: 378.85, pe: 32.1, dividend: 0.75, marketCap: 2810000000000, ebitda: 102000000000, priceSales: 12.4, priceBook: 12.8, assets: 411000000000, liabilities: 169000000000, high52: 384.30, low52: 309.45 },
            'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Information Technology', price: 142.56, pe: 25.8, dividend: 0.0, marketCap: 1780000000000, ebitda: 95000000000, priceSales: 5.8, priceBook: 6.2, assets: 402000000000, liabilities: 107000000000, high52: 151.55, low52: 123.12 },
            'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary', price: 155.23, pe: 45.2, dividend: 0.0, marketCap: 1620000000000, ebitda: 85000000000, priceSales: 2.8, priceBook: 8.1, assets: 527000000000, liabilities: 316000000000, high52: 170.83, low52: 101.15 },
            'TSLA': { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary', price: 248.42, pe: 65.3, dividend: 0.0, marketCap: 790000000000, ebitda: 15000000000, priceSales: 8.9, priceBook: 12.4, assets: 106000000000, liabilities: 28000000000, high52: 299.29, low52: 138.80 },
            'META': { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Information Technology', price: 485.67, pe: 24.1, dividend: 0.0, marketCap: 1230000000000, ebitda: 55000000000, priceSales: 7.2, priceBook: 6.8, assets: 185000000000, liabilities: 32000000000, high52: 531.49, low52: 197.16 },
            'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Information Technology', price: 875.28, pe: 65.8, dividend: 0.16, marketCap: 2160000000000, ebitda: 45000000000, priceSales: 35.2, priceBook: 50.1, assets: 66000000000, liabilities: 15000000000, high52: 974.00, low52: 200.00 },
            'JPM': { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', price: 185.34, pe: 11.2, dividend: 4.00, marketCap: 540000000000, ebitda: 0, priceSales: 3.8, priceBook: 1.8, assets: 3900000000000, liabilities: 3600000000000, high52: 200.52, low52: 135.19 },
            'JNJ': { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care', price: 157.89, pe: 15.8, dividend: 4.44, marketCap: 420000000000, ebitda: 28000000000, priceSales: 3.2, priceBook: 5.1, assets: 180000000000, liabilities: 110000000000, high52: 175.98, low52: 144.12 },
            'V': { symbol: 'V', name: 'Visa Inc.', sector: 'Financials', price: 275.45, pe: 35.2, dividend: 1.80, marketCap: 580000000000, ebitda: 20000000000, priceSales: 16.8, priceBook: 12.4, assets: 85000000000, liabilities: 20000000000, high52: 290.96, low52: 220.00 }
        };

        return demoData[symbol] || {
            symbol: symbol,
            name: `${symbol} Inc.`,
            sector: 'Unknown',
            price: 100.00,
            pe: 20.0,
            dividend: 2.0,
            marketCap: 100000000000,
            ebitda: 5000000000,
            priceSales: 3.0,
            priceBook: 2.0,
            assets: 50000000000,
            liabilities: 25000000000,
            high52: 120.00,
            low52: 80.00
        };
    }

    // Get all companies data
    async getAllCompaniesData() {
        const companies = config.companies;
        const promises = companies.map(async (company) => {
            try {
                const overview = await this.getCompanyOverview(company.symbol);
                const quote = await this.getQuote(company.symbol);
                
                return {
                    ...overview,
                    ...quote,
                    name: company.name,
                    sector: company.sector
                };
            } catch (error) {
                console.error(`Error fetching data for ${company.symbol}:`, error.message);
                return this.getDemoData(company.symbol);
            }
        });

        return Promise.all(promises);
    }
}

module.exports = FinancialDataService;
