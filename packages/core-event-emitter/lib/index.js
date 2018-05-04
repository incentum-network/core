'use strict'

const emitter = require('./emitter')

/**
 * The struct used by the plugin container.
 * @type {Object}
 */
exports.plugin = {
  pkg: require('../package.json'),
  alias: 'event-emitter',
  register: async (container, options) => emitter
}
