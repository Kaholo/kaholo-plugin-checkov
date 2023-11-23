# Kaholo Checkov Plugin
Checkov scans cloud infrastructure configurations to find misconfigurations before they're deployed.

Checkov uses a common command line interface to manage and analyze infrastructure as code (IaC) scan results across platforms such as Terraform, CloudFormation, Kubernetes, Helm, ARM Templates and Serverless framework.

## Checkov Text vs JSON
The Checkov CLI allows JSON output using the `-o json` argument. JSON output allows for ready code-layer access to the results in Kaholo so a parameter is provided get JSON output by default. The resulting JSON report can be found in the Kaholo Execution Final Result. To access this programmatically, use `kaholo.actions.checkov1.result` where `checkov1` is the ID of the upstream Checkov Action in the Kaholo pipeline. For example the number of failures is available as `kaholo.actions.checkov1.result.summary.failed`.

## Checkov Exit Code
A successful Checkov scan with no failing checks results in exit code 0 and a Kaholo Action status of `success`. If any checks fail then the exit code is 1 and the Kaholo Action status is `error`. To allow Checkov checks to fail and the Kaholo Action to still succeed, use Additional Command Argument `--soft-fail`. With or without this argument the Checkov report is returned to the Kaholo Execution Final Result if JSON output is used.

For other errors, e.g. exit code 2, the plugin attempts to parse out the relevant error message and returns it in Final Result as `error_message` in Final Result.

In all cases the full output of Checkov is made available in plain text in the Kaholo Execution Activity Log.

## Method: Run Checkov Scan
This method runs a checkov scan using the CLI command `checkov`, which is run in a docker container using the specified docker image. Many of the arguments normally provided the command are parameterized in the Action for ease of use. The full text output (whether or not JSON output is specified) is displayed in the Kaholo Activity Log.

The full command used to make the scan is displayed in the Kaholo Activity Log prior to execution, as well as the docker image that was used. For example:

    The Checkov command is: checkov -f gcp-create-instance/main.tf --skip-check CKV_SECRET_2,CKV_SECRET_6 --soft-fail

    Running in docker container using image bridgecrew/checkov:3.1.2

### Parameter: Working Directory
The Working Directory is a directory on the Kaholo Agent where the code to be scanned can be found. It is typically cloned to the Kaholo Agent by an upstream Git action. Because the plugin runs Checkov in a container with Working Directory mounted into the container it is important that the code to be scanned be within Working Directory.

The path provided may be relative or absolute, or even omitted. If relative, it is relative to the default working directory of the Kaholo agent, for example `/twiddlebug/workspace`. If omitted the Working Directory is the default working directory on the Kaholo agent.

### Parameter: Target File or Directory
To scan a specific file or directory within working directory specify the file or relative path to the directory here. Omit this parameter to scan the entire working directory. The plugin detects whether a file or directory has been provided and uses the `-f` or `-d` command line argument as appropriate.

### Parameter: Checks to Skip
Often certain checks are anticipated to fail and this is considered harmless, so it may be preferable to skip those checks. To skip no checks, leave this parameter empty. List checks to skip one per line. This is equivalent to the `--skip-check` argument used on the command line.

### Parameter: Environment Variables
Checkov is affected not only by command line arguments but also Environment Variables. To set environment variables in the container running the command, list them here as `KEY=value` pairs, one per line.

### Parameter: Secret Environment Variables
Some environment variables may be used that are sensitive secrets, for example access tokens or passwords. These should not be exposed in the user interface, Activity Log, or error logs in Kaholo.

Enter secret environment variables into the Kaholo Vault, just like parameter Environment Variables - `KEY=value` pairs, one per line. Then specify the Kaholo Vault item in this parameter to make those variables available to checkov in the container where it runs.

### Parameter: Use JSON Output
As a convenience, this boolean parameter includes `-o json` in the command line arguments if enabled. This results in a well-formed JSON report being made available in Final Result, if the scan is successful, whether or not all checks pass.

### Parameter: Additional Command Arguments
If the above parameterized arguments do not include one you wish to use, specify additional checkov CLI arguments here, one per line. For example `--soft-fail` to allow the scan to end in success even if some checks fail.

### Parameter: Docker Image
The plugin is designed to run checkov using a docker image found in docker hub. To run checkov with a custom docker image or different version of the bridgecrew docker image, specify which image to use here. The Kaholo Agent will automatically pull the image specified and attempt to run the scan using the image. The entrypoint of the image must be `checkov`.

The plugin was developed using `bridgecrew/checkov:3.1.2`. A new Checkov action put in the pipeline will arrive configured to use this image as the default.
