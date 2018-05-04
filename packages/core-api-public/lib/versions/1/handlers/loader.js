'use strict'

const container = require('@arkecosystem/core-container')
const config = container.get('config')
const blockchain = container.get('blockchain')
const state = blockchain.getState()
const utils = require('../utils')

/**
 * @type {Object}
 */
exports.status = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return utils.respondWith({
      loaded: blockchain.isSynced(),
      now: state.lastBlock ? blockchain.getLastBlock(true).height : 0,
      blocksCount: blockchain.p2p.getNetworkHeight() - blockchain.getLastBlock(true).height
    })
  }
}

/**
 * @type {Object}
 */
exports.syncing = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return utils.respondWith({
      syncing: !blockchain.isSynced(),
      blocks: blockchain.p2p.getNetworkHeight() - blockchain.getLastBlock(true).height,
      height: blockchain.getLastBlock(true).height,
      id: blockchain.getLastBlock(true).id
    })
  }
}

/**
 * @type {Object}
 */
exports.autoconfigure = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
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
