/**
 * typedoc-plugin-not-exported
 * TypeDoc plugin that forces inclusion of non-exported symbols (variables)
 * Originally from https://github.com/TypeStrong/typedoc/issues/1474#issuecomment-766178261
 * And: https://github.com/tomchen/typedoc-plugin-not-exported
 * CC0
 */

import {
  Converter,
  TypeScript,
  Application,
  DeclarationReflection,
  ReflectionKind,
} from 'typedoc'
import * as ts from 'typescript'
import { Context } from 'typedoc/dist/lib/converter/context'

const ModuleFlags =
  TypeScript.SymbolFlags.ValueModule | TypeScript.SymbolFlags.NamespaceModule

exports.load = function (application: Application) {
  /** @type {Map<Reflection, Set<TypeScript.SourceFile>>} */
  const checkedForModuleExports = new Map()
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
    // Figure out where "not exports" will be placed, go up the tree until we get to
    // the module where it belongs.
    let targetModule = reflection
    while (
      !targetModule.kindOf(ReflectionKind.Module | ReflectionKind.Project)
    ) {
      targetModule = targetModule.parent as DeclarationReflection
    }
    const moduleContext = context.withScope(targetModule)

    const reflSymbol = context.project.getSymbolFromReflection(reflection)

    if (!reflSymbol) {
      // Global file, no point in doing anything here. TypeDoc will already
      // include everything declared in this file.
      return
    }

    for (const declaration of reflSymbol.declarations || []) {
      checkFakeExportsOfFile(declaration.getSourceFile(), moduleContext)
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

  // Fix for the new TypeDoc JSDoc tag linting.
  application.on(Application.EVENT_BOOTSTRAP_END, () => {
    const modifiers = application.options.getValue('modifierTags')
    if (!modifiers.includes('@notExported')) {
      application.options.setValue('modifierTags', [
        ...modifiers,
        '@notExported',
      ])
    }
  })
}
