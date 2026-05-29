/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", ".git/**", "dist/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
      globals: {
        process:      "readonly",
        console:      "readonly",
        __dirname:    "readonly",
        __filename:   "readonly",
        require:      "readonly",
        module:       "readonly",
        exports:      "writable",
        Buffer:       "readonly",
        setTimeout:   "readonly",
        clearTimeout: "readonly",
        setInterval:  "readonly",
        clearInterval:"readonly",
        global:       "readonly",
        URL:          "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef":       "error"
    }
  }
];
