import feeManager from '@/managers/fee'
import Transaction from '@/builder/transaction'
import { TRANSACTION_TYPES } from '@/constants'

export default class MultiSignature extends Transaction {
  /**
   * @constructor
   * @return {[type]} [description]
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.MULTI_SIGNATURE
    this.fee = 0
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { multisignature: {} }
  }

  /**
   * [create description]
   * Overrides the inherited method to add the necessary parameters
   * @param  {[type]} keysgroup [description]
   * @param  {[type]} lifetime  [description]
   * @param  {[type]} min       [description]
   * @return {[type]}           [description]
   */
  create (keysgroup, lifetime, min) {
    this.asset.multisignature.keysgroup = keysgroup
    this.asset.multisignature.lifetime = lifetime
    this.asset.multisignature.min = min
    this.fee = (keysgroup.length + 1) * feeManager.get(TRANSACTION_TYPES.MULTI_SIGNATURE)
    return this
  }

  /**
   * [getStruct description]
   * Overrides the inherited method to return the additional required by this
   * @return {Object} [description]
   */
  getStruct () {
    const struct = super.getStruct()
    struct.amount = this.amount
    struct.recipientId = this.recipientId
    struct.asset = this.asset
    return struct
  }
}
