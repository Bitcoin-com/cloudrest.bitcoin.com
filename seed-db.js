const config = require('./config')
const seeder = require('mongoose-seed')

// Data array containing seed data - documents organized by Model
let data = [
  {
    'model': 'Appsettings',
    'documents': [
      {
        env: 'development',
        node_defaults: {
          flavor: 'bu.1.4.0.0',
          tier: 'standard',
          private: true,
          services: ['rest'],
          pruned: false,
          clone_blockchain: true,
          disk_size_gb_full: '220',
          disk_size_gb_pruned: '20',
        },
        node_flavors: ['abc.0.18.0', 'bu.1.4.0.0'],
        usd_per_minute: '0.001',
        minimum_billing_days: 7,
        notify_user_node_expiration_days: 30,
        quote_valid_minutes: 10,
        invoice_confirmations_required: 0,
        gcloud: {
          project: 'bitbox-cloud-stage',
          zone: 'us-central1-a',
        },
        source_blockchain_snapshot: 'bitcoin-data-snapshot-1',
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
  seeder.clearModels(['Appsettings', 'Invoice', 'Node', 'User'], function() {

    // Callback to populate DB once collections have been cleared
    seeder.populateModels(data, function() {
      seeder.disconnect()
    })
  })
})