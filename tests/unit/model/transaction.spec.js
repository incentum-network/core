const Transaction = require('app/models/transaction')
const arkjs = require('arkjs')

const txdata = {
  version: 1,
  network: 23,
  type: 4,
  timestamp: 10112114,
  senderPublicKey: '036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760',
  recipientId: 'AMw3TiLrmVmwmFVwRzn96kkUsUpFTqsAEX',
  fee: 2000000000,
  asset: {
    multisignature: {
      min: 2,
      lifetime: 24,
      keysgroup: ['+03543c6cc3545be6bac09c82721973a052c690658283472e88f24d14739f75acc8', '+0276dc5b8706a85ca9fdc46e571ac84e52fbb48e13ec7a165a80731b44ae89f1fc', '+02e8d5d17eb17bbc8d7bf1001d29a2d25d1249b7bb7a5b7ad8b7422063091f4b31']}},
  signatures: ['304502210097f17c8eecf36f86a967cc52a83fa661e4ffc70cc4ea08df58673669406d424c0220798f5710897b75dda42f6548f841afbe4ed1fa262097112cf5a1b3f7dade60e4', '304402201a4a4c718bfdc699bbb891b2e89be018027d2dcd10640b5ddf07802424dab78e02204ec7c7d505d2158c3b51fdd3843d16aecd2eaaa4c6c7a555ef123c5e59fd41fb', '304402207e660489bced5ce80c33d45c86781b63898775ab4a231bb48780f97b40073a63022026f0cefd0d83022d822522ab4366a82e3b89085c328817919939f2efeabd913d'],
  signature: '30440220324d89c5792e4a54ae70b4f1e27e2f87a8b7169cc6f2f7b2c83dba894960f987022053b8d0ae23ff9d1769364db7b6fd03216d93753c82a711c3558045e787bc01a5',
  amount: 0,
  signSignature: '304402201fcd54a9ac9c0269b8cec213566ddf43207798e2cf9ca1ce3c5d315d66321c6902201aa94c4ed3e5e479a12220aa886b259e488eb89b697c711f91e8c03b9620e0b1',
  secondSignature: '304402201fcd54a9ac9c0269b8cec213566ddf43207798e2cf9ca1ce3c5d315d66321c6902201aa94c4ed3e5e479a12220aa886b259e488eb89b697c711f91e8c03b9620e0b1',
  id: 'a8eefb5c216845d2eccda5e489076bc70d2eaef8e8f127726c249c16187a25a4'
}

const createRandomTx = (type) => {
  arkjs.crypto.setNetworkVersion(0x17)
  switch (type) {
    case 0: // transfer
      return arkjs.transaction.createTransaction('AMw3TiLrmVmwmFVwRzn96kkUsUpFTqsAEX', ~~(Math.random() * Math.pow(10, 10)), Math.random().toString(36), Math.random().toString(36), Math.random().toString(36))
    case 1: // second signature
      return arkjs.signature.createSignature(Math.random().toString(36), Math.random().toString(36))
    case 2: // delegate registration
      return arkjs.delegate.createDelegate(Math.random().toString(36), Math.random().toString(12))
    case 3: // vote registration
      return arkjs.vote.createVote(Math.random().toString(36), ['+036928c98ee53a1f52ed01dd87db10ffe1980eb47cd7c0a7d688321f47b5d7d760'])
    case 4: // multisignature registration
      const ECkeys = [1, 2, 3].map(() => arkjs.crypto.getKeys(Math.random().toString(36)))
      const tx = arkjs.multisignature.createMultisignature(Math.random().toString(36), '', ECkeys.map(k => k.publicKey), 48, 2)
      const hash = arkjs.crypto.getHash(tx, true, true)
      tx.signatures = ECkeys.slice(1).map((k) => k.sign(hash).toDER().toString('hex'))
      console.log(tx)
      return tx
    default:
      return null
  }
}

describe('Model | Transaction', () => {
  describe('static fromBytes', () => {
    it('returns a new transaction', () => {
      [0, 1, 2, 3, 4].map(type => createRandomTx(type))
        .map(tx => { tx.network = 0x17; return tx })
        .map(tx => Transaction.serialize(tx).toString('hex'))
        .map(tx => { console.log(tx); return tx })
        .map(serialized => Transaction.fromBytes(serialized))
        .forEach(tx => console.log(JSON.stringify(tx)))

      let hex = Transaction.serialize(txdata).toString('hex')
      let tx = Transaction.fromBytes(hex)

      expect(tx).toBeInstanceOf(Transaction)
      expect(tx.data).toEqual(txdata)
    })
  })

  describe('static deserialize', () => {

  })

  describe('serialize', () => {

  })
})
