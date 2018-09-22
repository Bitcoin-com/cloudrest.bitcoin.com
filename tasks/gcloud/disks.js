"use strict"
const { google } = require("googleapis")
const compute = google.compute("v1")

class disks {
  static async createFromSnapshot(
    project,
    zone,
    diskName,
    diskSizeGb,
    sourceSnapshot
  ) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const request = {
      project: project,
      zone: zone,
      resource: {
        name: diskName,
        sizeGb: diskSizeGb,
        sourceSnapshot: `global/snapshots/${sourceSnapshot}`
      },
      auth: auth
    }

    return await compute.disks.insert(request)
  }

  static async get(project, zone, diskName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const request = {
      project: project,
      zone: zone,
      disk: diskName,
      auth: auth
    }

    return await compute.disks.get(request)
  }

  static async isReady(project, zone, diskName) {
    const res = await this.get(project, zone, diskName)

    return res.data.status === "READY"
  }

  static async isAttached(project, zone, diskName) {
    const res = await this.get(project, zone, diskName)

    return res.data.users && res.data.users.length
  }

  static async delete(project, zone, diskName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const request = {
      project: project,
      zone: zone,
      disk: diskName,
      auth: auth
    }

    return await compute.disks.delete(request)
  }
}

module.exports = disks
