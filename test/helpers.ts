import * as fs from 'fs'
import * as path from 'path'

export interface JsonCommentPart {
  kind: string
  text: string
}

export interface JsonComment {
  summary?: JsonCommentPart[]
  blockTags?: Array<{ tag: string; content: JsonCommentPart[] }>
  modifierTags?: string[]
}

export interface JsonType {
  type: string
  target?: number | Record<string, unknown>
  declaration?: JsonReflection
  [key: string]: unknown
}

export interface JsonReflection {
  id: number
  name: string
  kind: number
  comment?: JsonComment
  children?: JsonReflection[]
  type?: JsonType
  signatures?: JsonReflection[]
  [key: string]: unknown
}

/** Reads and parses the `output.json` file generated for the given fixture. */
export function loadFixture(fixtureName: string): JsonReflection {
  const outputPath = path.join(
    __dirname,
    'fixtures',
    fixtureName,
    'output.json'
  )
  const contents = fs.readFileSync(outputPath, 'utf8')
  return JSON.parse(contents) as JsonReflection
}

/** Finds the first direct child with the given name. */
export function findChild(
  reflection: JsonReflection | undefined,
  name: string
): JsonReflection | undefined {
  return reflection?.children?.find((child) => child.name === name)
}

/** Finds every direct child with the given name (fixtures can have more than one). */
export function findChildren(
  reflection: JsonReflection | undefined,
  name: string
): JsonReflection[] {
  return reflection?.children?.filter((child) => child.name === name) ?? []
}

/** Recursively searches the reflection tree for a reflection with the given id. */
export function findById(
  reflection: JsonReflection | undefined,
  id: number
): JsonReflection | undefined {
  if (!reflection) {
    return undefined
  }
  if (reflection.id === id) {
    return reflection
  }
  for (const child of reflection.children ?? []) {
    const found = findById(child, id)
    if (found) {
      return found
    }
  }
  return undefined
}

/** Returns the plain-text contents of a reflection's comment summary. */
export function commentText(reflection: JsonReflection | undefined): string {
  const summary = reflection?.comment?.summary ?? []
  return summary.map((part) => part.text).join('')
}

/** Returns the modifier tags (e.g. `@notExported`) recorded on a reflection's comment. */
export function modifierTags(reflection: JsonReflection | undefined): string[] {
  return reflection?.comment?.modifierTags ?? []
}

/** Returns the block tags (e.g. `@param`) recorded on a reflection's comment. */
export function blockTagNames(
  reflection: JsonReflection | undefined
): string[] {
  return (reflection?.comment?.blockTags ?? []).map((tag) => tag.tag)
}
