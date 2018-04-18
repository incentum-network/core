'use strict';

const crypto = require('crypto')

/**
 * [description]
 * @param  {[type]} bip38    [description]
 * @param  {[type]} address  [description]
 * @param  {[type]} password [description]
 * @return {[type]}          [description]
 */
exports.encrypt = (bip38, address, password) => {
  const cipher = crypto.createCipher('aes-256-ctr', password)

  return cipher.update(`${bip38}:${address}`, 'utf8', 'hex') + cipher.final('hex')
}

/**
 * [description]
 * @param  {[type]} value    [description]
 * @param  {[type]} password [description]
 * @return {[type]}          [description]
 */
exports.decrypt = (value, password) => {
  const decipher = crypto.createDecipher('aes-256-ctr', password)

  return (decipher.update(value, 'hex', 'utf8') + decipher.final('utf8')).split(':')
}
