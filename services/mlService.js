
// Lightweight ML utilities operating on the Kaggle companies datasetnode 
// No external dependencies; suitable for small, in-memory analyses

class MLService {
    // Extract feature matrix X from companies for given metric keys
    static buildFeatureMatrix(companies, featureKeys) {
        return companies.map(company =>
            featureKeys.map(key => {
                const value = company[key];
                return Number.isFinite(value) ? Number(value) : 0;
            })
        );
    }

    // K-Means clustering (Lloyd's algorithm) with simple initialization
    static kMeans(X, k = 3, maxIters = 100) {
        if (!Array.isArray(X) || X.length === 0) return { centroids: [], labels: [], iterations: 0 };
        const n = X.length;
        const d = X[0].length;
        const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

        // Initialize centroids by sampling unique points
        const chosen = new Set();
        const centroids = [];
        while (centroids.length < Math.min(k, n)) {
            const idx = getRandomInt(0, n);
            if (!chosen.has(idx)) {
                centroids.push([...X[idx]]);
                chosen.add(idx);
            }
        }

        let labels = new Array(n).fill(0);
        let iterations = 0;

        const distance2 = (a, b) => {
            let sum = 0;
            for (let i = 0; i < d; i++) {
                const diff = a[i] - b[i];
                sum += diff * diff;
            }
            return sum;
        };

        while (iterations < maxIters) {
            iterations++;

            // Assign step
            let changed = false;
            for (let i = 0; i < n; i++) {
                let bestK = 0;
                let bestDist = Infinity;
                for (let c = 0; c < centroids.length; c++) {
                    const dist = distance2(X[i], centroids[c]);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestK = c;
                    }
                }
                if (labels[i] !== bestK) {
                    labels[i] = bestK;
                    changed = true;
                }
            }

            // Stop if no changes
            if (!changed) break;

            // Update step
            const sums = Array.from({ length: centroids.length }, () => new Array(d).fill(0));
            const counts = new Array(centroids.length).fill(0);
            for (let i = 0; i < n; i++) {
                const c = labels[i];
                counts[c]++;
                for (let j = 0; j < d; j++) sums[c][j] += X[i][j];
            }
            for (let c = 0; c < centroids.length; c++) {
                if (counts[c] === 0) continue; // keep previous centroid if empty cluster
                for (let j = 0; j < d; j++) centroids[c][j] = sums[c][j] / counts[c];
            }
        }

        return { centroids, labels, iterations };
    }

    // Z-score anomaly detection for a single metric
    static detectAnomaliesZScore(values, threshold = 3.0) {
        if (!values.length) return { mean: 0, std: 0, anomalies: [] };
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance) || 1e-12;
        const anomalies = values.map((v, i) => ({
            index: i,
            value: v,
            z: (v - mean) / std,
            isAnomaly: Math.abs((v - mean) / std) >= threshold
        }));
        return { mean, std, anomalies };
    }

    // Simple linear regression (least squares) for y ~ a + b*x
    static simpleLinearRegression(x, y) {
        const n = Math.min(x.length, y.length);
        if (n === 0) return { a: 0, b: 0, r2: 0 };
        const sx = x.reduce((s, v) => s + v, 0);
        const sy = y.reduce((s, v) => s + v, 0);
        const sxx = x.reduce((s, v) => s + v * v, 0);
        const syy = y.reduce((s, v) => s + v * v, 0);
        let sxy = 0;
        for (let i = 0; i < n; i++) sxy += x[i] * y[i];

        const denom = n * sxx - sx * sx;
        const b = denom !== 0 ? (n * sxy - sx * sy) / denom : 0;
        const a = n !== 0 ? (sy - b * sx) / n : 0;

        // Compute R^2
        const yMean = sy / n;
        let ssTot = 0, ssRes = 0;
        for (let i = 0; i < n; i++) {
            const yi = y[i];
            const yhat = a + b * x[i];
            ssTot += Math.pow(yi - yMean, 2);
            ssRes += Math.pow(yi - yhat, 2);
        }
        const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
        return { a, b, r2 };
    }
}

module.exports = MLService;

