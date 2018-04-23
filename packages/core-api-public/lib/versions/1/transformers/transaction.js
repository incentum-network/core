'use strict';

const { crypto } = require('@arkecosystem/client')
const blockchainManager = require('@arkecosystem/core-plugin-manager').get('blockchain')
const state = blockchainManager.getState()
const config = require('@arkecosystem/core-plugin-manager').get('config')
const { Transaction } = require('@arkecosystem/client').models

/**
 * [description]
 * @param  {[type]} model [description]
 * @return {[type]}       [description]
 */
module.exports = (model) => {
  const lastBlock = state.lastBlock
  const data = Transaction.deserialize(model.serialized.toString('hex'))

  return {
    id: data.id,
    blockid: model.blockId,
    type: data.type,
    timestamp: data.timestamp,
    amount: data.amount,
    fee: data.fee,
    recipientId: data.recipientId,
    senderId: crypto.getAddress(data.senderPublicKey, config.network.pubKeyHash),
    senderPublicKey: data.senderPublicKey,
    signature: data.signature,
    asset: data.asset,
    confirmations: lastBlock ? lastBlock.data.height - model.block.height : 0
  }
}
