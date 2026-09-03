/**
 * @notExported
 */
interface Helper {
  value: number
}

/**
 * @notExported
 */
class InnerHelper {
  describe(): string {
    return 'inner'
  }
}

export class Service {
  method(): Helper {
    return { value: 1 }
  }

  nested = {
    deeper: {
      helper(): InnerHelper {
        return new InnerHelper()
      },
    },
  }
}
