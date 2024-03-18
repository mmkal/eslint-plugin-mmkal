declare module '@eslint/js' {
  const plugin: import('eslint').ESLint.Plugin & {
    configs: Record<'recommended' | 'all', import('eslint').Linter.FlatConfig>
  }
  export = plugin
}

declare module 'eslint-config-prettier' {
  const config: import('eslint').Linter.Config
  export = config
}

declare module 'eslint-plugin-import' {
  const plugin: import('eslint').ESLint.Plugin
  export = plugin
}

declare module 'eslint-plugin-unicorn' {
  const plugin: import('eslint').ESLint.Plugin
  export = plugin
}

declare module '@babel/eslint-parser' {
  const parser: import('eslint').Linter.ParserModule
  export = parser
}
