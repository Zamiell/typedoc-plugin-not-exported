/**
 * typedoc-plugin-not-exported
 * TypeDoc plugin that forces inclusion of non-exported symbols (variables)
 * Originally from https://github.com/TypeStrong/typedoc/issues/1474#issuecomment-766178261
 * And: https://github.com/tomchen/typedoc-plugin-not-exported
 * CC0
 */

import {
  Application,
  Context,
  Converter,
  DeclarationReflection,
  ReflectionKind,
  TypeScript,
} from 'typedoc'
import type * as ts from 'typescript'

const ModuleFlags =
  TypeScript.SymbolFlags.ValueModule | TypeScript.SymbolFlags.NamespaceModule

export function load(application: Application): void {
  // Fail clearly instead of silently doing nothing if a future TypeDoc
  // release removes the converter API this plugin depends on.
  if (typeof Context.prototype.getSymbolFromReflection !== 'function') {
    throw new Error(
      '[typedoc-plugin-not-exported] The installed version of TypeDoc no ' +
        'longer exposes `Context.prototype.getSymbolFromReflection`. This ' +
        'plugin requires TypeDoc ^0.28.0; check for a plugin update.'
    )
  }

  const checkedForModuleExports = new Map<unknown, Set<ts.SourceFile>>()
  let includeTag = 'notExported'

  application.options.addDeclaration({
    name: 'includeTag',
    help: '[typedoc-plugin-not-exported] Specify the tag name for non-exported member to be imported under',
    defaultValue: includeTag,
  })

  application.converter.on(Converter.EVENT_BEGIN, () => {
    const includeTagTemp = application.options.getValue('includeTag')
    if (typeof includeTagTemp === 'string') {
      includeTag = includeTagTemp.toLocaleLowerCase()
    }
  })

  application.converter.on(
    Converter.EVENT_CREATE_DECLARATION,
    lookForFakeExports
  )

  application.converter.on(Converter.EVENT_END, () => {
    checkedForModuleExports.clear()
  })

  function lookForFakeExports(
    context: Context,
    reflection: DeclarationReflection
  ) {
    // TypeDoc 0.28 only allows `context.withScope()` to move to the current
    // scope or to an immediate child, so we can no longer walk up from
    // `reflection` to its owning module/project and manufacture a context for
    // that ancestor. Instead, rely on the fact that every declaration
    // directly inside a module or project (including a namespace's own
    // declaration) fires this event with `context.scope` already set to that
    // owning module/project. Skip every other, more deeply nested event; the
    // file will already get processed by one of its module-level siblings
    // (or by the namespace/module declaration itself).
    if (!context.scope.kindOf(ReflectionKind.Module | ReflectionKind.Project)) {
      return
    }

    const reflSymbol = context.getSymbolFromReflection(reflection)

    if (!reflSymbol) {
      // Global file, no point in doing anything here. TypeDoc will already
      // include everything declared in this file.
      return
    }

    for (const declaration of reflSymbol.declarations || []) {
      checkFakeExportsOfFile(declaration.getSourceFile(), context)
    }
  }

  function checkFakeExportsOfFile(file: ts.SourceFile, context: Context) {
    const moduleSymbol = context.checker.getSymbolAtLocation(file)

    // Make sure we are allowed to call getExportsOfModule
    if (!moduleSymbol || (moduleSymbol.flags & ModuleFlags) === 0) {
      return
    }

    const checkedScopes =
      checkedForModuleExports.get(context.scope) || new Set()
    checkedForModuleExports.set(context.scope, checkedScopes)

    if (checkedScopes.has(file)) return
    checkedScopes.add(file)

    const exportedSymbols = context.checker.getExportsOfModule(moduleSymbol)

    const symbols: ts.Symbol[] = context.checker
      .getSymbolsInScope(file, TypeScript.SymbolFlags.ModuleMember)
      .filter(
        (symbol: ts.Symbol) =>
          symbol.declarations?.some((d) => d.getSourceFile() === file) &&
          !exportedSymbols.includes(symbol)
      )

    for (const symbol of symbols) {
      if (
        symbol
          .getJsDocTags()
          .some(
            (tag: ts.JSDocTagInfo) =>
              tag.name.toLocaleLowerCase() === includeTag
          )
      ) {
        context.converter.convertSymbol(context, symbol)
      }
    }
  }

  // Fix for the new TypeDoc JSDoc tag linting. Register whatever tag is
  // actually configured (the default `@notExported`, or a custom
  // `--includeTag` value), not just the default, so that custom tags are
  // also stripped from the rendered comment instead of failing lint checks.
  application.on(Application.EVENT_BOOTSTRAP_END, () => {
    const configuredIncludeTag = application.options.getValue('includeTag')
    const tagName =
      typeof configuredIncludeTag === 'string' &&
      configuredIncludeTag.length > 0
        ? configuredIncludeTag
        : 'notExported'
    const modifierTag: `@${string}` = `@${tagName}`

    const modifiers = application.options.getValue('modifierTags')
    if (!modifiers.includes(modifierTag)) {
      application.options.setValue('modifierTags', [...modifiers, modifierTag])
    }
  })
}
