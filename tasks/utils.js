"use strict"
const uuidv4 = require("uuid/v4")
const replace = require("replace-in-file")
const fs = require("fs")
const util = require("util")
const path = require("path")

const getDeploymentConfig = async (fromTokens, toValues, services) => {
  // Copy template and replace tokens
  const templatePath = path.resolve(
    "tasks",
    "kube-templates/bch-deployment.json"
  )
  const tempPath = path.resolve(`tasks/temp/${uuidv4()}.json`)
  const copyFile = util.promisify(fs.copyFile)
  const copyResult = await copyFile(templatePath, tempPath)
  const replaceOptions = {
    files: tempPath,
    from: fromTokens,
    to: toValues
  }
  const fileChanges = await replace(replaceOptions)

  // Load config without services
  const kubeConfig = require(tempPath)

  // Cleanup temp
  const unlinkResult = await fs.unlink(tempPath)

  // Inject requested services
  for (const service of services) {
    const servicePath = path.resolve(
      `tasks/kube-templates/${service}-sidecar.json`
    )
    const serviceConfig = require(servicePath)
    kubeConfig.spec.template.spec.containers.push(serviceConfig)
  }

  return kubeConfig
}

const getServiceConfig = async (fromTokens, toValues, services) => {
  // Copy template and replace tokens
  const templatePath = path.resolve(
    "tasks",
    "kube-templates/bch-service.json"
  )
  const tempPath = path.resolve(`tasks/temp/${uuidv4()}.json`)
  const copyFile = util.promisify(fs.copyFile)
  const copyResult = await copyFile(templatePath, tempPath)
  const replaceOptions = {
    files: tempPath,
    from: fromTokens,
    to: toValues
  }
  const fileChanges = await replace(replaceOptions)

  // Load config without services
  const kubeConfig = require(tempPath)

  // Cleanup temp
  const unlinkResult = await fs.unlink(tempPath)

  // Route ports for requested services
  for (const service of services) {
    switch (service) {
      case "rest":
        const restPortConfig = {
          port: 80,
          targetPort: 5000,
          name: "rest"
        }
        kubeConfig.spec.ports.push(restPortConfig)

        break
      case "wormholerest":
        const wormholerestPortConfig = {
          port: 80,
          targetPort: 5000,
          name: "wormholerest"
        }
        kubeConfig.spec.ports.push(wormholerestPortConfig)
    }
  }

  return kubeConfig
}

module.exports = {
  getDeploymentConfig,
  getServiceConfig
}
