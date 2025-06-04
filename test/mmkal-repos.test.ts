import * as fs from 'fs'
import * as path from 'path'
import {expect, test} from 'vitest'

const reposToTest = [
  'https://github.com/mmkal/expect-type', //
  'https://github.com/mmkal/trpc-cli',
]

const ts = Date.now().toString()

for (const repoUrl of reposToTest) {
  test(
    `lint ${repoUrl}`,
    async () => {
      const {execa} = await import('execa')
      await execa('pnpm', ['build'])
      const tmp = path.join(`/tmp/eslint-plugin-mmkal-testing`, ts)
      fs.mkdirSync(tmp, {recursive: true})
      await execa('git', ['clone', repoUrl], {cwd: tmp})
      const repoName = repoUrl.split('/').pop()!
      const clone = path.join(tmp, repoName)
      expect(fs.existsSync(clone)).toBe(true)
      await execa('pnpm', ['install'], {cwd: clone})
      await execa(path.join(process.cwd(), 'node_modules', '.bin', 'link'), [process.cwd()], {cwd: clone})
      const {all: lint} = await execa('pnpm', ['eslint', '.', '--fix', '--max-warnings', '0'], {
        all: true,
        cwd: clone,
        reject: false,
      })

      const snapshot = lint
        .replaceAll(new RegExp(`${repoName}@\\S+`, 'g'), `${repoName}@<version>`)
        .replaceAll(tmp, '<dir>')
        .replaceAll('/private<dir>/', '<dir>/')
        .replaceAll(ts, '<timestamp>')
        .replaceAll(/\d+:\d+/g, '<line>:<col>')
      expect(snapshot).toMatchSnapshot()
    },
    {timeout: 30_000},
  )
}
