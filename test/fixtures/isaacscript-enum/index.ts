/**
 * This is represented as an object instead of an enum due to limitations with
 * TypeScript enums.
 *
 * @enum
 * @notExported
 */
const CacheFlagInternal = {
  /** 1 << 0 (1) */
  DAMAGE: 1 << 0,

  /** 1 << 1 (2) */
  FIRE_DELAY: 1 << 1,

  /** 1 << 2 (4) */
  SHOT_SPEED: 1 << 2,
} as const

export const CacheFlag = CacheFlagInternal
