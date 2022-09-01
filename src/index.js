const {EslintPluginWrapper} = require('eslint-plugin-wrapper')

const wrapper = new EslintPluginWrapper({pluginName: 'mmkal'})

process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true'

// model external configs as plugins that just expose one config each, so we can use the same wrapping method
wrapper.addPlugins({
  'config:xo': {configs: {recommended: require('eslint-config-xo')}},
  // 'config:xo-react': {configs: {recommended: require('eslint-config-xo-react')}},
  'config:xo-typescript': {
    configs: {recommended: require('eslint-config-xo-typescript')},
  },
  'config:@rushstack/eslint-config': {
    configs: {
      recommended: require('@rushstack/eslint-config/profile/node').overrides[0],
    },
  },
})

// external plugins are awkward to set up peer dependencies for. wrap them so all you have to do is require this plugin.
wrapper.addPlugins({
  '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
  '@rushstack': require('@rushstack/eslint-plugin'),
  '@rushstack/security': require('@rushstack/eslint-plugin-security'),
  '@rushstack/packlets': require('@rushstack/eslint-plugin-packlets'),
  codegen: require('eslint-plugin-codegen'),
  // functional: require('eslint-plugin-functional'),
  import: require('eslint-plugin-import'),
  jest: require('eslint-plugin-jest'),
  prettier: require('eslint-plugin-prettier'),
  unicorn: require('eslint-plugin-unicorn'),
  promise: require('eslint-plugin-promise'),
  react: require('eslint-plugin-react'),
  'react-hooks': require('eslint-plugin-react-hooks'),
  'jsx-a11y': require('eslint-plugin-jsx-a11y'),
})

wrapper.addPlugins({
  custom: {
    rules: {
      /**
       * Banning non-null asssertions would make sense if typescript and all the types we use were perfect.
       * But there are lots of resaons that types are just wrong, and a non-null assertion is sometimes OK
       * if you are sure you know better than the compiler. This encourages you to use `!!!` instead of the
       * insanely verbose `// eslint-disable-next-line mmkal/@typescript-eslint/no-non-null-assertions`.
       * Rationale: `!!!` still stands out and is clearly deliberate, but it's easy to type and grok.
       */
      'bang-bang-bang': (() => {
        const parentDef = wrapper.plugins['@typescript-eslint'].rules['no-non-null-assertion']
        /** @type {import('eslint-plugin-wrapper').Plugin['rules'][string]} */
        return {
          ...parentDef,
          meta: {
            ...parentDef.meta,
            messages: {
              ...parentDef.meta.messages,
              noNonNull: `Use "!!!" instead of a single non-null assertion, if you want to avoid a noisy lint suppression.`,
            },
          },
          create(context) {
            const parentRule = parentDef.create(context)
            const isNNE = node => node && node.type === 'TSNonNullExpression'

            return {
              TSNonNullExpression(node) {
                if (isNNE(node.expression) && isNNE(node.expression.expression)) {
                  return // !!!, permitted
                }

                if (isNNE(node.parent)) {
                  return // probably the child of a !!!, rely on parent for linting
                }

                // eslint-disable-next-line mmkal/@typescript-eslint/no-confusing-void-expression
                return parentRule.TSNonNullExpression(node)
              },
            }
          },
        }
      })(),
    },
    configs: {
      recommended: {
        plugins: ['mmkal'],
        extends: ['plugin:mmkal/recommended', 'plugin:mmkal/config:xo.all', 'plugin:mmkal/custom.all'],
        parser: require.resolve('@typescript-eslint/parser'),
        parserOptions: {
          ecmaVersion: 2018,
          sourceType: 'module',
          project: ['./tsconfig.json'],
          extraFileExtensions: ['.md', '.mjs', '.js'],
        },
        settings: {
          jest: {version: 27},
          react: {version: '17.0'},
        },
        env: {
          browser: true,
          node: true,
          jest: true,
        },
        rules: {
          // default rules that clash with prettier or typescript-eslint
          indent: 'off',
          semi: 'off',
          quotes: 'off',
          camelcase: 'off',
          'no-redeclare': 'off',
          'func-call-spacing': 'off',
          'no-undef': 'off',
          'semi-spacing': 'off',
          'padding-line-between-statements': 'off',
          'new-cap': 'off',
          'mmkal/@typescript-eslint/no-extra-semi': 'off',

          'mmkal/unicorn/no-abusive-eslint-disable': 'off',

          'mmkal/prettier/prettier': ['warn', require('./prettierrc')],
          'mmkal/codegen/codegen': 'error',
          'mmkal/@typescript-eslint/naming-convention': 'off',
          'mmkal/@typescript-eslint/no-extra-non-null-assertion': 'off',
          'mmkal/@typescript-eslint/no-non-null-assertion': 'off',
          'mmkal/@rushstack/typedef-var': 'off', // 💙 type inference
          'mmkal/@rushstack/no-new-null': 'off', // pg returns nulls so this is a non-starter
          'mmkal/@typescript-eslint/consistent-type-definitions': 'off',
          'mmkal/@typescript-eslint/no-use-before-define': 'off',
          'mmkal/@typescript-eslint/explicit-member-accessibility': 'off',
          'mmkal/@typescript-eslint/typedef': 'off',
          'mmkal/promise/param-names': 'off',
          'no-void': 'off',
          'mmkal/rushstack/hoist-jest-mock': 'off',
          'require-atomic-updates': 'off',
          'mmkal/rushstack/no-new-null': 'off',
          'no-restricted-syntax': [
            'error',
            {
              selector: 'TSEnumDeclaration',
              message:
                "Don't declare enums, use literal types instead. Instead of `enum Direction {up, down}` use `type Direction = 'up' | 'down'`",
            },
          ],

          // beware: this will affect _all_ multiline templates. suppress if you have a template you don't want that with
          'mmkal/unicorn/template-indent': ['warn', {selectors: ['*']}],

          'prefer-arrow-callback': 'error',
          'prefer-const': 'error',
          'no-console': 'warn',
          'no-var': 'error',
          strict: ['error', 'never'],

          'no-await-in-loop': 'off',

          'mmkal/jest/expect-expect': [
            'error',
            {
              assertFunctionNames: ['expect', 'expectTypeOf', 'verify', 'expectCDK', 't.expect', 'click', 'waitFor'],
            },
          ],
          'mmkal/@typescript-eslint/ban-types': 'off',
          'mmkal/@typescript-eslint/explicit-module-boundary-types': 'off',

          // https://github.com/typescript-eslint/typescript-eslint/issues/2585#issuecomment-696269611
          'mmkal/@typescript-eslint/no-redeclare': 'off',

          'mmkal/@typescript-eslint/ban-ts-comment': [
            'warn',
            {
              'ts-expect-error': 'allow-with-description',
              'ts-ignore': 'allow-with-description', // even with description, prefer-ts-expect-error still applies
            },
          ],
          'mmkal/@typescript-eslint/no-confusing-void-expression': [
            'warn',
            {ignoreArrowShorthand: true, ignoreVoidOperator: true},
          ],
          'mmkal/@typescript-eslint/prefer-function-type': 'error',
          'mmkal/@typescript-eslint/restrict-template-expressions': [
            'warn',
            {allowBoolean: true, allowNumber: true, allowNullish: true},
          ],
          'mmkal/@typescript-eslint/no-shadow': 'error',
          'mmkal/@typescript-eslint/no-unused-vars': [
            'error',
            {
              varsIgnorePattern: '^_',
              argsIgnorePattern: '^_',
              caughtErrorsIgnorePattern: '^_',
              ignoreRestSiblings: true,
              args: 'after-used',
            },
          ],
          'mmkal/@typescript-eslint/no-namespace': ['warn', {allowDeclarations: true}],
          'mmkal/@typescript-eslint/no-unsafe-return': 'warn',

          'mmkal/import/newline-after-import': 'warn',
          // doesn't understand typescript, and is covered by the compiler anyway
          'mmkal/import/no-unresolved': 'off',
          // by default allows dev depenencies everywhere
          'mmkal/import/no-extraneous-dependencies': [
            'warn',
            {
              devDependencies: [
                '**/*.test.ts',
                'test/**',
                'scripts/**',
                '**/*.js',
                '*.js',
                '.*.js',
                'cdk/**',
                '**/cdk/**',
                '**/cdk.ts',
                '**/*.stories.tsx',
              ],
            },
          ],
          'mmkal/import/order': [
            'warn',
            {
              alphabetize: {order: 'asc'},
              groups: [['index', 'external', 'internal', 'builtin', 'object'], 'parent', 'sibling'],
            },
          ],
          'mmkal/unicorn/import-style': [
            'warn',
            {
              styles: {
                path: {default: false, namespace: true},
              },
            },
          ],

          'mmkal/@typescript-eslint/prefer-nullish-coalescing': 'off',
          'mmkal/@typescript-eslint/explicit-function-return-type': 'off',
          'mmkal/@typescript-eslint/no-explicit-any': 'warn',
          'mmkal/@typescript-eslint/prefer-readonly-parameter-types': 'off',
          'mmkal/@typescript-eslint/no-unsafe-member-access': 'off',
          'mmkal/@typescript-eslint/member-ordering': 'off',
          'mmkal/@typescript-eslint/no-unsafe-call': 'off',
          'mmkal/@typescript-eslint/unified-signatures': 'off',
          'mmkal/@typescript-eslint/no-empty-function': 'off',
          'mmkal/@typescript-eslint/member-delimiter-style': 'off',
          'mmkal/@typescript-eslint/no-parameter-properties': 'off',

          // xo defaults that overlap with prettier
          'comma-dangle': 'off',
          'object-curly-spacing': 'off',
          curly: 'off',
          'operator-linebreak': 'off',
          'no-mixed-spaces-and-tabs': 'off',
          'no-mixed-operators': 'off',
          'mmkal/@typescript-eslint/comma-dangle': 'off',
          'mmkal/@typescript-eslint/indent': 'off',
          'mmkal/@typescript-eslint/quotes': 'off',
          'mmkal/@typescript-eslint/semi': 'off',
          'mmkal/unicorn/no-nested-ternary': 'off',

          // covered by `mmkal/@typescript-eslint/no-unsued-vars`
          'no-unused-vars': 'off',

          // valid rule, but the type system can make sure we don't do this unsafely
          'mmkal/unicorn/no-array-callback-reference': 'off',

          'no-warning-comments': 'off',
          'no-dupe-class-members': 'off',
          'capitalized-comments': 'off',
          'no-promise-executor-return': 'off',

          'mmkal/unicorn/catch-error-name': 'off',
          'mmkal/unicorn/consistent-function-scoping': 'off',
          // warning in vscode, don't bug me in CI, and make CLI commands match CI
          'mmkal/unicorn/expiring-todo-comments': process.env.VSCODE_CWD
            ? ['warn', {allowWarningComments: false, ignoreDatesOnPullRequests: true}]
            : 'off',
          'mmkal/react/react-in-jsx-scope': 'off',
          'mmkal/react/prop-types': 'off',
          'mmkal/react/no-unescaped-entities': ['error', {forbid: ['>', '}']}],
          'mmkal/react/display-name': 'off', // lots of false positives from React.useMemo and only really helps with React.createElement
          'mmkal/unicorn/filename-case': [
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
          'mmkal/unicorn/no-fn-reference-in-iterator': 'off',
          'mmkal/unicorn/no-null': 'off',
          'mmkal/unicorn/prevent-abbreviations': 'off',
          'mmkal/unicorn/no-useless-undefined': 'off',
          'mmkal/unicorn/no-array-for-each': 'off',
          'mmkal/unicorn/prefer-node-protocol': 'off',
          'mmkal/unicorn/prefer-module': 'off',
          'mmkal/unicorn/no-array-reduce': 'off',
          'mmkal/unicorn/prefer-spread': 'off',
          // a foolish consistency is the hobgoblin of little minds
          'mmkal/unicorn/prefer-query-selector': 'off',
        },
        ignorePatterns: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.next/**',
          '**/.rush/**',
          'node_modules',
          'coverage',
          'examples/**/*.md',
          '**/cdk.out/**',
          '**/*ignoreme*/**',
          '**/*ignoreme*',
        ],
        overrides: [
          {
            files: ['**/*.js'],
            rules: {
              'mmkal/@typescript-eslint/no-var-requires': 'off',
              'mmkal/@typescript-eslint/restrict-template-expressions': 'off',
              'mmkal/@typescript-eslint/no-require-imports': 'off',
              'mmkal/@typescript-eslint/no-unsafe-return': 'off',
              'mmkal/@typescript-eslint/no-unsafe-assignment': 'off',
              'mmkal/@typescript-eslint/prefer-optional-chain': 'off',
              'mmkal/@typescript-eslint/no-implicit-any-catch': 'off',
              'no-undef': 'error',
              'no-console': 'off',
            },
          },
          {
            files: ['**/*.cjs'],
            rules: {
              'mmkal/unicorn/no-process-exit': 'off',
            },
          },
          {
            files: ['test/**/*.ts', '**/tests/**/*.ts'],
            rules: {
              'no-console': ['warn', {allow: ['warn', 'error']}],
              'mmkal/@typescript-eslint/no-unsafe-return': 'off',
              'mmkal/custom/bang-bang-bang': 'off',
              'mmkal/@typescript-eslint/no-extra-non-null-assertion': 'warn',
              'mmkal/@typescript-eslint/consistent-type-assertions': 'off',
              'mmkal/@typescript-eslint/no-unsafe-assignment': 'off',
              'mmkal/@typescript-eslint/no-var-requires': 'off',
              'mmkal/@typescript-eslint/no-require-imports': 'off',
              'object-shorthand': 'off',
              'mmkal/@typescript-eslint/restrict-template-expressions': 'off',
              'mmkal/@typescript-eslint/no-base-to-string': 'off',
              'mmkal/@typescript-eslint/no-empty-interface': 'off',
              'mmkal/@typescript-eslint/require-array-sort-compare': 'off',
            },
          },
          {
            files: ['**/cdk/*.ts'],
            rules: {
              'no-new': 'off',
            },
          },
        ],
      },
    },
  },
})

module.exports = wrapper
