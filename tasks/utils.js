const uuidv4 = require("uuid/v4");
const replace = require("replace-in-file");
const fs = require("fs");
const util = require("util");
const path = require("path");

let getKubeConfig = async (templatePath, fromTokens, toValues) => {
  console.log(templatePath);
  templatePath = path.resolve("tasks", templatePath);
  let tempPath = path.resolve(`tasks/temp/${uuidv4()}.json`);
  let copyFile = util.promisify(fs.copyFile);
  const copyResult = await copyFile(templatePath, tempPath);
  const replaceOptions = {
    files: tempPath,
    from: fromTokens,
    to: toValues
  };
  const fileChanges = await replace(replaceOptions);
  const kubeConfig = require(tempPath);
  const unlinkResult = await fs.unlink(tempPath);
  return kubeConfig;
};

module.exports = {
  getKubeConfig
};
