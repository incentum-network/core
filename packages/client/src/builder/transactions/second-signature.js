import feeManager from '@/managers/fee'
import Transaction from '@/builder/transaction'
import { TRANSACTION_TYPES } from '@/constants'

export default class SecondSignature extends Transaction {
  /**
   * @constructor
   * @return {[type]} [description]
   */
  constructor () {
    super()

    this.type = TRANSACTION_TYPES.SECOND_SIGNATURE
    this.fee = feeManager.get(TRANSACTION_TYPES.SECOND_SIGNATURE)
    this.amount = 0
    this.recipientId = null
    this.senderPublicKey = null
    this.asset = { signature: {} }
  }

  /**
   * [sign description]
   * Overrides the inherited `sign` method to include the generated second
   * signature
   * @param  {String} passphrase [description]
   * @return {[type]}            [description]
   */
  sign (passphrase) {
    super.sign(passphrase)
    this.asset.signature = this.signature
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
