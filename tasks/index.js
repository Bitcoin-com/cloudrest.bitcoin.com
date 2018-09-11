const KubeClient = require('kubernetes-client').Client
const kubeconfig = require('kubernetes-client').config
const kubeClient = new KubeClient({ config: kubeconfig.fromKubeconfig(), version: '1.9' })
const mongoose = require('mongoose')
const config = require('../config')
const Node = require('../src/models/nodes')
const User = require('../src/models/users')
const Invoice = require('../src/models/invoices')
const Appsettings = require('../src/models/appsettings')
const utils = require('./utils')
const gcloudDisks = require('./gcloud-disks')

async function main() {
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true)
  await mongoose.connect(config.database, { useNewUrlParser: true })

  await processInvoices()
  await processNodes()
  mongoose.disconnect()
}

async function processInvoices() {
  let invoices = await Invoice.find({ paid: false })
  for (let invoice of invoices) {
    invoice.paid = true
    await invoice.save()
  }
}

async function processNodes() {
  let nodes = await Node.find({ status: { $regex: 'pending:.*' }}).populate('_user')
  for (let node of nodes) {
    // Determine global node name
    const globalNodeName = `${node._user.username}-${node.name}`.toLowerCase()

    // Fetch current appsettings
    const appsettings = await Appsettings.getAppsettingsForEnv()
    const project = appsettings.gcloud.project
    const zone = appsettings.gcloud.zone

    switch(node.status) {
      case 'pending:new':
        // Update node status
        node.status = 'pending:cloning'
        await node.save()

        // New disk configuration
        const newDiskName = `bc-${globalNodeName}`
        const pruned = appsettings.node_defaults.pruned
        const diskSizeGb = pruned ? appsettings.node_defaults.disk_size_gb_pruned : appsettings.node_defaults.disk_size_gb_full
        const sourceSnapshot = appsettings.source_blockchain_snapshot

        // Create disk
        let createDiskRes = await gcloudDisks.createDiskFromSnapshot(project, zone, newDiskName, diskSizeGb, sourceSnapshot)

        // Update node's data disk name
        node.data_disk_name = newDiskName
        await node.save()

        break
      case 'pending:cloning':
        // Wait for cloning to complete
        let isDiskReady = await gcloudDisks.isDiskReady(project, zone, node.data_disk_name)
        if (!isDiskReady) {
          break
        }

        // Update node status
        node.status = 'pending:deploying'
        await node.save()

        // Create deployment config files for node
        const deploymentTemplate = 'kube-templates/bch-deployment.json'
        const fromTokens = [/#\{NODE_NAME\}#/g, /#\{DATA_DISK_NAME\}#/g]
        const toValues = [globalNodeName, node.data_disk_name]
        const deploymentManifest = await utils.getKubeConfig(deploymentTemplate, fromTokens, toValues)

        // Deploy node
        const create = await kubeClient.apis.apps.v1.namespaces('default').deployments.post({ body: deploymentManifest })
        
        break
      case 'pending:deploying':
        // Check rollout status
        const deployment = await kubeClient.apis.apps.v1.namespaces('default').deployments(`${globalNodeName}-deploy`).get()

        node.status = 'live'
        await node.save()

        break
      case 'pending:delete':
        // Delete deployment & pods
        await kubeClient.apis.apps.v1.namespaces('default').deployments(`${globalNodeName}-deploy`).delete()
        break
    }
  }
}

async function processExpiringNodes() {
}

async function processTaskTimeouts() {
}

main().catch(console.error)