const mongoose = require('mongoose')

const Appsettings = new mongoose.Schema({
  type: { type: String, default: 'Appsettings' },
  env: { type: String },
  node_defaults: {
    flavor: { type: String },
    tier: { type: String },
    status: { type: String },
    private: { type: Boolean },
    services: [{ type: String }],
  },
  node_flavors: [ { type: String } ],
  usd_per_minute: { type: String },
  minimum_billing_days: { type: Number },
  notify_user_node_expiration_days: { type: Number },
  quote_valid_minutes: { type: Number },
  invoice_confirmations_required: { type: Number },
})

Appsettings.statics.getAppsettingsForEnv = async function() {
  const env = process.env.NODE_ENV || 'development'
  return await this.findOne({env: env}).exec()
}

module.exports = mongoose.model('Appsettings', Appsettings)
