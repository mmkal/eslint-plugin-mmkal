import dedent from 'dedent'
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

test('rules-of-hooks shim', async () => {
  const testdir = path.join(__dirname, 'ignoreme')

  const testfile = path.join(testdir, 'testfile.tsx')

  fs.mkdirSync(testdir, {recursive: true})
  fs.readdirSync(testdir).forEach(file => fs.unlinkSync(path.join(testdir, file)))
  fs.writeFileSync(
    testfile,
    dedent`
      import React from 'react'

      const useMutation = () => ({mutate: () => {}})
      export const X = () => {
        if (Math.random()) {
          useMutation()
        }

        return <div>Hello</div>
      }

      const trpc = {foo: {bar: {useMutation}}}

      export const Y = () => {
        if (Math.random()) {
          trpc.foo.bar.useMutation()
        }

        return <div>Hello</div>
      }
    `,
  )

  const {all} = await execa('pnpm', ['eslint', 'test/ignoreme/*', '--fix', '--no-ignore'], {all: true, reject: false})

  expect(all).toContain(`React Hook "useMutation" is called conditionally`)
  expect(all).toContain(`React Hook "trpc.foo.bar.useMutation" is called conditionally`)
  expect(all.replace(process.cwd(), '<dir>')).toMatchInlineSnapshot(`
    "
    <dir>/test/ignoreme/testfile.tsx
       6:5  error  React Hook "useMutation" is called conditionally. React Hooks must be called in the exact same order in every component render               react-hooks/rules-of-hooks
      16:5  error  React Hook "trpc.foo.bar.useMutation" is called conditionally. React Hooks must be called in the exact same order in every component render  react-hooks/rules-of-hooks

    ✖ 2 problems (2 errors, 0 warnings)
    "
  `)

  fs.rmSync(testdir, {recursive: true})
})

test('exhaustive-deps shim', async () => {
  const testdir = path.join(__dirname, 'ignoreme')

  const testfile = path.join(testdir, 'testfile.tsx')

  fs.mkdirSync(testdir, {recursive: true})
  fs.readdirSync(testdir).forEach(file => fs.unlinkSync(path.join(testdir, file)))
  fs.writeFileSync(
    testfile,
    dedent`
      import React from 'react'

      const useMutation = () => ({mutate: () => {}})
      export const X = () => {
        const mutation = useMutation()
        React.useEffect(() => {
          mutation.mutate() // this should be ok, because of our shim
        }, [mutation.mutate])

        React.useEffect(() => {
          alert(mutation.status) // this is not ok, we need to add mutation.status to the deps array
        }, [mutation.mutate])

        return <div>Hello</div>
      }
    `,
  )

  const {all} = await execa('pnpm', ['eslint', 'test/ignoreme/*', '--fix', '--no-ignore'], {all: true, reject: false})

  expect(all.replace(process.cwd(), '<dir>')).toMatchInlineSnapshot(`""`)

  fs.rmSync(testdir, {recursive: true})
})
