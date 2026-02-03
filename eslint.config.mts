import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginImport from "eslint-plugin-import";

export default tseslint.config(
    { ignores: [".next/**", "out/**", "node_modules/**", "*.config.js", "*.config.mjs", "*.config.ts"] },
    ...tseslint.configs.recommended,
    js.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            ecmaVersion: 2020,
            sourceType: "module",
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react: pluginReact,
            "react-hooks": pluginReactHooks,
            "jsx-a11y": pluginJsxA11y,
            import: pluginImport,
        },
        settings: {
            react: {
                version: "detect",
            },
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },
        rules: {
            // React rules (from next/core-web-vitals)
            "react/react-in-jsx-scope": "off", // Not needed in Next.js 13+
            "react/prop-types": "off", // Using TypeScript for prop validation
            "react/no-unescaped-entities": "off", // Allow apostrophes and quotes in JSX

            // React Hooks rules (from next/core-web-vitals)
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            // JSX A11y rules - make anchor-is-valid a warning for now
            "jsx-a11y/anchor-is-valid": "warn",

            // TypeScript rules
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/triple-slash-reference": "off", // Allow triple slash references in .d.ts files

            // General rules
            "no-unused-vars": "off", // Use TypeScript version instead
            "no-undef": "off", // TypeScript handles this
            semi: ["error", "always"],
            quotes: ["error", "double"],
        },
    },
    {
        files: ["**/*.{js,mjs,cjs}"],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ["**/*.test.{js,ts,jsx,tsx}", "**/__tests__/**/*.{js,ts,jsx,tsx}", "jest.setup.js"],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.node,
            },
        },
    },
);
