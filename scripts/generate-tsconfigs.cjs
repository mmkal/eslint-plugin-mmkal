const fs = require('fs')
const path = require('path')

/** @type {typeof import('../tsconfig.json')} */
const basis = JSON.parse(fs.readFileSync(path.join(__dirname, '../tsconfig.json')).toString())

const dots = Array.from({length: 5}).map((_, i) => '../'.repeat(i + 2).replace(/\/$/, ''))

const configsDir = path.join(__dirname, '../src/tsconfigs')
fs.mkdirSync(configsDir, {recursive: true})
fs.readdirSync(configsDir).forEach(f => fs.unlinkSync(path.join(configsDir, f)))
fs.writeFileSync(
  path.join(configsDir, 'README.md'),
  [
    'This directory contains a few tsconfigs which *might* successfully apply to userland projects by using "../.." in "include" and "exclude" arrays.',
    `It's an *effort* to make this plugin easy to set up, but if you have trouble, just add your own tsconfig.json in your project root.`,
  ].join('\n'),
)
dots.forEach(d => {
  /** @type {typeof basis} */
  const newTsConfig = {
    ...basis,
    include: basis.include.map(i => `${d}/${i}`),
    exclude: basis.exclude.concat(basis.exclude.map(e => `${d}/${e}`)),
  }
  const suffix = `dotdot${d.split('/').length}`
  const filepath = path.join(configsDir, `tsconfig.${suffix}.json`)

  fs.writeFileSync(filepath, JSON.stringify(newTsConfig, null, 2))
})
