'use strict'

/**
 * Check if the given IP address is local.
 * @param  {*} value
 * @return {boolean}
 */
module.exports = (value) => {
  return value === '::1' || value === '127.0.0.1' || value === '::ffff:127.0.0.1'
}
