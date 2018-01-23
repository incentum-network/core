const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const helpers = require('../helpers')

class LoaderController {
  status (req, res, next) {
    const lastBlock = blockchain.status.lastBlock

    helpers.respondWith('ok', {
      loaded: blockchain.isSynced(lastBlock),
      now: lastBlock ? lastBlock.data.height : 0,
      blocksCount: blockchain.networkInterface.getNetworkHeight() - lastBlock.data.height
    })
  }

  syncing (req, res, next) {
    const lastBlock = blockchain.status.lastBlock

    helpers.respondWith('ok', {
      syncing: !blockchain.isSynced(lastBlock),
      blocks: blockchain.networkInterface.getNetworkHeight() - lastBlock.data.height,
      height: lastBlock.data.height,
      id: lastBlock.data.id
    })
  }

  configuration (req, res, next) {
    helpers.respondWith('ok', {
      nethash: config.network.nethash,
      token: config.network.client.token,
      symbol: config.network.client.symbol,
      explorer: config.network.client.explorer,
      version: config.network.pubKeyHash
    })
  }
}

module.exports = new LoaderController()
