import type * as EslintPluginWrapper from 'eslint-plugin-wrapper'

type Plugin = (typeof EslintPluginWrapper)['plugins'][string]

declare const plugin: Plugin & {
  getRecommended: () => NonNullable<Plugin['configs']>[string]
}

export = plugin
