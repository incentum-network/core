'use strict'

const { Op } = require('sequelize')
const moment = require('moment')
const { slots } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const buildFilterQuery = require('./utils/filter-query')

const Redis = require('ioredis')

module.exports = class TransactionsRepository {
  /**
   * Create a new transaction repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
    this.query = connection.query

    this.redis = new Redis()
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (params = {}) {
    const whereStatement = this.__formatConditions(params)

    if (params['senderId']) {
      const wallet = this.connection.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) {
        whereStatement['senderPublicKey'] = wallet.publicKey
      }
    }

    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const buildQuery = (query) => {
      return query
        .from('transactions')
        .whereKeyValuePairs(whereStatement)
    }

    let transactions = await buildQuery(this.query.select(['blockId', 'serialized']))
      .sortBy(orderBy[0], orderBy[1])
      .take(params.limit)
      .skip(params.offset)
      .all()

    // let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count: transactions.length
      // count: count.count
    }
  }

  /**
   * Get all transactions for the given Wallet object.
   * @param  {Wallet} wallet
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByWallet (wallet, params) {
    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const buildQuery = (query) => {
      return query
        .from('transactions')
        .where('senderPublicKey', wallet.publicKey)
        .orWhere('recipientId', wallet.address)
    }

    let transactions = await buildQuery(this.query.select(['blockId', 'serialized']))
      .sortBy(orderBy[0], orderBy[1])
      .take(params.limit)
      .skip(params.offset)
      .all()

    let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count: count.count
    }
  }

  /**
   * Get all transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  findAllBySender (senderPublicKey, params) {
    return this.findAll({...{senderPublicKey}, ...params})
  }

  /**
   * Get all transactions for the given recipient address.
   * @param  {String} recipientId
   * @param  {Object} params
   * @return {Object}
   */
  findAllByRecipient (recipientId, params) {
    return this.findAll({...{recipientId}, ...params})
  }

  /**
   * Get all vote transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  allVotesBySender (senderPublicKey, params) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...params})
  }

  /**
   * Get all transactions for the given block.
   * @param  {Number} blockId
   * @param  {Object} params
   * @return {Object}
   */
  findAllByBlock (blockId, params) {
    return this.findAll({...{blockId}, ...params})
  }

  /**
   * Get all transactions for the given type.
   * @param  {Number} type
   * @param  {Object} params
   * @return {Object}
   */
  findAllByType (type, params) {
    return this.findAll({...{type}, ...params})
  }

  /**
   * Get a transaction.
   * @param  {Object} conditions
   * @return {Object}
   */
  async findOne (conditions) {
    const transaction = await this.query
      .select(['blockId', 'serialized'])
      .from('transactions')
      .whereKeyValuePairs(conditions)
      .first()

    return this.__mapBlocksToTransactions(transaction)
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.findOne({ id })
  }

  /**
   * Get a transactions for the given type and id.
   * @param  {Number} type
   * @param  {Number} id
   * @return {Object}
   */
  findByTypeAndId (type, id) {
    return this.findOne({ id, type })
  }

  /**
   * Search all transactions.
   * @param  {Object} payload
   * @return {Object}
   */
  async search (params) {
    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const conditions = buildFilterQuery(params, {
      exact: ['id', 'blockId', 'type', 'version', 'senderPublicKey', 'recipientId'],
      between: ['timestamp', 'amount', 'fee'],
      wildcard: ['vendorFieldHex']
    })

    const buildQuery = (query) => {
      return query
        .from('transactions')
        .whereStruct(conditions)
    }

    let transactions = await buildQuery(this.query.select(['blockId', 'serialized']))
      .sortBy(orderBy[0], orderBy[1])
      .take(params.limit)
      .skip(params.offset)
      .all()

    let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count: count.count
    }
  }

  /**
   * Get all transactions that have a vendor field.
   * @return {Object}
   */
  async findWithVendorField () {
    let transactions = await this.query
      .select(['blockId', 'serialized'])
      .from('transactions')
      .whereNotNull('vendorFieldHex')
      .all()

    return this.__mapBlocksToTransactions(transactions)
  }

  /**
   * Count all transactions.
   * @return {Number}
   */
  count () {
    return this
      .connection
      .query
      .select('COUNT(DISTINCT id) as count')
      .from('transactions')
      .first()
  }

  /**
   * Calculates min, max and average fee statistics based on transactions table
   * @return {Object}
   */
  getFeeStatistics () {
    return this
      .connection
      .query
      .select([
        'type',
        'MAX("fee") AS "maxFee"',
        'MIN("fee") AS "minFee"',
        'MAX("timestamp") AS "timestamp"'
      ], false)
      .from('transactions')
      .where('timestamp', slots.getTime(moment().subtract(30, 'days')), '>=')
      .groupBy('type')
      .sortBy('timestamp', 'DESC')
      .all()
  }

  /**
   * Format any raw conditions.
   * @param  {Object} params
   * @return {Object}
   */
  __formatConditions (params) {
    let statement = {}

    const conditions = [Op.or, Op.and]
    const filter = (args) => args.filter(elem => ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId'].includes(elem))

    filter(Object.keys(params)).map(col => (statement[col] = params[col]))

    conditions.map(elem => {
      if (!params[elem]) {
        return
      }

      const fields = Object.assign({}, ...params[elem])
      statement[elem] = filter(Object.keys(fields)).reduce((prev, val) => prev.concat({ [val]: fields[val] }), [])
    })

    return statement
  }

  /**
   * [__mapBlocksToTransactions description]
   * @param  {Object} data
   * @return {Object}
   */
  async __mapBlocksToTransactions (data) {
    // Array...
    if (Array.isArray(data)) {
      // 1. get heights from cache
      const missingFromCache = []

      for (let i = 0; i < data.length; i++) {
        const cachedBlock = await this.__getBlockCache(data[i].blockId)

        if (cachedBlock) {
          data[i].block = cachedBlock
        } else {
          missingFromCache.push({
            index: i,
            blockId: data[i].blockId
          })
        }
      }

      // 2. get missing heights from database
      if (missingFromCache.length) {
        const blocks = await this.query
          .select(['id', 'height'])
          .from('blocks')
          .whereIn('id', missingFromCache.map(d => d.blockId).join('\',\''))
          .groupBy('id')
          .all()

        for (let i = 0; i < missingFromCache.length; i++) {
          const missing = missingFromCache[i]
          const block = blocks.find(block => (block.id === missing.blockId))

          data[missing.index].block = block

          this.__setBlockCache(block)
        }
      }

      return data
    }

    // Object...
    if (data) {
      const cachedBlock = await this.__getBlockCache(data.blockId)

      if (cachedBlock) {
        data.block = cachedBlock
      } else {
        const block = await this.query
          .select(['id', 'height'])
          .from('blocks')
          .where('id', data.blockId)
          .first()

        this.__setBlockCache(block)
      }
    }

    return data
  }

  /**
   * [__getBlockCache description]
   * @param  {[type]} blockId [description]
   * @return {[type]}         [description]
   */
  async __getBlockCache (blockId) {
    const cachedHeight = await this.redis.get(`heights:${blockId}`)

    if (cachedHeight) {
      return { height: cachedHeight }
    }

    return false
  }

  /**
   * [__setBlockCache description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  __setBlockCache (block) {
    this.redis.set(`heights:${block.id}`, block.height)
  }
}
