'use strict'

const assert = require('assert')

const microtime = require('./microtime')

const toNumber = str => parseInt(str, 10)

module.exports = class Limiter {
  constructor ({ id, db, max = 2500, duration = 3600000, namespace = 'limit' }) {
    assert(db, 'db required')
    this.db = db
    this.id = id
    this.max = max
    this.duration = duration
    this.namespace = namespace
  }

  async get ({ id = this.id, max = this.max, duration = this.duration } = {}) {
    assert(id, 'id required')
    assert(max, 'max required')
    assert(duration, 'duration required')

    const key = `${this.namespace}:${id}`
    const now = microtime.now()
    const start = now - duration * 1000

    const operations = [
      ['zremrangebyscore', key, 0, start],
      ['zcard', key],
      ['zadd', key, now, now],
      ['zrange', key, 0, 0],
      ['zrange', key, -max, -max],
      ['zremrangebyrank', key, 0, -(max + 1)],
      ['pexpire', key, duration]
    ]

    const res = await this.execRedis(operations);
    const count = toNumber(res[1])
    const oldest = toNumber(res[3][0])
    const oldestInRange = toNumber(res[4][0])
    const resetMicro = (Number.isNaN(oldestInRange) ? oldest : oldestInRange) + duration * 1000

    return {
      remaining: count < max ? max - count : 0,
      reset: Math.floor(resetMicro / 1000000),
      total: max
    }
  }

  async execRedis(operations) {
    return new Promise((resolve, reject) => {
      this.db.multi(operations).exec((err, res) => {
        if (err) {
          reject(err);
        } 

        resolve(res);
      });
    });
  }
}
