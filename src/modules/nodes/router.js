'use strict'
const ensureUser = require('../../middleware/validators')
const nodes = require('./controller')

module.exports.baseUrl = '/nodes'

module.exports.routes = [
  {
    method: 'POST',
    route: '/',
    handlers: [ensureUser, nodes.createNode],
  },
  {
    method: 'GET',
    route: '/',
    handlers: [ensureUser, nodes.getNodes],
  },
  {
    method: 'GET',
    route: '/:name',
    handlers: [ensureUser, nodes.getNode],
  },
  {
    method: 'PUT',
    route: '/:name',
    handlers: [ensureUser, nodes.updateNode],
  },
  {
    method: 'DELETE',
    route: '/:name',
    handlers: [ensureUser, nodes.deleteNode],
  },
]
