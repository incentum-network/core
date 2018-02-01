const logger = requireFrom('core/logger')
const Hapi = require('hapi')

module.exports = class PublicAPI {
  constructor (config) {
    if (!config.server.api.mount) {
      return logger.info('Public API not mounted!')
    }

    const serverConfig = {
      host: 'localhost',
      port: config.server.api.port
    }

    if (config.server.api.cache) {
      serverConfig.cache = [{
        name: 'redisCache',
        engine: require('catbox-redis'),
        host: '127.0.0.1',
        partition: 'cache'
      }]
    }

    const server = Hapi.server(serverConfig)

    async function start () {
      try {
        await server.register({
          plugin: require('hapi-api-version'),
          options: {
            validVersions: [1, 2],
            defaultVersion: config.server.api.version,
            vendorName: 'arkpublic',
            basePath: '/api/'
          }
        })

        await server.register({
          plugin: require('hapi-rate-limit'),
          options: {
            pathLimit: false
          }
        })

        await server.register(require('./plugins/caster'))

        await server.register(require('./plugins/validation'))

        await server.register({
          plugin: require('hapi-pagination'),
          options: {
            results: {
              name: 'data'
            },
            routes: {
              include: [
                '/api/v2/blocks',
                '/api/v2/blocks/{id}/transactions',
                '/api/v2/blocks/search',
                '/api/v2/delegates',
                '/api/v2/delegates/{id}/blocks',
                '/api/v2/delegates/{id}/voters',
                '/api/v2/multisignatures',
                '/api/v2/peers',
                '/api/v2/signatures',
                '/api/v2/transactions',
                '/api/v2/transactions/search',
                '/api/v2/votes',
                '/api/v2/wallets',
                '/api/v2/wallets/{id}/transactions',
                '/api/v2/wallets/{id}/transactions/received',
                '/api/v2/wallets/{id}/transactions/send',
                '/api/v2/wallets/{id}/votes',
                '/api/v2/wallets/search'
              ],
              exclude: ['*']
            }
          }
        })

        await server.register([
          require('./versions/1/routes'),
          require('./versions/2/routes')
        ], {
          routes: {
            prefix: '/api'
          }
        })

        await server.start()
      } catch (err) {
        logger.error(err)

        process.exit(1)
      }

      logger.info(`✅  Public API is listening on ${server.info.uri}`)
    }

    start()
  }
}
