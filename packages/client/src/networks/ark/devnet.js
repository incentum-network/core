module.exports = {
  'name': 'devnet',
  'messagePrefix': 'DARK message:\n',
  'bip32': {
    'public': 0x2bf4968,
    'private': 0x2bf4530
  },
  'pubKeyHash': 30,
  'nethash': '578e820911f24e039733b45e4882b73e301f813a0d2c31330dafda84534ffa23',
  'wif': 170,
  'client': {
    'token': 'DARK',
    'symbol': 'DѦ',
    'explorer': 'https://dexplorer.ark.io'
  },
  'peers': [{
    'ip': '167.114.29.32',
    'port': 4002
  }, {
    'ip': '167.114.29.33',
    'port': 4002
  }, {
    'ip': '167.114.29.34',
    'port': 4002
  }, {
    'ip': '167.114.29.35',
    'port': 4002
  }, {
    'ip': '167.114.29.36',
    'port': 4002
  }],
  'constants': [{
    'height': 1,
    'reward': 0,
    'activeDelegates': 51,
    'blocktime': 8,
    'block': {
      'version': 0,
      'maxTransactions': 50,
      'maxPayload': 2097152
    },
    'epoch': '2017-03-21T13:00:00.000Z',
    'fees': {
      'transfer': 10000000,
      'secondSignature': 500000000,
      'delegate': 2500000000,
      'vote': 100000000,
      'multiSignature': 500000000,
      'ipfs': 0,
      'timelockTransfer': 0,
      'multiPayment': 0,
      'delegateResignation': 0
    }
  }, {
    'height': 75600,
    'reward': 200000000
  }],
  'exceptions': {}
}
