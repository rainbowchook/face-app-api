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
1. The VPC Construct does a lookup that dynamically returns the default VPC configurations based on the current context. 2. The SecurityGroup Construct sets the ingress and egress rules - allowing inbound only for SSH (TCP port 22), HTTP (TCP port 80) and HTTPS (TCP port 443), and allowing all outbound 

#### Design decisions
Instead of doing a readFileSync for /scripts/user-data.sh and adding it to the EC2 Spot Instance with .addUserData(userData), commands were added to the instance user data using the .addCommands() and addS3DownloadCommand() methods from UserData class for Amazon Linux AMI.  All commands were rendered and added to the EC2 Spot Instance through addUserData(userData.render()).


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







