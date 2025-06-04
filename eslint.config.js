require('tsx/cjs')

const library = require('./src')

module.exports = [
  ...library.recommendedReactConfigs,
  ...library.crazyConfigs, // experimental stuff
]

if (process.env.ALT_CONFIG in library) {
  module.exports = library[process.env.ALT_CONFIG]
} else if (process.env.ALT_CONFIG) {
  throw new Error(`Unknown config ${process.env.ALT_CONFIG} (options: ${Object.keys(library).join(', ')})`)
}
