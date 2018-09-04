const expect = require('chai').expect
const should = require('chai').should
const utils = require('./utils')

const rp = require('request-promise')
const assert = require('chai').assert

const LOCALHOST = 'http://localhost:5000'

should()
const context = {}

describe('#Nodes', () => {
  before(async () => {
    utils.cleanDb()
  })

  describe('GET /nodes', () => {
    it('should not fetch nodes if the authorization header is missing', (done) => {
      request
        .get('/nodes')
        .set('Accept', 'application/json')
        .expect(401, done)
    })

    it('should not fetch nodes if the authorization header is missing the scheme', (done) => {
      request
        .get('/nodes')
        .set({
          Accept: 'application/json',
          Authorization: '1'
        })
        .expect(401, done)
    })

    it('should not fetch nodes if the authorization header has invalid scheme', (done) => {
      const { token } = context
      request
        .get('/nodes')
        .set({
          Accept: 'application/json',
          Authorization: `Unknown ${token}`
        })
        .expect(401, done)
    })

    it('should not fetch nodes if token is invalid', (done) => {
      request
        .get('/nodes')
        .set({
          Accept: 'application/json',
          Authorization: 'Bearer 1'
        })
        .expect(401, done)
    })

    it('should fetch all nodes', (done) => {
      const { token } = context
      request
        .get('/nodes')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        })
        .expect(200, (err, res) => {
          if (err) { return done(err) }

          res.body.should.have.property('nodes')

          res.body.nodes.should.have.length(1)

          done()
        })
    })
  })

  describe('GET /nodes/:name', () => {
    it('should not fetch user if token is invalid', (done) => {
      request
        .get('/users/1')
        .set({
          Accept: 'application/json',
          Authorization: 'Bearer 1'
        })
        .expect(401, done)
    })

    it('should throw 404 if user doesn\'t exist', (done) => {
      const { token } = context
      request
        .get('/users/1')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        })
        .expect(404, done)
    })

    it('should fetch user', (done) => {
      const {
        user: { _id },
        token
      } = context

      request
        .get(`/nodes/${_id}`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        })
        .expect(200, (err, res) => {
          if (err) { return done(err) }

          // console.log(`res: ${JSON.stringify(res, null, 2)}`)

          res.body.should.have.property('user')

          expect(res.body.user.password).to.not.exist

          done()
        })
    })
  })

  describe('PUT /nodes/:name', () => {
    it('should not update user if token is invalid', (done) => {
      request
        .put('/nodes/1')
        .set({
          Accept: 'application/json',
          Authorization: 'Bearer 1'
        })
        .expect(401, done)
    })

    it('should throw 404 if user doesn\'t exist', (done) => {
      const { token } = context
      request
        .put('/nodes/1')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        })
        .expect(404, done)
    })

    it('should update user', (done) => {
      const {
        user: { _id },
        token
      } = context

      request
        .put(`/users/${_id}`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        })
        .send({ user: { username: 'updatedcoolname' } })
        .expect(200, (err, res) => {
          if (err) { return done(err) }

          res.body.user.should.have.property('username')
          res.body.user.username.should.equal('updatedcoolname')
          expect(res.body.user.password).to.not.exist

          done()
        })
    })
  })

  describe('DELETE /nodes/:name', () => {
    it('should not delete user if token is invalid', (done) => {
      request
        .delete('/users/1')
        .set({
          Accept: 'application/json',
          Authorization: 'Bearer 1'
        })
        .expect(401, done)
    })

    it('should throw 404 if user doesn\'t exist', (done) => {
      const { token } = context
      request
        .delete('/users/1')
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        })
        .expect(404, done)
    })

    it('should delete user', (done) => {
      const {
        user: { _id },
        token
      } = context

      request
        .delete(`/users/${_id}`)
        .set({
          Accept: 'application/json',
          Authorization: `Bearer ${token}`
        })
        .expect(200, done)
    })

  })
})
