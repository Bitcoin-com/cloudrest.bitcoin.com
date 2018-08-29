// import * as auth from './controller'
const auth = require('./controller')

// export const baseUrl = '/auth'
module.exports.baseUrl = '/auth'

// export default [
module.exports.routes = [
  {
    method: 'POST',
    route: '/',
    handlers: [
      auth.authUser
    ]
  },
  {
    method: 'POST',
    route: '/login',
    handlers: [
      auth.login
    ]
  },
  {
    method: 'POST',
    route: '/logout',
    handlers: [
      auth.logout
    ]
  },
  {
    method: 'GET',
    route: '/2fa',
    handlers: [
      auth.twofa
    ]
  },
  {
    method: 'GET',
    route: '/token',
    handlers: [
      auth.token
    ]
  },
  {
    method: 'GET',
    route: '/whoami',
    handlers: [
      auth.whoami
    ]
  }
]
