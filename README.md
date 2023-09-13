# face-app-api

## Description
This is the back-end part of a full-stack PERN application for detecting faces and their corresponding emotions within an image.  Logged-in user can submit images for face and emotions detection, with each submission updated in the database for tracking number of image entries.

API for face-app client located at [https://github.com/rainbowchook/face-app](https://github.com/rainbowchook/face-app)

Most of the source code is located in the /src directory.  

## Technical Description

Main project source code and CDK scripts were written in TypeScript.  
The API exposes /users and /images endpoints for: 
registration, login, get user profile, get all users, delete user account, update user image entries count, and making a call to Clarifai through their GRPC client.

/users/signin -> POST = success/fail (Login) 

/users -> POST = user - CREATE (Register) 

/users/:userId -> GET = user - READ (Get user profile) 

/users/ -> GET = users - READ (Get all users) 

/users/:userId/images -> PUT = user - UPDATE (Update user image entries count) 

/users/:userId -> DELETE - DELETE (Delete user account) 

/images/ -> POST - Make API call to Clarifai with image; returns JSON results (through GRPC client) 

## Architectural Overview

### Express server

The server is CORS-enabled and accepts JSON request bodies.  

View-Controller architecture employed: All routes, controllers and services are re-exported from the index.ts within the /src/routes, /src/controllers and /src/services directories to enable a cleaner separation of roles ie separating view from business logic.

Routers exist in /src/routes directory for the /users and /images endpoints.  
Each route has route handlers located in /src/controllers.  
Route handlers invoke services found in /src/services, such as database services with Knex as a bridging interface with the Postgresql database for database queries.

Project Enhancement: Models were not created for Requests and Responses, though a BoxSentiment type was clearly defined for the bounding boxes and sentiments returned from the /images endpoint, which makes a call to the Clarifai API for image processing.

### Postgresql database

### CDK scripts for CloudFormation (Infrastructure as Code)

Deploys a single stack from /bin/faces.cdk.project.ts, with the environment set through environment variables.

All source code located in /lib folder.  Assets (docker-compose file and Postgresql init script) located in /lib/assets.

The stack is created by calling the constructor of each construct in sequence and destructuring the instance returned as a readonly property:
1. The VPC Construct does a lookup that dynamically returns the default VPC configurations based on the current context.
2. The SecurityGroup Construct sets the ingress and egress rules - allowing inbound traffic only for SSH (TCP port 22), HTTP (TCP port 80) and HTTPS (TCP port 443), and allowing all outbound traffic
3. 


#### Design decisions 
1. Instead of using readFileSync for /scripts/user-data.sh and adding it to the EC2 Spot Instance with .addUserData(userData), commands were added to the instance user data using the .addCommands() and addS3DownloadCommand() methods from UserData class for Amazon Linux AMI.  All commands were rendered and added to the EC2 Spot Instance through addUserData(userData.render()).
2. Environment variables from GitHub Actions secrets were referenced in the user data script and exported into the EC2 instance.  The GitHub Actions logs appropriately masks environment variables injected at runtime.  Loading the environment variables into SSM Parameter Store or loading a file in the S3 bucket encrypted with KMS would have been redundant.


## CDK setup

### AWS CLI setup in local development environment

#### Docker Installation

Pre-requisite: Docker installed (see [Docker website](https://docs.docker.com/get-docker/))

```shell
$ docker --version
```

Docker Hub Rate Limiting unlikely to be an issue for local developer testing with AWS CLI.

#### Setup AWS alias

For Linux and MacOS, set an alias to run AWS CLI version 2 from within a container (image pulled from Docker Hub) as if it's installed on the host system:

```shell
$ alias aws='docker run --rm -it -v ~/.aws:/root/.aws -v $(pwd):/aws amazon/aws-cli'
$ alias | grep 'aws'
aws='docker run --rm -it -v ~/.aws:/root/.aws -v $(pwd):/aws amazon/aws-cli'
$ aws --version
aws-cli/2.10.0 Python/3.7.3 Linux/4.9.184-linuxkit botocore/2.4.5dev10
```

The alias is defined for the current shell session.
To set the alias for all future shell sessions, edit the ~/.bashrc, ~/.bash_profile or ~/.zshrc file.

Specify the volume mounts ~/.aws:/root/.aws and ${pwd}:/aws for access to the host file system, credentials and configuration settings when using aws commands, which allows AWS CLI running in the container to locate host file information.

#### Configure AWS profile

Account information for the default profile or named profile can be configured with AWS CLI by running:

```
aws configure
aws configure --profile prod
```

Or, use the manual process of configuring credentials and configuration:

1. Create or open the credentials file, which is ~/.aws/credentials on Linux and MacOS.  Add default AWS IAM user with programmatic access and necessary permissions.  For example:
   ```
   [default] 
    aws_access_key_id = AKIAIOSFODNN7EXAMPLE 
    aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
    aws_session_token = IQoJb3JpZ2luX2IQoJb3JpZ2luX2IQoJb3JpZ2luX2IQoJb3JpZ2luX2IQoJb3JpZVERYLONGSTRINGEXAMPLE

   [user1] 
    aws_access_key_id = AKIAIOSFODNN7EXAMPLE 
    aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
    aws_session_token = IQoJb3JpZ2luX2IQoJb3JpZ2luX2IQoJb3JpZ2luX2IQoJb3JpZ2luX2IQoJb3JpZVERYLONGSTRINGEXAMPLE
   ```
2. Add preferred default region and format to the shared config file, which is ~/.aws/config on Linux and MacOS.
   ```
    [default]
    region=us-west-2
    output=json
    
    [profile user1]
    region=us-east-1
    output=text
   ```
Specify the profile when issuing cdk commands using the --profile option or the AWS_PROFILE environment variable (can be added with a -e flag in the docker run command for the AWS CLI).  

Useful commands for getting default account information, account information for a specific profile, and the region for which the account is configured for:

```
aws sts get-caller-identity
aws sts get-caller-identity --profile prod

aws configure get region
aws configure get region --profile prod
```

### CDK project setup

#### Initialise CDK project

TypeScript and the CDK Toolkit can be installed globally by running <code>npm install -g typescript aws-cdk</code>.  

Or, use local tools:

Initialise a new CDK project e.g. faces-cdk-project, cdk-app, etc.

```shell
$ mkdir cdk-app
$ cd cdk-app
$ npx aws-cdk init --language=typescript
```

An alias <code>cdk</code> can be set for <code>npx aws-cdk</code> in the current shell session, or for all future shell sessions by editing the ~/.bashrc, ~/.bash_profile or ~/.zshrc file.

#### Build
For CDK projects initialised in TypeScript, the project is automatically compiled into JS with ts-node, as specified in the cdk.json file:

```js
{
  "app": "npx ts-node --prefer-ts-exts bin/faces-cdk-project.ts",
   ...
}
```

Build with <code>tsc</code> if using global tools, or if using local tools, use <code>npm run build</code>.

#### Bootstrap CDK project

Bootstrap stack deployment for the CDK project by creating dedicated AWS resources e.g. Amazon S3 buckets, to be available to AWS CloudFormation during deployment. Bootstrap can be run with a named profile.

```
aws sts get-caller-identity
cdk bootstrap aws://ACCOUNT-NUMBER/REGION

cdk bootstrap --profile prod aws://ACCOUNT-NUMBER/REGION
```

From the AWS management console, new CloudFormation stack, CDKToolkit, will be created.  

#### CDK Synth
To test that the stack defined in the AWS CDK app can be synthesised and deployed, issue the command from the CDK project's main directory:

```
cdk synth
```
This app only defines a single stack, so there is no need to specify the Stack name after the command.

The output of the <code>cdk synth</code> command will be sent to the /cdk.out directory, which will include the synthesised template of the stack as well as any stack assets.

No need to explicitly synthesise stacks before deployment as <code>cdk deploy</code> performs this step.  However, it is useful as a test before deployment in the GitHub Actions workflow.  Also, the synthesised template can be used in the deployment by using the --app /path/to/cdk.out. 

#### CDK Deploy
Deploy the resources defined by the stack in the AWS CDK app to AWS by issuing the command from the CDK project's main directory:

```
cdk deploy
```
This app only defines a single stack, so there is no need to specify the Stack name(s) after the command.

For testing from local development environment, <code>cdk deploy</code> can be run with or without a named profile.  FOr example:

```
cdk deploy FacesCdkProjectStack
cdk deploy --profile prod FacesCdkProjectStack --require-approval never
```

Or deploy using the synthesised stack template found in the <code>cdk.out</code> directory:

```
cdk deploy --app cdk.out FacesCdkProjectStack --require-approval never
cdk deploy --profile prod --app cdk.out FacesCdkProjectStack --require-approval never
```

#### Other CDK commands

Use <code>cdk destroy</code> to destroy the stack created after testing is completed.  For example:

```
cdk destroy FacesCdkProjectStack
cdk destroy --profile prod FacesCdkProjectStack
```

#### IAM roles/users required

An IAM role/user for CDK deployment must be provisioned along with the necessary persmissions to assume the role and create and manage the resources of the stack.  

As the stack includes an EC2 Spot Instance, an EC2 instance profile also had to be set up with the necessary permissions.

### Test for successful deployment

On successful creation of the stack following a <code>cdk deploy</code>:

1. Go to the AWS management console and navigate to EC2 > Instances.  A new instance will be spun up with the INstance State being 'RUNNING' and the Status Check will be completed.
2. Click on the EC2 instance link.  The public address can be copied to the REACT_APP_SERVER_URL environment variable in the front end client's deployment project settings in Vercel.  A new deployment must be triggered to make use of the new value of the environment variable. 
3. Click on 'Connect'.  The instance ID can be copied from here.
4. Again, click on 'Connect' to open an SSH connection to the EC2 instance with the keypair specified in the CDK script.
5. Run <code>docker ps -a</code>.  Two containers, <code>postgres</code> and <code>faces</code> will be running.
6. Run <code>curl -v http://localhost/users</code>.  A 200 response will be returned by the Express server.
7. Run <code>sudo cat /var/lib/cloud/instances/<instance_ID>/user-data.txt</code>.  This is the user data script that was run by the EC2 instance profile on spinning up the instance.  All environment variables will have been exported when the script was run.
8. Run <code>cat /home/ec2-user/APP/docker-compose.log</code> to find the logs from when <code>docker-compose up</code> was run.
9. Run <code>ls -la /home/ec2-user/APP/docker-compose.yml</code> and <code>/home/ec2-user/APP/postgres/init-scripts</code> to find the <code>docker-compose.yml</code> and <code>setupDB.sh</code> files were downloaded from S3.
10. Run <code>docker exec -it <postgres_container_name> sh</code>.  An interactive shell session will be made available to run psql.

## Integration and Deployment

CI/CD setup was deliberately kept low-cost and simple but effective through the use of GitHub Actions, which ran successfully.  

### Docker Image CI
![Docker Image CI status](https://github.com/rainbowchook/face-app-api/actions/workflows/docker-image.yml/badge.svg)

Docker images built from ./Dockerfile and pushed to Docker Hub through Github Actions triggered by PR to main branch.

Docker Hub repo found here: [https://hub.docker.com/r/rainbowchook/faces-app-api](https://hub.docker.com/r/rainbowchook/faces-app-api)

### Manual CDK Deployment
![Manual CDK Deployment status](https://github.com/rainbowchook/face-app-api/actions/workflows/aws-cdk-ec2.yml/badge.svg)

CDK scripts located in /faces-sdk-project directory.  Project is deployable to AWS EC2 Spot Instance through manual trigger of a GitHub Actions workflow - Manual CDK Deployment. 

Every deployment spins up a new EC2 Spot Instance.  The front-end client must be updated to point to the latest public server URL.  

The EC2 instance profile will initialise the instance through the user data script: The assets (docker-compose file and Postgres init script) and exported environment variables will be used to pull, start and initialise Docker containers of the Express server and Postgresql database from Docker Hub images, communicating via Docker custom bridge network connection, as specified in the docker-compose file.  



#### Use of HTTP instead of HTTPS
As this project is deliberately kept low-cost by requiring a new stack to be deployed each time, no domain nor CA was purchased for a secure HTTPS connection.  The stack is always destroyed after testing.

Port 80 will be open, thus the front-end client will make calls to http://<EC2_public_URL>.

As the browser will not allow mixed media content to be served (the server is serving over HTTP instead of HTTPS), all requests from the front-end client will be routed through a serverless function, deployed together with the front-end app to Vercel, thus bypassing browser restrictions.

## References

[Mixed media content: Website delivers HTTPS pages but contains HTTP links](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content/How_to_fix_website_with_mixed_content)

[AWS CLI Amazon ECR Public/Docker Getting Started User Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-docker.html)

[AWS CLI Authenticate with short-term credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-authentication-short-term.html)

[AWS CDK v2 Getting Started and Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_bootstrap)

[CDK Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)

[Guide to Working with CDK in TypeScript](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html)

[Processing EC2 user data script](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)

[EC2 Spot Instance Pricing](https://aws.amazon.com/ec2/spot/pricing/)




