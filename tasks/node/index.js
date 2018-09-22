"use strict"
const KubeClient = require("kubernetes-client").Client
const kubeconfig = require("kubernetes-client").config
const kubeClient = new KubeClient({
  config: kubeconfig.fromKubeconfig(),
  version: "1.9"
})
const Appsettings = require("../../src/models/appsettings")
const utils = require("../utils")
const gcloud = require("../gcloud")
const moment = require("moment")

async function processNode (node) {
  // Determine global node name
  const globalNodeName = `${node._user.username}-${node.name}`.toLowerCase()

  // Fetch current appsettings
  const appsettings = await Appsettings.getAppsettingsForEnv()
  const project = appsettings.gcloud.project
  const region = appsettings.gcloud.region
  const zone = appsettings.gcloud.zone

  switch (node.status) {
    case "pending:new":
      // New disk configuration
      const newDiskName = `bc-${globalNodeName}`
      const pruned = appsettings.node_defaults.pruned
      const diskSizeGb = pruned
        ? appsettings.node_defaults.disk_size_gb_pruned
        : appsettings.node_defaults.disk_size_gb_full
      const sourceSnapshot = appsettings.source_blockchain_snapshot

      // Create disk
      const createDiskRes = await gcloud.disks.createFromSnapshot(
        project,
        zone,
        newDiskName,
        diskSizeGb,
        sourceSnapshot
      )

      // Reserve IP address
      const addressName = `${globalNodeName}-ip`
      const createAddressRes = await gcloud.addresses.create(
        project,
        region,
        addressName
      )

      // Update node's status metadata
      node.data_disk_name = newDiskName
      node.ip_address_name = addressName
      node.status = "pending:cloning"
      await node.save()

      break
    case "pending:cloning":
      // Wait for cloning to complete
      const isDiskReady = await gcloud.disks.isReady(
        project,
        zone,
        node.data_disk_name
      )
      const isAddressReady = await gcloud.addresses.isReady(
        project,
        region,
        node.ip_address_name
      )
      if (!(isDiskReady && isAddressReady)) break

      // Determine node image
      const flavor = node.flavor.split(".", 1)[0]
      const image = appsettings.node_flavors.find(item => item.name === flavor)
        .image
      node.image = image

      // Create deployment config
      const deployTokens = [
        /#\{NODE_NAME\}#/g,
        /#\{DATA_DISK_NAME\}#/g,
        /#\{NODE_IMAGE\}#/g
      ]
      const deployValues = [globalNodeName, node.data_disk_name, node.image]
      const deploymentManifest = await utils.getDeploymentConfig(
        deployTokens,
        deployValues,
        node.services
      )

      // Create node deployment
      const createDeployRes = await kubeClient.apis.apps.v1
        .namespaces("default")
        .deployments.post({ body: deploymentManifest })

      // Get node's reserved ip address
      const ip = await gcloud.addresses.getIPAddress(
        project,
        region,
        node.ip_address_name
      )

      // Create service config
      const serviceTokens = [
        /#\{NODE_NAME\}#/g,
        /#\{NODE_IP_ADDRESS\}#/g
      ]
      const serviceValues = [globalNodeName, ip]
      const serviceManifest = await utils.getServiceConfig(
        serviceTokens,
        serviceValues,
        node.services
      )

      // Create node service
      const createServiceRes = await kubeClient.apis.v1
        .namespaces("default")
        .services.post({ body: serviceManifest })

      // Update node status and ip address
      node.ip_address = ip
      node.status = "pending:deploying"
      await node.save()

      break
    case "pending:deploying":
      // Verify rollout complete to continue
      const deployStatusRes = await kubeClient.apis.apps.v1
        .namespaces("default")
        .deployments(`${globalNodeName}-deploy`)
        .get()
      if (deployStatusRes.body.status.readyReplicas !== 1) break

      // Update status
      node.status = "live"
      await node.save()

      break
    case "pending:backup":
      // Backup data disk
      const snapshotName = `${globalNodeName}-${moment()
        .toISOString()
        .toLowerCase()
        .replace(/\:|\./g, "-")}`
      await gcloud.snapshots.createFromDisk(
        project,
        zone,
        snapshotName,
        node.data_disk_name
      )

      // Update status
      node.status = "live"
      await node.save()

      break
    case "pending:delete":
      // Delete deployment & pods
      await kubeClient.apis.apps.v1
        .namespaces("default")
        .deployments(`${globalNodeName}-deploy`)
        .delete()

      // Delete Service

      // Update status
      node.status = "pending:deleteDisk"
      await node.save()

      break
    case "pending:deleteDisk":
      // Verify disk is detached to continue
      const isDiskAttached = await gcloud.disks.isAttached(
        project,
        zone,
        node.data_disk_name
      )
      if (isDiskAttached) break

      // Delete disk
      await gcloud.disks.delete(project, zone, node.data_disk_name)

      // TODO: Delete backups

      // Update status
      node.status = "deleted"
      await node.save()

      break
  }
}

module.exports = processNode
