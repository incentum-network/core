#! /usr/bin/env node

const commander = require('commander')
const packageJson = require('../package.json')
const logger = require('../src/core/logger')
const config = require('../src/core/config')
const BlockchainManager = require('../src/core/managers/blockchain')
const P2PInterface = require('../src/api/p2p/p2pinterface')
const DB = require('../src/core/dbinterface')
const QueueManager = require('../src/core/managers/queue')
const WebhookManager = require('../src/core/managers/webhook')
const DependencyHandler = require('../src/core/dependency-handler')
const PublicAPI = require('../src/api/public')
const TransactionHandler = require('../src/core/transaction-handler')

commander
  .version(packageJson.version)
  .option('-c, --config <path>', 'config files path')
  .option('-i, --interactive', 'launch cli')
  .parse(process.argv)

process.on('unhandledRejection', (reason, p) => console.error(`Unhandled Rejection at: ${JSON.stringify(p)} reason: ${JSON.stringify(reason)}`))

const start = async () => {
  try {
    await config.init(commander.config)
    await logger.init(config.server.logging, config.network.name)

    const blockchainManager = await new BlockchainManager(config)

    logger.info('Initialising Dependencies...')
    await DependencyHandler.checkDatabaseLibraries(config)

    logger.info('Initialising Queue Manager...')
    await new QueueManager(config.server.redis)

    logger.info('Initialising Webhook Manager...')
    await new WebhookManager(config.webhooks).init()

    logger.info('Initialising Database Interface...')
    const db = await DB.create(config.server.database)
    await blockchainManager.attachDBInterface(db)

    logger.info('Initialising P2P Interface...')
    const p2p = new P2PInterface(config)
    await p2p.warmup()
    await blockchainManager.attachNetworkInterface(p2p)

    logger.info('Initialising Transaction Pool...')
    const txHandler = await new TransactionHandler(config)
    await blockchainManager.attachTransactionHandler(txHandler)

    logger.info('Initialising Blockchain Manager...')
    await blockchainManager.start()
    await blockchainManager.isReady()

    logger.info('Initialising Public API...')
    await PublicAPI(config)
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

start()
