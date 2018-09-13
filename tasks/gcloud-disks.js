"use strict";
const { google } = require("googleapis");
const compute = google.compute("v1");

class gcloudDisks {
  static async createDiskFromSnapshot(
    project,
    zone,
    diskName,
    diskSizeGb,
    sourceSnapshot
  ) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    });

    let request = {
      project: project,
      zone: zone,
      resource: {
        name: diskName,
        sizeGb: diskSizeGb,
        sourceSnapshot: `global/snapshots/${sourceSnapshot}`
      },
      auth: auth
    };

    return await compute.disks.insert(request);
  }

  static async createSnapshotFromDisk(project, zone, snapshotName, diskName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    });

    let request = {
      project: project,
      zone: zone,
      disk: diskName,
      resource: {
        name: snapshotName
      },
      auth: auth
    };

    return await compute.disks.createSnapshot(request);
  }

  static async getDisk(project, zone, diskName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    });

    let request = {
      project: project,
      zone: zone,
      disk: diskName,
      auth: auth
    };

    return await compute.disks.get(request);
  }

  static async isDiskReady(project, zone, diskName) {
    let res = await this.getDisk(project, zone, diskName);

    return res.data.status === "READY";
  }

  static async isDiskAttached(project, zone, diskName) {
    let res = await this.getDisk(project, zone, diskName);

    return res.data.users && res.data.users.length;
  }

  static async deleteDisk(project, zone, diskName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    });

    let request = {
      project: project,
      zone: zone,
      disk: diskName,
      auth: auth
    };

    return await compute.disks.delete(request);
  }

  static async getSnapshot(project, snapshotName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    });

    let request = {
      project: project,
      snapshot: snapshotName,
      auth: auth
    };

    return await compute.snapshots.get(request);
  }

  static async isSnapshotReady(project, snapshotName) {
    let res = await this.getSnapshot(project, snapshotName);

    return res.data.status === "READY";
  }

  static async deleteSnapshot(project, snapshotName) {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/compute"]
    });

    let request = {
      project: project,
      snapshot: snapshotName,
      auth: auth
    };

    return await compute.snapshots.delete(request);
  }
}

module.exports = gcloudDisks;
