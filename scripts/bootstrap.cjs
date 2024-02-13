const fs = require('fs')

fs.mkdirSync('node_modules/eslint-plugin-mmkal', {recursive: true})
fs.writeFileSync('node_modules/eslint-plugin-mmkal/index.js', `module.exports = require('../../src')`)
fs.writeFileSync('node_modules/eslint-plugin-mmkal/package.json', `{"main":"index.js"}`)
fs.writeFileSync('node_modules/eslint-plugin-mmkal/index.d.ts', `export * from '../../src'`)
