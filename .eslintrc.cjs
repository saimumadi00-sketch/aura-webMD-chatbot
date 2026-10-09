/*
 * Lint policy for browser React source: recommended JS/React/hooks checks with repository-specific warning levels.
 */

module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/set-state-in-effect": "off",
    "no-unused-vars": "warn"
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
