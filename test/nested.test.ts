import { ReflectionKind } from 'typedoc'
import { findById, findChild, loadFixture, modifierTags } from './helpers'

describe('nested declarations', () => {
  const project = loadFixture('nested')

  test('converts a tagged declaration referenced only from a class method return type', () => {
    const helper = findChild(project, 'Helper')
    expect(helper).toBeDefined()
    expect(helper?.kind).toBe(ReflectionKind.Interface)
    expect(modifierTags(helper)).toContain('@notExported')

    const service = findChild(project, 'Service')
    const method = findChild(service, 'method')
    const signature = method?.signatures?.[0]
    expect(signature?.type?.type).toBe('reference')
    expect(signature?.type?.target).toBe(helper?.id)
  })

  test('converts a tagged declaration referenced only from a deeply nested inline type', () => {
    const innerHelper = findChild(project, 'InnerHelper')
    expect(innerHelper).toBeDefined()
    expect(innerHelper?.kind).toBe(ReflectionKind.Class)
    expect(modifierTags(innerHelper)).toContain('@notExported')

    const service = findChild(project, 'Service')
    const nested = findChild(service, 'nested')
    const deeper = findChild(nested?.type?.declaration, 'deeper')
    const helperMethod = findChild(deeper?.type?.declaration, 'helper')
    const signature = helperMethod?.signatures?.[0]
    expect(signature?.type?.type).toBe('reference')
    expect(signature?.type?.target).toBe(innerHelper?.id)
  })

  test('recursive search helper can find a reflection by id anywhere in the tree', () => {
    const innerHelper = findChild(project, 'InnerHelper')
    expect(innerHelper).toBeDefined()
    const found = findById(project, innerHelper!.id)
    expect(found?.name).toBe('InnerHelper')
  })
})
