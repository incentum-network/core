module.exports = {
  '@arkecosystem/core-event-emitter': {},
  '@arkecosystem/core-validation': {},
  '@arkecosystem/core-config': {},
  '@arkecosystem/core-config-json': {},
  '@arkecosystem/core-logger': {},
  '@arkecosystem/core-logger-winston': {},
  '@arkecosystem/core-database': {},
  '@arkecosystem/core-database-sequelize': {
    // uri: 'postgres://node:password@localhost:5432/ark_testnet',
    // dialect: 'postgres'
  },
  '@arkecosystem/core-transaction-pool': {},
  '@arkecosystem/core-transaction-pool-redis': {},
  '@arkecosystem/core-p2p': {
    port: 4000
  },
  '@arkecosystem/core-blockchain': {},
  '@arkecosystem/core-api': {
    port: 4102
  },
  '@arkecosystem/core-webhooks': {},
  '@arkecosystem/core-webhooks-api': {
    port: 4103
  },
  '@arkecosystem/core-graphql': {},
  '@arkecosystem/core-graphql-api': {},
  '@arkecosystem/core-forger': {}
}
