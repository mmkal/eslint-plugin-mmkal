# eslint-plugin-mmkal

My eslint plugin with rules I find good. If you aren't me you probably shouldn't use this.

## Goals

1. Work out of the box
1. Cover as many js/ts development use-cases as possible
1. Be prescriptive about arbitrary rules like formatting
1. Enforce some degree of consistency
1. Be opinionated but trusting
1. Protect against common gotchas
1. Provide pits of success
1. Don't require any peer dependencies to work
1. Be _somewhat_ configurable

### Included

The following plugins/libraries are usable and should "just work" without needing to add extra configs. They should also "just work" if you _have_ defined extra configs like `.prettierrc.js` or `tsconfig.json`.

1. Prettier
1. typescript-eslint
1. eslint-plugin-unicorn

## Non-goals

1. Small package size
1. Support non-flat config
1. Be your mother

## How to use

Install with `npm install eslint-plugin-mmkal`, then in your eslint.config.js:

```js
module.exports = require('eslint-plugin-mmkal').recommendedFlatConfigs
```

## Notes

### Prettier is pre-configured

That is, there are prettier options baked into this package, and the above usage will use them. If you want to rely on the default prettier resolution, just override:

```js
module.exports = [
    ...require('eslint-plugin-mmkal').recommendedFlatConfigs,
    {rules: {'prettier/prettier': 'warn'}},
]
```

This will rely on [prettier's built-in config resolution](https://prettier.io/docs/en/configuration.html#sharing-configurations). The reason this package doesn't do this is so that you can install it in a project *without* a `.prettierrc.js` file, you get what *I* think is a better prettier config than the default.

### Common globals are enabled

Because the goal of this plugin is to make it quick to write sensible code rather than be 100% sure to prevent you from writing silly code (which no lint library can really achieve), globals for nodejs, browsers, commonjs and esm are all enabled by default. All of the globals in the [globals package](https://npmjs.com/package/globals) (which are the [official globals eslint uses](https://eslint.org/blog/2022/08/new-config-system-part-2/#goodbye-environments%2C-hello-globals)) are available as configs:

```js
const mmkal = require('eslint-plugin-mmkal')

module.exports = [
    ...mmkal.recommendedFlatConfigs,
    ...mmkal.configs.globals_greasemonkey,
]
```

### Disabling configs

This is somewhat experimental and I might change how this works, but there's a jerry-rigged "naming" system that ships with this package to make it easier to disable internal configs (which are pretty modular) if you don't want it:

```js
const mmkal = require('eslint-plugin-mmkal')

module.exports = withoutConfigs(
    mmkal.recommendedFlatConfigs,
    ['globals_node', 'prettierPreset'],
)
```

Since this is experimental and subject to change, what the actual names are isn't documented here, but the `withoutConfigs` function is strongly typed, so IDE intellisense/autocomplete should hint what you can disable.