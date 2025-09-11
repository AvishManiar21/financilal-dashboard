// Flat ESLint config for ESLint v9+
import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		languageOptions: {
			sourceType: 'module',
			ecmaVersion: 2021,
			globals: {
				Chart: 'readonly',
				window: 'readonly',
				document: 'readonly',
				console: 'readonly'
			}
		},
		rules: {
			'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
		}
	}
];
