"use strict"
const addresses = require('./addresses')
const disks = require('./disks')
const snapshots = require('./snapshots')

const gcloud = {
  addresses: addresses,
  disks: disks,
  snapshots: snapshots
}

module.exports = gcloud
