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
const moment = require('moment')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true)
  await mongoose.connect(config.database, { useNewUrlParser: true })

  await processInvoices()
  await processNodes()
  await updateBlockchainSnapshot()
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

        // Determine node image
        const flavor = node.flavor.split('.', 1)
        const image = appsettings.node_flavors.find((item) => item.name == flavor).image
        node.image = image

        // Update node status
        node.status = 'pending:deploying'
        await node.save()

        // Create deployment config files for node
        const deploymentTemplate = 'kube-templates/bch-deployment.json'
        const fromTokens = [/#\{NODE_NAME\}#/g, /#\{DATA_DISK_NAME\}#/g, /#\{NODE_IMAGE\}#/g]
        const toValues = [globalNodeName, node.data_disk_name, node.image]
        const deploymentManifest = await utils.getKubeConfig(deploymentTemplate, fromTokens, toValues)

        // Deploy node
        const createRes = await kubeClient.apis.apps.v1.namespaces('default').deployments.post({ body: deploymentManifest })
        
        break
      case 'pending:deploying':
        // Verify rollout complete to continue
        const deployStatusRes = await kubeClient.apis.apps.v1.namespaces('default').deployments(`${globalNodeName}-deploy`).get()
        if (deployStatusRes.body.status.readyReplicas != 1) {
          break
        }

        // Update status
        node.status = 'live'
        await node.save()

        break
      case 'pending:backup':
        // Backup data disk
        const now = moment()
        const snapshotName = `${globalNodeName}-${now.toISOString().toLowerCase().replace(/\:|\./g, '-')}`
        await gcloudDisks.createSnapshotFromDisk(project, zone, snapshotName, node.data_disk_name)

        // Backup config disk

        // Update status
        node.status = 'live'
        await node.save()

        break
      case 'pending:delete':
        // Update status
        node.status = 'pending:deleteDisk'
        await node.save()

        // Delete deployment & pods
        await kubeClient.apis.apps.v1.namespaces('default').deployments(`${globalNodeName}-deploy`).delete()

        break
      case 'pending:deleteDisk':
        // Verify disk is detached to continue
        const isDiskAttached = await gcloudDisks.isDiskAttached(project, zone, node.data_disk_name)
        if (isDiskAttached) {
          break
        }

        // Delete disk
        await gcloudDisks.deleteDisk(project, zone, node.data_disk_name)

        // Delete backups

        // Update status
        node.status = 'deleted'
        await node.save()

        break
    }
  }
}

async function updateBlockchainSnapshot() {
  // Fetch current appsettings
  const appsettings = await Appsettings.getAppsettingsForEnv()
  const project = appsettings.gcloud.project
  const zone = appsettings.gcloud.zone
  const sourceDeploy = appsettings.source_blockchain_deploy
  const sourceDiskName = appsettings.source_blockchain_disk

  // Verify snapshot is stale to continue
  const snapshotRes = await gcloudDisks.getSnapshot(project, appsettings.source_blockchain_snapshot)
  const createdAt = moment(snapshotRes.data.creationTimestamp)
  const expiresAt = createdAt.add(24, 'hours')
  const now = moment()
  if (now.isBefore(expiresAt)) {
    return
  }

  // Scale down source deployment
  const scaleDownRes = await kubeClient.apis.apps.v1.namespaces('default').deployments(sourceDeploy).scale.patch({ body: { spec: { replicas: 0 } } })

  // Wait for deployment to scale down
  while (true) {
    const isDiskAttached = await gcloudDisks.isDiskAttached(project, zone, sourceDiskName)

    if (!isDiskAttached) {
      break
    } else {
      await sleep(1000)
    }
  }

  // Create snapshot
  const snapshotName = `bch-data-${now.toISOString().toLowerCase().replace(/\:|\./g, '-')}`
  await gcloudDisks.createSnapshotFromDisk(project, zone, snapshotName, sourceDiskName)

  // Wait for snapshot to complete
  while (true) {
    const isSnapshotReady = await gcloudDisks.isSnapshotReady(project, snapshotName)
    if (isSnapshotReady) {
      break
    } else {
      await sleep(1000)
    }
  }

  // Resume source deploy
  const scaleUpRes = await kubeClient.apis.apps.v1.namespaces('default').deployments(sourceDeploy).scale.patch({ body: { spec: { replicas: 1 } } })

  // Update current snapshot in appsettings
  let appsettingsToUpdate = await Appsettings.getAppsettingsForEnv()
  appsettingsToUpdate.source_blockchain_snapshot = snapshotName
  await appsettingsToUpdate.save()
}

async function processExpiringNodes() {
}

async function processTaskTimeouts() {
}

main()