const ForgerManager = require('../../../core/forgerManager')
const Delegate = require('../../../model/delegate')

describe('Core | ForgerManager', () => {
  const config = {
    server: { version: '0.0.1', port: 9999 },
    network: { nethash: 'lol-hash' }
  }

  const delegateConfig = {
    ...{ delegates: { secrets: ['do-not-tell-anyone'] } },
    ...config
  }

  describe('loadDelegates', () => {
    it('returns a promise', () => {
      const forger = new ForgerManager(config)
      const promise = forger.loadDelegates()
      // Avoids the UnhandledPromiseRejectionWarning
      promise.catch(() => {})
      expect(promise).toBeInstanceOf(Promise)
    })

    describe('without configured delegates', () => {
      it('rejects with an Error', () => {
        const forger = new ForgerManager(config)
        return forger.loadDelegates().catch(error => {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toMatch(/no delegate/i)
        })
      })
    })
    describe('with configured delegates', () => {
      it('resolves with them', () => {
        const forger = new ForgerManager(delegateConfig)
        return forger.loadDelegates()
          .catch(error => console.error(error))
          .then(delegates => {
            expect(delegates).toBeType('array')
            delegates.forEach(delegate => expect(delegate).toBeInstanceOf(Delegate))
          })
      })
    })
  })

  describe('startForging', () => {})

  describe('broadcast', () => {})

  describe('pickForgingDelegate', () => {
    it('returns a promise', () => {
      const forger = new ForgerManager(delegateConfig)
      forger.loadDelegates()
      const promise = forger.pickForgingDelegate({ delegate: {} })
      expect(promise).toBeInstanceOf(Promise)
    })
  })

  describe('getRound', () => {})
})
