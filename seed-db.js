const config = require('./config')
const seeder = require('mongoose-seed')

// Data array containing seed data - documents organized by Model
let data = [
  {
    'model': 'appsettings',
    'documents': [
      {
        'env': 'development',
        'node_defaults': {
          flavor: 'bu.0.18.0',
          tier: 'standard',
          status: 'pending',
          private: true,
          services: ['rest'],
        },
        'node_flavors': ['abc.0.18.0', 'bu.0.18.0'],
        'usd_per_minute': '0.001',
        'minimum_billing_days': 7,
        'notify_user_node_expiration_days': 30,
        'quote_valid_minutes': 10,
        'invoice_confirmations_required': 0,
      },
    ]
  },
]

// Connect to MongoDB via Mongoose
seeder.connect(config.database, function() {

  // Load Mongoose models
  seeder.loadModels([
    'src/models/appsettings.js',
    'src/models/invoices.js',
    'src/models/nodes.js',
    'src/models/users.js',
  ])
 
  // Clear specified collections
  seeder.clearModels(['appsettings', 'invoice', 'node', 'user'], function() {

    // Callback to populate DB once collections have been cleared
    seeder.populateModels(data, function() {
      seeder.disconnect()
    })
  })
})