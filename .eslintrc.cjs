module.exports = require('./src/index').getRecommended()

// bugfixes in old eslint-plugin-unicorn rules
// they come from the npm package of this package so we don't have the updates yet 🧐
module.exports.rules['mmkal/unicorn/expiring-todo-comments'] = 'off'
module.exports.rules['mmkal/unicorn/no-empty-file'] = 'off'

module.exports.plugins.push('codegen')
module.exports.rules['mmkal/codegen/codegen'] = 'off'
module.exports.rules['codegen/codegen'] = 'warn'
