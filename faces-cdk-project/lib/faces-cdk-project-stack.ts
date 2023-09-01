// import { readFileSync } from 'node:fs'
import * as path from 'node:path'

import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { UserData } from 'aws-cdk-lib/aws-ec2'
import { Asset } from 'aws-cdk-lib/aws-s3-assets'
import DefaultVpc from './vpc/default-vpc'
import ServerSecurityGroup from './security-group/security-group'
import ServerRole from './role/server-role'
import EC2SpotInstance from './instance/ec2-instance'
import { config } from './config'

export class FacesCdkProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Add Docker Compose file as an asset
    const dockerComposeAsset = new Asset(this, 'DockerComposeAsset', {
      path: path.join(__dirname, '/assets/docker-compose.yml'),
    })

    // Create VPC in which to launch EC2 spot instance
    const { vpc } = new DefaultVpc(this, 'DefaultVPC')

    // Create Security Group for EC2 spot instance
    const { serverSG } = new ServerSecurityGroup(this, 'ServerSecurityGroup', {
      vpc,
    })

    // Create role for EC2 Spot Instance
    const { serverRole } = new ServerRole(this, 'ServerRole')

    // Create EC2 Spot Instance
    const { ec2SpotInstance } = new EC2SpotInstance(this, 'EC2SpotInstance', {
      vpc,
      serverRole,
      serverSG,
    })

    // Grant EC2 instance role read access for the asset
    dockerComposeAsset.grantRead(ec2SpotInstance.role)

    // Get environment variables from config for running docker-compose in user data script
    const {
      DATABASE_URL,
      DB_HOST,
      DB_PORT,
      DB_USER,
      DB_NAME,
      DB_PASSWORD,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      PORT,
      CLARIFAI_API_KEY,
      CLARIFAI_PAT_KEY,
      CLARIFAI_USER_ID,
      CLARIFAI_APP_ID,
    } = config
    // Load User Data Script and add User Data to the EC2 Spot Instance
    // const userData = readFileSync('./lib/scripts/user-data.sh', 'utf8')
    // ec2SpotInstance.addUserData(userData)

    const userData = UserData.forLinux()

    // Install Docker
    userData.addCommands(
      'sudo yum update -y',
      'sudo amazon-linux-extras install docker -y',
      'sudo service docker start',
      'sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose',
      'sudo chmod +x /usr/local/bin/docker-compose'
    )

    // Set environment variables
    userData.addCommands(
      `export CLARIFAI_API_KEY=${CLARIFAI_API_KEY}`,
      `export CLARIFAI_PAT_KEY=${CLARIFAI_PAT_KEY}`,
      `export CLARIFAI_USER_ID=${CLARIFAI_USER_ID}`,
      `export CLARIFAI_APP_ID=${CLARIFAI_APP_ID}`,
      `export DB_HOST=${DB_HOST}`,
      `export DB_PORT=${DB_PORT}`,
      `export DB_USER=${DB_USER}`,
      `export DB_NAME=${DB_NAME}`,
      `export DB_PASSWORD=${DB_PASSWORD}`,
      `export POSTGRES_USER=${POSTGRES_USER}`,
      `export POSTGRES_PASSWORD=${POSTGRES_PASSWORD}`,
      `export DATABASE_URL=postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`,
      `export PORT=${PORT}`
    )

    // Switch user to ec2-user and Create the /APP directory
    userData.addCommands(
      'sudo usermod -aG docker ec2-user && sudo -i -u ec2-user && mkdir /home/ec2-user/APP'
    )

    //Download docker-compose asset from S3 and execute it
    const dockerComposeLocalPath = userData.addS3DownloadCommand({
      bucket: dockerComposeAsset.bucket,
      bucketKey: dockerComposeAsset.s3ObjectKey,
      localFile: '/home/ec2-user/APP/docker-compose.yml',
    })

    // Execute docker-compose and 1) pipe standard output to log file; 2) pipe standard error to same file
    userData.addCommands(
      `docker-compose -f ${dockerComposeLocalPath} up -d > /home/ec2-user/APP/docker-compose.log 2>&1`
    )

    // ec2SpotInstance.userData.addCommands(userData.render())
    ec2SpotInstance.addUserData(userData.render())

    //Output the instance ID
    new cdk.CfnOutput(this, 'InstanceId', {
      value: ec2SpotInstance.instance.ref,
    })
  }
}
