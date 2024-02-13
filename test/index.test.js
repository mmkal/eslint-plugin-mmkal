import {execa} from 'execa'
import * as fs from 'fs'
import * as path from 'path'
import {test, expect} from 'vitest'

test('fix works', async () => {
  // for now, just test that semicolons are prettiered away
  const testdir = path.join(__dirname, 'ignoreme')

  const typescript = path.join(testdir, 'typescript.ts')
  const esm = path.join(testdir, 'esm.mjs')
  const commonjs = path.join(testdir, 'commonjs.cjs')

  fs.mkdirSync(testdir, {recursive: true})
  fs.readdirSync(testdir).forEach(file => fs.unlinkSync(path.join(testdir, file)))
  fs.writeFileSync(typescript, 'export const a = 1;')
  fs.writeFileSync(esm, `import * as fs from 'fs';\nexport const read = fs.readFile;`)
  fs.writeFileSync(commonjs, `const fs = require('fs');\nexport const read = fs.readFile;`)

  await execa('pnpm', ['eslint', 'test/ignoreme/*', '--fix', '--no-ignore'])
  /** @type {(file: string) => string} */
  const read = file => fs.readFileSync(file).toString().trim()

  expect(read(typescript)).toEqual('export const a = 1')
  expect(read(esm)).toEqual(`import * as fs from 'fs'\n\nexport const read = fs.readFile`)
  expect(read(commonjs)).toEqual(`const fs = require('fs')\n\nexport const read = fs.readFile`)
}, 10_000)
