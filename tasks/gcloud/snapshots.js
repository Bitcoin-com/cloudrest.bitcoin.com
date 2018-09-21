"use strict"
const { google } = require("googleapis")
const compute = google.compute("v1")

class snapshots {
  static async createFromDisk(project, zone, snapshotName, diskName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const request = {
      project: project,
      zone: zone,
      disk: diskName,
      resource: {
        name: snapshotName
      },
      auth: auth
    }

    return await compute.disks.createSnapshot(request)
  }

  static async get(project, snapshotName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const request = {
      project: project,
      snapshot: snapshotName,
      auth: auth
    }

    return await compute.snapshots.get(request)
  }

  static async isReady(project, snapshotName) {
    const res = await this.get(project, snapshotName)

    return res.data.status === "READY"
  }

  static async deleteSnapshot(project, snapshotName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const request = {
      project: project,
      snapshot: snapshotName,
      auth: auth
    }

    return await compute.snapshots.delete(request)
  }
}

module.exports = snapshots
