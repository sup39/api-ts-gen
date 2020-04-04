module.exports = {
  'env': {
    'es6': true,
    'node': true
  },
  'extends': [
    'google'
  ],
  'globals': {
    'Atomics': 'readonly',
    'SharedArrayBuffer': 'readonly'
  },
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 2018,
    'sourceType': 'module'
  },
  'plugins': [
    '@typescript-eslint'
  ],
  'rules': {
    'require-jsdoc': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'indent': ['error', 2, {'MemberExpression': 1}],
    // no-unused-vars except ts interface
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      'vars': 'all',
      'args': 'after-used',
      'ignoreRestSiblings': false
    }],
  },
};
