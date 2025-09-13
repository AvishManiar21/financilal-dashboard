// Flat ESLint config for ESLint v9+
import js from '@eslint/js';

export default [
	js.configs.recommended,
	// Node/backend files
	{
		files: [
			'server.js',
			'services/**/*.js',
			'config.js',
			'tailwind.config.js',
			'postcss.config.js',
			'eslint.config.js'
		],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: 'script',
			globals: {
				module: 'readonly',
				require: 'readonly',
				__dirname: 'readonly',
				process: 'readonly',
				console: 'readonly',
				setTimeout: 'readonly'
			}
		},
		rules: {
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
		}
	},
	// Frontend browser files
	{
		files: ['public/js/**/*.js'],
		languageOptions: {
			ecmaVersion: 2021,
			sourceType: 'script',
			globals: {
				window: 'readonly',
				document: 'readonly',
				fetch: 'readonly',
				setTimeout: 'readonly',
				Chart: 'readonly',
				console: 'readonly'
			}
		},
		rules: {
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
		}
	}
];
