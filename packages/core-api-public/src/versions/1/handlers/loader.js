'use strict';

const blockchain = require('@arkecosystem/core-plugin-manager').get('blockchain')
const state = blockchain.getState()
const config = require('@arkecosystem/core-plugin-manager').get('config')
const utils = require('../utils')

/**
 * [status description]
 * @type {Object}
 */
exports.status = {
  handler: (request, h) => {
    return utils.respondWith({
      loaded: blockchain.isSynced(),
      now: state.lastBlock ? state.lastBlock.data.height : 0,
      blocksCount: blockchain.networkInterface.getNetworkHeight() - state.lastBlock.data.height
    })
  }
}

/**
 * [syncing description]
 * @type {Object}
 */
exports.syncing = {
  handler: (request, h) => {
    return utils.respondWith({
      syncing: !blockchain.isSynced(),
      blocks: blockchain.networkInterface.getNetworkHeight() - state.lastBlock.data.height,
      height: state.lastBlock.data.height,
      id: state.lastBlock.data.id
    })
  }
}

/**
 * [autoconfigure description]
 * @type {Object}
 */
exports.autoconfigure = {
  handler: (request, h) => {
    return utils.respondWith({
      network: {
        nethash: config.network.nethash,
        token: config.network.client.token,
        symbol: config.network.client.symbol,
        explorer: config.network.client.explorer,
        version: config.network.pubKeyHash
      }
    })
  }
}
