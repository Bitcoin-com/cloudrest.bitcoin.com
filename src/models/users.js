const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')
const config = require('../../config')
const jwt = require('jsonwebtoken')

const User = new mongoose.Schema({
  type: { type: String, default: 'User' },
  name: { type: String },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  email_confirmed: { type: Boolean },
  password: { type: String, required: true },
  nodes: [{ type: Schema.Types.ObjectId, ref: 'Node' }],
  created_at: { type: Date, default: Date.now },
})

User.pre('save', function(next) {
  const user = this

  if (!user.isModified('password')) {
    return next()
  }

  new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) { return reject(err) }
      resolve(salt)
    })
  })
  .then(salt => {
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) { throw new Error(err) }

      user.password = hash

      next(null)
    })
  })
  .catch(err => next(err))
})

User.methods.validatePassword = function(password) {
  const user = this

  return new Promise((resolve, reject) => {
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) { return reject(err) }

      resolve(isMatch)
    })
  })
}

User.methods.generateToken = function() {
  const user = this

  const token = jwt.sign({ id: user.id }, config.token)
  //console.log(`config.token: ${config.token}`)
  //console.log(`generated token: ${token}`)
  return token
}

// export default mongoose.model('user', User)
module.exports = mongoose.model('User', User)
