'use strict'

const webhookManager = require('@arkecosystem/core-container').resolvePlugin('webhooks')
const Joi = require('joi')

const events = webhookManager.getEvents().map(event => event.name)
const conditions = [
  'between', 'contains', 'eq', 'falsy', 'gt', 'gte',
  'lt', 'lte', 'ne', 'not-between', 'regexp', 'truthy'
]

/**
 * @return {Object}
 */
exports.index = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * @return {Object}
 */
exports.show = {
  params: {
    id: Joi.string()
  }
}

/**
 * @return {Object}
 */
exports.store = {
  payload: {
    event: Joi.string().valid(events).required(),
    target: Joi.string().required().uri(),
    enabled: Joi.boolean().default(true),
    conditions: Joi.array().items(Joi.object({
      key: Joi.string(),
      value: Joi.string(),
      condition: Joi.string().valid(conditions)
    }))
  }
}

/**
 * @return {Object}
 */
exports.update = {
  payload: {
    event: Joi.string().valid(events),
    target: Joi.string().uri(),
    enabled: Joi.boolean(),
    conditions: Joi.array().items(Joi.object({
      key: Joi.string(),
      value: Joi.string(),
      condition: Joi.string().valid(conditions)
    }))
  }
}

/**
 * @return {Object}
 */
exports.destroy = {
  params: {
    id: Joi.string()
  }
}
