import { ReflectionKind } from 'typedoc'
import { commentText, findChild, loadFixture, modifierTags } from './helpers'

describe('default @notExported tag', () => {
  const project = loadFixture('default')

  test('converts an unexported, tagged class', () => {
    const cls = findChild(project, 'Cls')
    expect(cls).toBeDefined()
    expect(cls?.kind).toBe(ReflectionKind.Class)
    expect(commentText(cls)).toBe('My class')
    expect(modifierTags(cls)).toContain('@notExported')
  })

  test('converts unexported, tagged type aliases', () => {
    const twoNumbers = findChild(project, 'twoNumbers')
    const threeNumbers = findChild(project, 'threeNumbers')
    expect(twoNumbers).toBeDefined()
    expect(twoNumbers?.kind).toBe(ReflectionKind.TypeAlias)
    expect(modifierTags(twoNumbers)).toContain('@notExported')
    expect(threeNumbers).toBeDefined()
    expect(threeNumbers?.kind).toBe(ReflectionKind.TypeAlias)
    expect(modifierTags(threeNumbers)).toContain('@notExported')
  })

  test('excludes unexported, untagged declarations', () => {
    expect(findChild(project, 'HiddenCls')).toBeUndefined()
    expect(findChild(project, 'fourNumbers')).toBeUndefined()
  })

  test('leaves naturally exported declarations untouched', () => {
    const me = findChild(project, 'me')
    const sum2 = findChild(project, 'sum2')
    const twoOrThreeNumbers = findChild(project, 'twoOrThreeNumbers')
    expect(me).toBeDefined()
    expect(sum2).toBeDefined()
    expect(twoOrThreeNumbers).toBeDefined()
  })
})
