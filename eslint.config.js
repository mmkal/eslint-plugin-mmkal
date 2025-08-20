import 'tsx/esm'

import * as library from './src/index.ts'

const getDefaultExport = () => {
  let exp = [
    ...library.recommendedFlatConfigs,
    ...library.crazyConfigs, // experimental stuff
  ]

  if (process.env.ALT_CONFIG in library) {
    exp = library[process.env.ALT_CONFIG]
  } else if (process.env.ALT_CONFIG) {
    throw new Error(`Unknown config ${process.env.ALT_CONFIG} (options: ${Object.keys(library).join(', ')})`)
  }

  return exp
}

export default getDefaultExport()
