import * as fs from 'fs'
import * as path from 'path'
import {expect, test} from 'vitest'

const reposToTest = [
  'https://github.com/mmkal/expect-type', //
  'https://github.com/mmkal/trpc-cli',
]

const ts = Date.now().toString()

for (const repo of reposToTest) {
  test(
    `lint ${repo}`,
    async () => {
      const {execa} = await import('execa')
      await execa('pnpm', ['build'])
      const tmp = path.join(`/tmp/eslint-plugin-mmkal-testing`, ts)
      fs.mkdirSync(tmp, {recursive: true})
      await execa('git', ['clone', repo], {cwd: tmp})
      const [cloneName, ...otherFiles] = fs.readdirSync(tmp).filter(f => f === repo.split('/').pop())
      const clone = path.join(tmp, cloneName)
      expect(otherFiles).toEqual([])
      await execa('pnpm', ['install'], {cwd: clone})
      await execa(path.join(process.cwd(), 'node_modules', '.bin', 'link'), [process.cwd()], {cwd: clone})
      const {all: lint} = await execa('pnpm', ['eslint', '.', '--fix', '--max-warnings', '0'], {
        all: true,
        cwd: clone,
        reject: false,
      })

      const snapshot = lint
        .replaceAll(tmp, '<dir>')
        .replaceAll('/private<dir>/', '<dir>/')
        .replaceAll(ts, '<timestamp>')
        .replaceAll(/\d+:\d+/g, '<line>:<col>')
      expect(snapshot).toMatchSnapshot()
    },
    {timeout: 30_000},
  )
}
