const util = require("util");
const childProcess = require("child_process");

async function asyncExec(params) {
  const {
    command,
    onProgressFn,
    options = {},
  } = params;

  let childProcessInstance;
  try {
    childProcessInstance = childProcess.exec(command, options);
  } catch (error) {
    throw new Error(error);
  }

  const dataChunks = [];

  childProcessInstance.stdout.on("data", (data) => {
    onProgressFn?.(data);
    dataChunks.push(data);
  });
  childProcessInstance.stderr.on("data", (data) => {
    onProgressFn?.(data);
  });

  try {
    await util.promisify(childProcessInstance.on.bind(childProcessInstance))("close");
  } catch (error) {
    const resultObj = tryParseJson(dataChunks.join());
    if (error === 1 && resultObj) {
      // stringify needed only to partially workaround Error: [object Object] bug in 4.2.0
      throw JSON.stringify(resultObj);
    }
    throw error;
  }

  const resultObj = tryParseJson(dataChunks.join());
  if (resultObj) {
    return resultObj;
  }
  return "";
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

module.exports = {
  asyncExec,
};
