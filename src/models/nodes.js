const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Node = new mongoose.Schema({
  type: { type: String, default: 'Node' },
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  flavor: { type: String, required: true },
  created: { type: Date, default: Date.now },
})

module.exports = mongoose.model('node', Node)
