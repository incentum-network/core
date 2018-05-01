'use strict'

module.exports = {
  enabled: true,
  port: 4004,
  token: '$argon2id$v=19$m=4096,t=3,p=1$/sUhlZGQp/K+zGLlwWp5Kw$8aNVK5F6DU20zaA8WjBSge/xNf75793BcfBo/zj5Yxw',
  pagination: {
    limit: 100,
    include: [
      '/api/webhooks'
    ]
  }
}
