'use strict'

const { TRANSFER } = require('@arkecosystem/client').constants

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid TRANSFER transaction.',
    pass: received.type === TRANSFER
  }
}
