const logger = require('@arkecosystem/core-module-loader').get('logger')
const Manager = require('./manager')

exports.plugin = {
  pkg: require('../package.json'),
  alias: 'webhooks',
  register: async(hook, config, app) => {
    logger.info('Initialising Webhook Manager...')

    const manager = new Manager(config)
    await manager.boot(config)

    // logger.info('Initialising Webhook API...')

    // await Server(config)

    return Manager.getInstance()
  }
}
