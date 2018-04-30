module.exports = {
  init: {
    '@arkecosystem/core-event-emitter': {},
    '@arkecosystem/core-config': {},
    '@arkecosystem/core-config-json': {}
  },
  beforeCreate: {
    '@arkecosystem/core-logger': {},
    '@arkecosystem/core-logger-winston': {},
    '@arkecosystem/core-webhooks': {
      database: {
        uri: 'sqlite:~/.ark/database/webhooks.sqlite',
        dialect: 'sqlite',
        logging: false
      },
      redis: {
        host: 'localhost',
        port: 6379
      }
    },
    '@arkecosystem/core-blockchain': {}
  },
  beforeMount: {
    '@arkecosystem/core-database': {},
    '@arkecosystem/core-database-sequelize': {
      uri: 'sqlite:~/.ark/database/testnet.sqlite',
      uri_1: 'postgres://node:password@localhost:5432/ark_testnet',
      dialect: 'sqlite',
      dialect_1: 'postgres'
    },
    '@arkecosystem/core-api-p2p': {
      port: 4000
    },
    '@arkecosystem/core-transaction-pool-redis': {}
  },
  mounted: {
    '@arkecosystem/core-api-public': {},
    '@arkecosystem/core-api-webhooks': {},
    '@arkecosystem/core-forger': {}
  }
}
