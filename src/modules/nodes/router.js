const ensureUser = require('../../middleware/validators')
const nodes = require('./controller')

module.exports.baseUrl = '/nodes'

module.exports.routes = [
  {
    method: 'GET',
    route: '/',
    handlers: [
      ensureUser,
      nodes.list
    ]
  },
  {
    method: 'POST',
    route: '/',
    handlers: [
      ensureUser,
      nodes.create
    ]
  },
  {
    method: 'DELETE',
    route: '/:name',
    handlers: [
      ensureUser,
      nodes.remove
    ]
  },
]
