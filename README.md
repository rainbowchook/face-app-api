# face-app-api

## Description
This is the back-end part of a full-stack PERN application for detecting faces and their corresponding emotions within an image.  

API for face-app client located at [https://github.com/rainbowchook/face-app](https://github.com/rainbowchook/face-app)

Most of the source code is located in the /src directory.  Written in TypeScript.

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







