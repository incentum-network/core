const LRU = require('lru-cache')

module.exports = class Table {
  constructor (options) {
    this.table = new LRU(options.size || 10000)
  }

  get (key) {
    return this.table.get(key)
  }

  set (key, value) {
    return this.table.set(key, value)
  }
}
