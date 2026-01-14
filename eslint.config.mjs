import { fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import noticePlugin from 'eslint-plugin-notice';
import prettier from 'eslint-plugin-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// FlatCompat to use legacy "extends" presets in flat config
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
});

const OFF = 0;
const WARN = 1;
const ERROR = 2;

export default defineConfig([
	/**
	 * ESLint, Prettier Configuration
	 *
	 * This block sets up the base JavaScript/ES rules, globals, and disables ESLint rules that conflict with Prettier.
	 */
	{
		name: 'base',

		files: ['**/*.ts', '**/*.tsx'],

		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.node,
			},
		},

		plugins: {
			jsdoc: jsdocPlugin,
			notice: fixupPluginRules(noticePlugin),
			prettier: fixupPluginRules(prettier),
		},

		// Keep Prettier separate (no eslint-plugin-prettier). Only extend "prettier" to disable conflicting rules.
		extends: [
			...compat.extends('eslint:recommended'),
			...compat.extends('prettier'),
		],

		rules: {
			/**
			 * Enforces JSDoc comments for public classes, methods, and functions.
			 */
			'jsdoc/require-jsdoc': [
				'error',
				{
					publicOnly: true,
					contexts: [
						'ClassDeclaration',
						'MethodDefinition',
						'FunctionDeclaration',
						'ArrowFunctionExpression',
					],
					require: {
						ClassDeclaration: true,
						MethodDefinition: true,
						FunctionDeclaration: true,
						ArrowFunctionExpression: false,
					},
				},
			],
			'jsdoc/require-param': 'warn',
			'jsdoc/require-returns': 'off',
			'jsdoc/check-tag-names': 'warn',
			'jsdoc/check-alignment': 'warn',
			'jsdoc/check-indentation': 'off',

			/**
			 * Enforces a specific copyright notice format at the top of files.
			 */
			'notice/notice': [
				'error',
				{
					mustMatch: String.raw`^(#!/usr/bin/env node\r?\n)?/\*\*\r?\n \* @copyright Copyright © .+?\. All rights reserved\.\r?\n \* @author    .+? <[^>]+>\r?\n \*/`,
				},
			],

			/**
			 * Integrates Prettier with ESLint, applying formatting rules during linting.
			 */
			'prettier/prettier': [
				'warn',
				{
					arrowParens: 'always',
					endOfLine: 'auto',
					plugins: [], // "prettier-plugin-tailwindcss"
					printWidth: 140,
					semi: true,
					singleQuote: false,
					tabWidth: 4,
					trailingComma: 'all',
				},
			],
		},

		settings: {
			jsdoc: {
				mode: 'typescript',

				// Prefer "@returns" and auto-fix "@return" to "@returns"
				tagNamePreference: {
					return: 'returns',
					returns: 'returns',
				},
			},
		},
	},

	/**
	 * Import/Export Configuration
	 *
	 * This block sets up import/export rules.
	 */
	{
		name: 'imports',

		files: ['**/*.ts', '**/*.tsx'],

		plugins: {
			_import: fixupPluginRules(importPlugin),
		},

		rules: {
			'_import/order': [
				'warn',
				{
					// Group imports by their source type
					groups: [
						['builtin', 'external'],
						['internal'],
						['parent', 'sibling', 'index'],
					],

					// Define custom patterns for import groups
					pathGroups: [
						{
							pattern: '@/**', // Treat imports starting with @ as internal
							group: 'internal',
						},
					],

					// Exclude certain import types from path groups
					pathGroupsExcludedImportTypes: ['builtin', 'external'],

					// Add blank lines between different import groups
					'newlines-between': 'always',

					// Sort imports alphabetically within each group
					alphabetize: { caseInsensitive: true, order: 'asc' },
				},
			],

			// If you use TS path aliases, consider installing and enabling the resolver:
			// Settings example (requires: pnpm add -D eslint-import-resolver-typescript):
			// settings: { import/resolver: { typescript: { project: "tsconfig.json" } } }
		},
	},

	/**
	 * TypeScript Configuration
	 *
	 * This block sets up TypeScript-specific rules.
	 */
	{
		name: 'typescript',

		files: ['**/*.ts', '**/*.tsx'],

		languageOptions: {
			// Use TypeScript parser to allow ESLint to understand TypeScript syntax
			parser: tsParser,

			// TypeScript parser options for type checking and project context
			parserOptions: {
				project: 'tsconfig.json',
				tsconfigRootDir: __dirname,
			},
		},

		plugins: {
			'@typescript-eslint': tsPlugin,
		},

		// Avoid redefining the same plugin here; rely on presets via FlatCompat.
		extends: [
			...compat.extends(
				// Base ESLint rules for common JavaScript issues
				'eslint:recommended',

				// TypeScript-specific rules for common issues and best practices
				'plugin:@typescript-eslint/recommended',

				// TypeScript-specific rules that require type information
				'plugin:@typescript-eslint/recommended-requiring-type-checking'
			),
		],

		rules: {
			// Disallows console statements except for error and warning messages
			'no-console': [
				WARN,
				{
					allow: ['error', 'warn'],
				},
			],

			// Warns about empty blocks like if () {} which might indicate incomplete code
			'no-empty': WARN,

			// Enforces the use of === and !== instead of == and != for more predictable comparisons
			eqeqeq: ERROR,

			// Requires all switch statements to have a default case for better error handling
			'default-case': ERROR,

			// Disables the enforcement of consistent line ending style (Windows/Unix)
			'linebreak-style': OFF,

			// TypeScript Rules

			// Disables the rule that requires explicit return types on functions and class methods
			'@typescript-eslint/await-thenable': OFF,

			// Allows using require() statements instead of import
			'@typescript-eslint/no-require-imports': OFF,

			// Warns when returning any or unknown types from functions
			'@typescript-eslint/no-unsafe-return': WARN,

			// Allows comparing values with enum members
			'@typescript-eslint/no-unsafe-enum-comparison': OFF,

			// Warns when using non-string values in template expressions like `${value}`
			'@typescript-eslint/restrict-template-expressions': WARN,

			// Warns when calling a function or method that's typed as any
			'@typescript-eslint/no-unsafe-call': WARN,

			// Allows accessing properties on values typed as any
			'@typescript-eslint/no-unsafe-member-access': OFF,

			// Allows assigning values typed as any to other variables
			'@typescript-eslint/no-unsafe-assignment': OFF,

			// Warns about declared variables that aren't used in the code
			'@typescript-eslint/no-unused-vars': WARN,

			// Warns when an async function doesn't contain any await expressions
			'@typescript-eslint/require-await': WARN,

			// Prevents common mistakes with Promises, with special handling for JSX attributes
			'@typescript-eslint/no-misused-promises': [
				'error',
				{
					checksVoidReturn: {
						attributes: false,
					},
				},
			],
		},
	},

	/**
	 * Next.js Configuration
	 *
	 * This block sets up Next.js specific rules and configurations.
	 */
	// {
	//     name: "nextjs",
	//
	//     // Apply this config only to Next.js files
	//     files: ["**/*.ts", "**/*.tsx"],
	//
	//     // Language specific configuration
	//     languageOptions: {
	//         // Use TypeScript parser to allow ESLint to understand TypeScript syntax
	//         parser: tsParser,
	//
	//         // TypeScript parser options for type checking and project context
	//         parserOptions: {
	//             project: "tsconfig.json",
	//             tsconfigRootDir: __dirname,
	//         },
	//     },
	//
	//     // Use FlatCompat to extend Next.js rules
	//     extends: compat.extends(
	//         // Next.js Base Rules
	//         "next",
	//
	//         // Next.js Core Web Vitals
	//         "next/core-web-vitals",
	//
	//         // Next.js + TypeScript
	//         "next/typescript",
	//     ),
	// },

	// ...compat.extends("next"),

	globalIgnores(['.next', 'node_modules', 'dist', 'build', 'out']),
]);
