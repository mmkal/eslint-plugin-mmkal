import {type Plugin} from 'eslint-plugin-wrapper'

declare const plugin: Plugin

export declare const getRecommended: () => NonNullable<Plugin['configs']>[string]
export declare const configs: Plugin['configs']
export declare const rules: Plugin['rules']
export declare const environments: Plugin['environments']
export declare const processors: Plugin['processors']
