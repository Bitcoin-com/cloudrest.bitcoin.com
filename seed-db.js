"use strict"
const config = require("./config")
const seeder = require("mongoose-seed")

// Data array containing seed data - documents organized by Model
const data = [
  {
    model: "Appsettings",
    documents: [
      {
        env: "development",
        node_defaults: {
          flavor: "bu",
          tier: "standard",
          private: true,
          services: ["rest"],
          pruned: false,
          clone_blockchain: true,
          disk_size_gb_full: "220",
          disk_size_gb_pruned: "20"
        },
        node_flavors: [
          {
            name: "abc",
            image: "zquestz/bitcoin-abc"
          },
          {
            name: "bu",
            image: "zquestz/bitcoin-unlimited"
          },
          {
            name: "xt",
            image: "zquestz/bitcoin-xt"
          },
          {
            name: "wormhole",
            image: "",
            defaults: {
              services: ["rest", "wormhole-rest"]
            }
          },
          {
            name: "no-node",
            image: ""
          }
        ],
        source_blockchain_snapshot: "bch-data-2018-09-13t01-10-19-154z",
        source_blockchain_deploy: "source-blockchain-deploy",
        source_blockchain_disk: "source-blockchain-disk",
        services: [
          {
            name: "rest",
            image: ""
          }
        ],
        usd_per_minute: "0.001",
        minimum_billing_days: 7,
        notify_user_node_expiration_days: 30,
        quote_valid_minutes: 10,
        invoice_confirmations_required: 0,
        gcloud: {
          project: "bitbox-cloud-stage",
          region: "us-central1",
          zone: "us-central1-a"
        }
      }
    ]
  }
]

// Connect to MongoDB via Mongoose
seeder.connect(
  config.database,
  function() {
    // Load Mongoose models
    seeder.loadModels([
      "src/models/appsettings.js",
      "src/models/invoices.js",
      "src/models/nodes.js",
      "src/models/users.js"
    ])

    // Clear specified collections
    seeder.clearModels(["Appsettings", "Invoice", "Node", "User"], function() {
      // Callback to populate DB once collections have been cleared
      seeder.populateModels(data, function() {
        seeder.disconnect()
      })
    })
  }
)
