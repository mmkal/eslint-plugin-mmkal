import {type Plugin} from 'eslint-plugin-wrapper'

declare const plugin: Plugin & {
  getRecommended: () => NonNullable<Plugin['configs']>[string]
}

export = plugin
