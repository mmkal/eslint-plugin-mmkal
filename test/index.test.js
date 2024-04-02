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
  fs.writeFileSync(typescript, 'export const a: [number] = [1];')
  fs.writeFileSync(esm, `export const a = [1];`)
  fs.writeFileSync(commonjs, `exports.a = [1];`)

  await execa('pnpm', ['eslint', 'test/ignoreme/*', '--fix', '--no-ignore'])
  /** @type {(file: string) => string} */
  const read = file => fs.readFileSync(file).toString().trim()

  expect(read(typescript)).toEqual('export const a: [number] = [1]')
  expect(read(esm)).toEqual(`export const a = [1]`)
  expect(read(commonjs)).toEqual(`exports.a = [1]`)

  fs.rmSync(testdir, {recursive: true})
}, 10_000)
