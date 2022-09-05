const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

test('fix works', () => {
  // for now, just test that semicolons are prettiered away
  const testdir = path.join(__dirname, 'ignoreme')
  const typescript = path.join(testdir, 'typescript.ts')
  const commonjs = path.join(testdir, 'commonjs.cjs')
  fs.mkdirSync(testdir, {recursive: true})
  fs.readdirSync(testdir).forEach(file => fs.unlinkSync(path.join(testdir, file)))
  fs.writeFileSync(typescript, 'export const a = 1;')
  fs.writeFileSync(commonjs, `const fs = require('fs');\nexport const read = fs.readFile;`)
  childProcess.execSync(`yarn eslint 'test/ignoreme/*' --fix --no-ignore`, {stdio: 'inherit'})
  const read = file => fs.readFileSync(file).toString().trim()
  expect(read(typescript)).toEqual('export const a = 1')
  expect(read(commonjs)).toEqual(`const fs = require('fs')\n\nexport const read = fs.readFile`)
})
