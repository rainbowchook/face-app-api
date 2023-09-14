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

Route handlers invoke services found in /src/services, such as database services with Knex as a bridging interface with the Postgresql database for database queries.  For this project's simple requirements, Knex was used as a query builder in conjunction with the pg database driver to connect to the database.  An ORM was not needed (see [this blog post](https://blog.logrocket.com/node-js-orms-why-shouldnt-use/)).

During registration, passwords are hashed with brcyptjs before storing in the <code>login</code> table in the database.
For logins, user plaintext passwords are compared with the stored hashed password via brcypt's compare function.

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

Alternatively, just run the shell script setupDB.sh on opening an interactive shell session for the postgres docker container with the -it flags within the <code>docker run</code> command.

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

### CDK scripts for CloudFormation (Infrastructure as Code)

Deploys a single stack from /bin/faces.cdk.project.ts, with the environment set through environment variables.

All source code located in /lib folder.  Assets (docker-compose file and Postgresql init script) located in /lib/assets.

The stack is created by calling the constructor of each construct in sequence and destructuring the instance returned as a readonly property:
1. The VPC Construct does a lookup that dynamically returns the default VPC configurations based on the current context.
2. The SecurityGroup Construct sets the ingress and egress rules - allowing inbound traffic only for SSH (TCP port 22), HTTP (TCP port 80) and HTTPS (TCP port 443), and allowing all outbound traffic
3. 

#### User Data script for EC2 instance initialisation

The EC2 instance profile will run the user data script as the root user.  On connecting to the EC2 instance, the user-data script can be found in /var/lib/cloud/instances/<instance_ID>/user-data.txt.

Install docker and start the docker service, which will be run in the docker group.

Add the ec2-user to the docker group with <code>sudo usermod -aG docker ec2-user</code>.  This will enable the ec2-user to run <code>docker</code> commands without using <code>sudo</code>.

Note that docker-compose must be installed first prior to running the docker-compose.yml asset downloaded from the S3 bucket.

#### IAM roles and policies

##### CDK deploy user
The credentials or named profile of the AWS user or role used in the running of cdk commands e.g. <code>cdk boostrap</code> must have sufficient IAM permissions for CDK setup, like '<code>cloudFormation:CreateStack</code>', '<code>s3:CreateBucket</code>', and other CloudFormation permissions.

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
2. Environment variables from GitHub Actions secrets were referenced in the user data script and exported into the EC2 instance.  The GitHub Actions logs appropriately masks environment variables injected at runtime.  Loading the environment variables into SSM Parameter Store or loading a file in the S3 bucket encrypted with KMS would have been redundant. (This will require modifications to the front-end for the user session logout to be effected).

## Dockerisation 

Prerequisite: Create a Docker Hub account and a Docker Hub repo.  Make the repo public to enable the Docker image to be pulled by the AWS EC2 instance.

### Dockerfile of Express server

As TypeScript was installed as a dev dependency, run <code>npm ci && npm cache clean --force</code> to install packages in /node_modules folder first.

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


### Use of HTTP instead of HTTPS
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

[How to use the Postgres Docker Official Image](https://www.docker.com/blog/how-to-use-the-postgres-docker-official-image/)

[Introducing Health Check for Postgres Docker container](https://stackoverflow.com/a/71315084/20171966)

[Planetscale Regions](https://planetscale.com/docs/concepts/regions)

[Running Docker on AWS EC2](https://medium.com/appgambit/part-1-running-docker-on-aws-ec2-cbcf0ec7c3f8)

[Install docker-compose in Amazon Linux 2 EC2 instance](https://stackoverflow.com/questions/63708035/installing-docker-compose-on-amazon-ec2-linux-2-9kb-docker-compose-file)

[AWS LAMP Amazon Linux 2 Guide: Setting ec2-user to a group and permissions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-lamp-amazon-linux-2.html)

[Changing ownership and permissions of ec2-user](https://stackoverflow.com/questions/27611608/ec2-user-permissions)

[Adding ec2-user to group](https://stackoverflow.com/questions/72360551/adding-ec2-user-to-docker-group)

[AWS User Guide: Processing user data script](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)
