module.exports = {
  env: {
    'es6': true,
    'node': true,
  },
  extends: [
    '@sup39/eslint-config-typescript',
  ],
  globals: {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly',
  },
  parserOptions: {
    'ecmaVersion': 2018,
    'sourceType': 'module',
  },
  rules: {
    'no-prototype-builtins': 'off',
  },
};
