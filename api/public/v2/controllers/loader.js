const blockchain = require(__root + 'core/blockchainManager')
const config = require(__root + 'core/config')
const p2pInterface = require(__root + 'api/p2p/p2pinterface')
const responseOk = require(__root + 'api/public/v2/responses/ok')

class LoaderController {
    status(req, res, next) {
        const instance = blockchain.getInstance()

        responseOk.send(req, res, {
            loaded: instance.isSynced(instance.lastBlock),
            now: instance.lastBlock ? instance.lastBlock.data.height : 0,
            blocksCount: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height
        })

        next()
    }

    syncing(req, res, next) {
        const instance = blockchain.getInstance()

        responseOk.send(req, res, {
            syncing: !instance.isSynced(instance.lastBlock),
            blocks: instance.networkInterface.getNetworkHeight() - instance.lastBlock.data.height,
            height: instance.lastBlock.data.height,
            id: instance.lastBlock.data.id
        })

        next()
    }

    configuration(req, res, next) {
        responseOk.send(req, res, {
            network: {
                nethash: config.network.nethash,
                token: config.network.client.token,
                symbol: config.network.client.symbol,
                explorer: config.network.client.explorer,
                version: config.network.pubKeyHash
            }
        })

        next()
    }
}

module.exports = new LoaderController
