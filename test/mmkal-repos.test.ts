import * as fs from 'fs'
import * as path from 'path'
import {expect, test} from 'vitest'

const reposToTest = [
  'https://github.com/mmkal/expect-type', //
  'https://github.com/mmkal/trpc-cli',
]

for (const repo of reposToTest) {
  test(
    `lint ${repo}`,
    async () => {
      const {execa} = await import('execa')
      await execa('pnpm', ['build'])
      const tmp = path.join(`/tmp/eslint-plugin-mmkal-testing`, Date.now().toString())
      fs.mkdirSync(tmp, {recursive: true})
      await execa('git', ['clone', repo], {cwd: tmp})
      const [cloneName, ...otherFiles] = fs.readdirSync(tmp)
      const clone = path.join(tmp, cloneName)
      expect(otherFiles).toEqual([])
      await execa('pnpm', ['install'], {cwd: clone})
      await execa(path.join(process.cwd(), 'node_modules', '.bin', 'link'), [process.cwd()], {cwd: clone})
      const {all: lint} = await execa('pnpm', ['eslint', '.', '--fix', '--max-warnings', '0'], {cwd: clone})

      expect(lint!.toLowerCase()).not.toContain('error')
    },
    {timeout: 30_000},
  )
}
