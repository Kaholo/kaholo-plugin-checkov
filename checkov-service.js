const { docker, helpers } = require("@kaholo/plugin-library");
const {
  asyncExec,
} = require("./helpers");

async function runCheckovScan(params) {
  const {
    workingDirectory = await helpers.analyzePath("./"),
    targetFileOrDirectory,
    checksToSkip,
    environmentVariables,
    secretEnvVars,
    jsonOutput,
    additionalArguments,
    dockerImage,
  } = params;

  // entrypoint of docker image already includes 'checkov'
  const commandArgs = [];

  let targetPath = "";
  if (targetFileOrDirectory) {
    targetPath = await helpers.analyzePath(`${workingDirectory.absolutePath}/${targetFileOrDirectory}`);
    if (!targetPath.exists) {
      throw new Error(`Path ${workingDirectory.absolutePath}/${targetFileOrDirectory} not found on the Kaholo agent.`);
    }
    if (targetPath.type === "directory") {
      commandArgs.push(`-d ${targetFileOrDirectory}`);
    } else {
      commandArgs.push(`-f ${targetFileOrDirectory}`);
    }
  } else {
    commandArgs.push("-d .");
  }

  if (checksToSkip) {
    commandArgs.push(`--skip-check ${checksToSkip.join(",")}`);
  }

  if (additionalArguments) {
    commandArgs.push(additionalArguments.join(" "));
  }

  if (jsonOutput) {
    commandArgs.push("-o json");
  }

  const dockerCommandBuildOptions = {
    command: `${commandArgs.join(" ")}`,
    image: dockerImage,
  };

  console.error(`The Checkov command is: checkov ${dockerCommandBuildOptions.command}`);
  console.error(`Running in docker container using image ${dockerCommandBuildOptions.image}`);

  const workingDirVolumeDefinition = docker.createVolumeDefinition(workingDirectory.absolutePath);

  const dockerEnvVars = {
    ...environmentVariables,
    ...secretEnvVars,
    [workingDirVolumeDefinition.path.name]: workingDirVolumeDefinition.path.value,
    [workingDirVolumeDefinition.mountPoint.name]: workingDirVolumeDefinition.mountPoint.value,
  };

  dockerCommandBuildOptions.workingDirectory = workingDirVolumeDefinition.mountPoint.value;
  dockerCommandBuildOptions.volumeDefinitionsArray = [workingDirVolumeDefinition];
  dockerCommandBuildOptions.environmentVariables = dockerEnvVars;

  const dockerCommand = docker.buildDockerCommand(dockerCommandBuildOptions);

  return asyncExec({
    command: dockerCommand,
    options: {
      env: dockerEnvVars,
    },
    onProgressFn: process.stdout.write.bind(process.stdout),
  }).catch((error) => {
    throw new Error(error.stderr || error.stdout || error.message || error);
  });
}

module.exports = {
  runCheckovScan,
};
