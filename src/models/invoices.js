const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Invoice = new mongoose.Schema({
  type: { type: String, default: 'Invoice' },
  _node: { type: Schema.Types.ObjectId, ref: 'Node' },
  bch_address: { type: String, required: true },
  bch_per_minute: { type: String, required: true },
  paid: { type: Boolean, required: true, default: false },
  amount_paid: { type: String },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
})

Invoice.methods.toJSON = function() {
  let invoice = {
    bch_address: this.bch_address,
    bch_per_minute: this.bch_per_minute,
    paid: this.paid,
    expires_at: this.expires_at,
  }

  return invoice
}

module.exports = mongoose.model('Invoice', Invoice)
