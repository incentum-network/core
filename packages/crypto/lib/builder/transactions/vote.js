const feeManager = require('../../managers/fee')
const { TRANSACTION_TYPES } = require('../../constants')
const TransactionBuilder = require('./transaction')
const sign = require('./mixins/sign')

class VoteBuilder extends TransactionBuilder {
  /**
   * @constructor
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.VOTE
    this.fee = feeManager.get(TRANSACTION_TYPES.VOTE)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { votes: {} }
  }

  /**
   * Create vote transaction with delegate votes.
   * @param  {Array} delegates
   * @return {VoteBuilder}
   */
  create (delegates) {
    this.asset.votes = delegates
    return this
  }

  /**
   * Overrides the inherited method to return the additional required by this
   * @return {Object}
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.amount
    struct.recipientId = this.recipientId
    struct.asset = this.asset
    return struct
  }
}

module.exports = sign.mixin(VoteBuilder)
