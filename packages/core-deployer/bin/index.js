#!/usr/bin/env node

const commander = require('commander')
const assert = require('assert-plus')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { updateConfig } = require('../src/utils')

commander
  .version(require('../package.json').version)
  .option('--network <value>', 'Network')
  .option('--p2pPort <value>', 'P2P API Port')
  .option('--pubPort <value>', 'Public P2P Port')
  .option('--dbHost <value>', 'Database host')
  .option('--dbPort <value>', 'Database port')
  .option('--dbUsername <value>', 'Database username')
  .option('--dbPassword <value>', 'Database password')
  .option('--dbDatabase <value>', 'Database name')
  .option('--nodeIp <value>', 'IP for node')
  .option('--nodePort <value>', 'Port for node')
  .option('--activeDelegates <value>', 'How many forgers for the network [51]')
  .option('--feeSend <value>', 'Fee for sending Transaction')
  .option('--feeVote <value>', 'Fee for Vote Transaction')
  .option('--feeSecondSignature <value>', 'Fee for Second Passphrase Transaction')
  .option('--feeDelegate <value>', 'Fee for Register Delegate Transaction')
  .option('--feeMultisig <value>', 'Fee for Multisignature Transaction')
  .option('--epoch <value>', 'Set Epoch based on time the chain was created')
  .option('--rewardHeight <value>', 'Block Height when Forgers receive Rewards [75600]')
  .option('--rewardBlock <value>', 'How many Rewarded Tokens per Forged Block [200000000 (2)]')
  .option('--blocktime <value>', 'Time per block (seconds) [8]')
  .option('--token <value>', 'Token Name [MINE]')
  .option('--symbol <value>', 'Symbol for Token [M]')
  .option('--prefix <value>', 'Address Prefix [M]')
  .option('--transactionsPerBlock <value>', 'Max Transaciton count per Block [50]')
  // .option('--max-votes', 'Max Votes per Wallet [1]')
  // .option('--total-premine', 'How many tokens initially added to genesis account [2100000000000000 (21 million)]')
  // .option('--max-tokens-per-account', 'Max amount of tokens per account [12500000000000000 (125 million)]')
  .parse(process.argv)

assert.number(commander.feeSend)
assert.number(commander.feeVote)
assert.number(commander.feeSecondSignature)
assert.number(commander.feeDelegate)
assert.number(commander.feeMultisignature)

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}

process.env.ARK_CONFIG = path.resolve(os.homedir(), '.ark')

if (!fs.existsSync(process.env.ARK_CONFIG)) {
  fs.copy(`./config/${commander.network}`, process.env.ARK_CONFIG)
}

const networkConfig = {
  'constants[0].activeDelegates': commander.activeDelegates,
  'constants[0].fees.send': commander.feeSend,
  'constants[0].fees.vote': commander.feeVote,
  'constants[0].fees.secondsignature': commander.feeSecondSignature,
  'constants[0].fees.delegate': commander.feeDelegate,
  'constants[0].fees.multisignature': commander.feeMultisignature,
  'constants[0].epoch': commander.epoch,
  'constants[0].blocktime': commander.blocktime,
  'client.token': commander.token,
  'client.symbol': commander.symbol,
  pubKeyHash: commander.prefix,
  nethash: commander.nethash,
  'constants[0].block.maxTransactions': commander.transactionsPerBlock
}

if (commander.rewardHeight === 1) {
  networkConfig['constants[0].height'] = commander.rewardHeight
  networkConfig['constants[0].reward'] = commander.rewardBlock
  delete networkConfig.constants[1]
} else {
  networkConfig['constants[1].height'] = commander.rewardHeight
  networkConfig['constants[1].reward'] = commander.rewardBlock
}

updateConfig('network', networkConfig)

updateConfig('server', {
  port: commander.p2pPort,
  'database.options.uri': `postgres://${commander.dbUsername}:${commander.dbPassword}@${commander.dbHost}:${commander.dbPort}/${commander.dbDatabase}`,
  'database.options.dialect': 'postgres'
})

updateConfig('api/public', { port: commander.pubPort })
