Financials Comparison Dashboard

Node.js/Express + Tailwind CSS dashboard that visualizes financial metrics from a Kaggle-based CSV dataset. Includes ML utilities (clustering, anomaly detection, regression).

Prerequisites
- Node.js 18+ (tested with v22)
- npm

Setup
```
npm install
npm run build
# start
npm start
# or dev auto-reload
npm run dev
```

Visit http://localhost:3000

Endpoints
- GET `/api/companies?sector=&limit=`
- GET `/api/company/:symbol`
- GET `/api/sectors`
- GET `/api/metrics`
- GET `/api/stats`
- GET `/api/health`

ML Endpoints
- POST `/api/ml/cluster`
  - body: `{ "features": ["peRatio","dividendYield","marketCap"], "k": 3, "limit": 200 }`
- GET `/api/ml/anomalies?metric=peRatio&threshold=2.5&limit=200`
- GET `/api/ml/regression?x=marketCap&y=peRatio&limit=200`

Frontend
Open `/public/index.html`. The "Machine Learning" section includes:
- Clustering scatter
- Regression with best-fit line
- P/E anomaly list

Development
- Tailwind build: `npm run build` (minified) or `npm run build-css` (watch)

License
MIT

