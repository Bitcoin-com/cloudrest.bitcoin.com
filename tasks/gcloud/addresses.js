"use strict"
const { google } = require("googleapis")
const compute = google.compute("v1")

class addresses {
  static async create(project, region, addressName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const resource = {
      name: addressName,
      networkTier: "PREMIUM",
      addressType: "EXTERNAL"
    }

    const request = {
      project: project,
      region: region,
      resource: resource,
      auth: auth
    }

    return await compute.addresses.insert(request)
  }

  static async get(project, region, addressName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

    const request = {
      project: project,
      region: region,
      address: addressName,
      auth: auth
    }

    return await compute.addresses.get(request)
  }

  static async isReady(project, region, addressName) {
    const res = await this.get(project, region, addressName)

    if (res.data.address != null) return true
    return false
  }

  static async getIPAddress(project, region, addressName) {
    const res = await this.get(project, region, addressName)

    return res.data.address
  }
}

module.exports = addresses
