import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import {inspect} from 'util'
import {test, expect} from 'vitest'

test('tseslint recommended config', async () => {
  const flatConfig = tseslint.config(eslint.configs.recommended, ...tseslint.configs.recommended)

  const str = inspect(flatConfig, {depth: 5, maxArrayLength: 10})

  expect(str).toMatchSnapshot()
})
