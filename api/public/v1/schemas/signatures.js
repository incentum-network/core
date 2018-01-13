module.exports = {
  addSignature: {
    type: 'object',
    properties: {
      secret: {
        type: 'string',
        minLength: 1
      },
      secondSecret: {
        type: 'string',
        minLength: 1
      },
      publicKey: {
        type: 'string',
        format: 'publicKey'
      },
      multisigAccountPublicKey: {
        type: 'string',
        format: 'publicKey'
      }
    },
    required: ['secret', 'secondSecret']
  },
  getFee: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        minLength: 1,
        format: 'address'
      }
    },
    required: ['address']
  },
}
