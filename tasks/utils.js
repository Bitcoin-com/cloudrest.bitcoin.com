'use strict'
const uuidv4 = require('uuid/v4')
const replace = require('replace-in-file')
const fs = require('fs')
const util = require('util')
const path = require('path')

const getKubeConfig = async (fromTokens, toValues, services) => {
  // Copy deployment template and replace tokens
  const templatePath = path.resolve(
    'tasks',
    'kube-templates/bch-deployment.json'
  )
  const tempPath = path.resolve(`tasks/temp/${uuidv4()}.json`)
  const copyFile = util.promisify(fs.copyFile)
  const copyResult = await copyFile(templatePath, tempPath)
  const replaceOptions = {
    files: tempPath,
    from: fromTokens,
    to: toValues,
  }
  const fileChanges = await replace(replaceOptions)

  // Load config without services
  let kubeConfig = require(tempPath)

  // Cleanup temp
  const unlinkResult = await fs.unlink(tempPath)

  // Inject requested services
  for (const service of services) {
    const servicePath = path.resolve(`tasks/kube-templates/${service}-sidecar.json`)
    const serviceConfig = require(servicePath)
    kubeConfig.spec.template.spec.containers.push(serviceConfig)
  }

  return kubeConfig
}

module.exports = {
  getKubeConfig,
}
