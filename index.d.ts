declare module '@digifi/async-ratelimiter' {
  import { RedisClient } from 'redis'

  namespace RateLimiter {
    interface ConstructorOptions {
      db: RedisClient
      max?: number
      duration?: number
      namespace?: string
      id?: string
    }

    interface GetOptions {
      id?: string
      max?: number
      duration?: number
    }

    interface Status {
      total: number
      remaining: number
      reset: number
    }
  }

  class RateLimiter {
    constructor(options: RateLimiter.ConstructorOptions)
    get(options: RateLimiter.GetOptions): Promise<RateLimiter.Status>
  }

  export = RateLimiter
}
