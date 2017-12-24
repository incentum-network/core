const response = require('../response')

class UnprocessableEntityHttpException {
  send(req, res, data, headers = {}) {
    response.send(req, res, Object.assign(data, {
      success: false,
    }), 200, headers)
  }
}

module.exports = new UnprocessableEntityHttpException
