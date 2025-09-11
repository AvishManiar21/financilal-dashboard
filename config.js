// Configuration file for the financial dashboard
module.exports = {
    // Alpha Vantage API Configuration
    alphaVantage: {
        apiKey: process.env.ALPHA_VANTAGE_API_KEY || 'demo', // Use 'demo' for testing
        baseUrl: 'https://www.alphavantage.co/query',
        rateLimit: 5, // requests per minute for free tier
        timeout: 10000 // 10 seconds
    },
    
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    
    // Sample companies for the dashboard
    companies: [
        { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Information Technology' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Information Technology' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Information Technology' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
        { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
        { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Information Technology' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Information Technology' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
        { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care' },
        { symbol: 'V', name: 'Visa Inc.', sector: 'Financials' }
    ]
};
