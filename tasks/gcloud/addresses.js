"use strict"
const { google } = require("googleapis")
const compute = google.compute("v1")

class addresses {
  static async create(project, region, resource) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    })

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

    if (res.data.address && res.data.address) return true
    return false
  }
}

module.exports = addresses
