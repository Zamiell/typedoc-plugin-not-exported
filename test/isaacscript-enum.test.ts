import { ReflectionKind } from 'typedoc'
import { commentText, findChild, loadFixture, modifierTags } from './helpers'

describe('IsaacScript-style unexported @enum object', () => {
  const project = loadFixture('isaacscript-enum')

  test('converts the unexported, tagged object literal as an Enum', () => {
    const cacheFlagInternal = findChild(project, 'CacheFlagInternal')
    expect(cacheFlagInternal).toBeDefined()
    expect(cacheFlagInternal?.kind).toBe(ReflectionKind.Enum)
    expect(modifierTags(cacheFlagInternal)).toContain('@notExported')

    const members = ['DAMAGE', 'FIRE_DELAY', 'SHOT_SPEED']
    for (const memberName of members) {
      const member = findChild(cacheFlagInternal, memberName)
      expect(member).toBeDefined()
      expect(member?.kind).toBe(ReflectionKind.EnumMember)
      expect(commentText(member)).not.toBe('')
    }
  })

  test('the exported alias retains every documented member', () => {
    const cacheFlag = findChild(project, 'CacheFlag')
    expect(cacheFlag).toBeDefined()

    const declaration = cacheFlag?.type?.declaration
    expect(declaration).toBeDefined()

    const expectedComments: Record<string, string> = {
      DAMAGE: '1 << 0 (1)',
      FIRE_DELAY: '1 << 1 (2)',
      SHOT_SPEED: '1 << 2 (4)',
    }

    for (const [memberName, expectedComment] of Object.entries(
      expectedComments
    )) {
      const member = findChild(declaration, memberName)
      expect(member).toBeDefined()
      expect(commentText(member)).toBe(expectedComment)
    }
  })
})
