import eslint from '@eslint/js'
import * as packlets from '@rushstack/eslint-plugin-packlets'
import next from '@next/eslint-plugin-next'
import * as rushSecurity from '@rushstack/eslint-plugin-security'
import * as codegen from 'eslint-plugin-codegen'
import * as _import from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-plugin-prettier'
import prettierRecommended from 'eslint-plugin-prettier/recommended' // disables rules that conflict with prettier
import promise from 'eslint-plugin-promise'
import reactRecommended from 'eslint-plugin-react/configs/recommended'
import reactHooks from 'eslint-plugin-react-hooks'
import unicorn from 'eslint-plugin-unicorn'
import vitest from 'eslint-plugin-vitest'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import {
  ANTFU_GLOB_EXCLUDE,
  codegenFileGlobs,
  codegenProcessedGlobs,
  nonProdGlobs,
  sourceCodeGlobs,
  typescriptGlobs,
} from './globs'
import {prettierrc} from './prettierrc'

const omit = <T extends {}, K extends keyof T | PropertyKey>(obj: T, keys: K[]) => {
  const omitted = new Set(keys)
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !omitted.has(k as K))) as Omit<T, K>
}

/** Re-export of the `Preset` type from `eslint-plugin-codegen`. Useful for adding types to custom codegen functions */
export type CodegenPreset<T extends {} = {}> = codegen.Preset<T>

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

    'prefer-arrow-callback': 'error',
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
    'unicorn/no-await-expression-member': 'off',

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
    'unicorn/no-null': 'off',
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
  ignores: ANTFU_GLOB_EXCLUDE,
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
    codegen: [flatify('codegen', codegen)],
    rushSecurity: [
      flatify('@rushstack/security', rushSecurity as {} as import('eslint').ESLint.Plugin),
      {rules: {'@#rushstack/security/no-unsafe-regex': 'warn'}},
    ],
    packlets: [
      {
        plugins: {
          '@rushstack/packlets': {
            ...packlets,
            rules: {
              ...Object.fromEntries(
                Object.entries(packlets.rules).map(([name, _rule]) => {
                  const rule = _rule as {} as import('eslint').Rule.RuleModule
                  const create: import('eslint').Rule.RuleModule['create'] = context => {
                    try {
                      return rule.create(context)
                    } catch (err: unknown) {
                      // todo[@rushstack/eslint-plugin-packlets@>0.8.1]: hopefully we can remove this. Right now, packlets throws an error if *any* files don't have parser services.
                      // Change the runtime error into a lint warning so we can avoid it by just not running the rule on those files. No point crashing the whole of eslint.
                      const parserServicesError = /You have used a rule which requires parserServices to be generated./
                      if (parserServicesError.test(String(err))) {
                        return {
                          Program: node => {
                            const messages = [
                              `This rule requires parser services, so can't be run on ${context.filename}.`,
                              `Try disabling this rule for this file, or fix the parser services error.`,
                              `Error: ${err as string}`,
                            ]
                            context.report({node, message: messages.join(' ')})
                          },
                        }
                      }
                      throw err
                    }
                  }

                  return [name, {...rule, create}]
                }),
              ),
            },
          },
        },
      },
      {
        files: sourceCodeGlobs,
        rules: {
          '@rushstack/packlets/mechanics': 'warn',
          '@rushstack/packlets/circular-deps': 'warn',
        },
      },
    ],
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
    'import-x': [flatify('import-x', _import as {})],
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
    reactRecommended: [reactRecommended],
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
                  const rule = prettier.rules!.prettier as import('eslint').Rule.RuleModule
                  return rule.create(shimmedContext, ...args)
                }) as import('eslint').Rule.RuleModule['create'],
              },
            },
          },
        },
      },
    ],
    prettierRecommended: [omit(prettierRecommended, ['plugins'])],
    /** my subjective preferreed prettier config */
    prettierPreset: [prettierrcConfig],
    eslintRecommended: [eslint.configs.recommended],
    tseslintOverrides: [tseslintOverrides],
    externalPluginRuleOverrides: [externalPluginRuleOverrides],
    typescriptLanguageSetup: [typescriptLanguageSetup],
    fullTypescriptConfig,
    nonProdTypescript: [nonProdTypescript],
    ignoreCommonNonSourceFiles: [ignoreCommonNonSourceFiles],
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
  ...configs.packlets,
  ...configs['import-x'].map(cfg => ({
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
  ...configs.prettierRecommended,
  ...configs.prettierPreset,
  ...configs.externalPluginRuleOverrides,
  ...configs.ignoreCommonNonSourceFiles,
  ...configs.codegenSpecialFiles,
]

export const jsxStyleConfigs: ConfigLike[] = [
  {
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
  ...configs.reactRecommended,
  ...configs.reactHooks,
  ...configs.jsxA11y,
  ...configs.reactHooksRecommended,
  ...configs.jsxA11yRecommended,
  {settings: {react: {version: '18'}}},
  ...jsxStyleConfigs,
  {
    rules: {
      'react/prop-types': 'off', // prop-types are soo 2015
    },
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
    // todo[eslint@>=8]: remove this on eslint 9. `ignores` as the only key means a global ignore, and eslint 9 is smart enought to ignore `name`, but eslint 8 isn't.
    namedGlobalIgnore: (cfg: ConfigLike) => Object.keys(cfg).sort().join(',') === 'ignores,name',
  }

  const errors = flatConfigs.flatMap(cfg => {
    return Object.entries(rules).flatMap(([rule, fn]) => {
      const bad = fn(cfg)
      return bad ? [`config ${cfg.name} violates rule ${rule}`] : []
    })
  })

  if (errors.length > 0) {
    throw new Error(`Config errors:\n\n` + errors.join('\n'))
  }
}

validate(recommendedFlatConfigs as NamedConfigLike[])
validate(recommendedReactConfigs as NamedConfigLike[])
validate(recommendedNextConfigs as NamedConfigLike[])
