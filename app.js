const kaholoPluginLibrary = require("@kaholo/plugin-library");

const checkovService = require("./checkov-service");

module.exports = kaholoPluginLibrary.bootstrap(
  {
    runCheckovScan: checkovService.runCheckovScan,
  },
);
