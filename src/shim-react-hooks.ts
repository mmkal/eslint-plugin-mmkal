import * as fs from 'fs'

/**
 * see https://github.com/facebook/react/issues/27160#issuecomment-2813423512
 * this is a hack to avoid exhaustive-deps linting on react-query useMutation's `.mutate` method.
 */
export const getShimmedReactHooks = () => {
  // rely on the fact that the react-hooks plugin exports everything in one big file. use the development build to avoid minimised code

  const reactHooksPluginPath = require.resolve('eslint-plugin-react-hooks/cjs/eslint-plugin-react-hooks.development.js')
  const reactHooksPluginCode = fs.readFileSync(reactHooksPluginPath, 'utf8')

  // !!! avert your eyes - eval hack below !!!
  const exports = {} as {rules: Record<string, unknown>} // this needs to be in scope for the eval below - it will set exports.rules = ... as a side effect

  const insertAfter = `function getDependency(node) {`
  const parts = reactHooksPluginCode.split(insertAfter)
  if (parts.length !== 2) {
    throw new Error(
      `Can't shim react-hooks plugin. Code at ${reactHooksPluginPath} expected to contain the following line exactly once:\n${insertAfter}`,
    )
  }

  const newReactHooksPluginCode =
    parts[0] +
    insertAfter +
    `
      // BEGIN HACK HACK HACK - react-hooks plugin is annoying about useMutation, this shims it by saying the dependency for 'foo.mutate' is 'foo.mutate' rather than 'foo' (techincally this could cause problems if 'foo.mutate()' relied on this-binding, but react-query doesn't)
      if ((node.parent.type === 'MemberExpression' || node.parent.type === 'OptionalMemberExpression') && node.parent.object === node && node.parent.property.name !== 'current' && !node.parent.computed && node.parent.property.name === 'mutate') {
        return getDependency(node.parent)
      }
      // END HACK HACK HACK - react-hooks plugin is annoying about useMutation, this shims it
  
    ` +
    parts[1]

  if (process.env.DEBUG_REACT_HOOKS_HACK) {
    // to debug this code-shimming, write the code to a file so we can look at it with our eyeballs
    const changedPath = reactHooksPluginPath + '.changed.js'
    fs.writeFileSync(changedPath, newReactHooksPluginCode)
    // eslint-disable-next-line no-console
    console.log('Wrote changed react-hooks plugin to', changedPath)
  }

  eval(newReactHooksPluginCode) // this sets to exports.rules = ... as a side effect 😬

  if (!exports.rules?.['exhaustive-deps']) {
    throw new Error(`Failed to shim react-hooks plugin. Exports: ${JSON.stringify(Object.keys(exports))}`)
  }

  // make rules-of-hooks understand trpc.foo.useQuery() calls
  const originalRule = exports.rules['rules-of-hooks'] as import('eslint').Rule.RuleModule
  exports.rules['rules-of-hooks'] = {
    create: (context, ...args) => {
      const originalRuleListener = originalRule.create(context, ...args)
      return Object.fromEntries(
        Object.keys(originalRuleListener).map(k => {
          if (k === 'CallExpression') {
            // HACK: Just for this listener of this rule, pretend CallExpressions like trpc.foo.useQuery() look like Trpc.useQuery() because rules-of-hooks considers that a hook 🤷
            // This should just be made configurable in eslint-plugin-react-hooks, but no movement on the issue for this: https://github.com/facebook/react/issues/25065. For now this works.
            return [
              k,
              (node: import('eslint').Rule.Node) => {
                if (!('callee' in node))
                  throw new Error(`Expected node to have a callee property, but got ${JSON.stringify(node.type)}`)
                const calleeProxy = new Proxy(node.callee, {
                  get(calleeTarget, calleeProp, calleeReceiver) {
                    if (calleeProp === 'object') {
                      return {type: 'Identifier', name: 'Trpc'}
                    }

                    return Reflect.get(calleeTarget, calleeProp, calleeReceiver) as {}
                  },
                })
                const nodeProxy = new Proxy(node, {
                  get(target, prop, receiver) {
                    if (prop === 'callee') {
                      return calleeProxy
                    }

                    return Reflect.get(target, prop, receiver) as {}
                  },
                })

                return originalRuleListener[k]?.(nodeProxy)
              },
            ]
          }
          return [k, originalRuleListener[k]]
        }),
      )
    },
  } satisfies import('eslint').Rule.RuleModule

  return exports as typeof import('eslint-plugin-react-hooks')
}
