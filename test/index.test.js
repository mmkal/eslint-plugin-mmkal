const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

test('fix works', () => {
  // for now, just test that semicolons are prettiered away
  const filepath = path.join(__dirname, '/ignoreme/index.ts')
  fs.mkdirSync(path.dirname(filepath), {recursive: true})
  fs.writeFileSync(filepath, 'export const a = 1;')
  childProcess.execSync('yarn eslint test/ignoreme/index.ts --fix --no-ignore', {stdio: 'inherit'})
  const updated = fs.readFileSync(filepath).toString()
  expect(updated).toEqual('export const a = 1\n')
})
