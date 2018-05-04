const expandHomeDir = require('expand-home-dir')
const formatter = require('@arkecosystem/core-logger-winston').formatter

module.exports = {
  init: {
    '@arkecosystem/core-event-emitter': {},
    '@arkecosystem/core-config': {},
    '@arkecosystem/core-config-json': {}
  },
  beforeCreate: {
    '@arkecosystem/core-logger': {},
    '@arkecosystem/core-logger-winston': {
      transports: [{
        constructor: 'Console',
        options: {
          colorize: true,
          level: 'debug',
          timestamp: () => Date.now(),
          formatter: (info) => formatter(info)
        }
      }, {
        package: 'winston-daily-rotate-file',
        constructor: 'DailyRotateFile',
        options: {
          filename: expandHomeDir(`${process.env.ARK_PATH_DATA}/logs/core/testnet/`) + '%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'debug',
          zippedArchive: true
        }
      }]
    },
    '@arkecosystem/core-blockchain': {}
  },
  beforeMount: {
    '@arkecosystem/core-database': {
      snapshots: `${process.env.ARK_PATH_DATA}/testnet/snapshots`
    },
    '@arkecosystem/core-database-sequelize': {
      uri: `sqlite:${process.env.ARK_PATH_DATA}/database/testnet.sqlite`,
      dialect: 'sqlite'
        // uri: 'postgres://node:password@localhost:5432/ark_testnet',
        // dialect: 'postgres'
    },
    '@arkecosystem/core-api-p2p': {
      port: 4000,
      remoteinterface: true
    },
    '@arkecosystem/core-transaction-pool': {},
    '@arkecosystem/core-transaction-pool-redis': {
      enabled: true,
      key: 'ark/pool',
      maxTransactionsPerSender: 5,
      whiteList: [],
      redis: {
        host: 'localhost',
        port: 6379
      }
    }
  },
  mounted: {
    '@arkecosystem/core-api-public': {
      enabled: true,
      port: 4102
    },
    '@arkecosystem/core-webhooks': {},
    '@arkecosystem/core-api-webhooks': {
      enabled: true,
      port: 4102
    },
    '@arkecosystem/core-graphql': {},
    '@arkecosystem/core-api-graphql': {},
    '@arkecosystem/core-forger': {}
  }
}
