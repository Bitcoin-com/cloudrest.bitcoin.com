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

async function start() {
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true)
  await mongoose.connect(config.database, { useNewUrlParser: true })

  await processInvoices()
  await processNodes()
  await processExpiringNodes()
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

    switch(node.status) {
      case 'pending:new':
        // Update node status
        node.status = 'pending:deploying'
        await node.save()

        // Create deployment config files for node
        const deploymentTemplate = 'kube-templates/deployment.json'
        const fromTokens = [/#\{NODE_NAME\}#/g]
        const toValues = [globalNodeName]
        const deploymentManifest = await utils.getKubeConfig(deploymentTemplate, fromTokens, toValues)
        const create = await kubeClient.apis.apps.v1.namespaces('default').deployments.post({ body: deploymentManifest })

        break
      case 'pending:cloning':
        node.status = 'pending:deploying'
        await node.save()
        
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

start()