'use strict'

const ark = require('arkjs')
const delay = require('delay')
const utils = require('../utils')
const logger = utils.logger
const superheroes = require('superheroes')
const transactionCommand = require('./transactions')

module.exports = async (options) => {
  const wallets = utils.generateWallet(options.number)
  await transactionCommand(options, wallets, 50, true)

  const delegates = await utils.getDelegates()

  logger.info(`Starting delegate count: ${delegates.length}`)

  const transactions = []
  const usedDelegateNames = {}
  wallets.forEach((wallet, i) => {
    wallet.username = superheroes.random()
    while (typeof usedDelegateNames[wallet.username] !== 'undefined') {
      wallet.username = superheroes.random()
    }
    wallet.username = wallet.username.toLowerCase().replace(/ /g, '_')
    const transaction = ark.delegate.createDelegate(wallet.passphrase, wallet.username)
    transactions.push(transaction)

    logger.info(`${i} ==> ${transaction.id}, ${wallet.address} (${wallet.username})`)
  })

  if (options.copy) {
    utils.copyToClipboard(transactions)
    process.exit() // eslint-disable-line no-unreachable
  }

  const expectedDelegates = delegates.length + wallets.length
  logger.info(`Expected end delegate count: ${expectedDelegates}`)

  try {
    await utils.request.post('/peer/transactions', {transactions}, true)

    const delaySeconds = await utils.getTransactionDelay(transactions)
    logger.info(`Waiting ${delaySeconds} seconds to apply delegate transactions`)
    await delay(delaySeconds * 1000)

    const delegates = await utils.getDelegates()
    logger.info(`All transactions have been sent! Total delegates: ${delegates.length}`)

    if (delegates.length !== expectedDelegates) {
      logger.error(`Delegate count incorrect. '${delegates.length}' but should be '${expectedDelegates}'`)
    }
  } catch (error) {
    logger.error(`There was a problem sending transactions: ${error.response.data.message}`)
  }
}
