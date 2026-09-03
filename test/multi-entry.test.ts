import { ReflectionKind } from 'typedoc'
import { findChild, findChildren, loadFixture, modifierTags } from './helpers'

describe('multiple entry points', () => {
  const project = loadFixture('multi-entry')

  test('creates a separate fake export for each module, without collisions', () => {
    const commons = findChildren(project, 'Common')
    expect(commons).toHaveLength(2)

    for (const common of commons) {
      expect(common.kind).toBe(ReflectionKind.Interface)
      expect(modifierTags(common)).toContain('@notExported')
    }

    const commonWithA = commons.find((c) => findChild(c, 'a'))
    const commonWithB = commons.find((c) => findChild(c, 'b'))
    expect(commonWithA).toBeDefined()
    expect(commonWithB).toBeDefined()
    expect(commonWithA).not.toBe(commonWithB)

    // Each module's `Common` must only contain its own property, proving the
    // two same-named unexported interfaces were not merged together.
    expect(findChild(commonWithA, 'b')).toBeUndefined()
    expect(findChild(commonWithB, 'a')).toBeUndefined()
  })

  test('each module resolves its own exported variable to its own Common', () => {
    const moduleA = findChild(project, 'moduleA')
    const moduleB = findChild(project, 'moduleB')
    expect(moduleA).toBeDefined()
    expect(moduleB).toBeDefined()

    const a = findChild(moduleA, 'a')
    const b = findChild(moduleB, 'b')

    const commons = findChildren(project, 'Common')
    const commonWithA = commons.find((c) => findChild(c, 'a'))
    const commonWithB = commons.find((c) => findChild(c, 'b'))

    expect(a?.type?.type).toBe('reference')
    expect(a?.type?.target).toBe(commonWithA?.id)
    expect(b?.type?.type).toBe('reference')
    expect(b?.type?.target).toBe(commonWithB?.id)
  })
})
