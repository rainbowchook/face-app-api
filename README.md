# face-app-api

## Description
This is the back-end part of a full-stack PERN application for detecting faces and their corresponding emotions within an image.  Logged-in user can submit images for face and emotions detection, with each submission updated in the database for tracking number of image entries.

The source code for the app server is located in the /src directory.  The CDK project is located in /faces-cdk-project. Other config and docker files are located in the project root / directory.

GitHub repo for face-app client located at [https://github.com/rainbowchook/face-app](https://github.com/rainbowchook/face-app).

The deployed front-end app is located at [https://face-app-lilac.vercel.app/](https://face-app-lilac.vercel.app/)

This project has been successfully deployed to an AWS EC2 Spot Instance by a manually triggered GitHub Actions worflow using AWS CDK.  Each deployment will result in a different public address.  To save cost, the CloudFormation stack is torn down each time after testing.

![Docker Image CI status](https://github.com/rainbowchook/face-app-api/actions/workflows/docker-image.yml/badge.svg)

Express server Docker Image: [https://hub.docker.com/r/rainbowchook/faces-app-api](https://hub.docker.com/r/rainbowchook/faces-app-api)

![Manual CDK Deployment status](https://github.com/rainbowchook/face-app-api/actions/workflows/aws-cdk-ec2.yml/badge.svg)

## Available scripts

Build script to compile TypeScript code in JS:

```
npm run build
```

Build script in watch mode
```
npm run start:build
```

Development run script to be used after build step:
```
npm run start:run
```

Development run script to be executed after building:
```
npm run start:dev
```

Production run script:
```
npm run start
```

### Enhancement/Todo
Instead of using the <code>concurrently</code> npm package to build and run, <code>tsnode</code> could have been used instead.

## Technical Description

Main project source code and CDK scripts were written in TypeScript.  
The API exposes /users and /images endpoints for: 
CRUD operations - registration, login, get user profile, get all users, delete user account, update user image entries count; 
and making a call to Clarifai through their GRPC client.

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

During registration, passwords are hashed with brcyptjs before storing in the <code>login</code> table in the database.
For logins, user plaintext passwords are compared with the stored hashed password via brcypt's compare function.

#### Clarifai

##### Clarifai GRPC Client

The Clarifai gRPC client connects over HTTP/2, which features are still unsupported on the browser client.  Use of the gRPC client was recommended by Clarifai over connecting via HTTP+JSON through the front-end app.  Benefits of using gRPC include:

1. Increased throughput/reduced network constraint: gRPC Protobuf-encoded binary messages result in smaller payloads that serialiase quickly on server and client; and HTTP/2 protocol allows multiplexing of multiple HTTP/2 calls over a single TCP connection.
   
2. Prescriptive gRPC specification about the format that a gRPC service must follow, ensuring consistency across platforms and implementations.  Clients can also specify request timeouts.
   
3. Code generation from the gRPC client is strongly typed, eliminating duplication of messages during the creation of RESTful JSON Web API (in this case /images endpoint); consequently, additional tooling is required to analyse Protobuf payloads and to compose requests by hand - the increased complexity adding to development time.

4. Supports real-time bi-directional streaming, though only unary streaming was used in this project.

##### Using the clarifai-nodejs-grpc library

The static approach to using the [clarifai-nodejs-grpc](https://github.com/Clarifai/clarifai-nodejs-grpc) library was chosen over the dynamic approach as it provides type annotations via TypeScript declaration files, improving the IDE auto-completion experience. The only difference is in the syntax - the dynamic approach uses a stub to access all methods available in the Clarifai API.

The static approach involves: 
1. Creating the <code>V2Client</code> object with which to access all Clarifai API functionality, and the <code>Metadata</code> object that is used to authenticate by means of the Clarifai Personal Access Token (PAT) key. 

2. Setting up the request for PostWorkflowResults with the UserId and AppId, WorkflowId (of the face-sentiments workflow obtained from publicly available Clarifai/main apps and workflows), default OutputConfig and image input data set to the passed-in imageUrl.

3. The request and metadata are then sent to the Clarifai gRPC service via the postWorkflowResults function, which will return a response or error via the callback function passed in as the third parameter in the function.

4. The list of outputs was obtained from the list of results returned in the <code>response</code> object.  For an image input supplied, a list of regions was returned by the workflow, which comprised of bounding boxes and (sentiments) concepts.  The bounding boxes and sentiments would be returned as a JSON response to the called or the /images endpoint.  Types were defined for BoundingBox, Sentiment and BoxSentiment as a contract for the return types.  Each face detected in the image would have a BoundingBox region and its associated list of Sentiments returned in the form of a JSON as a BoxSentiment object.

##### Making predictions

This project uses a [publicly available workflow for face-sentiments detection](https://clarifai.com/clarifai/main/workflows/Face-Sentiment), which passes images through a face-detection model before passing the cropped face-detection regions to the sentiments model.  The multi-model workflow combines face detection and sentiment classification of 7 concepts: anger, disgust, fear, neutral, happiness, sadness, and contempt.

Model predictions on image inputs can be made from image URLs or bytes.  For this project, submission by image URL was selected.  The imageUrl is submitted to the face-sentiments [workflow](https://docs.clarifai.com/api-guide/workflows/common-workflows/workflow-predict). 

##### Challenges

1. TypeScript [Optional Chaining](https://stackoverflow.com/a/15260828) was utilised a lot as the <code>getStatus()</code> method of the <code>response</code> object may return <code>undefined</code> (from the type definition).  

2. The Clarifai documentation with regards to its gRPC implementation was more , so the code was cobbled together through much use of <code>console.log</code>, manually checking the type definition files through the VSCode IDE, and sifting through the provided example JSON output files for the face-sentiment detection workflow found in the Clarifai user's app dashboard.  

#### Knex

For this project's simple requirements, Knex was used as a query builder in conjunction with the pg database driver to connect to the database.  [An ORM was not needed](https://blog.logrocket.com/node-js-orms-why-shouldnt-use/).

When working with Knex in TypeScript, types <code>User</code> and <code>Login</code> were created to represent rows in the database tables.  Knex APIs accept <code>TRecord</code> and <code>TResult</code> type parameters, with which to specify a row in the database table and the type of the result of the query respectively.  

When returning a result from the database, the Knex query builder accepts a partial type that picks a set of properties <code>Keys</code> from the result <code>Type</code> (selected columns of a table) as a type parameter e.g. <code>Pick<Todo, "title" | "completed"></code>.  The <code>TResult</code> type parameter will allow Knex to infer the result type based on the columns being selected as long as the select arguments exactly match the key  names in the record type.  

Example query returning the <code>hash</code> from the <code>Login</code> table, from /src/services/queries.ts: 

```typescript
export const getLoginHashByEmail = (email: string) => {
  return pg
    .select()
    .from<Login, Pick<Login, 'hash'>>('login')
    .where({ email })
    .returning('hash')
    .then((loginPassword) => loginPassword)
    .catch((error) => {
      console.error('Error retrieving user data: ', error)
      throw error
    })
}
```

Transactions were used in the registration and delete operations as records pertaining to the user account had to be inserted/deleted from the <code>users</code> and <code>login</code> tables in one atomic transaction.

#### Future Enhancements/Todos

1. Models were not created for Requests and Responses, though a BoxSentiment type was clearly defined for the bounding boxes and sentiments returned from the /images endpoint, which makes a call to the Clarifai API for image processing.
2. Login and register requests can be routed through a middleware that sets the user session on a cookie.  Subsequent requests to the /images endpoint should check to see if the user session has expired.  

### Postgresql database

#### Setup Postgresql from Docker image

The [official Postgresql Docker image](https://hub.docker.com/_/postgres) was used instead of a local installation.  It is good enough for testing purposes and POC projects of this complexity.

```
docker run --name postgresql -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -v $PWD/data:/var/lib/postgresql/data -d postgres
docker exec -it postgresql sh
```
<code>$PWD</code> needed for MacOS.

Equivalent command:

```
docker run -itd –name postgresql -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -v $PWD/data:/var/lib/postgresql/data postgres
```

A data volume in the local host environment must be mounted.

#### Setup of Postgres Database

A shell script or .sql scripts can be run if the directory that contains the scripts were mounted as a volume to bind to <code>docker-entrypoint-initdb.d</code> directory on the postgres container.

Alternatively, just run the shell script setupDB.sh containining the SQL queries upon opening an interactive shell session for the postgres docker container with the -it flags within the <code>docker run</code> command.

```sql
CREATE DATABASE $DB_NAME;
  \connect $DB_NAME;
  CREATE SCHEMA IF NOT EXISTS $SCHEMA;
  CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
  GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
  GRANT ALL ON SCHEMA $SCHEMA TO $DB_USER;
  \connect $DB_NAME $DB_USER;
  CREATE TABLE $SCHEMA.users (
    id serial PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email text UNIQUE NOT NULL,
    entries BIGINT DEFAULT 0,
    joined TIMESTAMP NOT NULL
  );
  CREATE TABLE $SCHEMA.login (
    id serial PRIMARY KEY,
    email text UNIQUE NOT NULL,
    hash VARCHAR(100) NOT NULL
  );
```

The <code>login</code> table only keeps the user email and hashed password.  Other user details are kept in the <code>users</code> table.

Sample query to check that the request handler for the POST /users end-point of the Express server is working correctly:
```
SELECT * FROM users JOIN login ON users.email = login.email;
```
During registration, user records should be inserted into the <code>users</code> and <code>login</code> tables.  

#### Future Enghancements/Todos

The database design, while working in its current state, could be further refined.  

##### 'users' table: 'userId' generated from version 4 UUID
The auto-generated id in the <code>users</code> table is currently treated as a primary key.  Instead, a <code>userId</code> column should be a unique primary key for each record in the <code>users</code>, along with the <code>email</code> column. This arrangement makes provision for the user changing their email in the future for their user account.  

The latest postgres docker image is greater than version 13, which natively supports generation of version 4 UUID through the function <code>gen_random_uuid()</code>.  

##### 'login' table: 'lastLogin' timestamp and 'lastLogout' timestamp
Introducing a <code>lastLogin</code> timestamp in the <code>login</code> table would be useful for persisting user session data.  By comparing the <code>lastLogin</code> with the session expiry set in the cookie or expiry on period of inactivity (whichever is less), the user session can be reset/refreshed or the user logged out, upon which the corresponding <code>lastLogout</code> timestamp will be updatedin the <code>login</code> table. 
(Note: This change will require modifications to the front-end for the user session logout to be effected).

### CDK scripts for CloudFormation (Infrastructure as Code)

Deploys a single stack from /bin/faces.cdk.project.ts, with the environment set through environment variables.

This CDK app is created from the TypeScript template.  All source code located in /lib folder.  Assets (docker-compose file and Postgresql init script) located in /lib/assets.

The stack is created by calling the constructor of each construct in sequence and destructuring the instance returned as a readonly property:

1. The VPC construct does a lookup that dynamically returns the default VPC configurations based on the current context.
2. The SecurityGroup construct takes the vpc above as props and sets the ingress and egress rules - allowing inbound traffic only for SSH (TCP port 22), HTTP (TCP port 80) and HTTPS (TCP port 443), and allowing all outbound traffic
3. The ServerRole construct is created for the EC2 instance to assume as the service principal, and is configured with customer-managed policies created earlier with the necessary permissions - EC2instance and DockerOps.  This role will be attached to the EC2 instance during the launching of the EC2 instance.
4. The EC2SpotInstance construct receives the vpc, serverRole and server security groups as props and returns the ec2SpotInstance as a readonly property.  Its constructor invokes a new instance of custom class SpotInstance which inherits from the Instance class, receiving an extra property - launchTemplateSpotOptions - from within custom SpotInstanceProps that inherits from InstanceProps.  
5. The commands are added to an instance of UserData for Linux before being rendered for use in the ec2SpotInstance construct and added to the ec2SpotInstance construct.

#### EC2 Spot Instance

The launch template specifies the instance requirements based on a list of attributes.  It specifies the instance type to be a t2.micro instance with the latest Amazon Linux 2 image.  It also specifies an existing key pair for SSH connections to the EC2 instance launched.  

Spot options set the max price to USD 0.005 (market price depends on the AWS region), with requirements to request once only and to terminate the EC2 spot instance on interruption i.e. max spot price exceeded or a <code>cdk destroy</code> command was issued to tear down the stack and all resources in it, such as the EC2 Spot Instance. 

Note: This launchTemplateSpotOptions parameter combination of <code>interruptionBehavior</code> and <code>requestType</code> is valid: 
```typescript
const launchTemplateSpotOptions: LaunchTemplateSpotOptions = {
  // blockDuration: Duration.hours(2),
  interruptionBehavior: SpotInstanceInterruption.TERMINATE,
  maxPrice: 0.005,
  requestType: SpotRequestType.ONE_TIME,
  // validUntil: Expiration.after(Duration.minutes(30)), // Invalid Parameter Combination: validUntil cannot be specified when the SpotRequestType is set to 'one-time';
}
```
For a one-time spot request and interruption behavior set to 'terminate', <code>blockDuration</code> and <code>validUntil</code> cannot be included in the spot options parameter combination.

#### User Data script for EC2 instance initialisation

The EC2 instance profile will run the user data script as the root user.  On connecting to the EC2 instance, the user-data script can be found in /var/lib/cloud/instances/<instance_ID>/user-data.txt.

Install docker and start the docker service, which will be run in the docker group.

Add the ec2-user to the docker group with <code>sudo usermod -aG docker ec2-user</code>.  This will enable the ec2-user to run <code>docker</code> commands without using <code>sudo</code>.

Note that docker-compose must be installed first via curl prior to running the docker-compose.yml asset downloaded from the S3 bucket.  The ec2-user should be granted execute permissions for the docker-compose binary.

Environment variables for the app server and postgres database should be exported.

The docker-compose file and database init script(s) should be downloaded from the S3 bucket, creating a directory for the postgres init scripts and any parent directories as needed through the -p flag in <code>mkdir -p /home/ec2-user/<app_directory>/<postgres_init-scripts></code>.

Execute the command <code>docker-compose up</code> as a background process or daemon with the -d flag.  Pipe standard output and standard error to a log file for easy debugging:
```
docker-compose -f ${dockerComposeLocalPath} up -d > /home/ec2-user/APP/docker-compose.log 2>&1
```

As the user data script is run by the root user, change ownership of the working directory e.g. /APP, to the ec2-user user and group, as well as grant all read/write/execute permissions to the root and ec2-user group:
```
sudo chown -R ec2-user:ec2-user /home/ec2-user/APP
sudo chmod -R 770 /home/ec2-user/APP
```

#### IAM roles and policies

##### CDK deploy user
The credentials or named profile of the AWS user or role used in the running of cdk commands e.g. <code>cdk bootstrap</code> must have sufficient IAM permissions for CDK setup, like '<code>cloudFormation:CreateStack</code>', '<code>s3:CreateBucket</code>', and other CloudFormation permissions.

Permissions need to be granted depending on services used in the CDK script.  EC2 permissions are needed for launching, describing and terminating of EC2 instances.  As the CDK script uses assets stored in an S3 bucket, it should also have S3 permissions.

##### EC2 instance profile
The instance profile is assigned to the EC2 instance when launching or modifying the instance, granting permissions to the EC2 instances to allow instances to access other AWS services securely.

IAM permissions for the EC2 instance profile were granted following the principle of least privilege and granting only the permissions needed for specific tasks that the EC2 instance profile will perform. 

The role assumed by the EC2 instance profile initially had IAM permissions granted through the AWS management console (it can also be done through the AWS CLI).  

As it also performs Docker ops during the running of the user data script, a DockerOps custom policy was created to pull images from Docker Hub, interact with the Docker daemon.  Sample DockerOps policy:
```js
{
	"Version": "2012-10-17",
	"Statement": [
		{
			"Sid": "VisualEditor0",
			"Effect": "Allow",
			"Action": [
				"ec2:CreateNetworkInterface",
				"ec2:DescribeInstances",
				"ec2:DescribeNetworkInterfaces",
				"ec2:CreateTags",
				"ec2:DeleteNetworkInterface",
				"ec2:DescribeInstanceStatus"
			],
			"Resource": "*"
		}
	]
}
```

The process of granting permissions for the IAM roles and policies was characterised by much trial and error.  

If the stack cannot be torn down automatically, it must be destroyed manually.  Through the AWS management console, delete the stack in CloudFormation and any S3 buckets or EC2 instances created before adjusting IAM permissions and re-deploying.

#### Design decisions 
1. Instead of using readFileSync for /scripts/user-data.sh and adding it to the EC2 Spot Instance with .addUserData(userData), commands were added to the instance user data using the .addCommands() and addS3DownloadCommand() methods from UserData class for Amazon Linux AMI.  All commands were rendered and added to the EC2 Spot Instance through addUserData(userData.render()).
2. Environment variables from GitHub Actions secrets were referenced in the user data script and exported into the EC2 instance.  The GitHub Actions logs appropriately masks environment variables injected at runtime.  Loading the environment variables into the SSM Parameter Store or Secrets Manager, or loading a file in the S3 bucket encrypted with KMS would have been redundant. The use of the Secrets Manager in particular would have been the most cost-prohibitive.
3. The most cost-effective solution was considered based on the simplicity of the project requirements.  The stack created utilised minimal resources: a single EC2 Spot Instance is created in the stack with a pre-determined max price in the spot options of the launch template. If the market price goes beyond the set max price, the instance will be terminated, as a one-time spot instance type was requested and based on the interruption behaviour. However, horizontal scaling can be introduced by specifying the min, max and desired capacity of EC2 Spot instances to launch by means of an AutoScaling Group (AG) fronted by an Internet-facing Application Load Balancer (ALB).  In that case, the existing deployment strategy would need to be modified to a microservices architecture - the Postgres database docker container would have to run in its own EC2 instance while the express app server container would run in its own EC2 instance and the number of instances scaled according to demand by the AG.  The ALB will incoming traffic to  available app servers with capacity to handle the load.

## Dockerisation 

Prerequisite: Create a Docker Hub account and a Docker Hub repo.  Make the repo public to enable the Docker image to be pulled by the AWS EC2 instance.

### Dockerfile of Express server

As TypeScript was installed as a dev dependency, run <code>npm ci && npm cache clean --force</code> to install packages in /node_modules folder first.  

<code>npm ci</code> (or <code>clean-install</code>) is preferred over <code>npm install</code> as it will install existing dependencies from the <code>package-lock.json</code> file without updating current dependencies, ensuring a reliable build for continuous integration.  As a general rule, use <code>npm ci</code> for production and <code>npm install</code> for development.  Running <code>npm cache clean --force</code> clears the cache for a clean install by clearing the packages and dependencies in the local npm cache folder e.g. ~/.npm for POSIX.

Set the NODE_ENV environment variable to 'production' before running <code>npm run build</code> to compile the TypeScript code into JS. 

Then prune all dev dependencies by running <code>npm prune --production</code>

The user <code>node</code> in the Docker container must be granted ownership of the working directory with the recursive flag:
```
RUN chown -R node /app
USER node
```

Run the command to start the server thus:
```
CMD ["node", "build/server.js"]
```

### Build and Push Docker Image

Run the <code>docker build</code> command in the project directory from the Dockerfile, tagging the image as with <code>latest</code>:
```
docker build . --file Dockerfile --tag <DockerHub_username>/<DockerHub_repo>:latest

docker build . --file Dockerfile --tag rainbowchook/faces-app-api:latest
```

Then login to the Docker Hub account and push the Docker image on to the Docker Hub repo created earlier:
```
docker push <DockerHub_username>/<DockerHub_repo>

docker push rainbowchook/faces-app-api
```

### Docker Compose

There are two docker-compose files: docker-compose.dev.yml used in development, and docker-compose.yml uploaded as an S3 asset by the CDK scripts to be run in the EC2 user data script.  

The local docker-compose.dev.yml file builds the Express server Docker container from the given context and Dockerfile.  

#### Docker network

Use docker-compose to start up Postgresql and Express server containers to run on the same network, which is by default the bridge network.  

The DB_HOST referred to in the Express server container must be the name of the Postgres container for a custom bridge network arrangement.

#### Data volume

The db service was configured to use a named data volume called 'postgres' in docker-compose.yml.

#### Health check

The prod docker-compose.yml file was refined while deploying to the EC2 instance and tweaked to include health checks for the db service as the database was being restarted in the postgres container before it was ready to accept connections, thus aborting the running of the database init script (setupDB.sh) but already running with a non-empty data volume - which then causes the postgres docker entrypoint init script to skip the running of database init scripts.  The health check forces an artificial delay of the database restart, which allows the database init scripts found in /docker-entrypoint-initdb.d to be run fully before the database restart.  The server service depends on the db service being in a healthy condition.

Get the logs for the postgres container by running <code>docker logs -f postgres</code> in order to see that the database init script(s) was run.

## CDK setup

### AWS CLI setup in local development environment

#### Docker Installation

Pre-requisite: [Docker](https://docs.docker.com/get-docker/) installed

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

Specify the volume mounts ~/.aws:/root/.aws and $(pwd):/aws for access to the host file system, credentials and configuration settings when using aws commands, which allows AWS CLI running in the container to locate host file information.

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

Bootstrap stack deployment for the CDK project by creating dedicated AWS resources to be available to AWS CloudFormation during deployment i.e. setting up Amazon S3 buckets to store CDK assets and a CloudFormation stack for managing CDK resources. 

Bootstrap can be run with a named profile.

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

1. Go to the AWS management console and navigate to EC2 > Instances.  A new instance will be spun up with the Instance State being 'RUNNING' and the Status Check will be completed.
2. Click on the EC2 instance link.  The public address can be copied to the REACT_APP_SERVER_URL environment variable in the front end client's deployment project settings in Vercel.  A new deployment must be triggered to make use of the new value of the environment variable. 
3. Click on 'Connect'.  The instance ID can be copied from here.
4. Again, click on 'Connect' to open an SSH connection to the EC2 instance with the keypair specified in the CDK script.
5. Run <code>docker ps -a</code>.  Two containers, <code>postgres</code> and <code>faces</code> will be running.
6. Run <code>curl -v http://localhost/users</code>.  A 200 response will be returned by the Express server.
7. Run <code>sudo cat /var/lib/cloud/instances/<instance_ID>/user-data.txt</code>.  This is the user data script that was run by the EC2 instance profile on spinning up the instance.  All environment variables will have been exported when the script was run.
8. Run <code>cat /home/ec2-user/APP/docker-compose.log</code> to find the logs from when <code>docker-compose up</code> was run.
9. Run <code>ls -la /home/ec2-user/APP/docker-compose.yml</code> and <code>/home/ec2-user/APP/postgres/init-scripts</code> to find the <code>docker-compose.yml</code> and <code>setupDB.sh</code> files were downloaded from S3.
10. Run <code>docker exec -it <postgres_container_name> sh</code>.  An interactive shell session will be made available to run psql.
11. To enter psql, run:
```shell
# PGPASSWORD=password psql -U postgres
```
12. Run <code>\c <DB_NAME> <DB_USER></code> to connect to the database created as the DB user created in the postgres init scripts i.e. setupDB.sh.
13. Run <code>\d</code> to describe DB tables.  For example:
```shell
facesdb=> \d
            List of relations
 Schema |     Name     |   Type   | Owner 
--------+--------------+----------+-------
 public | login        | table    | faces
 public | login_id_seq | sequence | faces
 public | users        | table    | faces
 public | users_id_seq | sequence | faces
(4 rows)

```

Completion of this checklist means that the stack was successfully deployed, and the user data script and postgres init scripts were successfully run.

## GitHub Actions: Integration and Deployment

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

## Reflections

### Alternative deployment strategy
1. The express server functionality can be converted into serverless functions and deployed together with the front-end app on Vercel, bypassing the need for a serverless function to act as a proxy to route requests over HTTP to the Express server hosted on AWS EC2, without a domain and a CA to enable HTTPS connection.  Serverless functions also come with in-built horizontal scaling, although a slower start-up time can be expected if demand drops.

2. Even the Postgresql database can be replaced with Vercel Postgres to keep the resources close to each other.  [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) is a scalable serverless framework designed to integrate with Vercel Functions (serverless functions and edge functions) and the frontend framework.

3. Another alternative is deploying the database using [Planetscale](https://planetscale.com/docs/concepts/what-is-planetscale), a MySQL-compatible serverless database, by selecting a region close to the application server or region that the serverless function is deployed in (Vercel allows specifying the region for the serverless function). Planetscale deploys over AWS and GCP, which makes it easy to co-locate the application server and database in the same region.

4. Since the Express server and Postgresql database were deployed as Docker containers (bearing in mind cost-effectiveness), they could have been deployed into ECS for horizontal scaling of services depending on demand.

5. A persistent secondary EBS Volume can be used to persist the postgres data.  If needs evolve beyond the requirements of this POC project, an EBS volume can be mounted so that on launching the EC2 Spot Instance, the persisted data can be used by the postgres database.  ["To automatically attach a persistent secondary EBS volume to a new EC2 Linux Spot Instance at boot, add a user data script to an EC2 launch template. Use the template when configuring your Spot Instance Request."](https://repost.aws/knowledge-center/ec2-linux-spot-instance-attach-ebs-volume). The EC2 instance profile, or IAM role attached to the launch template, should include attach-volume access granted.  The launch template of the EC2 Spot Instance should be modified to include the user data script with the command to attach the EBS Volume to the EC2 Spot Instance using the instance id:

```shell
   #!/bin/bash
      OUTPUT=$(curl http://169.254.169.254/latest/meta-data/instance-id)
      aws ec2 attach-volume --volume-id vol-xxxxxxxxxxxx --device /dev/xvdf --instance-id $OUTPUT --region ap-southeast-1
   ```
Alternatively, create a file system in Amazon EFS, a network storage system, and mount the network filesystem to the instance.

### Use of HTTP instead of HTTPS
As this project is deliberately kept low-cost by requiring a new stack to be deployed each time, no domain nor CA was purchased for a secure HTTPS connection.  The stack is always destroyed after testing.

Port 80 will be open, thus the front-end client will make calls to http://<EC2_public_URL>.

As the browser will not allow mixed media content to be served (the server is serving over HTTP instead of HTTPS), all requests from the front-end client will be routed through a serverless function, deployed together with the front-end app to Vercel, thus bypassing browser restrictions.

### Tests
Tests for the app server and infrastructure not yet added.

## References

### Express

[Use TypeScript to build a Node API with Express](https://developer.okta.com/blog/2018/11/15/node-express-typescript)

[How to set up TypeScript with Node.js and Express](https://blog.logrocket.com/how-to-set-up-node-typescript-express/)

[How to use Express in TypeScript](https://www.geeksforgeeks.org/how-to-use-express-in-typescript/)

[Error can't set headers after they are sent to the client](https://stackoverflow.com/questions/7042340/error-cant-set-headers-after-they-are-sent-to-the-client)

### Clarifai

[Clarifai Face-Sentiment Multi-Modal Workflow combining face detection and sentiment classifications of 7 concepts](https://clarifai.com/clarifai/main/workflows/Face-Sentiment)

[Clarifai NodeJS gRPC Client](https://github.com/Clarifai/clarifai-nodejs-grpc)

[Clarifai API Client Installation](https://docs.clarifai.com/api-guide/api-overview/api-clients/)

[Clarifai use of gRPC over HTTP/2 preferred over that of HTTTPS+JSON channel - calling a gRPC service from the server rather than the browser client](https://docs.clarifai.com/api-guide/api-overview/api-clients/grpc-vs-http-channels)

[Clarifai Predict Images via URL](https://docs.clarifai.com/api-guide/predict/images/)

[Clarifai NodeJS Tutorial](https://docs.clarifai.com/tutorials/node-js-tutorial) 

[Clarifai Make Model Predictions in your workflows](https://docs.clarifai.com/api-guide/workflows/common-workflows/workflow-predict/)

[Clarifai/main app: models and workflows built by Clarifai - Visual Classifiers, Moderation, Visual Classifiers](https://clarifai.com/clarifai/main)

[Clarifai API Swagger](https://api.clarifai.com/api-doc/?url=https://api.clarifai.com/v2/swagger.json)

### Postgres

[Postgresql System Queries](https://razorsql.com/articles/postgresql_system_queries.html)

[Postgresql Tutorial: Postgresql integer](https://www.postgresqltutorial.com/postgresql-tutorial/postgresql-integer/)

[In Postgresql version 15 and above: Only the database owner can create objects in the public schema](https://www.cybertec-postgresql.com/en/error-permission-denied-schema-public/)

[How to Set the Default User Password in Postgresql](https://chartio.com/resources/tutorials/how-to-set-the-default-user-password-in-postgresql/)

[Generating a UUID in Postgres for Insert Statement](https://stackoverflow.com/questions/12505158/generating-a-uuid-in-postgres-for-insert-statement)

### Knex

[Knex Guide regarding TypeScript](https://knexjs.org/guide/#typescript)

[Knex Query Builder Guide for select query](https://knexjs.org/guide/query-builder.html#select)

[Knex Transactions](https://knexjs.org/guide/transactions.html)

### Docker

#### Docker Build

[How to Build a NodeJS Application with Docker](https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker)

[Dockerising a NodeJS Web App](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)

[Node Docker Good Defaults](https://github.com/BretFisher/node-docker-good-defaults/blob/69c923bc646bc96003e9ada55d1ec5ca943a1b19/test/sample.js)

#### Postgres Docker

[How to use the Postgres Docker Official Image](https://www.docker.com/blog/how-to-use-the-postgres-docker-official-image/)

[Docker Compose and Create DB in postgres on init](https://stackoverflow.com/questions/59715622/docker-compose-and-create-db-in-postgres-on-init)

[Docker entrypoint initdb Permission Denied](https://stackoverflow.com/a/68288835/20171966)

[Docker Postgres db init scripts ignored when data volume not empty - shutdown initiated before server read to accept connections](https://gist.github.com/onjin/2dd3cc52ef79069de1faa2dfd456c945)

[Docker Postgresql image's docker-entrypoing.sh](https://github.com/docker-library/postgres/blob/master/docker-entrypoint.sh#L327)

[Docker Postgres Shuts Down immediately When Started with Docker Compose](https://stackoverflow.com/questions/37259584/postgres-shuts-down-immediately-when-started-with-docker-compose)

[Introducing Health Check for Postgres Docker container to delay shutdown so that db init script(s) will finish running](https://stackoverflow.com/a/71315084/20171966)

[User-defined bridges provide automatic DNS resolution between containers: DB_HOST should be postgres container name](https://docs.docker.com/network/drivers/bridge/)

#### Docker Compose

[Docker Compose Environment variables](https://docs.docker.com/compose/environment-variables/envvars-precedence/)

[Docker Compose specifications for services](https://docs.docker.com/compose/compose-file/05-services/)

[Docker Compose Networks top-level element](https://docs.docker.com/compose/compose-file/06-networks/)

[Docker Compose commandline reference: docker compose up](https://docs.docker.com/engine/reference/commandline/compose_up/)

[Docker Compose down with a non-default yml file name](https://stackoverflow.com/questions/48717646/docker-compose-down-with-a-non-default-yml-file-name)

[Variables in Docker Compose](https://www.codementor.io/@dhananjaykumar/variables-in-docker-compose-21argqci24)

#### Others

[Add $PWD before local file directory path for Mac](https://stackoverflow.com/a/69501793)

[Resolve warning the requested image platform linux amd64 does not match the detected host platform linux arm64](https://devcoops.com/resolve-warning-the-requested-image-platform-linux-amd64-does-not-match-the-detected-host-platform-linux-arm64-v8/)

[Introduction to Docker Secrets - only works in swarm mode](https://www.baeldung.com/ops/docker-secrets)

### AWS

#### AWS CLI

[AWS CLI Amazon ECR Public/Docker Getting Started User Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-docker.html)

[AWS CLI Authenticate with short-term credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-authentication-short-term.html)

#### Profiles / Shared config and credentials files

[AWS User Guide: Use an IAM role in the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-role.html)

[AWS Configuring Profile](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

[AWS Shared config and credentials files format](https://docs.aws.amazon.com/sdkref/latest/guide/file-format.html)

[Supported SDKs and tools that use the shared config and credentials files](https://docs.aws.amazon.com/sdkref/latest/guide/supported-sdks-tools.html)

#### Amazon EC2

[Using roles for applications on Amazon EC2 - Using Instance Profiles](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html)

[Run commands on your Linux instance at launch](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)

[Running Docker on AWS EC2](https://medium.com/appgambit/part-1-running-docker-on-aws-ec2-cbcf0ec7c3f8)

[Install docker-compose in Amazon Linux 2 EC2 instance](https://stackoverflow.com/questions/63708035/installing-docker-compose-on-amazon-ec2-linux-2-9kb-docker-compose-file)

[Install docker compose from the EC2 user data script](https://stackoverflow.com/a/72156137)

[How to install docker on EC2 and Create a container](https://medium.com/@mehmetodabashi/how-to-install-docker-on-ec2-and-create-a-container-75ca88e342d2)

[Creating a File System on EBS and Volume Mounting it to an EC2 instance and persisting data](https://stackoverflow.com/questions/70228792/creating-a-file-system-on-ebs-volume-mounting-it-to-ec2-instance-and-persisting)

[AWS LAMP Amazon Linux 2 Guide: Setting ec2-user to a group and permissions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-lamp-amazon-linux-2.html)

[Changing ownership and permissions of ec2-user](https://stackoverflow.com/questions/27611608/ec2-user-permissions)

[Adding ec2-user to group](https://stackoverflow.com/questions/72360551/adding-ec2-user-to-docker-group)

[AWS User Guide: Run commands at launch with user data script](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)

[AWS EC2 User Guide IAM Roles for Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html#attach-iam-role)

[EC2 Spot Instance Pricing](https://aws.amazon.com/ec2/spot/pricing/)

[AWS EC2 Key Pairs for SSH Connections](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)

[Attribute-based instance type selection(ABS) using Launch Templates to specify instance requirements for Auto-Scaling and EC2 Fleet](https://aws.amazon.com/blogs/aws/new-attribute-based-instance-type-selection-for-ec2-auto-scaling-and-ec2-fleet/)

[How to Create Spot Instance in AWS EC2 in the AWS Management Console](https://www.geeksforgeeks.org/how-to-create-spot-instance-in-aws-ec2-in-aws-latest-wizards/)

[AWS Overview of Amazon EC2 Spot Instance: How to Request Spot Instances](https://docs.aws.amazon.com/whitepapers/latest/cost-optimization-leveraging-ec2-spot-instances/how-to-request-spot-instances.html)

[AWS EC2 API Reference for RunInstances action](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_RunInstances.html)

[AWS EC2 User Guide: Launching EC2 using a launch template](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-templates.html)

[AWS EC2 User Guide: Creating Launch Template](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/create-launch-template.html)

[AWS EC2 User Guide: Using Spot Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-spot-instances.html)

[AWS EC2 User Guide: Spot Request Examples (Example launch specifications)](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-request-examples.html)

#### CDK

[Your First AWS CDK App](https://docs.aws.amazon.com/cdk/v2/guide/hello_world.html)

[CDK Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)

[AWS CDK v2 Getting Started and Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_bootstrap)

[Guide to Working with CDK in TypeScript](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html)

[CDK Concepts: Environments](https://docs.aws.amazon.com/cdk/v2/guide/environments.html)

[CDK API v2 reference: aws-cdk-lib AWS EC2 InstanceProps](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceProps.html)

[CDK API v2 reference: aws-cdk-lib AWS EC2 InstanceType](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.InstanceType.html)

[CDK API v2 reference: aws-cdk-lib AWS EC2 LaunchTemplateSpotOptions](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.LaunchTemplateSpotOptions.html)

[CDK API v2 reference: aws-cdk-lib/aws-ec2 module for setting up networking and instances](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html)

[CDK API v2 reference: aws-cdk-lib/aws-ec2 module - Allowing Connections](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#allowing-connections)

[CDK Guide to Assets](https://docs.aws.amazon.com/cdk/v2/guide/assets.html)

[CDK aws-s3-deployment: Transfer asset without extracting contents of .zip files - assets in a directory are zipped when downloaded](https://github.com/aws/aws-cdk/issues/8065)

[EC2 instance with ingress rules in its security group](https://dev.to/aws-builders/autoscaling-using-spot-instances-with-aws-cdk-ts-4hgh)

[How to create an EC2 with VPC in CDK](https://edwinradtke.com/ec2vpc)

[AWS Samples: Single EC2 CDK](https://github.com/aws-samples/single-ec2-cdk)

[Autoscaling using spot instances](https://dev.to/aws-builders/autoscaling-using-spot-instances-with-aws-cdk-ts-4hgh)

[CDK Bootstrapping](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html)

[AWS CDK EC2 instance Example](https://bobbyhadz.com/blog/aws-cdk-ec2-instance-example)

[AWS CDK EC2 User Data Example](https://bobbyhadz.com/blog/aws-cdk-ec2-userdata-example/)

[AWS CDK Tutorial TypeScript](https://bobbyhadz.com/blog/aws-cdk-tutorial-typescript)

[AWS CDK Get Region and AccountId with Stack API - explicitly setting context to resolve values at synthesis time rather than deployment time](https://bobbyhadz.com/blog/cdk-get-region-accountid)

[Vpc.fromLookup can't determine region - need to explicitly set the env](https://github.com/aws/aws-cdk/issues/4846)

[Guide to Working with CDK in TypeScript](https://docs.aws.amazon.com/cdk/v2/guide/work-with-cdk-typescript.html)

[AWS Labs GitHub Default VPC EC2 stack](https://github.com/benoitpaul/aws-labs/blob/main/default-vpc-ec2/lib/default-vpc-ec2-stack.ts)

[Run docker compose in EC2 User Data](https://stackoverflow.com/questions/63153521/run-docker-compose-in-ec2-user-data)

[Deploying AWS CDK With Github Actions](https://www.youtube.com/watch?v=KCp6BmUGBHc&t=2s&ab_channel=MichaelLevan)

[Integrating AWS CDK into GitHub Actions](https://johntipper.org/integrating-aws-cdk-into-github-actions/)

#### Other AWS resources

[Diving Deep into EC2 Spot Instace Cost and Operational Practices](https://aws.amazon.com/pt/blogs/compute/diving-deep-into-ec2-spot-instance-cost-and-operational-practices/)

[AWS Guide to Reference Amazon Resource Names(ARNs)](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference-arns.html)

[How can I attach a persistent EBS Volume to an EC2 Linux launch template that is used in an autoscaling group?](https://stackoverflow.com/questions/71227777/how-can-i-attach-a-persistent-ebs-volume-to-an-ec2-linux-launch-template-that-is)

[How can I automatically attach a persistent secondary EBS Volume to a new EC2 Linux Spot Instance at boot?](https://repost.aws/knowledge-center/ec2-linux-spot-instance-attach-ebs-volume)

[Creating a file system on EBS Volume, mounting it to EC2 instance and persisting data when instance is replaced with CDK](https://stackoverflow.com/questions/70228792/creating-a-file-system-on-ebs-volume-mounting-it-to-ec2-instance-and-persisting)

[AWS EC2 User Guide: Make an Amazon EBS volume available for use on Linux](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-using-volumes.html)

### Others

[npm ci](https://docs.npmjs.com/cli/v9/commands/npm-ci)

[How to clear your cache in npm](https://coder-coder.com/npm-clear-cache/)

[Chown command in Linux (with examples)](https://linuxopsys.com/topics/chown-command-in-linux)

[TypeScript Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)

[TypeScript 2.0  non-null assertion operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator)

[TypeScript Optional Chaining](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#optional-chaining)

[Using curl verbose](https://everything.curl.dev/usingcurl/verbose)

[NTU HowTo guide on Environment Variables](https://www3.ntu.edu.sg/home/ehchua/programming/howto/Environment_Variables.html#zz-3.)

[Mixed media content: Website delivers HTTPS pages but contains HTTP links](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content/How_to_fix_website_with_mixed_content)

[Let's Encrypt Getting Started](https://letsencrypt.org/getting-started/)

[Planetscale Regions](https://planetscale.com/docs/concepts/regions)

[GitHub Actions: 'No such file or directory' on run due to not checking out repo first](https://stackoverflow.com/questions/64405836/github-actions-no-such-file-or-directory-on-any-run-step?rq=3)

[GitHub Actions: Adding a status badge](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge)

[Getting Started with Writing and Formatting on GitHub: Basic Writing and Formatting Syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#images)

