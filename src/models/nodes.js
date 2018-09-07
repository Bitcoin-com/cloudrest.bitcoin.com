const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Node = new mongoose.Schema({
  type: { type: String, default: 'Node' },
  _user: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  flavor: { type: String, required: true },
  ip_address: { type: String },
  tier: { type: String },
  private: { type: Boolean, required: true },
  services: [{ type: Schema.Types.Mixed }],
  status: { type: String, required: true },
  invoices: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
  created_at: { type: Date, default: Date.now },
})

module.exports = mongoose.model('node', Node)
