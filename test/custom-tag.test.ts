import { ReflectionKind } from 'typedoc'
import {
  blockTagNames,
  commentText,
  findChild,
  loadFixture,
  modifierTags,
} from './helpers'

describe('custom --includeTag option', () => {
  const project = loadFixture('custom-tag')

  test('converts an unexported declaration tagged with the custom tag', () => {
    const cls = findChild(project, 'Cls')
    expect(cls).toBeDefined()
    expect(cls?.kind).toBe(ReflectionKind.Class)
    expect(commentText(cls)).toBe('My class')
  })

  test('registers the custom tag as a modifier tag instead of a block tag', () => {
    const cls = findChild(project, 'Cls')
    // If the custom tag were not registered as a modifier tag, TypeDoc would
    // either warn about an unknown block tag or render it as a block tag
    // inside the comment. Neither should happen.
    expect(modifierTags(cls)).toContain('@internalDoNotUse')
    expect(blockTagNames(cls)).not.toContain('@internalDoNotUse')
  })

  test('excludes unexported, untagged declarations', () => {
    expect(findChild(project, 'HiddenCls')).toBeUndefined()
    expect(findChild(project, 'fourNumbers')).toBeUndefined()
  })
})
