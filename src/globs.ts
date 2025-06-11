// todo: consider just stealing all globs and boilerplate stuff from https://github.com/antfu/eslint-config
export const nonProdGlobs = ['test/**/*.ts', '**/tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts', 'e2e/**/*.ts']

export const typescriptGlobs = ['**/*.ts', '**/*.tsx']

export const sourceCodeGlobs = [
  'src/**', // where most people put source codde
  'source/**', // where sindresorhus puts source code
]

export const ANTFU_GLOB_EXCLUDE = [
  '**/node_modules',
  '**/dist',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
  '**/bun.lockb',

  '**/output',
  '**/coverage',
  '**/temp',
  '**/.temp',
  '**/tmp',
  '**/.tmp',
  '**/.history',
  '**/.vitepress/cache',
  '**/.nuxt',
  '**/.next',
  '**/.vercel',
  '**/.changeset',
  '**/.idea',
  '**/.cache',
  '**/.output',
  '**/.vite-inspect',
  '**/.yarn',

  '**/CHANGELOG*.md',
  '**/*.min.*',
  '**/LICENSE*',
  '**/__snapshots__',
  '**/auto-import?(s).d.ts',
  '**/components.d.ts',
]

export const codegenFileGlobs = ['*.md', '*.mdx', '*.yml', '*.yaml']
export const codegenProcessedGlobs = codegenFileGlobs.map(f => `**/${f}/*.{js,ts,jsx,tsx,cjs,mjs,cts,mts}`)

/** globs that should be linted in an IDE, but not via CLI */
export const cliIgnoreGlobs = ['*ignoreme*']
