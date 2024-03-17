require('tsx/cjs')

module.exports = [
  {
    files: ['**/*.md/*.js'],
    rules: {
      semi: ['error', 'always'],
    },
  },
  {
    files: ['*.md'],
    plugins: {
      codegen: require('eslint-plugin-codegen'),
    },
    processor: 'codegen/processor',
    rules: {
      semi: ['error', 'always'],
    },
  },
]

module.exports = [
  ...require('./src').configs.codegen, //
  ...require('./src').configs.prettier, //
  ...require('./src').configs.prettierPreset, //
  ...require('./src').configs.codegenSpecialFiles, //
].map((config, i, {length}) => ({
  ...config,
  files: i === length - 1 ? ['*.md'] : ['**/*.md/*.js', '*.md'],
}))

// console.log('exports', module.exports)

module.exports = require('./src').recommendedFlatConfigs
