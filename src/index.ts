import eslint from '@eslint/js'
import next from '@next/eslint-plugin-next'
import * as rushSecurity from '@rushstack/eslint-plugin-security'
import * as codegen from 'eslint-plugin-codegen'
import * as importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-plugin-prettier'
// import prettierRecommended from 'eslint-plugin-prettier/recommended' // disables rules that conflict with prettier
import promise from 'eslint-plugin-promise'
import reactPlugin from 'eslint-plugin-react'
import unicorn from 'eslint-plugin-unicorn'
import vitest from 'eslint-plugin-vitest'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import {inspect} from 'util'
import {
  ANTFU_GLOB_EXCLUDE,
  cliIgnoreGlobs,
  codegenFileGlobs,
  codegenProcessedGlobs,
  eslintIgnoreGlobs,
  nonProdGlobs,
  typescriptGlobs,
} from './globs.ts'
import {prettierrc} from './prettierrc.ts'
import {getShimmedReactHooks} from './shim-react-hooks.ts'

const reactRecommended = reactPlugin.configs!.recommended
const reactHooks = getShimmedReactHooks()

const omit = <T extends object, K extends keyof T | PropertyKey>(obj: T, keys: K[]) => {
  const omitted = new Set(keys)
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !omitted.has(k as K))) as Omit<T, K>
}

/** Re-export of the `Preset` type from `eslint-plugin-codegen`. Useful for adding types to custom codegen functions */
export type CodegenPreset<T extends object = object> = codegen.Preset<T>

/** Re-export of the `DefinePreset` type from `eslint-plugin-codegen`. Useful for defining custom codegen presets with input validation via arktype */
export type CodegenDefinePreset = codegen.DefinePreset

export * as codegen from 'eslint-plugin-codegen'

export type ConfigLike = import('eslint').Linter.FlatConfig
// todo[eslint@>8.57.0]: remove - name will be built in to eslint https://github.com/eslint/eslint/issues/18231
export type NamedConfigLike = ConfigLike & {name: string}

const codegenSpecialFiles = ((): ConfigLike[] => {
  return [
    {
      files: codegenFileGlobs,
      processor: 'codegen/processor',
      rules: {
        'codegen/codegen': 'warn',
        // prettier doesn't work with processors - it has some logic to skip based on the physical file because it thinks it's going to run the whole file. see node_modules/eslint-plugin-prettier/eslint-plugin-prettier.js
        'prettier/prettier': 'warn',
        'unicorn/filename-case': 'off',
      },
    },
    ...[eslint.configs.recommended]
      .concat(tseslint.configs.recommended as ConfigLike[])
      .concat(tseslint.configs.disableTypeChecked as ConfigLike[])
      .map(c => ({
        ...c,
        files: codegenProcessedGlobs,
      })),
    {
      files: codegenProcessedGlobs,
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off',
        'unicorn/filename-case': 'off',
        'prettier/prettier': 'off',
        // docs files should be narrower to avoid needing to scroll
        'prettier/processed': ['warn', {...prettierrc, printWidth: 80}],
        'codegen/codegen': 'warn',
      },
    },
  ]
})()

const tseslintOverrides: ConfigLike = {
  ignores: codegenProcessedGlobs,
  rules: {
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-extra-non-null-assertion': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/typedef': 'off',

    // ur not my mum
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-object-type': 'off', // sometimes {} is useful
    '@typescript-eslint/require-await': 'off', // bad idea. if you have a non-async function that usually returns a promise, but sometimes throws synchronously, if the caller uses `.catch(...)` it won't work as expected

    // https://github.com/typescript-eslint/typescript-eslint/issues/2585#issuecomment-696269611
    '@typescript-eslint/no-redeclare': 'off',

    '@typescript-eslint/ban-ts-comment': [
      'warn',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description', // even with description, prefer-ts-expect-error still applies
      },
    ],
    '@typescript-eslint/no-confusing-void-expression': ['warn', {ignoreArrowShorthand: true, ignoreVoidOperator: true}],
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/restrict-template-expressions': [
      'warn',
      {allowBoolean: true, allowNumber: true, allowNullish: true},
    ],
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        args: 'after-used',
      },
    ],
    '@typescript-eslint/no-namespace': ['warn', {allowDeclarations: true}],
    '@typescript-eslint/no-unsafe-return': 'warn',

    '@typescript-eslint/unbound-method': ['error', {ignoreStatic: true}],
    '@typescript-eslint/no-misused-promises': ['warn', {checksVoidReturn: {attributes: false}}],

    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/unified-signatures': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/member-delimiter-style': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/quotes': 'off',
    '@typescript-eslint/semi': 'off',
  },
}

const externalPluginRuleOverrides: ConfigLike = {
  rules: {
    'prettier/prettier': 'warn',
    'codegen/codegen': 'error',

    '@rushstack/typedef-var': 'off', // prefer type inference
    '@rushstack/no-new-null': 'off', // pg returns nulls so this is a non-starter

    'promise/param-names': 'off',
    'no-redeclare': 'off', // typescript has valid redeclare use cases
    'no-void': 'off',
    'require-atomic-updates': 'off',

    'rushstack/no-new-null': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSEnumDeclaration',
        message:
          "Don't declare enums, use literal types instead. Instead of `enum Direction {up, down}` use `type Direction = 'up' | 'down'`",
      },
    ],

    'prefer-arrow-callback': 'off', // usually prefer, but nbd and sometimes nice to give a name to a middleware or some such

    'prefer-const': ['error', {destructuring: 'all'}],
    'no-console': 'warn',
    'no-var': 'error',

    strict: ['error', 'never'],

    'no-await-in-loop': 'off',

    'import-x/newline-after-import': 'warn',
    // doesn't understand typescript, and is covered by the compiler anyway
    'import-x/no-unresolved': 'off',
    'import-x/no-extraneous-dependencies': 'warn',
    'import-x/order': [
      'warn',
      {
        alphabetize: {order: 'asc'},
        groups: [['index', 'external', 'internal', 'builtin', 'object'], 'parent', 'sibling'],
      },
    ],
    // xo defaults that overlap with prettier
    'comma-dangle': 'off',
    'object-curly-spacing': 'off',
    curly: 'off',
    'operator-linebreak': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'no-mixed-operators': 'off',

    // covered by `@typescript-eslint/no-unsued-vars`
    'no-unused-vars': 'off',

    // valid rule, but the type system can make sure we don't do this unsafely
    'unicorn/no-array-callback-reference': 'off',
    'array-callback-return': 'off',

    'no-warning-comments': 'off',
    'no-dupe-class-members': 'off',
    'capitalized-comments': 'off',
    'no-promise-executor-return': 'off',

    'unicorn/catch-error-name': 'off',
    'unicorn/consistent-function-scoping': 'off',
    // warning in vscode, don't bug me in CI, and make CLI commands match CI
    'unicorn/expiring-todo-comments': process.env.VSCODE_CWD
      ? ['warn', {allowWarningComments: false, ignoreDatesOnPullRequests: true}]
      : 'off',
    'unicorn/consistent-destructuring': 'off',
    'unicorn/consistent-existence-index-check': 'off',
    'unicorn/no-array-sort': 'off', // (maybe make smarter - ignore if following a .map/.filter/.slice etc.)
    'unicorn/no-await-expression-member': 'off',
    'unicorn/explicit-length-check': 'off', // why should i
    'unicorn/prefer-type-error': 'off', // sindre doesn't know when my typeof x === 'string' checks actually mean something is a type error
    'unicorn/prefer-ternary': 'off', // teraries are sometimes better, sometimes worse. linter does not know best.
    'unicorn/no-null': 'off', // get real m8 nulls are a thing
    'unicorn/no-push-push': 'off', // depends what makes it more readable
    'unicorn/prefer-switch': 'off', // wut

    '@typescript-eslint/no-namespace': 'off',
    'unicorn/prefer-event-target': 'off', // why
    'no-unsued-vars': 'off', // covered by typescript
    // 'unicorn/prefer-string-replace-all': 'off', // maybe this one is ok, makes the intention a bit clearer, don't disable for now
    'unicorn/prefer-at': 'off', // not always better
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    // 'react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
    'react/display-name': 'off', // lots of false positives from React.useMemo and only really helps with React.createElement

    'unicorn/filename-case': [
      'warn',
      {
        cases: {
          kebabCase: true,
          pascalCase: true,
        },
        ignore: [
          /^\d{4}.\d{2}.\d{2}/, // ignore filenames starting with a date (migration tools generate these)
        ],
      },
    ],
    'unicorn/no-fn-reference-in-iterator': 'off',
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-useless-undefined': 'off',
    'unicorn/no-array-for-each': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/prefer-module': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/no-nested-ternary': 'off',
    'unicorn/prefer-spread': 'off',

    'unicorn/no-abusive-eslint-disable': 'off',

    // beware: this will affect _all_ multiline templates. suppress if you have a template you don't want that with
    'unicorn/template-indent': ['warn', {selectors: ['*']}],

    // a foolish consistency is the hobgoblin of little minds
    'unicorn/prefer-query-selector': 'off',
    'unicorn/import-style': [
      'warn',
      {
        styles: {
          path: {default: false, namespace: true},
        },
      },
    ],
  },
}

const flatify = <Name extends string>(name: Name, legacyPlugin: import('eslint').ESLint.Plugin) =>
  ({
    ...omit(legacyPlugin.configs?.recommended || {}, ['env', 'parserOptions', 'plugins', 'extends', 'overrides']),
    plugins: {[name]: legacyPlugin},
  }) as ConfigLike

export const stripConfig = (cfg: ConfigLike): ConfigLike => ({
  ...omit(cfg, ['plugins', 'parserOptions']),
})

const typescriptLanguageSetup: ConfigLike = {
  languageOptions: {
    parserOptions: {
      project: true, // does a `find-up(tsconfig.json | tsconfig.eslint.json)`
      tsconfigDirName: process.cwd(),
      extraFileExtensions: ['.md'],
    },
  },
}

const fullTypescriptConfig: ConfigLike[] = [
  typescriptLanguageSetup,
  ...tseslint.configs.recommendedTypeChecked.map(cfg => ({
    ...cfg,
    ignores: codegenProcessedGlobs,
  })),
  tseslintOverrides,
] as ConfigLike[]

/** Less strict rules for non-production code (e.g. unit tests, where non-null assertions are more acceptable) */
const nonProdTypescript: ConfigLike = {
  rules: {
    'no-console': ['warn', {allow: ['warn', 'error']}],
    '@typescript-eslint/no-unsafe-return': 'off',
    'custom/bang-bang-bang': 'off',
    '@typescript-eslint/no-extra-non-null-assertion': 'warn',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'object-shorthand': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/require-array-sort-compare': 'off',
    'import-x/no-extraneous-dependencies': ['warn', {devDependencies: true}],
  },
}

const ignoreCommonNonSourceFiles: ConfigLike = {
  name: 'ignoreCommonNonSourceFiles',
  ignores: ANTFU_GLOB_EXCLUDE,
}

/** i like to add `*ignoreme*` to .gitignore - and I like those files to be linted when I'm looking at them, but not when I'm running `pnpm eslint .` */
const ignoreDebugFilesButNotInIDE: ConfigLike = {
  name: 'ignoreDebugFilesButNotInIDE',
  ignores: process.env?.VSCODE_CWD ? eslintIgnoreGlobs : [...cliIgnoreGlobs, ...eslintIgnoreGlobs],
}

const prettierrcConfig: ConfigLike = {
  rules: {
    'prettier/prettier': ['warn', prettierrc],
  },
}

const extendedGlobals = {
  ...globals,
  // react not in `globals` package at time of writing https://github.com/sindresorhus/globals/issues/82#issuecomment-2032260165
  react: {JSX: false, React: false},
}

const globalsConfigs = Object.fromEntries(
  Object.entries(extendedGlobals).map(([k, v]) => {
    return [`globals_${k}`, [{languageOptions: {globals: v}}]]
  }),
) as {
  [K in keyof typeof extendedGlobals as `globals_${K}`]: [{languageOptions: {globals: (typeof extendedGlobals)[K]}}]
}

const configsRecord = (() => {
  const record = {
    ...globalsConfigs,
    codegen: [flatify('codegen', codegen as {})],
    rushSecurity: [
      flatify('@rushstack/security', rushSecurity as {} as import('eslint').ESLint.Plugin),
      {rules: {'@#rushstack/security/no-unsafe-regex': 'warn'}},
    ],
    oneAnyToRuleThemAll: (() => {
      const ruleNames = [
        'no-explicit-any',
        'no-unsafe-assignment',
        'no-unsafe-call',
        'no-unsafe-member-access',
        'no-unsafe-argument',
        'no-unsafe-return',
        'no-unsafe-function-type',
        'no-unsafe-member-access',
      ]
      const rules = ruleNames.map(ruleName => {
        const tseslintPlugin = tseslint.plugin as import('eslint').ESLint.Plugin
        const rule = tseslintPlugin.rules![ruleName] as import('eslint').Rule.RuleModule
        if (!rule)
          throw new Error(
            `Rule ${ruleName} not found. Available rules: ` + Object.keys(tseslintPlugin.rules!).join(' '),
          )
        return {
          ruleName,
          rule,
        }
      })

      return [
        {
          plugins: {
            mmkal: {
              rules: {
                'no-any': {
                  meta: {
                    messages: Object.fromEntries(
                      rules.flatMap(rule => {
                        const messages = Object.entries(rule.rule.meta?.messages || {})
                        return messages.map(([key, message]) => [key, `${rule.ruleName}: ${message}`])
                      }),
                    ),
                    hasSuggestions: true,
                  },
                  create: context => {
                    const rulesInfo = rules.map(rule => {
                      // eslint-disable-next-line mmkal/no-any
                      const created = (rule.rule.create as Function)(context) as import('eslint').Rule.RuleListener
                      return {...rule, created}
                    })

                    const keysToRules = {} as Record<string, typeof rulesInfo>
                    for (const rule of rulesInfo) {
                      for (const key of Object.keys(rule.created)) {
                        keysToRules[key] = keysToRules[key] ?? []
                        keysToRules[key].push(rule)
                      }
                    }

                    return Object.fromEntries(
                      Object.entries(keysToRules).map(([key, rulesForKey]) => {
                        const listener = (...args: [never, never, never]) => {
                          for (const ruleInfo of rulesForKey) {
                            // console.log('ruleInfo', key, ruleInfo)
                            ruleInfo.created[key]!(...args)
                          }
                        }
                        return [key, listener] as [string, import('eslint').Rule.RuleListener[string]]
                      }),
                    )
                  },
                } satisfies import('eslint').Rule.RuleModule,
              },
            },
          },
        },
        {
          files: typescriptGlobs,
          rules: {
            'mmkal/no-any': 'error',
            ...Object.fromEntries(ruleNames.map(ruleName => [`@typescript-eslint/${ruleName}`, 'off'])),
          },
        },
      ]
    })(),
    // @rushstack/eslint-plugin-packlets plugin removed for now
    unicorn: [
      {
        ...flatify('unicorn', unicorn),
        plugins: {
          unicorn: {
            ...unicorn,
            rules: {
              ...unicorn.rules,
              'filename-case': {
                ...unicorn.rules!['filename-case'],
                create: ((context, ...args) => {
                  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
                  const shimmedContext = new Proxy<typeof context>({} as typeof context, {
                    get(_target, prop, receiver) {
                      const newProp = prop === 'physicalFilename' ? 'filename' : prop
                      return Reflect.get(context, newProp, receiver) as {}
                    },
                  })
                  const rule = unicorn.rules!['filename-case'] as import('eslint').Rule.RuleModule
                  return rule.create(shimmedContext, ...args)
                }) as import('eslint').Rule.RuleModule['create'],
              },
            },
          },
        },
      },
    ],
    import_x: [flatify('import-x', importX)],
    promise: [flatify('promise', promise)],
    vitest: [
      flatify('vitest', vitest),
      {
        rules: {
          'vitest/expect-expect': ['error', {assertFunctionNames: ['expect', 'expectTypeOf']}],
        },
      },
    ],
    reactHooks: [flatify('react-hooks', reactHooks)],
    jsxA11y: [flatify('jsx-a11y', jsxA11y)],
    next: [flatify('@next/next', next)],
    promiseRecommended: [stripConfig(promise.configs!.recommended as ConfigLike)],
    reactRecommended: [reactRecommended as never],
    reactHooksRecommended: [stripConfig(reactHooks.configs!.recommended as ConfigLike)],
    jsxA11yRecommended: [stripConfig(jsxA11y.configs!.recommended as ConfigLike)],
    nextRecommended: [stripConfig(next.configs!.recommended as ConfigLike)],
    prettier: [
      {
        plugins: {
          prettier: {
            ...prettier,
            rules: {
              ...prettier.rules,
              // workaround prettier refusing to fix markdown files which have js snippets extracted by processors, it thinks it's smart enough to run on the whole file but it's not
              processed: {
                ...prettier.rules!.prettier,
                create: ((context, ...args) => {
                  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
                  const shimmedContext = new Proxy<typeof context>({} as typeof context, {
                    get(_target, prop, receiver) {
                      const newProp = prop === 'physicalFilename' ? 'filename' : prop
                      return Reflect.get(context, newProp, receiver) as {}
                    },
                  })
                  const rule = prettier.rules!.prettier as {} as import('eslint').Rule.RuleModule
                  return rule.create(shimmedContext, ...args)
                }) as import('eslint').Rule.RuleModule['create'],
              },
            },
          },
        },
      },
    ],
    // prettierRecommended: [omit(prettierRecommended, ['plugins'])],
    /** my subjective preferreed prettier config */
    prettierPreset: [prettierrcConfig],
    eslintRecommended: [eslint.configs.recommended],
    tseslintOverrides: [tseslintOverrides],
    externalPluginRuleOverrides: [externalPluginRuleOverrides],
    typescriptLanguageSetup: [typescriptLanguageSetup],
    fullTypescriptConfig,
    nonProdTypescript: [nonProdTypescript],
    ignoreCommonNonSourceFiles: [ignoreCommonNonSourceFiles],
    ignoreDebugFilesButNotInIDE: [ignoreDebugFilesButNotInIDE],
    codegenSpecialFiles,
  } satisfies Record<string, ConfigLike[]>

  return record as {[K in keyof typeof record]: ConfigLike[]}
})()

type ConfigsRecord = typeof configsRecord

export const configs = Object.fromEntries(
  Object.entries(configsRecord).map(([k, v]) => {
    const named = v.map((cfg, i) => {
      // todo[eslint@>=8]: remove this on eslint 9. `ignores` as the only key means a global ignore, and eslint 9 is smart enought to ignore `name`, but eslint 8 isn't.
      const keys = Object.keys(cfg)
      if (keys.length === 1 && keys[0] === 'ignores') return cfg

      return {name: `${k}.${i}`, ...cfg}
    })
    return [k, named]
  }),
) as {} as {
  [K in keyof ConfigsRecord]: ConfigsRecord[K] extends Array<infer T> ? Array<T & {name: `${K}.${number}`}> : never
}

export type ConfigName = keyof ConfigsRecord

export const withoutConfigs = (cfgs: NamedConfigLike[], names: ConfigName[]): ConfigLike[] => {
  const set = new Set<string>(names)
  return cfgs.filter(cfg => !set.has(cfg.name.replace(/\.\d+$/, '')))
}

// todo: consider a more consistent way to export configs
export const recommendedFlatConfigs: ConfigLike[] = [
  // todo: consider a way to make it easier to have more specific globals. right now it's optimised for things just working. But adds a slight risk of using `window` in node, or `__dirname` in the esm etc., when those might not work
  ...configs.globals_node,
  ...configs.globals_browser,
  ...configs.globals_commonjs,
  ...configs.globals_es2021,

  ...configs.fullTypescriptConfig.map(cfg => ({
    ...cfg,
    files: typescriptGlobs,
  })),
  ...configs.eslintRecommended,
  ...configs.codegen,
  ...configs.unicorn,
  // ...configs.packlets,
  ...configs['import_x'].map(cfg => ({
    name: cfg.name,
    plugins: cfg.plugins, // various problems related to parserOptions with import recommended
  })),
  ...configs.promise,
  ...configs.promiseRecommended,
  ...configs.vitest,
  ...configs.prettier,
  ...configs.nonProdTypescript.map(cfg => ({
    ...cfg,
    files: nonProdGlobs,
  })),
  // ...configs.prettierRecommended,
  ...configs.prettierPreset,
  ...configs.externalPluginRuleOverrides,
  ...configs.ignoreCommonNonSourceFiles,
  ...configs.ignoreDebugFilesButNotInIDE,
  ...configs.codegenSpecialFiles,
]

export const crazyConfigs: ConfigLike[] = [
  ...configs.oneAnyToRuleThemAll, // replaces the various no-any/no-unsafe-* rules with a single mmkal/no-any
]

export const jsxStyleConfigs: ConfigLike[] = [
  {
    name: 'jsxStyleConfigs',
    files: ['**/*.jsx', '**/*.tsx'],
    ignores: codegenProcessedGlobs,
    rules: {
      'unicorn/filename-case': ['warn', {cases: {kebabCase: true, pascalCase: true}}],
    },
  },
]

export const recommendedReactConfigs = [
  ...recommendedFlatConfigs,
  ...configs.globals_react,
  // ...configs.reactRecommended,
  ...configs.reactHooks,
  ...configs.jsxA11y,
  ...configs.reactHooksRecommended,
  ...configs.jsxA11yRecommended,
  {name: 'reactVersion', settings: {react: {version: '18'}}},
  ...jsxStyleConfigs,
  {
    name: 'reactPropTypesAreSoo2015',
    rules: {'react/prop-types': 'off'},
  },
]

export const recommendedNextConfigs = [
  ...recommendedReactConfigs,
  ...configs.next, //
  ...configs.nextRecommended,
]

const validate = (flatConfigs: NamedConfigLike[]) => {
  const usesProp = (prop: string) => (cfg: ConfigLike) => prop in cfg
  const rules = {
    // noName: (cfg: ConfigLike) => !('name' in cfg) || !cfg.name,
    usesExtends: usesProp('extends'),
    usesParserOptions: usesProp('parserOptions'),
    arrayPlugins: (cfg: ConfigLike) => Array.isArray(cfg.plugins),
    usesEnv: usesProp('env'),
    usesOverrides: usesProp('overrides'),
    unnamedConfig: (cfg: ConfigLike) => !cfg.name,
  }

  const errors = flatConfigs.flatMap(cfg => {
    return Object.entries(rules).flatMap(([rule, fn]) => {
      const bad = fn(cfg)
      return bad ? [`config ${cfg.name || inspect(cfg)} violates rule ${rule}`] : []
    })
  })

  if (errors.length > 0) {
    throw new Error(`Config errors:\n\n` + errors.join('\n'))
  }
}

validate(recommendedFlatConfigs as NamedConfigLike[])
validate(recommendedReactConfigs as NamedConfigLike[])
validate(recommendedNextConfigs as NamedConfigLike[])
