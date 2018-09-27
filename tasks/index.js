"use strict"
const KubeClient = require("kubernetes-client").Client
const kubeConfigOptions = require("kubernetes-client").config
let kubeConfig
try {
  kubeConfig = kubeConfigOptions.getInCluster()
} catch (err) {
  kubeConfig = kubeConfigOptions.fromKubeconfig()
}
const kubeClient = new KubeClient({
  config: kubeConfig,
  version: "1.9"
})

const mongoose = require("mongoose")
const config = require("../config")
const Node = require("../src/models/nodes")
const User = require("../src/models/users")
const Invoice = require("../src/models/invoices")
const Appsettings = require("../src/models/appsettings")
const gcloud = require("./gcloud")
const moment = require("moment")
const processNode = require("./node")
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  mongoose.Promise = global.Promise
  mongoose.set("useCreateIndex", true)
  await mongoose.connect(
    config.database,
    { useNewUrlParser: true }
  )

  // TODO: Replace dev loop with app cron
  while (true) {
    try {
      await processInvoices()
      await processNodes()
      // await updateBlockchainSnapshot()
    } catch (err) {
      console.log(err)
    }

    await sleep(1000)
  }

  mongoose.disconnect()
}

async function processInvoices() {
  const invoices = await Invoice.find({ paid: false })
  for (const invoice of invoices) {
    invoice.paid = true
    await invoice.save()
  }
}

async function processNodes() {
  const nodes = await Node.find({ status: { $regex: "pending:.*" } }).populate(
    "_user"
  )
  for (const node of nodes) {
    try {
      await processNode(node)
    } catch (err) {
      console.log(err)
      node.status = "error"
      await node.save()
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
  const snapshotRes = await gcloud.snapshots.get(
    project,
    appsettings.source_blockchain_snapshot
  )
  const createdAt = moment(snapshotRes.data.creationTimestamp)
  const expiresAt = createdAt.add(24, "hours")
  const now = moment()
  if (now.isBefore(expiresAt)) return

  // Scale down source deployment
  const scaleDownRes = await kubeClient.apis.apps.v1
    .namespaces("default")
    .deployments(sourceDeploy)
    .scale.patch({ body: { spec: { replicas: 0 } } })

  // Wait for deployment to scale down
  while (true) {
    const isDiskAttached = await gcloud.disks.isAttached(
      project,
      zone,
      sourceDiskName
    )

    if (!isDiskAttached) break
    else await sleep(1000)
  }

  // Create snapshot
  const snapshotName = `bch-data-${moment()
    .toISOString()
    .toLowerCase()
    .replace(/\:|\./g, "-")}`

  const createSnapshotRes = await gcloud.snapshots.createFromDisk(
    project,
    zone,
    snapshotName,
    sourceDiskName
  )

  // Wait for snapshot to complete
  while (true) {
    const isSnapshotReady = await gcloud.snapshots.isReady(
      project,
      snapshotName
    )
    if (isSnapshotReady) break
    else await sleep(1000)
  }

  // Resume source deploy
  const scaleUpRes = await kubeClient.apis.apps.v1
    .namespaces("default")
    .deployments(sourceDeploy)
    .scale.patch({ body: { spec: { replicas: 1 } } })

  // Update current snapshot in appsettings
  const appsettingsToUpdate = await Appsettings.getAppsettingsForEnv()
  appsettingsToUpdate.source_blockchain_snapshot = snapshotName
  await appsettingsToUpdate.save()
}

async function processExpiringNodes() {}

async function processTaskTimeouts() {}

main()
