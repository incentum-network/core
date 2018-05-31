const isObject = require('../../utils/is-object')

module.exports = class WhereNotBetweenConcern {
  static apply () {
    const args = arguments[0]

    const transform = (condition) => {
      return {
        column: condition[0],
        operator: 'NOT BETWEEN',
        from: condition[1],
        to: condition[2]
      }
    }

    return isObject(args[0])
      ? args[0].map(arg => transform(arg))
      : transform(args)
  }
}
